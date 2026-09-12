import { describe, expect, it } from "vitest";
import { RARITY_PRESETS } from "../../types/domain.js";
import { RARITY_PRESET_RANGES } from "../presets.js";

describe("RARITY_PRESET_RANGES", () => {
  it("has a range for every declared preset name", () => {
    for (const preset of RARITY_PRESETS) {
      expect(RARITY_PRESET_RANGES[preset]).toBeDefined();
    }
  });

  it.each(RARITY_PRESETS)("keeps min < avg < max for %s", (preset) => {
    const { min, avg, max } = RARITY_PRESET_RANGES[preset];
    expect(min).toBeLessThan(avg);
    expect(avg).toBeLessThan(max);
  });
});
