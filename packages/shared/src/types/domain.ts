export const GACHA_CATEGORIES = ["ability", "item", "familiar", "trait", "skill", "random"] as const;
export type GachaCategory = (typeof GACHA_CATEGORIES)[number];

export const RARITY_PRESETS = [
  "Bronze",
  "Silver",
  "Gold",
  "Platinum",
  "Diamond",
  "Legendary",
  "Mythical",
  "Divine",
] as const;
export type RarityPresetName = (typeof RARITY_PRESETS)[number];

export interface RarityRange {
  min: number;
  avg: number;
  max: number;
}

export interface AuthUser {
  id: string;
  email: string;
}
