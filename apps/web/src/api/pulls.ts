import type { GachaCategory } from "@chaosgachaplus/shared";
import { apiFetch } from "./client";

export interface ProposalOption {
  ticketId: string;
  optionIndex: number;
  category: GachaCategory;
  name: string;
  rarity: number;
  description: string;
  tier: string;
  color: string;
  luckPercent: number;
}

export type ProposalsByTicket = Record<string, ProposalOption[]>;

export interface Pull {
  id: string;
  ticketId: string;
  chosenOptionIndex: number;
  category: GachaCategory;
  name: string;
  rarity: number;
  description: string;
  tier: string;
  luckPercent: number;
  rolledAt: string;
  ticketFeat?: string;
}

export function proposeRolls(storyId: string, characterId: string, ticketIds: string[]) {
  return apiFetch<ProposalsByTicket>(`/stories/${storyId}/characters/${characterId}/tickets/propose`, {
    method: "POST",
    body: JSON.stringify({ ticketIds }),
  });
}

export function commitRolls(
  storyId: string,
  characterId: string,
  selections: Array<{ ticketId: string; optionIndex: number }>,
) {
  return apiFetch<Pull[]>(`/stories/${storyId}/characters/${characterId}/tickets/commit`, {
    method: "POST",
    body: JSON.stringify({ selections }),
  });
}

export function listPulls(storyId: string, characterId: string) {
  return apiFetch<Pull[]>(`/stories/${storyId}/characters/${characterId}/pulls`);
}
