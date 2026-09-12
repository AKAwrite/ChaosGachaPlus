import { describe, expect, it } from "vitest";
import { tierForRarity } from "../tiers.js";

describe("tierForRarity", () => {
  it.each([
    [0, "Trash"],
    [0.9, "Trash"],
    [1, "Common"],
    [2.5, "Uncommon"],
    [3.4, "Rare"],
    [4.1, "Elite"],
    [5.9, "Epic"],
    [6.7, "Legendary"],
    [7.2, "Mythical"],
    [8.8, "Divine"],
    [9, "Transcendent"],
    [10, "Transcendent"],
  ])("maps rarity %f to tier %s", (rarity, expected) => {
    expect(tierForRarity(rarity).name).toBe(expected);
  });
});
