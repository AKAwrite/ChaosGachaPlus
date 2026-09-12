import type { RarityPresetName, RarityRange } from "../types/domain.js";

// Ported from Gacha.py: presets/presetmin/presetavg/presetmax.
export const RARITY_PRESET_RANGES: Record<RarityPresetName, RarityRange> = {
  Bronze: { min: 0.1, avg: 1.3, max: 3.3 },
  Silver: { min: 0.5, avg: 2.3, max: 4.3 },
  Gold: { min: 1.5, avg: 3.3, max: 5.3 },
  Platinum: { min: 2.5, avg: 4.3, max: 6.3 },
  Diamond: { min: 3.5, avg: 5.3, max: 7.3 },
  Legendary: { min: 4.5, avg: 6.3, max: 8.3 },
  Mythical: { min: 5.5, avg: 7.3, max: 9.3 },
  Divine: { min: 6.5, avg: 8.3, max: 10.0 },
};
