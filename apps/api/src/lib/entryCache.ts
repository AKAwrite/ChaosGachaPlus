import type { OfficialEntryInput } from "@chaosgachaplus/shared";
import type { PrismaClient, EntryCategory } from "../../generated/client/index.js";

const TTL_MS = 60 * 60 * 1000;

let cache: Map<EntryCategory, OfficialEntryInput[]> | null = null;
let loadedAt = 0;
let inFlight: Promise<Map<EntryCategory, OfficialEntryInput[]>> | null = null;

/**
 * The official pool is seeded content that only changes on a redeploy, but it
 * was being re-read from Postgres on every single roll (1383 rows of prose for
 * `ability` alone). Holding it in memory removes the heaviest query from the
 * hot path - it matters a lot when the database is a region away.
 */
export async function getOfficialEntries(
  prisma: PrismaClient,
  category: EntryCategory,
): Promise<OfficialEntryInput[]> {
  if (!cache || Date.now() - loadedAt > TTL_MS) {
    inFlight ??= load(prisma);
    cache = await inFlight;
    loadedAt = Date.now();
    inFlight = null;
  }
  return cache.get(category) ?? [];
}

async function load(prisma: PrismaClient) {
  const rows = await prisma.gachaEntry.findMany();
  const byCategory = new Map<EntryCategory, OfficialEntryInput[]>();

  for (const row of rows) {
    const entry: OfficialEntryInput = {
      id: row.id,
      category: row.category,
      name: row.name,
      rarity: Number(row.rarity),
      description: row.description,
      isNsfw: row.isNsfw,
      isCharacter: row.isCharacter,
      isTech: row.isTech,
    };
    const bucket = byCategory.get(row.category);
    if (bucket) bucket.push(entry);
    else byCategory.set(row.category, [entry]);
  }

  return byCategory;
}
