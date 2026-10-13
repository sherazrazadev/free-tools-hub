import type { RequirementPreset } from "./types";

/**
 * Candidate presets. Unverified / unsourced entries stay here for draft work
 * but are never returned by listShippedPresets().
 *
 * Add a preset only after checking the official source; set verified: true,
 * sourceUrl, and verifiedDate. Ticket T03-05: no unsourced presets in the UI.
 */
export const PRESET_CANDIDATES: RequirementPreset[] = [
  // Intentionally empty of verified application presets.
  // Example shape (keep verified: false until source-checked):
  // {
  //   id: 'example-draft',
  //   name: 'Example form signature',
  //   organization: 'Example Org',
  //   country: 'XX',
  //   width: 300,
  //   height: 80,
  //   formats: ['image/jpeg', 'image/png'],
  //   maxKb: 50,
  //   sourceUrl: '',
  //   verifiedDate: '',
  //   notes: 'Draft - do not ship.',
  //   verified: false,
  // },
];

function isShippable(preset: RequirementPreset): boolean {
  return (
    preset.verified === true &&
    preset.sourceUrl.trim().length > 0 &&
    /^\d{4}-\d{2}-\d{2}$/.test(preset.verifiedDate.trim()) &&
    preset.width >= 1 &&
    preset.height >= 1 &&
    preset.formats.length > 0
  );
}

/** Presets allowed on public tool UIs - verified + sourced only. */
export function listShippedPresets(): RequirementPreset[] {
  return PRESET_CANDIDATES.filter(isShippable);
}

export function getShippedPreset(id: string): RequirementPreset | undefined {
  return listShippedPresets().find((p) => p.id === id);
}
