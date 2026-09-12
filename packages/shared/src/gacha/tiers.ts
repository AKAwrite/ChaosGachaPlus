export interface Tier {
  name: string;
  color: string;
}

// Rarity -> tier/color breakpoints, ported as-is from the original Chaos Gacha
// (Gacha.py, run_gacha): each bound is an exclusive upper limit except the last.
const TIER_TABLE: Array<{ upperBound: number; tier: Tier }> = [
  { upperBound: 1, tier: { name: "Trash", color: "#a39589" } },
  { upperBound: 2, tier: { name: "Common", color: "#9c7e5a" } },
  { upperBound: 3, tier: { name: "Uncommon", color: "#aed1d1" } },
  { upperBound: 4, tier: { name: "Rare", color: "#11d939" } },
  { upperBound: 5, tier: { name: "Elite", color: "#1172d9" } },
  { upperBound: 6, tier: { name: "Epic", color: "#6811d9" } },
  { upperBound: 7, tier: { name: "Legendary", color: "#f7d40a" } },
  { upperBound: 8, tier: { name: "Mythical", color: "#fc61ff" } },
  { upperBound: 9, tier: { name: "Divine", color: "#ff8c00" } },
];

const TRANSCENDENT: Tier = { name: "Transcendent", color: "#ff0000" };

/** Trash -> Transcendent, weakest to strongest - useful for comparing tiers by name. */
export const TIER_ORDER = [...TIER_TABLE.map((t) => t.tier.name), TRANSCENDENT.name];

export function tierForRarity(rarity: number): Tier {
  for (const { upperBound, tier } of TIER_TABLE) {
    if (rarity < upperBound) {
      return tier;
    }
  }
  return TRANSCENDENT;
}

/** True for Epic and above - the pulls worth an extra flourish in the UI. */
export function isHighTier(tierName: string): boolean {
  return TIER_ORDER.indexOf(tierName) >= TIER_ORDER.indexOf("Epic");
}
