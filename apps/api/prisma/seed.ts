import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseGachaFileContent } from "@chaosgachaplus/shared";
import { PrismaClient } from "../generated/client/index.js";
import type { EntryCategory } from "../generated/client/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../../../data/gachafiles");

const CATEGORY_FILES: Record<EntryCategory, string> = {
  ability: "ability.txt",
  item: "item.txt",
  familiar: "familiar.txt",
  trait: "trait.txt",
  skill: "skill.txt",
};

const prisma = new PrismaClient();

async function seedCategory(category: EntryCategory, filename: string) {
  const content = await readFile(path.join(DATA_DIR, filename), "utf-8");
  const { entries, warnings } = parseGachaFileContent(content);

  for (const warning of warnings) {
    console.warn(`[${category}] line ${warning.lineNumber}: ${warning.reason} -> ${JSON.stringify(warning.line)}`);
  }

  for (const entry of entries) {
    await prisma.gachaEntry.upsert({
      where: { category_sourceIndex: { category, sourceIndex: entry.sourceIndex } },
      update: {
        name: entry.name,
        rarity: entry.rarity,
        description: entry.description,
        isNsfw: entry.isNsfw,
        isCharacter: entry.isCharacter,
        isTech: entry.isTech,
      },
      create: {
        category,
        sourceIndex: entry.sourceIndex,
        name: entry.name,
        rarity: entry.rarity,
        description: entry.description,
        isNsfw: entry.isNsfw,
        isCharacter: entry.isCharacter,
        isTech: entry.isTech,
      },
    });
  }

  console.log(`[${category}] seeded ${entries.length} entries from ${filename}`);
  return entries.length;
}

async function main() {
  let total = 0;
  for (const [category, filename] of Object.entries(CATEGORY_FILES) as Array<[EntryCategory, string]>) {
    total += await seedCategory(category, filename);
  }
  console.log(`Done. Seeded ${total} gacha entries in total.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
