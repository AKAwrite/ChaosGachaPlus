import { apiFetch } from "./client";

export interface HistoryEvent {
  id: string;
  characterId: string | null;
  storyId: string;
  type: string;
  summary: string;
  occurredAt: string;
  character?: { name: string } | null;
}

export function listCharacterHistory(storyId: string, characterId: string) {
  return apiFetch<HistoryEvent[]>(`/stories/${storyId}/characters/${characterId}/history`);
}

export function listStoryHistory(storyId: string) {
  return apiFetch<HistoryEvent[]>(`/stories/${storyId}/history`);
}
