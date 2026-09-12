import { describe, expect, it } from "vitest";
import { rollGacha, sampleTargetRarity, weightForRarity } from "../engine.js";
import type { PoolEntry } from "../types.js";

const alwaysFirst = () => 0;

function makeEntry(overrides: Partial<PoolEntry> & Pick<PoolEntry, "rarity">): PoolEntry {
  return {
    id: `entry-${overrides.rarity}`,
    source: "official",
    category: "ability",
    name: `Entry ${overrides.rarity}`,
    description: "test entry",
    ...overrides,
  };
}

describe("weightForRarity", () => {
  it("is maximal (1) exactly at the average", () => {
    expect(weightForRarity(5, 5)).toBe(1);
  });

  it("decays as distance from the average grows", () => {
    const near = weightForRarity(4, 5);
    const far = weightForRarity(1, 5);
    expect(near).toBeGreaterThan(far);
  });
});

describe("sampleTargetRarity", () => {
  it("returns the lowest candidate (min + 0.1) when rng always picks index 0", () => {
    expect(sampleTargetRarity(0.8, 1.2, 1.0, 4, alwaysFirst)).toBeCloseTo(0.9, 5);
  });

  it("returns the highest candidate (max) when rng picks the last index", () => {
    const alwaysLast = () => 1 - 1e-9;
    expect(sampleTargetRarity(0.8, 1.2, 1.0, 4, alwaysLast)).toBeCloseTo(1.2, 5);
  });

  it("throws for a degenerate range with no candidates", () => {
    expect(() => sampleTargetRarity(1, 1, 1)).toThrow();
  });
});

describe("rollGacha", () => {
  it("deterministically resolves a single-entry pool", () => {
    const entries = [makeEntry({ rarity: 1.0 })];
    const result = rollGacha({ entries, min: 0.8, avg: 1.0, max: 1.2, rng: alwaysFirst });

    expect(result.entry.rarity).toBe(1.0);
    expect(result.tier).toBe("Common");
    expect(result.luckPercent).toBeCloseTo(100, 5);
  });

  it("throws when the pool is empty", () => {
    expect(() => rollGacha({ entries: [], min: 0, avg: 5, max: 10 })).toThrow();
  });

  it("throws when no entry falls within the (min, max] range", () => {
    const entries = [makeEntry({ rarity: 0.5 })];
    expect(() => rollGacha({ entries, min: 5, avg: 5, max: 10 })).toThrow();
  });

  it("throws when the sampled target never lands near any entry", () => {
    const entries = [makeEntry({ rarity: 9.0 })];
    expect(() => rollGacha({ entries, min: 0, avg: 5, max: 10, rng: alwaysFirst })).toThrow();
  });

  it("keeps the distribution centered near the average across many rolls", () => {
    const entries = [
      makeEntry({ rarity: 1.0 }),
      makeEntry({ rarity: 3.0 }),
      makeEntry({ rarity: 5.0 }),
      makeEntry({ rarity: 7.0 }),
      makeEntry({ rarity: 9.0 }),
    ];

    let sum = 0;
    const iterations = 500;
    for (let i = 0; i < iterations; i++) {
      const result = rollGacha({ entries, min: 0, avg: 5, max: 10 });
      sum += result.rarity;
    }
    const average = sum / iterations;
    expect(average).toBeGreaterThan(3.5);
    expect(average).toBeLessThan(6.5);
  });
});
