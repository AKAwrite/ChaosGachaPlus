import type { GachaCategory } from "../types/domain.js";

export interface PoolEntry {
  /** id of the underlying GachaEntry or GachaEntryCustomization row, for traceability */
  id: string;
  source: "official" | "custom";
  gachaEntryId?: string;
  customizationId?: string;
  category: GachaCategory;
  name: string;
  rarity: number;
  description: string;
}

export interface RollResult {
  entry: PoolEntry;
  rarity: number;
  tier: string;
  color: string;
  luckPercent: number;
}

export type RandomSource = () => number;
