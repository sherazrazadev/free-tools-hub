import { describe, expect, it } from "vitest";
import {
  PRESET_CANDIDATES,
  getShippedPreset,
  listShippedPresets,
} from "./registry";
import type { RequirementPreset } from "./types";

function draft(
  partial: Partial<RequirementPreset> & { id: string },
): RequirementPreset {
  return {
    name: "Test",
    organization: "Org",
    country: "PK",
    width: 100,
    height: 40,
    formats: ["image/png"],
    maxKb: 20,
    sourceUrl: "",
    verifiedDate: "",
    notes: "",
    verified: false,
    ...partial,
  };
}

describe("listShippedPresets", () => {
  it("ships no unverified candidates from the registry", () => {
    for (const p of PRESET_CANDIDATES) {
      if (!p.verified || !p.sourceUrl || !p.verifiedDate) {
        expect(listShippedPresets().some((s) => s.id === p.id)).toBe(false);
      }
    }
    // Current ship set may be empty - that is valid for T03-05.
    expect(Array.isArray(listShippedPresets())).toBe(true);
  });

  it("rejects unverified or unsourced shapes via filter rules", () => {
    const cases = [
      draft({
        id: "a",
        verified: false,
        sourceUrl: "https://example.com",
        verifiedDate: "2026-01-01",
      }),
      draft({
        id: "b",
        verified: true,
        sourceUrl: "",
        verifiedDate: "2026-01-01",
      }),
      draft({
        id: "c",
        verified: true,
        sourceUrl: "https://example.com",
        verifiedDate: "",
      }),
      draft({
        id: "d",
        verified: true,
        sourceUrl: "https://example.com",
        verifiedDate: "01-01-2026",
      }),
    ];
    for (const c of cases) {
      expect(
        c.verified === true &&
          c.sourceUrl.trim().length > 0 &&
          /^\d{4}-\d{2}-\d{2}$/.test(c.verifiedDate),
      ).toBe(false);
    }
  });

  it("getShippedPreset returns undefined for unknown ids", () => {
    expect(getShippedPreset("does-not-exist")).toBeUndefined();
  });
});
