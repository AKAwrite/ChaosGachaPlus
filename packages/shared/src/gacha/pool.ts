import type { GachaCategory } from "../types/domain.js";
import type { PoolEntry } from "./types.js";

export interface OfficialEntryInput {
  id: string;
  category: GachaCategory;
  name: string;
  rarity: number;
  description: string;
  isNsfw: boolean;
  isCharacter: boolean;
  isTech: boolean;
}

export interface CustomizationInput {
  id: string;
  /** null = applies to every Story the user owns; set = scoped to one Story */
  storyId: string | null;
  /** null = this customization IS a wholly custom entry, not an override */
  baseEntryId: string | null;
  category: GachaCategory;
  name: string | null;
  rarity: number | null;
  description: string | null;
  isExcluded: boolean;
}

export interface ContentFilters {
  excludeNsfw?: boolean;
  excludeCharacter?: boolean;
  excludeTech?: boolean;
}

export interface ResolvePoolInput {
  category: GachaCategory;
  storyId: string | null;
  officialEntries: OfficialEntryInput[];
  /** All of the current user's customizations - filtered internally by category/story scope */
  customizations: CustomizationInput[];
  contentFilters?: ContentFilters;
}

/**
 * Builds the effective roll pool for a category: official entries (minus
 * content-filter exclusions), overridden by any of the user's customizations
 * (a Story-scoped customization wins over an account-wide one for the same
 * base entry), plus the user's wholly custom entries for this scope.
 */
export function resolvePool(input: ResolvePoolInput): PoolEntry[] {
  const { category, storyId, officialEntries, customizations, contentFilters = {} } = input;

  const relevantCustomizations = customizations.filter(
    (c) => c.category === category && (c.storyId === null || c.storyId === storyId),
  );

  const overrideByBaseId = new Map<string, CustomizationInput>();
  for (const customization of relevantCustomizations) {
    if (!customization.baseEntryId) continue;
    const existing = overrideByBaseId.get(customization.baseEntryId);
    const isMoreSpecific = !existing || (existing.storyId === null && customization.storyId !== null);
    if (isMoreSpecific) {
      overrideByBaseId.set(customization.baseEntryId, customization);
    }
  }

  const pool: PoolEntry[] = [];

  for (const entry of officialEntries) {
    if (entry.category !== category) continue;
    if (contentFilters.excludeNsfw && entry.isNsfw) continue;
    if (contentFilters.excludeCharacter && entry.isCharacter) continue;
    if (contentFilters.excludeTech && entry.isTech) continue;

    const override = overrideByBaseId.get(entry.id);
    if (override?.isExcluded) continue;

    pool.push({
      id: override ? override.id : entry.id,
      source: override ? "custom" : "official",
      gachaEntryId: entry.id,
      customizationId: override?.id,
      category,
      name: override?.name ?? entry.name,
      rarity: override?.rarity ?? entry.rarity,
      description: override?.description ?? entry.description,
    });
  }

  for (const customization of relevantCustomizations) {
    if (customization.baseEntryId) continue;
    if (customization.isExcluded) continue;
    if (customization.name == null || customization.rarity == null) continue;

    pool.push({
      id: customization.id,
      source: "custom",
      customizationId: customization.id,
      category,
      name: customization.name,
      rarity: customization.rarity,
      description: customization.description ?? "",
    });
  }

  return pool;
}
