import type { ConcreteGachaCategory } from "@chaosgachaplus/shared";
import { apiFetch } from "./client";

export interface GachaEntryDTO {
  id: string;
  category: ConcreteGachaCategory;
  name: string;
  rarity: number;
  description: string;
  isNsfw: boolean;
  isCharacter: boolean;
  isTech: boolean;
}

export interface CustomizationDTO {
  id: string;
  userId: string;
  storyId: string | null;
  baseEntryId: string | null;
  category: ConcreteGachaCategory;
  name: string | null;
  rarity: number | null;
  description: string | null;
  isExcluded: boolean;
  createdAt: string;
}

export interface ListEntriesParams {
  category?: ConcreteGachaCategory;
  search?: string;
  tiers?: string[];
  sort?: "name" | "rarity";
  dir?: "asc" | "desc";
  limit?: number;
}

export interface EntryListPage {
  entries: GachaEntryDTO[];
  total: number;
}

export function listEntries(params: ListEntriesParams) {
  const query = new URLSearchParams();
  if (params.category) query.set("category", params.category);
  if (params.search) query.set("search", params.search);
  if (params.tiers?.length) query.set("tiers", params.tiers.join(","));
  if (params.sort) query.set("sort", params.sort);
  if (params.dir) query.set("dir", params.dir);
  if (params.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  return apiFetch<EntryListPage>(`/entries${qs ? `?${qs}` : ""}`);
}

export function listCustomizations(storyId?: string) {
  const qs = storyId ? `?storyId=${storyId}` : "";
  return apiFetch<CustomizationDTO[]>(`/customizations${qs}`);
}

export interface CreateCustomizationInput {
  storyId?: string | null;
  baseEntryId?: string | null;
  category?: ConcreteGachaCategory;
  name?: string | null;
  rarity?: number | null;
  description?: string | null;
  isExcluded?: boolean;
}

export function createCustomization(input: CreateCustomizationInput) {
  return apiFetch<CustomizationDTO>("/customizations", { method: "POST", body: JSON.stringify(input) });
}

export function updateCustomization(id: string, input: Partial<CreateCustomizationInput>) {
  return apiFetch<CustomizationDTO>(`/customizations/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export function deleteCustomization(id: string) {
  return apiFetch<void>(`/customizations/${id}`, { method: "DELETE" });
}
