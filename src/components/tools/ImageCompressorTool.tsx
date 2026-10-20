import { useEffect, useId, useRef, useState } from "react";
import { useToolAnalytics } from "../../lib/analytics/useToolAnalytics";
import { formatBytes } from "../../lib/format";
import { compressImage } from "../../lib/tools/image-compressor/compress";
import {
  bytesToKbLabel,
  formatExt,
  reductionPercent,
} from "../../lib/tools/image-compressor/plan";
import type {
  CompressFormat,
  CompressOutcome,
} from "../../lib/tools/image-compressor/types";
import {
  canvasToBlob,
  drawResizedCanvas,
  needsOpaqueBackground,
} from "../../lib/tools/image-resizer/canvasResize";
import { loadImageFromFile } from "../../lib/tools/image-resizer/loadImage";
import { revokeObjectUrl } from "../../lib/tools/image-resizer/objectUrl";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
} from "../../lib/tools/image-resizer/validate";
import FileDropzone from "../ui/FileDropzone";
import "../../styles/islands/ImageCompressorTool.css";

type SourceState = {
  image: HTMLImageElement;
  objectUrl: string;
  naturalWidth: number;
  naturalHeight: number;
  file: File;
};

/**
 * Local Canvas compressor - quality + optional max KB with honest unmet reporting.
 */
