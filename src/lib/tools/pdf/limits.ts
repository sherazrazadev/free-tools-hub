/**
 * Shared soft limits for PDF tools (merge + split).
 * Keep page copy in sync by importing these constants.
 */
export {
	MAX_PDF_BYTES,
	MAX_PDF_FILES,
	MAX_TOTAL_PDF_BYTES,
	PDF_MIME,
} from '../merge-pdf/validate';

export function bytesToMbFloor(bytes: number): number {
	return Math.floor(bytes / (1024 * 1024));
}
