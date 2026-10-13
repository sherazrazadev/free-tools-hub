import { useId, useRef, useState } from "react";
import { useToolAnalytics } from "../../lib/analytics/useToolAnalytics";
import { loadPdfDocument } from "../../lib/tools/pdf/document";
import {
  MAX_PDF_BYTES,
  PDF_MIME,
  validatePdfFile,
} from "../../lib/tools/merge-pdf/validate";
import {
  formatSelectedPages,
  parsePageRanges,
} from "../../lib/tools/split-pdf/ranges";
import { splitPdfByIndices } from "../../lib/tools/split-pdf/split";
import FileDropzone from "../ui/FileDropzone";
import "../../styles/islands/SplitPdfTool.css";

type SourcePdf = {
  name: string;
  bytes: Uint8Array;
  pageCount: number;
};

function downloadBytes(bytes: Uint8Array, filename: string) {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const blob = new Blob([copy], { type: PDF_MIME });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Local PDF splitter - page ranges (1-based), extract, download (pdf-lib).
 */
export default function SplitPdfTool() {
  const baseId = useId();
  const { toolComplete, toolExport } = useToolAnalytics("split-pdf");
  const inputRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<SourcePdf | null>(null);
  const [ranges, setRanges] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resultNote, setResultNote] = useState<string | null>(null);

  const maxMb = Math.floor(MAX_PDF_BYTES / (1024 * 1024));

  async function onFileChange(fileList: FileList | null) {
    setError(null);
    setResultNote(null);
    setSource(null);

    const file = fileList?.[0];
    if (!file) return;

    const validated = validatePdfFile(file);
    if (!validated.ok) {
      setError(validated.message);
      return;
    }

    setBusy(true);
    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const loaded = await loadPdfDocument(bytes);
      if (!loaded.ok) {
        setError(loaded.message);
        return;
      }

      setSource({
        name: file.name || "document.pdf",
        bytes,
        pageCount: loaded.pageCount,
      });
      setRanges(loaded.pageCount === 1 ? "1" : `1-${loaded.pageCount}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read this PDF.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function onSplit() {
    setError(null);
    setResultNote(null);

    if (!source) {
      setError("Choose a PDF file first.");
      return;
    }

    const parsed = parsePageRanges(ranges, source.pageCount);
    if (!parsed.ok) {
      setError(parsed.message);
      return;
    }

    setBusy(true);
    try {
      const result = await splitPdfByIndices(source.bytes, parsed.indices);
      if (!result.ok) {
        setError(result.message);
        return;
      }

      const base = source.name.replace(/\.pdf$/i, "") || "document";
      downloadBytes(result.bytes, `${base}-pages.pdf`);
      toolComplete();
      toolExport();
      setResultNote(
        `Extracted ${result.pageCount} page(s): ${formatSelectedPages(parsed.indices)}. Download started.`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Split failed.");
    } finally {
      setBusy(false);
    }
  }

  function clearAll() {
    setSource(null);
    setRanges("1");
    setError(null);
    setResultNote(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="sp-tool">
      <FileDropzone
        id={`${baseId}-file`}
        label="PDF file"
        accept={`${PDF_MIME},.pdf`}
        disabled={busy}
        inputRef={inputRef}
        fileLabel={source?.name ?? null}
        hint={`PDF only · max ${maxMb} MB · processed in this browser only`}
        onFiles={(files) => void onFileChange(files)}
      />

      {source ? (
        <p className="sp-tool__meta">
          <strong>{source.name}</strong>
          <span aria-hidden="true"> · </span>
          {source.pageCount} page{source.pageCount === 1 ? "" : "s"}
          <span aria-hidden="true"> · </span>
          numbered <strong>1–{source.pageCount}</strong>
        </p>
      ) : null}

      <label className="sp-tool__field">
        <span>Pages to extract</span>
        <input
          id={`${baseId}-ranges`}
          type="text"
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          placeholder="e.g. 1-3,5,8-10"
          value={ranges}
          disabled={!source || busy}
          onChange={(e) => {
            setRanges(e.target.value);
            setResultNote(null);
          }}
        />
      </label>
      <p className="sp-tool__hint">
        Use 1-based numbering (page 1 = first page). Examples: <code>1-3</code>,{" "}
        <code>2,5,7</code>, <code>1-2,4-6</code>.
      </p>

      <div className="sp-tool__actions">
        <button
          type="button"
          className="btn btn--primary"
          disabled={busy || !source}
          onClick={() => void onSplit()}
        >
          {busy ? "Working…" : "Extract and download"}
        </button>
        {source ? (
          <button
            type="button"
            className="btn btn--ghost"
            disabled={busy}
            onClick={clearAll}
          >
            Clear
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="sp-tool__error" role="alert">
          {error}
        </p>
      ) : null}

      {resultNote ? (
        <p className="sp-tool__result" aria-live="polite">
          {resultNote}
        </p>
      ) : null}
    </div>
  );
}