export default function ImageCompressorTool() {
  const baseId = useId();
  const { toolComplete, toolExport } = useToolAnalytics("image-compressor");
  const [source, setSource] = useState<SourceState | null>(null);
  const [format, setFormat] = useState<CompressFormat>("image/jpeg");
  const [qualityPct, setQualityPct] = useState(85);
  const [maxKb, setMaxKb] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CompressOutcome | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewRef = useRef<string | null>(null);
  const sourceUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (sourceUrlRef.current) {
        revokeObjectUrl(sourceUrlRef.current);
        sourceUrlRef.current = null;
      }
      if (previewRef.current) {
        revokeObjectUrl(previewRef.current);
        previewRef.current = null;
      }
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
    const file = fileList?.[0];
    if (!file) return;

    setBusy(true);
    const loaded = await loadImageFromFile(file);
    setBusy(false);

    // A bad replacement must not throw away the image already loaded.
    if (!loaded.ok) {
      setError(loaded.error.message);
      return;
    }

    clearSource();
    sourceUrlRef.current = loaded.value.objectUrl;
    setSource({
      image: loaded.value.image,
      objectUrl: loaded.value.objectUrl,
      naturalWidth: loaded.value.naturalWidth,
      naturalHeight: loaded.value.naturalHeight,
      file: loaded.value.file,
    });
    if (file.type === "image/webp") setFormat("image/webp");
    else setFormat("image/jpeg");
  }

  function parseMaxBytes(): number | null {
    const trimmed = maxKb.trim();
    if (!trimmed) return null;
    const n = Number(trimmed);
    if (!Number.isFinite(n) || n <= 0) {
      throw new Error(
        "Max size must be a positive number of KB, or leave blank.",
      );
    }
    return Math.round(n * 1024);
  }

  async function runCompress(download: boolean) {
    if (!source) {
      setError("Choose an image first.");
      return;
    }

    let maxBytes: number | null;
    try {
      maxBytes = parseMaxBytes();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid max KB.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const outcome = await compressImage({
        sourceWidth: source.naturalWidth,
        sourceHeight: source.naturalHeight,
        originalBytes: source.file.size,
        startQuality: qualityPct / 100,
        format,
        maxBytes,
        encode: async ({ width, height, quality, type }) => {
          const canvas = drawResizedCanvas(
            source.image,
            width,
            height,
            needsOpaqueBackground(type) ? "#ffffff" : undefined,
          );
          return canvasToBlob(canvas, type, quality);
        },
      });

      clearPreview();
      const url = URL.createObjectURL(outcome.blob);
      previewRef.current = url;
      setPreviewUrl(url);
      setResult(outcome);
      toolComplete();

      if (download) {
        const base =
          source.file.name.replace(/\.[^.]+$/, "") || "compressed-image";
        const a = document.createElement("a");
        a.href = url;
        a.download = `${base}-${outcome.width}x${outcome.height}.${formatExt(format)}`;
        a.rel = "noopener";
        document.body.appendChild(a);
        a.click();
        a.remove();
        toolExport();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Compression failed.");
    } finally {
      setBusy(false);
    }
  }

  const accept = ALLOWED_IMAGE_TYPES.join(",");
  const maxMb = Math.floor(MAX_IMAGE_BYTES / (1024 * 1024));
  const reduction =
    result !== null
      ? reductionPercent(result.originalBytes, result.outputBytes)
      : null;

  return (
    <div className="ic-tool">
      <FileDropzone
        id={`${baseId}-file`}
        label="Image"
        accept={accept}
        disabled={busy}
        fileLabel={source?.file.name ?? null}
        fileMeta={
          source
            ? `${source.naturalWidth}×${source.naturalHeight} · ${formatBytes(source.file.size)}`
            : null
        }
        onClear={() => {
          clearSource();
          setError(null);
        }}
        error={source ? null : error}
        hint={`JPEG, PNG, WebP, or GIF · max ${maxMb} MB · processed in this browser only`}
        onFiles={(files) => void onFileChange(files)}
      />

      <div className="ic-tool__fields">
        <label className="ic-tool__field">
          <span>Output format</span>
          <select
            value={format}
            disabled={busy}
            aria-describedby={`${baseId}-format-help`}
            onChange={(e) => {
              setFormat(e.target.value as CompressFormat);
              clearPreview();
            }}
          >
            <option value="image/jpeg">JPEG</option>
            <option value="image/webp">WebP</option>
          </select>
          <span id={`${baseId}-format-help`} className="ic-tool__field-help">
            Choose format anytime - compress after you pick an image.
          </span>
        </label>
        <label className="ic-tool__field">
          <span>Starting quality ({qualityPct}%)</span>
          <input
            type="range"
            min={10}
            max={100}
            step={1}
            value={qualityPct}
            disabled={busy}
            onChange={(e) => {
              setQualityPct(Number(e.target.value));
              clearPreview();
            }}
          />
        </label>
        <label className="ic-tool__field">
          <span>Max size (KB, optional)</span>
          <input
            type="number"
            inputMode="decimal"
            min={1}
            step={1}
            placeholder="e.g. 100"
            value={maxKb}
            disabled={busy}
            onChange={(e) => {
              setMaxKb(e.target.value);
              clearPreview();
            }}
          />
        </label>
      </div>

      <p className="ic-tool__honest">
        A max KB target is best-effort. Exact size is not guaranteed for every
        image and format. If the limit cannot be met, the tool reports that and
        offers the smallest attempt.
      </p>

      <div className="ic-tool__actions">
        <button
          type="button"
          className="btn btn--ghost"
          disabled={!source || busy}
          onClick={() => void runCompress(false)}
          aria-busy={busy}
        >
          {busy ? "Working…" : "Compress & preview"}
        </button>
        <button
          type="button"
          className="btn btn--primary"
          disabled={!source || busy}
          onClick={() => void runCompress(true)}
        >
          Download compressed image
        </button>
      </div>

      {error && source ? (
        <p className="ic-tool__error" role="alert">
          {error}
        </p>
      ) : null}

      {result && previewUrl ? (
        <div className="ic-tool__result" aria-live="polite">
          <p className="ic-tool__result-label">Result</p>
          <ul className="ic-tool__stats">
            <li>
              Output size: <strong>{bytesToKbLabel(result.outputBytes)}</strong>
              {result.maxBytes !== null ? (
                <> (target {bytesToKbLabel(result.maxBytes)})</>
              ) : null}
            </li>
            <li>
              Dimensions:{" "}
              <strong>
                {result.width}×{result.height}
              </strong>
              {result.scale < 1 ? (
                <span className="ic-tool__muted">
                  {" "}
                  (scaled to {Math.round(result.scale * 100)}%)
                </span>
              ) : null}
            </li>
            <li>
              Encoder quality:{" "}
              <strong>{Math.round(result.quality * 100)}%</strong>
              <span className="ic-tool__muted">
                {" "}
                · {result.attempts} attempt(s)
              </span>
            </li>
            {reduction !== null ? (
              <li>
                Change vs original:{" "}
                <strong>
                  {reduction > 0 ? "−" : "+"}
                  {Math.abs(reduction)}%
                </strong>
              </li>
            ) : null}
            <li>
              Limit:{" "}
              {result.maxBytes === null ? (
                <span>not requested</span>
              ) : result.metLimit ? (
                <strong className="ic-tool__ok">met</strong>
              ) : (
                <strong className="ic-tool__warn">not met</strong>
              )}
            </li>
          </ul>
          {result.message ? (
            <p className="ic-tool__warn-msg" role="status">
              {result.message}
            </p>
          ) : null}
          <img
            src={previewUrl}
            alt={`Compressed preview ${result.width} by ${result.height} pixels`}
            className="ic-tool__img"
          />
        </div>
      ) : source ? (
        <div className="ic-tool__preview">
          <p className="ic-tool__result-label">Source</p>
          <img
            src={source.objectUrl}
            alt="Selected image"
            className="ic-tool__img"
          />
        </div>
      ) : null}
    </div>
  );
}
