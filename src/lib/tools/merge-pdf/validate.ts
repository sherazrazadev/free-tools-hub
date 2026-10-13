import type { PdfValidateResult } from "./types";

export const PDF_MIME = "application/pdf";

/** Soft per-file limit - larger files may still OOM on mobile. */
export const MAX_PDF_BYTES = 25 * 1024 * 1024;

/** Soft cap on how many PDFs can be merged in one run. */
export const MAX_PDF_FILES = 20;

/** Soft total bytes across selected files. */
export const MAX_TOTAL_PDF_BYTES = 80 * 1024 * 1024;

export type FileLike = {
  type: string;
  size: number;
  name?: string;
};

export function isPdfFile(file: FileLike): boolean {
  const type = file.type.trim().toLowerCase();
  if (type === PDF_MIME || type === "application/x-pdf") return true;
  const name = (file.name ?? "").trim().toLowerCase();
  return name.endsWith(".pdf");
}

export function validatePdfFile(
  file: FileLike | null | undefined,
): PdfValidateResult {
  if (!file || file.size <= 0) {
    return {
      ok: false,
      code: "empty",
      message: "Choose a PDF file to continue.",
    };
  }

  if (!isPdfFile(file)) {
    return {
      ok: false,
      code: "type",
      message: "Unsupported file type. Use PDF files only.",
    };
  }

  if (file.size > MAX_PDF_BYTES) {
    return {
      ok: false,
      code: "size",
      message: `File is too large. Maximum size is ${Math.floor(MAX_PDF_BYTES / (1024 * 1024))} MB per PDF.`,
    };
  }

  return { ok: true };
}

export function validatePdfSelection(files: FileLike[]): PdfValidateResult {
  if (files.length === 0) {
    return {
      ok: false,
      code: "empty",
      message: "Add at least one PDF to merge.",
    };
  }

  if (files.length > MAX_PDF_FILES) {
    return {
      ok: false,
      code: "count",
      message: `Too many files. Maximum is ${MAX_PDF_FILES} PDFs.`,
    };
  }

  let total = 0;
  for (const file of files) {
    const one = validatePdfFile(file);
    if (!one.ok) return one;
    total += file.size;
  }

  if (total > MAX_TOTAL_PDF_BYTES) {
    return {
      ok: false,
      code: "total",
      message: `Combined size is too large. Keep the total under ${Math.floor(MAX_TOTAL_PDF_BYTES / (1024 * 1024))} MB.`,
    };
  }

  return { ok: true };
}
