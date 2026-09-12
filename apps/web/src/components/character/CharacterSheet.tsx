import { useState } from "react";
import type { ConcreteGachaCategory } from "@chaosgachaplus/shared";
import { tierStyle } from "../../lib/tier";
import { CategoryGlyph } from "../common/CategoryGlyph";
import { TierPill } from "../common/TierPill";
import { EntryDetailModal, type EntryDetail } from "../common/EntryDetailModal";
import type { Pull } from "../../api/pulls";

const GROUPS: Array<{ category: ConcreteGachaCategory; label: string }> = [
  { category: "ability", label: "Abilities" },
  { category: "skill", label: "Skills" },
  { category: "trait", label: "Traits" },
  { category: "familiar", label: "Familiars" },
];

export function CharacterSheet({ pulls }: { pulls: Pull[] }) {
  const [detail, setDetail] = useState<EntryDetail | null>(null);

  const owned = pulls.filter((pull) => pull.category !== "item");

  if (owned.length === 0) {
    return <p className="empty">Nothing acquired yet. Earn a ticket and roll to start building this character.</p>;
  }

  return (
    <div className="stack" style={{ gap: "1.4rem" }}>
      {GROUPS.map(({ category, label }) => {
        const entries = owned
          .filter((pull) => pull.category === category)
          .sort((a, b) => b.rarity - a.rarity);
        if (entries.length === 0) return null;

        return (
          <div key={category} className="collection-group">
            <div className="collection-group__title">
              <CategoryGlyph category={category} size={16} />
              {label}
              <span className="dim">{entries.length}</span>
            </div>
            <div className="stack" style={{ gap: "0.5rem" }}>
              {entries.map((pull) => (
                <button
                  key={pull.id}
                  type="button"
                  className="trait-card"
                  style={tierStyle(pull.rarity)}
                  onClick={() =>
                    setDetail({
                      name: pull.name,
                      description: pull.description,
                      rarity: pull.rarity,
                      category: pull.category,
                      footnote: pull.ticketFeat ? `Earned from: ${pull.ticketFeat}` : undefined,
                    })
                  }
                >
                  <CategoryGlyph category={pull.category} size={20} className="glyph" />
                  <span className="trait-card__body">
                    <span className="trait-card__name">{pull.name}</span>
                    <span className="trait-card__desc clamp-2">{pull.description}</span>
                  </span>
                  <TierPill tier={pull.tier} rarity={pull.rarity} />
                </button>
              ))}
            </div>
          </div>
        );
      })}

      {detail && <EntryDetailModal entry={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}
