import { tierForRarity } from "./tiers.js";
import type { PoolEntry, RandomSource, RollResult } from "./types.js";

const RARITY_STEP = 0.1;
const PROXIMITY_TOLERANCE = 0.2;
const DEFAULT_EXPONENT = 4;
const MAX_TARGET_RESAMPLES = 200;

/** Ported from Gacha.py: weight decays exponentially with distance from the target average. */
export function weightForRarity(rarity: number, avg: number, exponent = DEFAULT_EXPONENT): number {
  return 1 / Math.pow(exponent, Math.abs(avg - rarity));
}

/** Rounds to the nearest tenth as an integer, to avoid floating point drift when stepping by 0.1. */
function toTenths(value: number): number {
  return Math.round(value * 10);
}

/**
 * Ported from Gacha.py `randomizer`: samples a target rarity from the
 * min/max range, weighted so values near `avg` are more likely. Candidates
 * are every tenth strictly above `min` up to `max`.
 */
export function sampleTargetRarity(
  min: number,
  max: number,
  avg: number,
  exponent = DEFAULT_EXPONENT,
  rng: RandomSource = Math.random,
): number {
  const minTenths = toTenths(min);
  const maxTenths = toTenths(max);

  const candidates: number[] = [];
  const weights: number[] = [];
  for (let tenths = minTenths + 1; tenths <= maxTenths; tenths++) {
    const candidate = tenths / 10;
    candidates.push(candidate);
    weights.push(weightForRarity(candidate, avg, exponent));
  }

  if (candidates.length === 0) {
    throw new Error(`Invalid rarity range: min=${min}, max=${max} produced no candidates`);
  }

  const index = pickWeightedIndex(weights, rng);
  return candidates[index];
}

function pickWeightedIndex(weights: number[], rng: RandomSource): number {
  const total = weights.reduce((sum, w) => sum + w, 0);
  let roll = rng() * total;
  for (let i = 0; i < weights.length; i++) {
    roll -= weights[i];
    if (roll <= 0) {
      return i;
    }
  }
  return weights.length - 1;
}

export interface RollGachaInput {
  entries: PoolEntry[];
  min: number;
  avg: number;
  max: number;
  exponent?: number;
  rng?: RandomSource;
}

/**
 * Ported from Gacha.py `run_gacha`: samples a target rarity, picks a
 * weighted-random entry among those within +/-0.2 of it, and computes the
 * "luck" percentage relative to every entry in the (min, max] range.
 */
export function rollGacha(input: RollGachaInput): RollResult {
  const { entries, min, avg, max, exponent = DEFAULT_EXPONENT, rng = Math.random } = input;

  if (entries.length === 0) {
    throw new Error("Cannot roll: the pool has no eligible entries");
  }

  const weights = entries.map((entry) => weightForRarity(entry.rarity, avg, exponent));
  const weightSum = entries.reduce(
    (sum, entry, i) => (entry.rarity > min && entry.rarity <= max ? sum + weights[i] : sum),
    0,
  );

  if (weightSum <= 0) {
    throw new Error(`Cannot roll: no eligible entries fall within (${min}, ${max}]`);
  }

  for (let attempt = 0; attempt < MAX_TARGET_RESAMPLES; attempt++) {
    const target = sampleTargetRarity(min, max, avg, exponent, rng);

    const filteredIndexes = entries
      .map((_, i) => i)
      .filter((i) => Math.abs(entries[i].rarity - target) <= PROXIMITY_TOLERANCE);

    if (filteredIndexes.length === 0) {
      continue;
    }

    const filteredWeights = filteredIndexes.map((i) => weights[i]);
    const chosen = filteredIndexes[pickWeightedIndex(filteredWeights, rng)];
    const entry = entries[chosen];
    const luckPercent = (100 * weights[chosen]) / weightSum;
    const tier = tierForRarity(entry.rarity);

    return {
      entry,
      rarity: entry.rarity,
      tier: tier.name,
      color: tier.color,
      luckPercent,
    };
  }

  throw new Error("Cannot roll: no entries found near any sampled target rarity after repeated attempts");
}
