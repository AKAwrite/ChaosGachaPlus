import type { GachaCategory, RarityPresetName } from "./domain.js";

export type DedupeMode = "off" | "character" | "story";

export interface Story {
  id: string;
  title: string;
  /** Whether rolls may repeat something already held. */
  dedupeMode: DedupeMode;
  createdAt: string;
}

export interface Character {
  id: string;
  storyId: string;
  name: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  characterId: string;
  feat: string | null;
  category: GachaCategory;
  presetName: RarityPresetName | null;
  minRarity: number;
  avgRarity: number;
  maxRarity: number;
  isAdvantage: boolean;
  earnedAt: string;
  usedAt: string | null;
  createdAt: string;
}
