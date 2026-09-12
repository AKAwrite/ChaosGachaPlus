import type { CSSProperties } from "react";
import { tierForRarity } from "@chaosgachaplus/shared";

/** Exposes the tier colour to CSS as --tier-color so styling stays in the stylesheet. */
export function tierStyle(rarityOrColor: number | string): CSSProperties {
  const color = typeof rarityOrColor === "number" ? tierForRarity(rarityOrColor).color : rarityOrColor;
  return { "--tier-color": color } as CSSProperties;
}

export function tierName(rarity: number): string {
  return tierForRarity(rarity).name;
}
