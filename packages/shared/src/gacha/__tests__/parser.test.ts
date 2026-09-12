import { describe, expect, it } from "vitest";
import { parseGachaFileContent } from "../parser.js";

describe("parseGachaFileContent", () => {
  it("parses a standard entry with a space after the dot and comma", () => {
    const { entries, warnings } = parseGachaFileContent(
      "1. Tinder,1.3\n#Allows you to produce and control weak flames.\n",
    );
    expect(warnings).toHaveLength(0);
    expect(entries).toEqual([
      {
        sourceIndex: 1,
        name: "Tinder",
        rarity: 1.3,
        description: "Allows you to produce and control weak flames.",
        isNsfw: false,
        isCharacter: false,
        isTech: false,
      },
    ]);
  });

  it("parses a header with no space after the dot (skill.txt style)", () => {
    const { entries } = parseGachaFileContent("3.Iaijutsu,3.4\n#A refined blade art.\n");
    expect(entries[0].sourceIndex).toBe(3);
    expect(entries[0].name).toBe("Iaijutsu");
    expect(entries[0].rarity).toBe(3.4);
  });

  it("parses a header with extra spacing and a hyphenated name (familiar.txt style)", () => {
    const { entries } = parseGachaFileContent("10. Fafnir - Fate, 6.8\n#The Ultimate Dragon.\n");
    expect(entries[0].name).toBe("Fafnir - Fate");
    expect(entries[0].rarity).toBe(6.8);
  });

  it("joins multi-line descriptions and strips the leading #", () => {
    const { entries } = parseGachaFileContent(
      "1. Multiline,2.0\n#First line of the description.\nSecond line continues here.\n2. Next,3.0\n#Next entry.\n",
    );
    expect(entries[0].description).toBe("First line of the description. Second line continues here.");
    expect(entries[1].name).toBe("Next");
  });

  it("extracts and strips the Nsfw/Character/Tech tags", () => {
    const { entries } = parseGachaFileContent(
      "1. A,1.0\n#(Nsfw) Some spicy content.\n2. B,2.0\n#A familiar (Character) description.\n3. C,3.0\n#Some (Tech) gadget.\n",
    );
    expect(entries[0]).toMatchObject({ isNsfw: true, isCharacter: false, isTech: false });
    expect(entries[0].description).not.toMatch(/nsfw/i);
    expect(entries[1]).toMatchObject({ isCharacter: true });
    expect(entries[1].description).not.toMatch(/character/i);
    expect(entries[2]).toMatchObject({ isTech: true });
    expect(entries[2].description).not.toMatch(/tech/i);
  });

  it("flags non-empty content found before the first header as a warning", () => {
    const { warnings, entries } = parseGachaFileContent("stray leftover line\n1. A,1.0\n#desc\n");
    expect(warnings).toHaveLength(1);
    expect(warnings[0].reason).toMatch(/before the first entry header/);
    expect(entries).toHaveLength(1);
  });

  it("ignores blank lines between entries", () => {
    const { entries, warnings } = parseGachaFileContent("1. A,1.0\n#desc a\n\n2. B,2.0\n#desc b\n");
    expect(warnings).toHaveLength(0);
    expect(entries).toHaveLength(2);
  });
});
