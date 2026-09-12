import {
  CONCRETE_GACHA_CATEGORIES,
  resolvePool,
  rollGacha,
  type ConcreteGachaCategory,
  type PoolEntry,
  type RollResult,
} from "@chaosgachaplus/shared";
import type { PrismaClient, Ticket } from "../../generated/client/index.js";

/**
 * Resolves the eligible pool for a ticket's category (picking a random
 * concrete category for "random" tickets) and rolls once - or twice, for an
 * advantage ticket, as two independent options the caller lets the user
 * choose between.
 */
export async function rollForTicket(prisma: PrismaClient, userId: string, storyId: string, ticket: Ticket) {
  const category: ConcreteGachaCategory =
    ticket.category === "random"
      ? CONCRETE_GACHA_CATEGORIES[Math.floor(Math.random() * CONCRETE_GACHA_CATEGORIES.length)]
      : ticket.category;

  const [officialEntries, customizations] = await Promise.all([
    prisma.gachaEntry.findMany({ where: { category } }),
    prisma.gachaEntryCustomization.findMany({
      where: { userId, category, OR: [{ storyId: null }, { storyId }] },
    }),
  ]);

  const pool = resolvePool({
    category,
    storyId,
    officialEntries: officialEntries.map((entry) => ({
      id: entry.id,
      category: entry.category,
      name: entry.name,
      rarity: Number(entry.rarity),
      description: entry.description,
      isNsfw: entry.isNsfw,
      isCharacter: entry.isCharacter,
      isTech: entry.isTech,
    })),
    customizations: customizations.map((c) => ({
      id: c.id,
      storyId: c.storyId,
      baseEntryId: c.baseEntryId,
      category: c.category,
      name: c.name,
      rarity: c.rarity === null ? null : Number(c.rarity),
      description: c.description,
      isExcluded: c.isExcluded,
    })),
  });

  const rollCount = ticket.isAdvantage ? 2 : 1;
  const min = Number(ticket.minRarity);
  const max = Number(ticket.maxRarity);

  const results: RollResult[] = [];
  for (let i = 0; i < rollCount; i++) {
    results.push(
      rollGacha({
        entries: pool,
        min,
        avg: Number(ticket.avgRarity),
        max,
      }),
    );
  }

  return { results, decoys: sampleDecoys(pool, min, max) };
}

/**
 * Names the client spins past in the roll animation before landing on the
 * real result. Drawn from the same resolved pool so they always look like
 * plausible near-misses (and respect the user's own exclusions).
 */
function sampleDecoys(pool: PoolEntry[], min: number, max: number, count = 24): string[] {
  const inBand = pool.filter((entry) => entry.rarity > min && entry.rarity <= max);
  const source = inBand.length >= count ? inBand : pool;

  const decoys: string[] = [];
  for (let i = 0; i < count && source.length > 0; i++) {
    decoys.push(source[Math.floor(Math.random() * source.length)].name);
  }
  return decoys;
}
