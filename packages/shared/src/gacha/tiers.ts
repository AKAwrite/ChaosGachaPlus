export interface Tier {
  name: string;
  color: string;
}

export interface TierBand extends Tier {
  /** Inclusive lower bound. */
  min: number;
  /** Exclusive upper bound; Infinity for the top tier. */
  max: number;
}

// Rarity -> tier/color breakpoints, ported as-is from the original Chaos Gacha
// (Gacha.py, run_gacha).
export const TIER_BANDS: TierBand[] = [
  { name: "Trash", color: "#a39589", min: 0, max: 1 },
  { name: "Common", color: "#9c7e5a", min: 1, max: 2 },
  { name: "Uncommon", color: "#aed1d1", min: 2, max: 3 },
  { name: "Rare", color: "#11d939", min: 3, max: 4 },
  { name: "Elite", color: "#1172d9", min: 4, max: 5 },
  { name: "Epic", color: "#6811d9", min: 5, max: 6 },
  { name: "Legendary", color: "#f7d40a", min: 6, max: 7 },
  { name: "Mythical", color: "#fc61ff", min: 7, max: 8 },
  { name: "Divine", color: "#ff8c00", min: 8, max: 9 },
  { name: "Transcendent", color: "#ff0000", min: 9, max: Infinity },
];

/** Trash -> Transcendent, weakest to strongest - useful for comparing tiers by name. */
export const TIER_ORDER = TIER_BANDS.map((band) => band.name);

export function tierForRarity(rarity: number): Tier {
  const band = TIER_BANDS.find((candidate) => rarity < candidate.max) ?? TIER_BANDS[TIER_BANDS.length - 1];
  return { name: band.name, color: band.color };
}

export function bandForTierName(name: string): TierBand | undefined {
  return TIER_BANDS.find((band) => band.name === name);
}

/** True for Epic and above - the pulls worth an extra flourish in the UI. */
export function isHighTier(tierName: string): boolean {
  return TIER_ORDER.indexOf(tierName) >= TIER_ORDER.indexOf("Epic");
}
