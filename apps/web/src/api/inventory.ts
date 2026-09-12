import { apiFetch } from "./client";

export interface InventoryItem {
  id: string;
  characterId: string;
  sourcePullId: string;
  name: string;
  description: string;
  rarity: number;
  acquiredAt: string;
  consumedAt: string | null;
}

export function listInventory(storyId: string, characterId: string) {
  return apiFetch<InventoryItem[]>(`/stories/${storyId}/characters/${characterId}/inventory`);
}

export function transferItem(itemId: string, toCharacterId: string) {
  return apiFetch<InventoryItem>(`/items/${itemId}/transfer`, {
    method: "POST",
    body: JSON.stringify({ toCharacterId }),
  });
}

export function setItemConsumed(itemId: string, consumed: boolean) {
  return apiFetch<InventoryItem>(`/items/${itemId}/consume`, {
    method: "POST",
    body: JSON.stringify({ consumed }),
  });
}
