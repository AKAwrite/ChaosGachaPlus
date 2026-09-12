import type { Story } from "@chaosgachaplus/shared";
import { apiFetch } from "./client";

export function listStories() {
  return apiFetch<Story[]>("/stories");
}

export function getStory(storyId: string) {
  return apiFetch<Story>(`/stories/${storyId}`);
}

export function createStory(title: string) {
  return apiFetch<Story>("/stories", { method: "POST", body: JSON.stringify({ title }) });
}

export function updateStory(storyId: string, title: string) {
  return apiFetch<Story>(`/stories/${storyId}`, { method: "PATCH", body: JSON.stringify({ title }) });
}

export function deleteStory(storyId: string) {
  return apiFetch<void>(`/stories/${storyId}`, { method: "DELETE" });
}
