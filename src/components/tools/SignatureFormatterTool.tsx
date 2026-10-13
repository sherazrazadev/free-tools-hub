import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useToolAnalytics } from "../../lib/analytics/useToolAnalytics";
import { bytesToKbLabel } from "../../lib/tools/image-compressor/plan";
import { loadImageFromFile } from "../../lib/tools/image-resizer/loadImage";
import { revokeObjectUrl } from "../../lib/tools/image-resizer/objectUrl";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
} from "../../lib/tools/image-resizer/validate";
import { listShippedPresets } from "../../lib/tools/presets/registry";
import { normalizedToCrop } from "../../lib/tools/signature-formatter/crop";
import {
  formatExt,
  formatSignature,
  type SignatureFormat,
  type SignatureRenderResult,
} from "../../lib/tools/signature-formatter/render";
import FileDropzone from "../ui/FileDropzone";
import "../../styles/islands/SignatureFormatterTool.css";

type SourceState = {
  image: HTMLImageElement;
  objectUrl: string;
  naturalWidth: number;
  naturalHeight: number;
  file: File;
};

type NormCrop = { x: number; y: number; width: number; height: number };

/**
 * Signature formatter - crop, resize, format, optional max KB, plain-background preview.
 */
export default function SignatureFormatterTool() {
  const baseId = useId();
  const { toolComplete, toolExport } = useToolAnalytics("signature-formatter");
  const presets = useMemo(() => listShippedPresets(), []);
  const [source, setSource] = useState<SourceState | null>(null);
  const [presetId, setPresetId] = useState("");
  const [width, setWidth] = useState(300);
  const [height, setHeight] = useState(80);
  const [format, setFormat] = useState<SignatureFormat>("image/png");
  const [qualityPct, setQualityPct] = useState(90);
  const [maxKb, setMaxKb] = useState("");
  const [background, setBackground] = useState("#ffffff");
  const [useThreshold, setUseThreshold] = useState(false);
  const [threshold, setThreshold] = useState(180);
  const [crop, setCrop] = useState<NormCrop>({
    x: 0,
    y: 0,
    width: 1,
    height: 1,
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SignatureRenderResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewRef = useRef<string | null>(null);
  const sourceUrlRef = useRef<string | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    mode: "move" | "nw" | "ne" | "sw" | "se";
    startX: number;
    startY: number;
    orig: NormCrop;
    stageW: number;
    stageH: number;
  } | null>(null);

  useEffect(() => {
    return () => {
      if (sourceUrlRef.current) revokeObjectUrl(sourceUrlRef.current);
      if (previewRef.current) revokeObjectUrl(previewRef.current);
    };
  }, []);

  function clearPreview() {
    if (previewRef.current) {
      revokeObjectUrl(previewRef.current);
      previewRef.current = null;
    }
    setPreviewUrl(null);
    setResult(null);
  }

  function clearSource() {
    if (sourceUrlRef.current) {
      revokeObjectUrl(sourceUrlRef.current);
      sourceUrlRef.current = null;
    }
    setSource(null);
    clearPreview();
  }

  async function onFileChange(fileList: FileList | null) {
    setError(null);
    clearSource();
    const file = fileList?.[0];
    if (!file) return;
    setBusy(true);
    const loaded = await loadImageFromFile(file);
    setBusy(false);
    if (!loaded.ok) {
      setError(loaded.error.message);
      return;
    }
    sourceUrlRef.current = loaded.value.objectUrl;
    setSource({
      image: loaded.value.image,
      objectUrl: loaded.value.objectUrl,
      naturalWidth: loaded.value.naturalWidth,
      naturalHeight: loaded.value.naturalHeight,
      file: loaded.value.file,
    });
    setCrop({ x: 0, y: 0, width: 1, height: 1 });
  }

  function applyPreset(id: string) {
    setPresetId(id);
    clearPreview();
    if (!id) return;
    const p = presets.find((x) => x.id === id);
    if (!p) return;
    setWidth(p.width);
    setHeight(p.height);
    const fmt = (p.formats[0] ?? "image/png") as SignatureFormat;
    setFormat(fmt);
    setMaxKb(p.maxKb !== null ? String(p.maxKb) : "");
  }

  function clampCrop(next: NormCrop): NormCrop {
    const min = 0.05;
    let { x, y, width, height } = next;
    width = Math.min(1, Math.max(min, width));
    height = Math.min(1, Math.max(min, height));
    x = Math.min(Math.max(0, x), 1 - width);
    y = Math.min(Math.max(0, y), 1 - height);
    return { x, y, width, height };
  }

  function applyDrag(
    mode: "move" | "nw" | "ne" | "sw" | "se",
    orig: NormCrop,
    dx: number,
    dy: number,
  ): NormCrop {
    const min = 0.05;
    if (mode === "move") {
      return clampCrop({
        x: orig.x + dx,
        y: orig.y + dy,
        width: orig.width,
        height: orig.height,
      });
    }
    if (mode === "se") {
      return clampCrop({
        x: orig.x,
        y: orig.y,
        width: orig.width + dx,
        height: orig.height + dy,
      });
    }
    if (mode === "nw") {
      const right = orig.x + orig.width;
      const bottom = orig.y + orig.height;
      const x = Math.min(Math.max(0, orig.x + dx), right - min);
      const y = Math.min(Math.max(0, orig.y + dy), bottom - min);
      return { x, y, width: right - x, height: bottom - y };
    }
    if (mode === "ne") {
      const bottom = orig.y + orig.height;
      const y = Math.min(Math.max(0, orig.y + dy), bottom - min);
      const width = Math.min(Math.max(min, orig.width + dx), 1 - orig.x);
      return { x: orig.x, y, width, height: bottom - y };
    }
    // sw
    const right = orig.x + orig.width;
    const x = Math.min(Math.max(0, orig.x + dx), right - min);
    const height = Math.min(Math.max(min, orig.height + dy), 1 - orig.y);
    return { x, y: orig.y, width: right - x, height };
  }

  function onCropPointerDown(
    mode: "move" | "nw" | "ne" | "sw" | "se",
    e: React.PointerEvent<HTMLElement>,
  ) {
    if (!source || !stageRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    const stage = stageRef.current.getBoundingClientRect();
    dragRef.current = {
      mode,
      startX: e.clientX,
      startY: e.clientY,
      orig: crop,
      stageW: stage.width,
      stageH: stage.height,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onCropPointerMove(e: React.PointerEvent<HTMLElement>) {
    const d = dragRef.current;
    if (!d) return;
    const dx = (e.clientX - d.startX) / d.stageW;
    const dy = (e.clientY - d.startY) / d.stageH;
    setCrop(applyDrag(d.mode, d.orig, dx, dy));
    clearPreview();
  }

  function onCropPointerUp(e: React.PointerEvent<HTMLElement>) {
    dragRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  }

  async function runFormat(download: boolean) {
    if (!source) {
      setError("Choose a signature image first.");
      return;
    }
    let maxBytes: number | null = null;
    const trimmed = maxKb.trim();
    if (trimmed) {
      const n = Number(trimmed);
      if (!Number.isFinite(n) || n <= 0) {
        setError("Max size must be a positive number of KB, or leave blank.");
        return;
      }
      maxBytes = Math.round(n * 1024);
    }

    setBusy(true);
    setError(null);
    try {
      const pixelCrop = normalizedToCrop(
        crop,
        source.naturalWidth,
        source.naturalHeight,
      );
      const outcome = await formatSignature({
        source: source.image,
        crop: pixelCrop,
        sourceWidth: source.naturalWidth,
        sourceHeight: source.naturalHeight,
        outWidth: width,
        outHeight: height,
        format,
        background,
        threshold: useThreshold ? threshold : null,
        startQuality: qualityPct / 100,
        originalBytes: source.file.size,
        maxBytes,
      });

      clearPreview();
      const url = URL.createObjectURL(outcome.blob);
      previewRef.current = url;
      setPreviewUrl(url);
      setResult(outcome);
      toolComplete();

      if (download) {
        const base = source.file.name.replace(/\.[^.]+$/, "") || "signature";
        const a = document.createElement("a");
        a.href = url;
        a.download = `${base}-${outcome.width}x${outcome.height}.${formatExt(format)}`;
        a.rel = "noopener";
        document.body.appendChild(a);
        a.click();
        a.remove();
        toolExport();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Formatting failed.");
    } finally {
      setBusy(false);
    }
  }

  const accept = ALLOWED_IMAGE_TYPES.join(",");
  const maxMb = Math.floor(MAX_IMAGE_BYTES / (1024 * 1024));
  const formatOptions: SignatureFormat[] = presetId
    ? ((presets.find((p) => p.id === presetId)
        ?.formats as SignatureFormat[]) ?? [format])
    : ["image/png", "image/jpeg", "image/webp"];

  return (
    <div className="sf-tool">
      <FileDropzone
        id={`${baseId}-file`}
        label="Signature image"
        accept={accept}
        disabled={busy}
        fileLabel={source?.file.name ?? null}
        hint={`JPEG, PNG, WebP, or GIF · max ${maxMb} MB · local only — not an official acceptance guarantee`}
        onFiles={(files) => void onFileChange(files)}
      />

      <div className="sf-tool__field sf-tool__field--full">
        <span>Verified preset</span>
        <select
          value={presetId}
          disabled={busy}
          onChange={(e) => applyPreset(e.target.value)}
          aria-describedby={`${baseId}-preset-help`}
        >
          <option value="">Manual dimensions (no preset)</option>
          {presets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} - {p.organization} ({p.country})
            </option>
          ))}
        </select>
        <p id={`${baseId}-preset-help`} className="sf-tool__hint">
          {presets.length === 0
            ? "No verified application presets are published yet. Unsourced or unchecked requirements are not listed. Enter width, height, and max KB from the official form."
            : "Only source-checked presets appear here. Always re-check the official page before submitting."}
        </p>
      </div>

      {presetId
        ? (() => {
            const p = presets.find((x) => x.id === presetId);
            if (!p) return null;
            return (
              <p className="sf-tool__preset-meta">
                Source:{" "}
                <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer">
                  {p.sourceUrl}
                </a>
                <span aria-hidden="true"> · </span>
                Verified {p.verifiedDate}
                {p.notes ? (
                  <>
                    <br />
                    {p.notes}
                  </>
                ) : null}
              </p>
            );
          })()
        : null}

      {source ? (
        <>
          <p className="sf-tool__meta">
            Original:{" "}
            <strong>
              {source.naturalWidth}×{source.naturalHeight}
            </strong>
            <span aria-hidden="true"> · </span>
            {bytesToKbLabel(source.file.size)}
          </p>

          <div className="sf-tool__crop-wrap">
            <p className="sf-tool__label">Crop</p>
            <p className="sf-tool__hint">
              Drag inside the box to move. Drag any corner to resize the
              selection.
            </p>
            <div className="sf-tool__stage" ref={stageRef}>
              <img
                src={source.objectUrl}
                alt=""
                className="sf-tool__stage-img"
                draggable={false}
              />
              <div
                className="sf-tool__crop-box"
                style={{
                  left: `${crop.x * 100}%`,
                  top: `${crop.y * 100}%`,
                  width: `${crop.width * 100}%`,
                  height: `${crop.height * 100}%`,
                }}
                onPointerDown={(e) => onCropPointerDown("move", e)}
                onPointerMove={onCropPointerMove}
                onPointerUp={onCropPointerUp}
                onPointerCancel={onCropPointerUp}
                role="presentation"
              >
                {(
                  [
                    ["nw", "Resize from top-left"],
                    ["ne", "Resize from top-right"],
                    ["sw", "Resize from bottom-left"],
                    ["se", "Resize from bottom-right"],
                  ] as const
                ).map(([corner, label]) => (
                  <button
                    key={corner}
                    type="button"
                    className={`sf-tool__handle sf-tool__handle--${corner}`}
                    aria-label={label}
                    onPointerDown={(e) => onCropPointerDown(corner, e)}
                    onPointerMove={onCropPointerMove}
                    onPointerUp={onCropPointerUp}
                    onPointerCancel={onCropPointerUp}
                  />
                ))}
              </div>
            </div>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                setCrop({ x: 0, y: 0, width: 1, height: 1 });
                clearPreview();
              }}
            >
              Reset crop to full image
            </button>
          </div>
        </>
      ) : null}

      <div className="sf-tool__fields">
        <label className="sf-tool__field">
          <span>Width (px)</span>
          <input
            type="number"
            min={1}
            value={width}
            disabled={busy}
            onChange={(e) => {
              setWidth(Math.max(1, Math.floor(Number(e.target.value) || 1)));
              clearPreview();
            }}
          />
        </label>
        <label className="sf-tool__field">
          <span>Height (px)</span>
          <input
            type="number"
            min={1}
            value={height}
            disabled={busy}
            onChange={(e) => {
              setHeight(Math.max(1, Math.floor(Number(e.target.value) || 1)));
              clearPreview();
            }}
          />
        </label>
        <label className="sf-tool__field">
          <span>Format</span>
          <select
            value={format}
            disabled={busy}
            onChange={(e) => {
              setFormat(e.target.value as SignatureFormat);
              clearPreview();
            }}
          >
            {formatOptions.map((f) => (
              <option key={f} value={f}>
                {f === "image/png"
                  ? "PNG"
                  : f === "image/webp"
                    ? "WebP"
                    : "JPEG"}
              </option>
            ))}
          </select>
        </label>
        <label className="sf-tool__field">
          <span>Max KB (optional)</span>
          <input
            type="number"
            min={1}
            placeholder="e.g. 40"
            value={maxKb}
            disabled={busy}
            onChange={(e) => {
              setMaxKb(e.target.value);
              clearPreview();
            }}
          />
        </label>
        {format !== "image/png" ? (
          <label className="sf-tool__field">
            <span>Quality ({qualityPct}%)</span>
            <input
              type="range"
              min={10}
              max={100}
              value={qualityPct}
              disabled={busy}
              onChange={(e) => {
                setQualityPct(Number(e.target.value));
                clearPreview();
              }}
            />
          </label>
        ) : null}
        <label className="sf-tool__field">
          <span>Preview background</span>
          <select
            value={background}
            disabled={busy}
            onChange={(e) => {
              setBackground(e.target.value);
              clearPreview();
            }}
          >
            <option value="#ffffff">White</option>
            <option value="#f3f4f6">Light gray</option>
            <option value="#e5e7eb">Gray</option>
          </select>
        </label>
      </div>

      <label className="sf-tool__check">
        <input
          type="checkbox"
          checked={useThreshold}
          disabled={!source || busy}
          onChange={(e) => {
            setUseThreshold(e.target.checked);
            clearPreview();
          }}
        />
        <span>High-contrast ink (threshold) - optional readability aid</span>
      </label>
      {useThreshold ? (
        <label className="sf-tool__field sf-tool__field--full">
          <span>Threshold ({threshold})</span>
          <input
            type="range"
            min={40}
            max={240}
            value={threshold}
            disabled={busy}
            onChange={(e) => {
              setThreshold(Number(e.target.value));
              clearPreview();
            }}
          />
        </label>
      ) : null}

      <div className="sf-tool__actions">
        <button
          type="button"
          className="btn btn--ghost"
          disabled={!source || busy}
          onClick={() => void runFormat(false)}
        >
          Update preview
        </button>
        <button
          type="button"
          className="btn btn--primary"
          disabled={!source || busy}
          onClick={() => void runFormat(true)}
        >
          Download signature
        </button>
        {source ? (
          <button
            type="button"
            className="btn btn--ghost"
            disabled={busy}
            onClick={() => {
              clearSource();
              setError(null);
            }}
          >
            Clear
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="sf-tool__error" role="alert">
          {error}
        </p>
      ) : null}

      {result && previewUrl ? (
        <div className="sf-tool__result" aria-live="polite">
          <p className="sf-tool__result-label">
            Output preview on plain background · {result.width}×{result.height}{" "}
            · {bytesToKbLabel(result.outputBytes)}
            {result.maxBytes !== null ? (
              <>
                {" "}
                · limit{" "}
                {result.metLimit ? (
                  <strong className="sf-tool__ok">met</strong>
                ) : (
                  <strong className="sf-tool__warn">not met</strong>
                )}
              </>
            ) : null}
          </p>
          {result.message ? (
            <p className="sf-tool__warn-msg" role="status">
              {result.message}
            </p>
          ) : null}
          <div className="sf-tool__plain" style={{ background }}>
            <img
              src={previewUrl}
              alt={`Formatted signature ${result.width} by ${result.height} pixels`}
              className="sf-tool__out-img"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
