export interface ParsedGachaEntry {
  sourceIndex: number;
  name: string;
  rarity: number;
  description: string;
  isNsfw: boolean;
  isCharacter: boolean;
  isTech: boolean;
}

export interface ParseWarning {
  lineNumber: number;
  line: string;
  reason: string;
}

export interface ParseResult {
  entries: ParsedGachaEntry[];
  warnings: ParseWarning[];
}

// Matches a header line like "1. Tinder,1.3", "3.Iaijutsu,3.4" (no space after
// the dot) or "10. Fafnir - Fate, 6.8" (extra spacing around the comma).
const HEADER_PATTERN = /^\s*(\d+)\.\s*(.+?)\s*,\s*([0-9]+(?:\.[0-9]+)?)\s*$/;

const TAG_PATTERNS: Array<{ flag: keyof Pick<ParsedGachaEntry, "isNsfw" | "isCharacter" | "isTech">; pattern: RegExp }> = [
  { flag: "isNsfw", pattern: /\(\s*nsfw\s*\)/gi },
  { flag: "isCharacter", pattern: /\(\s*character\s*\)/gi },
  { flag: "isTech", pattern: /\(\s*tech\s*\)/gi },
];

function cleanDescriptionLine(line: string): string {
  return line.trim().replace(/^#+\s*/, "");
}

/**
 * Parses one gachafiles/*.txt source file's raw text into structured entries.
 * Pure function (no filesystem access) so it can run against fixtures in tests
 * and against the real files from the seed script.
 */
export function parseGachaFileContent(content: string): ParseResult {
  const lines = content.split(/\r?\n/);
  const entries: ParsedGachaEntry[] = [];
  const warnings: ParseWarning[] = [];

  let current: { sourceIndex: number; name: string; rarity: number; descriptionLines: string[] } | null = null;

  const flush = () => {
    if (!current) return;

    let description = current.descriptionLines.map(cleanDescriptionLine).filter(Boolean).join(" ");

    let isNsfw = false;
    let isCharacter = false;
    let isTech = false;
    for (const { flag, pattern } of TAG_PATTERNS) {
      if (pattern.test(description)) {
        if (flag === "isNsfw") isNsfw = true;
        if (flag === "isCharacter") isCharacter = true;
        if (flag === "isTech") isTech = true;
      }
      description = description.replace(pattern, "").replace(/\s{2,}/g, " ").trim();
    }

    entries.push({
      sourceIndex: current.sourceIndex,
      name: current.name,
      rarity: current.rarity,
      description,
      isNsfw,
      isCharacter,
      isTech,
    });
    current = null;
  };

  lines.forEach((rawLine, index) => {
    const lineNumber = index + 1;
    const match = rawLine.match(HEADER_PATTERN);

    if (match) {
      flush();
      current = {
        sourceIndex: Number.parseInt(match[1], 10),
        name: match[2].trim(),
        rarity: Number.parseFloat(match[3]),
        descriptionLines: [],
      };
      return;
    }

    if (!rawLine.trim()) {
      return;
    }

    if (current) {
      current.descriptionLines.push(rawLine);
    } else {
      warnings.push({ lineNumber, line: rawLine, reason: "Non-empty line found before the first entry header" });
    }
  });

  flush();

  return { entries, warnings };
}
