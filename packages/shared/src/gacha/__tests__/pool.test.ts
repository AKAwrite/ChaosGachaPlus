import { describe, expect, it } from "vitest";
import { resolvePool, type CustomizationInput, type OfficialEntryInput } from "../pool.js";

function official(overrides: Partial<OfficialEntryInput> & Pick<OfficialEntryInput, "id" | "name" | "rarity">): OfficialEntryInput {
  return {
    category: "ability",
    description: "official description",
    isNsfw: false,
    isCharacter: false,
    isTech: false,
    ...overrides,
  };
}

function customization(overrides: Partial<CustomizationInput> & Pick<CustomizationInput, "id">): CustomizationInput {
  return {
    storyId: null,
    baseEntryId: null,
    category: "ability",
    name: null,
    rarity: null,
    description: null,
    isExcluded: false,
    ...overrides,
  };
}

describe("resolvePool", () => {
  it("returns official entries unmodified when there are no customizations", () => {
    const entries = [official({ id: "e1", name: "Tinder", rarity: 1.3 })];
    const pool = resolvePool({ category: "ability", storyId: "story-1", officialEntries: entries, customizations: [] });

    expect(pool).toHaveLength(1);
    expect(pool[0]).toMatchObject({ source: "official", name: "Tinder", rarity: 1.3, gachaEntryId: "e1" });
  });

  it("excludes an official entry when a matching customization has isExcluded", () => {
    const entries = [official({ id: "e1", name: "Tinder", rarity: 1.3 })];
    const customizations = [customization({ id: "c1", baseEntryId: "e1", isExcluded: true })];
    const pool = resolvePool({ category: "ability", storyId: "story-1", officialEntries: entries, customizations });

    expect(pool).toHaveLength(0);
  });

  it("overrides name/rarity/description while keeping traceability to the base entry", () => {
    const entries = [official({ id: "e1", name: "Tinder", rarity: 1.3 })];
    const customizations = [
      customization({ id: "c1", baseEntryId: "e1", name: "Homebrew Tinder", rarity: 2.0 }),
    ];
    const pool = resolvePool({ category: "ability", storyId: "story-1", officialEntries: entries, customizations });

    expect(pool[0]).toMatchObject({
      source: "custom",
      name: "Homebrew Tinder",
      rarity: 2.0,
      gachaEntryId: "e1",
      customizationId: "c1",
    });
  });

  it("prefers a story-scoped customization over an account-wide one for the same entry", () => {
    const entries = [official({ id: "e1", name: "Tinder", rarity: 1.3 })];
    const customizations = [
      customization({ id: "global", baseEntryId: "e1", isExcluded: true }),
      customization({ id: "story-specific", baseEntryId: "e1", storyId: "story-1", name: "Only here", rarity: 5 }),
    ];
    const pool = resolvePool({ category: "ability", storyId: "story-1", officialEntries: entries, customizations });

    expect(pool).toHaveLength(1);
    expect(pool[0]).toMatchObject({ name: "Only here", customizationId: "story-specific" });
  });

  it("does not apply a customization scoped to a different story", () => {
    const entries = [official({ id: "e1", name: "Tinder", rarity: 1.3 })];
    const customizations = [customization({ id: "c1", baseEntryId: "e1", storyId: "other-story", isExcluded: true })];
    const pool = resolvePool({ category: "ability", storyId: "story-1", officialEntries: entries, customizations });

    expect(pool).toHaveLength(1);
    expect(pool[0].source).toBe("official");
  });

  it("includes wholly custom entries scoped to this story or account-wide", () => {
    const customizations = [
      customization({ id: "custom-1", name: "My Custom Ability", rarity: 4, storyId: "story-1" }),
      customization({ id: "custom-2", name: "Global Custom", rarity: 3, storyId: null }),
      customization({ id: "custom-3", name: "Other Story Only", rarity: 3, storyId: "other-story" }),
    ];
    const pool = resolvePool({ category: "ability", storyId: "story-1", officialEntries: [], customizations });

    expect(pool.map((p) => p.name).sort()).toEqual(["Global Custom", "My Custom Ability"]);
  });

  it("applies content filters (Nsfw/Character/Tech) to official entries", () => {
    const entries = [
      official({ id: "e1", name: "Clean", rarity: 1, isNsfw: false }),
      official({ id: "e2", name: "Spicy", rarity: 1, isNsfw: true }),
    ];
    const pool = resolvePool({
      category: "ability",
      storyId: "story-1",
      officialEntries: entries,
      customizations: [],
      contentFilters: { excludeNsfw: true },
    });

    expect(pool.map((p) => p.name)).toEqual(["Clean"]);
  });
});
