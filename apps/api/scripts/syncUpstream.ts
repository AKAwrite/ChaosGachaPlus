/**
 * Pulls the official entry lists from Bronzdeck's Chaos Gacha and merges them
 * into this database.
 *
 *   npm run sync:entries -- --dry-run     # show what would change
 *   npm run sync:entries                  # apply it
 *   npm run sync:entries -- --ref main    # a different upstream branch/tag
 *
 * Merge rules, in order of importance:
 *   - Nothing is ever deleted. Entries that exist here but not upstream are
 *     reported and left alone (they may be yours, or removed upstream).
 *   - Entries are matched on (category, name), not on the "N." numbering:
 *     that numbering is parse-order position, so a single insertion upstream
 *     shifts everything after it.
 *   - Matching entries get their rarity/description/tags refreshed; their row
 *     id survives, so existing pulls and customizations stay attached.
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseGachaFileContent } from "@chaosgachaplus/shared";
import { PrismaClient } from "../generated/client/index.js";
import type { EntryCategory, Prisma } from "../generated/client/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../../../data/gachafiles");

const UPSTREAM = "https://raw.githubusercontent.com/Bronzdeck/ChaosGacha";

const CATEGORY_FILES: Record<EntryCategory, string> = {
  ability: "ability.txt",
  item: "item.txt",
  familiar: "familiar.txt",
  trait: "trait.txt",
  skill: "skill.txt",
};

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const refIndex = args.indexOf("--ref");
const ref = refIndex >= 0 ? args[refIndex + 1] : "main";

const prisma = new PrismaClient();

interface Change {
  category: EntryCategory;
  name: string;
  detail: string;
}

const added: Change[] = [];
const updated: Change[] = [];
const localOnly: Change[] = [];
let unchanged = 0;

async function fetchUpstream(filename: string): Promise<string | null> {
  for (const candidateRef of [ref, "master"]) {
    const url = `${UPSTREAM}/${candidateRef}/gachafiles/${filename}`;
    const response = await fetch(url);
    if (response.ok) {
      if (candidateRef !== ref) console.log(`  (found on "${candidateRef}" instead of "${ref}")`);
      return response.text();
    }
  }
  console.error(`  could not fetch ${filename} (tried refs: ${ref}, master)`);
  return null;
}

async function syncCategory(category: EntryCategory, filename: string) {
  console.log(`\n${category}`);

  const raw = await fetchUpstream(filename);
  if (raw === null) {
    process.exitCode = 1;
    return;
  }

  const { entries: upstreamEntries, warnings } = parseGachaFileContent(raw);
  for (const warning of warnings) {
    console.warn(`  parse warning, line ${warning.lineNumber}: ${warning.reason}`);
  }

  const existing = await prisma.gachaEntry.findMany({ where: { category } });
  const byName = new Map(existing.map((entry) => [entry.name.toLowerCase(), entry]));
  const upstreamNames = new Set(upstreamEntries.map((entry) => entry.name.toLowerCase()));

  let nextIndex = existing.reduce((max, entry) => Math.max(max, entry.sourceIndex), 0);
  const creates: Prisma.GachaEntryCreateManyInput[] = [];
  const updates: Array<{ id: string; data: Prisma.GachaEntryUpdateInput }> = [];

  for (const entry of upstreamEntries) {
    const current = byName.get(entry.name.toLowerCase());

    if (!current) {
      creates.push({
        category,
        sourceIndex: ++nextIndex,
        name: entry.name,
        rarity: entry.rarity,
        description: entry.description,
        isNsfw: entry.isNsfw,
        isCharacter: entry.isCharacter,
        isTech: entry.isTech,
      });
      added.push({ category, name: entry.name, detail: `rarity ${entry.rarity}` });
      continue;
    }

    const diffs: string[] = [];
    if (Number(current.rarity) !== entry.rarity) diffs.push(`rarity ${current.rarity} -> ${entry.rarity}`);
    if (current.description !== entry.description) diffs.push("description");
    if (current.isNsfw !== entry.isNsfw) diffs.push(`isNsfw -> ${entry.isNsfw}`);
    if (current.isCharacter !== entry.isCharacter) diffs.push(`isCharacter -> ${entry.isCharacter}`);
    if (current.isTech !== entry.isTech) diffs.push(`isTech -> ${entry.isTech}`);

    if (diffs.length === 0) {
      unchanged++;
      continue;
    }

    updates.push({
      id: current.id,
      data: {
        rarity: entry.rarity,
        description: entry.description,
        isNsfw: entry.isNsfw,
        isCharacter: entry.isCharacter,
        isTech: entry.isTech,
      },
    });
    updated.push({ category, name: entry.name, detail: diffs.join(", ") });
  }

  for (const entry of existing) {
    if (!upstreamNames.has(entry.name.toLowerCase())) {
      localOnly.push({ category, name: entry.name, detail: "kept" });
    }
  }

  console.log(
    `  upstream ${upstreamEntries.length} | here ${existing.length} | ` +
      `new ${creates.length}, updated ${updates.length}, only here ${localOnly.filter((c) => c.category === category).length}`,
  );

  if (dryRun) return;

  if (creates.length > 0) {
    await prisma.gachaEntry.createMany({ data: creates });
  }
  for (const update of updates) {
    await prisma.gachaEntry.update({ where: { id: update.id }, data: update.data });
  }

  // Keep the repo's copy in step with what was imported, so `git diff` shows
  // exactly what changed upstream.
  await writeFile(path.join(DATA_DIR, filename), raw, "utf-8");
}

function report(title: string, changes: Change[], limit = 15) {
  if (changes.length === 0) return;
  console.log(`\n${title} (${changes.length})`);
  for (const change of changes.slice(0, limit)) {
    console.log(`  [${change.category}] ${change.name} - ${change.detail}`);
  }
  if (changes.length > limit) console.log(`  ...and ${changes.length - limit} more`);
}

console.log(`Syncing with ${UPSTREAM} @ ${ref}${dryRun ? "  (dry run - nothing will be written)" : ""}`);

for (const [category, filename] of Object.entries(CATEGORY_FILES) as Array<[EntryCategory, string]>) {
  await syncCategory(category, filename);
}

report("Added", added);
report("Updated", updated);
report("Only in your database - left untouched", localOnly);

console.log(
  `\nTotal: ${added.length} added, ${updated.length} updated, ${unchanged} unchanged, ${localOnly.length} kept.`,
);
if (dryRun) {
  console.log("Dry run - nothing was written. Re-run without --dry-run to apply.");
} else if (added.length > 0 || updated.length > 0) {
  console.log("Restart the API so the in-memory pool picks the changes up, then commit data/gachafiles.");
}

await prisma.$disconnect();
