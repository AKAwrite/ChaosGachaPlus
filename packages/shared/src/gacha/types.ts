import type { ConcreteGachaCategory } from "../types/domain.js";

export interface PoolEntry {
  /** id of the underlying GachaEntry or GachaEntryCustomization row, for traceability */
  id: string;
  source: "official" | "custom";
  gachaEntryId?: string;
  customizationId?: string;
  /** Always concrete - "random" tickets resolve to one of these before the pool is built. */
  category: ConcreteGachaCategory;
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
