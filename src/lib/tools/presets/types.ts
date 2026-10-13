/** Output formats a preset may allow. */
export type PresetFormat = 'image/jpeg' | 'image/png' | 'image/webp';

/**
 * Application / document photo or signature requirement.
 * Only presets with verified === true and a source URL + verifiedDate may ship in the UI.
 */
export type RequirementPreset = {
	id: string;
	name: string;
	organization: string;
	country: string;
	width: number;
	height: number;
	formats: PresetFormat[];
	/** Max file size in KB; null if the source has no published max. */
	maxKb: number | null;
	sourceUrl: string;
	/** ISO date YYYY-MM-DD when requirements were checked against the source. */
	verifiedDate: string;
	notes: string;
	/** Must be true to appear in listShippedPresets(). */
	verified: boolean;
};
