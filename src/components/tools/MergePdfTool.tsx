import { useId, useRef, useState } from "react";
import { useToolAnalytics } from "../../lib/analytics/useToolAnalytics";
import { loadPdfDocument } from "../../lib/tools/pdf/document";
import { mergePdfItems } from "../../lib/tools/merge-pdf/merge";
import { moveItem, removeAtIndex } from "../../lib/tools/merge-pdf/order";
import type { MergeItem } from "../../lib/tools/merge-pdf/types";
import {
  MAX_PDF_BYTES,
  MAX_PDF_FILES,
  PDF_MIME,
  validatePdfFile,
  validatePdfSelection,
} from "../../lib/tools/merge-pdf/validate";
import FileDropzone from "../ui/FileDropzone";
import "../../styles/islands/MergePdfTool.css";

type ListedFile = MergeItem & { size: number };

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
 * Local PDF merger - multi-file, reorder, remove, merge, download (pdf-lib).
 */
export default function MergePdfTool() {
  const baseId = useId();
  const { toolComplete, toolExport } = useToolAnalytics("merge-pdf");
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<ListedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resultNote, setResultNote] = useState<string | null>(null);

  const maxMb = Math.floor(MAX_PDF_BYTES / (1024 * 1024));

  async function addFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError(null);
    setResultNote(null);
    setBusy(true);

    try {
      const incoming = Array.from(fileList);
      const probe = [
        ...items.map((i) => ({ type: PDF_MIME, size: i.size, name: i.name })),
        ...incoming.map((f) => ({ type: f.type, size: f.size, name: f.name })),
      ];
      const selection = validatePdfSelection(probe);
      if (!selection.ok) {
        setError(selection.message);
        return;
      }

      const next = [...items];
      for (const file of incoming) {
        const one = validatePdfFile(file);
        if (!one.ok) {
          setError(one.message);
          return;
        }

        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        const loaded = await loadPdfDocument(bytes);
        if (!loaded.ok) {
          setError(`${file.name}: ${loaded.message}`);
          return;
        }

        next.push({
          id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
          name: file.name || "document.pdf",
          bytes,
          pageCount: loaded.pageCount,
          size: file.size,
        });
      }

      setItems(next);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not read the selected files.",
      );
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function onMerge() {
    setError(null);
    setResultNote(null);

    const selection = validatePdfSelection(
      items.map((i) => ({ type: PDF_MIME, size: i.size, name: i.name })),
    );
    if (!selection.ok) {
      setError(selection.message);
      return;
    }

    setBusy(true);
    try {
      const result = await mergePdfItems(items);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      downloadBytes(result.bytes, "merged.pdf");
      toolComplete();
      toolExport();
      setResultNote(
        `Merged ${items.length} file(s) into ${result.pageCount} page(s). Download started.`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Merge failed.");
    } finally {
      setBusy(false);
    }
  }

  function clearAll() {
    setItems([]);
    setError(null);
    setResultNote(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="mp-tool">
      <FileDropzone
        id={`${baseId}-files`}
        label="PDF files"
        accept={`${PDF_MIME},.pdf`}
        multiple
        disabled={busy || items.length >= MAX_PDF_FILES}
        inputRef={inputRef}
        fileLabel={items.length ? `${items.length} file(s) selected` : null}
        hint={`PDF only · max ${maxMb} MB each · up to ${MAX_PDF_FILES} files · processed in this browser only`}
        onFiles={(files) => void addFiles(files)}
      />

      {items.length > 0 ? (
        <ol className="mp-tool__list">
          {items.map((item, index) => (
            <li key={item.id} className="mp-tool__row">
              <div className="mp-tool__meta">
                <span className="mp-tool__name">{item.name}</span>
                <span className="mp-tool__pages">
                  {item.pageCount} page{item.pageCount === 1 ? "" : "s"}
                </span>
              </div>
              <div className="mp-tool__row-actions">
                <button
                  type="button"
                  className="btn btn--ghost"
                  disabled={busy || index === 0}
                  aria-label={`Move ${item.name} up`}
                  onClick={() =>
                    setItems((prev) => moveItem(prev, index, index - 1))
                  }
                >
                  Up
                </button>
                <button
                  type="button"
                  className="btn btn--ghost"
                  disabled={busy || index === items.length - 1}
                  aria-label={`Move ${item.name} down`}
                  onClick={() =>
                    setItems((prev) => moveItem(prev, index, index + 1))
                  }
                >
                  Down
                </button>
                <button
                  type="button"
                  className="btn btn--ghost"
                  disabled={busy}
                  aria-label={`Remove ${item.name}`}
                  onClick={() => {
                    setItems((prev) => removeAtIndex(prev, index));
                    setResultNote(null);
                  }}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mp-tool__empty">No PDFs added yet.</p>
      )}

      <div className="mp-tool__actions">
        <button
          type="button"
          className="btn btn--primary"
          disabled={busy || items.length === 0}
          onClick={() => void onMerge()}
        >
          {busy ? "Working…" : "Merge and download"}
        </button>
        {items.length > 0 ? (
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
        <p className="mp-tool__error" role="alert">
          {error}
        </p>
      ) : null}

      {resultNote ? (
        <p className="mp-tool__result" aria-live="polite">
          {resultNote}
        </p>
      ) : null}
    </div>
  );
}
