import type { GachaCategory, RarityPresetName } from "./domain.js";

export interface Story {
  id: string;
  title: string;
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
  feat: string;
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
