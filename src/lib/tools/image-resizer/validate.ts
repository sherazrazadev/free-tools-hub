import type { ImageValidateResult } from "./types";

/** Common raster types browsers can typically decode for Canvas. */
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

/** Soft client limit - large files may still fail decode in constrained browsers. */
export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

export type FileLike = {
  type: string;
  size: number;
  name?: string;
};

export function isAllowedImageType(type: string): boolean {
  const normalized = type.trim().toLowerCase();
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(normalized);
}

export function validateImageFile(
  file: FileLike | null | undefined,
): ImageValidateResult {
  if (!file || file.size <= 0) {
    return {
      ok: false,
      code: "empty",
      message: "Choose an image file to continue.",
    };
  }

  if (!isAllowedImageType(file.type)) {
    return {
      ok: false,
      code: "type",
      message: "Unsupported file type. Use JPEG, PNG, WebP, or GIF.",
    };
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return {
      ok: false,
      code: "size",
      message: `File is too large. Maximum size is ${Math.floor(MAX_IMAGE_BYTES / (1024 * 1024))} MB.`,
    };
  }

  return { ok: true };
}

export function decodeErrorMessage(): string {
  return "Could not read this image. It may be damaged or in an unsupported format.";
}
