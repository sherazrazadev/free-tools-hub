/**
 * Create a blob URL and return a revoke helper. Always revoke when done.
 */
export function createManagedObjectUrl(blob: Blob): {
	url: string;
	revoke: () => void;
} {
	const url = URL.createObjectURL(blob);
	let revoked = false;
	return {
		url,
		revoke: () => {
			if (revoked) return;
			revoked = true;
			URL.revokeObjectURL(url);
		},
	};
}

export function revokeObjectUrl(url: string | null | undefined): void {
	if (!url) return;
	URL.revokeObjectURL(url);
}
