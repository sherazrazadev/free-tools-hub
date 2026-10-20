import { useEffect, useId, useRef, useState } from "react";
import { useToolAnalytics } from "../../lib/analytics/useToolAnalytics";
import { formatBytes } from "../../lib/format";
import {
  canvasToBlob,
  drawResizedCanvas,
  needsOpaqueBackground,
  outputMimeFor,
} from "../../lib/tools/image-resizer/canvasResize";
import {
  computeOutputDimensions,
  defaultTargets,
  outputSizeProblem,
  parsePixelField,
} from "../../lib/tools/image-resizer/dimensions";
import { loadImageFromFile } from "../../lib/tools/image-resizer/loadImage";
import { revokeObjectUrl } from "../../lib/tools/image-resizer/objectUrl";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
} from "../../lib/tools/image-resizer/validate";
import FileDropzone from "../ui/FileDropzone";
import "../../styles/islands/ImageResizerTool.css";

type SourceState = {
  image: HTMLImageElement;
  objectUrl: string;
  naturalWidth: number;
  naturalHeight: number;
  file: File;
};

/**
 * Local Canvas image resizer - width/height, aspect lock, preview, download.
 */
export default function ImageResizerTool() {
  const baseId = useId();
  const { toolComplete, toolExport } = useToolAnalytics("image-resizer");
  const [source, setSource] = useState<SourceState | null>(null);
  const [widthText, setWidthText] = useState("800");
  const [heightText, setHeightText] = useState("600");
  const [lockAspect, setLockAspect] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [outputDims, setOutputDims] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const previewBlobRef = useRef<string | null>(null);
  const sourceUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (sourceUrlRef.current) {
        revokeObjectUrl(sourceUrlRef.current);
        sourceUrlRef.current = null;
      }
      if (previewBlobRef.current) {
        revokeObjectUrl(previewBlobRef.current);
        previewBlobRef.current = null;
      }
    };
  }, []);

  function clearPreview() {
    if (previewBlobRef.current) {
      revokeObjectUrl(previewBlobRef.current);
      previewBlobRef.current = null;
    }
    setPreviewUrl(null);
    setOutputDims(null);
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
    const result = await loadImageFromFile(file);
    setBusy(false);

    // A bad replacement must not throw away the image already loaded.
    if (!result.ok) {
      setError(result.error.message);
      return;
    }

    clearSource();
    const { value } = result;
    const targets = defaultTargets(value.naturalWidth, value.naturalHeight);
    sourceUrlRef.current = value.objectUrl;
    setSource({
      image: value.image,
      objectUrl: value.objectUrl,
      naturalWidth: value.naturalWidth,
      naturalHeight: value.naturalHeight,
      file: value.file,
    });
    setWidthText(String(targets.width));
    setHeightText(String(targets.height));
    setLockAspect(true);
  }

  function onWidthChange(raw: string) {
    setWidthText(raw);
    const n = parsePixelField(raw);
    if (n !== null && source && lockAspect) {
      const next = computeOutputDimensions({
        sourceWidth: source.naturalWidth,
        sourceHeight: source.naturalHeight,
        targetWidth: n,
        targetHeight: parsePixelField(heightText) ?? n,
        lockAspect: true,
        drive: "width",
      });
      setHeightText(String(next.height));
    }
    clearPreview();
  }

  function onHeightChange(raw: string) {
    setHeightText(raw);
    const n = parsePixelField(raw);
    if (n !== null && source && lockAspect) {
      const next = computeOutputDimensions({
        sourceWidth: source.naturalWidth,
        sourceHeight: source.naturalHeight,
        targetWidth: parsePixelField(widthText) ?? n,
        targetHeight: n,
        lockAspect: true,
        drive: "height",
      });
      setWidthText(String(next.width));
    }
    clearPreview();
  }

  function onLockChange(checked: boolean) {
    setLockAspect(checked);
    const w = parsePixelField(widthText);
    if (checked && source && w !== null) {
      const next = computeOutputDimensions({
        sourceWidth: source.naturalWidth,
        sourceHeight: source.naturalHeight,
        targetWidth: w,
        targetHeight: parsePixelField(heightText) ?? w,
        lockAspect: true,
        drive: "width",
      });
      setWidthText(String(next.width));
      setHeightText(String(next.height));
    }
    clearPreview();
  }

  async function buildPreviewAndDownload(download: boolean) {
    if (!source) {
      setError("Choose an image first.");
      return;
    }

    const w = parsePixelField(widthText);
    const h = parsePixelField(heightText);
    if (w === null || h === null) {
      setError("Enter a width and height of at least 1 pixel.");
      return;
    }
    const dims = computeOutputDimensions({
      sourceWidth: source.naturalWidth,
      sourceHeight: source.naturalHeight,
      targetWidth: w,
      targetHeight: h,
      lockAspect,
      drive: "width",
    });
    const sizeProblem = outputSizeProblem(dims.width, dims.height);
    if (sizeProblem) {
      setError(sizeProblem);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const mime = outputMimeFor(source.file.type);
      const canvas = drawResizedCanvas(
        source.image,
        dims.width,
        dims.height,
        needsOpaqueBackground(mime.type) ? "#ffffff" : undefined,
      );
      if (canvas.width !== dims.width || canvas.height !== dims.height) {
        throw new Error(
          "This browser could not create a canvas that large. Try smaller dimensions.",
        );
      }
      const blob = await canvasToBlob(canvas, mime.type, mime.quality);

      clearPreview();
      const url = URL.createObjectURL(blob);
      previewBlobRef.current = url;
      setPreviewUrl(url);
      setOutputDims({ width: canvas.width, height: canvas.height });
      toolComplete();

      if (download) {
        const base =
          source.file.name.replace(/\.[^.]+$/, "") || "resized-image";
        const a = document.createElement("a");
        a.href = url;
        a.download = `${base}-${canvas.width}x${canvas.height}.${mime.ext}`;
        a.rel = "noopener";
        document.body.appendChild(a);
        a.click();
        a.remove();
        toolExport();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Resize failed.");
    } finally {
      setBusy(false);
    }
  }

  const accept = ALLOWED_IMAGE_TYPES.join(",");
  const maxMb = Math.floor(MAX_IMAGE_BYTES / (1024 * 1024));

  return (
    <div className="ir-tool">
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

      <div className="ir-tool__fields">
        <label className="ir-tool__field">
          <span>Width (px)</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            value={widthText}
            disabled={!source || busy}
            onChange={(e) => onWidthChange(e.target.value)}
          />
        </label>
        <label className="ir-tool__field">
          <span>Height (px)</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            value={heightText}
            disabled={!source || busy}
            onChange={(e) => onHeightChange(e.target.value)}
          />
        </label>
      </div>

      <label className="ir-tool__check">
        <input
          type="checkbox"
          checked={lockAspect}
          disabled={!source || busy}
          onChange={(e) => onLockChange(e.target.checked)}
        />
        <span>Lock aspect ratio</span>
      </label>

      <div className="ir-tool__actions">
        <button
          type="button"
          className="btn btn--ghost"
          disabled={!source || busy}
          onClick={() => void buildPreviewAndDownload(false)}
          aria-busy={busy}
        >
          {busy ? "Working…" : "Update preview"}
        </button>
        <button
          type="button"
          className="btn btn--primary"
          disabled={!source || busy}
          onClick={() => void buildPreviewAndDownload(true)}
        >
          Download resized image
        </button>
      </div>

      {error && source ? (
        <p className="ir-tool__error" role="alert">
          {error}
        </p>
      ) : null}

      {(source?.objectUrl || previewUrl) && (
        <div className="ir-tool__preview" aria-live="polite">
          <p className="ir-tool__result-label">
            {previewUrl && outputDims
              ? `Preview · ${outputDims.width}×${outputDims.height} px`
              : "Source preview"}
          </p>
          <img
            src={previewUrl ?? source!.objectUrl}
            alt={
              previewUrl
                ? `Resized preview ${outputDims?.width} by ${outputDims?.height} pixels`
                : "Selected image"
            }
            className="ir-tool__img"
          />
        </div>
      )}
    </div>
  );
}
