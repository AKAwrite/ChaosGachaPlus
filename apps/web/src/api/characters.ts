import type { Character } from "@chaosgachaplus/shared";
import { apiFetch } from "./client";

export function listCharacters(storyId: string) {
  return apiFetch<Character[]>(`/stories/${storyId}/characters`);
}

export function getCharacter(storyId: string, characterId: string) {
  return apiFetch<Character>(`/stories/${storyId}/characters/${characterId}`);
}

export function createCharacter(storyId: string, name: string) {
  return apiFetch<Character>(`/stories/${storyId}/characters`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function updateCharacter(storyId: string, characterId: string, name: string) {
  return apiFetch<Character>(`/stories/${storyId}/characters/${characterId}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
}

export function deleteCharacter(storyId: string, characterId: string) {
  return apiFetch<void>(`/stories/${storyId}/characters/${characterId}`, { method: "DELETE" });
}
