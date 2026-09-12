import { CONCRETE_GACHA_CATEGORIES, type OfficialEntryInput } from "@chaosgachaplus/shared";
import type { PrismaClient, EntryCategory } from "../../generated/client/index.js";

const TTL_MS = 60 * 60 * 1000;

interface CacheSlot {
  entries: OfficialEntryInput[];
  loadedAt: number;
}

const cache = new Map<EntryCategory, CacheSlot>();
const inFlight = new Map<EntryCategory, Promise<OfficialEntryInput[]>>();

/**
 * The official pool is seeded content that only changes on a redeploy, but it
 * was being re-read from Postgres on every single roll (1383 rows of prose for
 * `ability` alone). Cached per category - loading all five at once made the
 * first roll after a cold start pay for categories it didn't need.
 */
export async function getOfficialEntries(
  prisma: PrismaClient,
  category: EntryCategory,
): Promise<OfficialEntryInput[]> {
  const slot = cache.get(category);
  if (slot && Date.now() - slot.loadedAt < TTL_MS) {
    return slot.entries;
  }

  let pending = inFlight.get(category);
  if (!pending) {
    pending = load(prisma, category);
    inFlight.set(category, pending);
  }

  try {
    return await pending;
  } finally {
    inFlight.delete(category);
  }
}

/**
 * Fills the cache in the background at boot. Render's free tier spins the
 * process down after 15 minutes idle, so without this the first roll of every
 * session pays the full load; doing it here moves that cost into the cold
 * start the user is already waiting through.
 */
export function warmEntryCache(prisma: PrismaClient, onError: (error: unknown) => void): void {
  for (const category of CONCRETE_GACHA_CATEGORIES) {
    void getOfficialEntries(prisma, category).catch(onError);
  }
}

async function load(prisma: PrismaClient, category: EntryCategory): Promise<OfficialEntryInput[]> {
  const rows = await prisma.gachaEntry.findMany({ where: { category } });
  const entries = rows.map((row) => ({
    id: row.id,
    category: row.category,
    name: row.name,
    rarity: Number(row.rarity),
    description: row.description,
    isNsfw: row.isNsfw,
    isCharacter: row.isCharacter,
    isTech: row.isTech,
  }));

  cache.set(category, { entries, loadedAt: Date.now() });
  return entries;
}
