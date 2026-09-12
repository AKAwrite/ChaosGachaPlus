import { useState } from "react";
import type { ConcreteGachaCategory } from "@chaosgachaplus/shared";
import { tierStyle } from "../../lib/tier";
import { useSetPullConsumed } from "../../hooks/useRolls";
import { CategoryGlyph } from "../common/CategoryGlyph";
import { TierPill } from "../common/TierPill";
import { EntryDetailModal } from "../common/EntryDetailModal";
import type { Pull } from "../../api/pulls";

const GROUPS: Array<{ category: ConcreteGachaCategory; label: string }> = [
  { category: "ability", label: "Abilities" },
  { category: "skill", label: "Skills" },
  { category: "trait", label: "Traits" },
  { category: "familiar", label: "Familiars" },
];

interface CharacterSheetProps {
  storyId: string;
  characterId: string;
  pulls: Pull[];
}

export function CharacterSheet({ storyId, characterId, pulls }: CharacterSheetProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [showConsumed, setShowConsumed] = useState(false);
  const setConsumed = useSetPullConsumed(storyId, characterId);

  const owned = pulls.filter((pull) => pull.category !== "item");
  const consumedCount = owned.filter((pull) => pull.consumedAt).length;
  const visible = showConsumed ? owned : owned.filter((pull) => !pull.consumedAt);
  const open = owned.find((pull) => pull.id === openId) ?? null;

  if (owned.length === 0) {
    return <p className="empty">Nothing acquired yet. Earn a ticket and roll to start building this character.</p>;
  }

  return (
    <div className="stack" style={{ gap: "1.4rem" }}>
      {consumedCount > 0 && (
        <label className="check">
          <input type="checkbox" checked={showConsumed} onChange={(e) => setShowConsumed(e.target.checked)} />
          <span className="dim">Show consumed ({consumedCount})</span>
        </label>
      )}

      {GROUPS.map(({ category, label }) => {
        const entries = visible
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
                  className={`trait-card${pull.consumedAt ? " trait-card--consumed" : ""}`}
                  style={tierStyle(pull.rarity)}
                  onClick={() => setOpenId(pull.id)}
                >
                  <CategoryGlyph category={pull.category} size={20} className="glyph" />
                  <span className="trait-card__body">
                    <span className="trait-card__name">
                      {pull.name}
                      {pull.consumedAt && <span className="badge">consumed</span>}
                    </span>
                    <span className="trait-card__desc clamp-2">{pull.description}</span>
                  </span>
                  <TierPill tier={pull.tier} rarity={pull.rarity} />
                </button>
              ))}
            </div>
          </div>
        );
      })}

      {open && (
        <EntryDetailModal
          entry={{
            name: open.name,
            description: open.description,
            rarity: open.rarity,
            category: open.category,
            footnote: [
              open.ticketFeat ? `Earned from: ${open.ticketFeat}` : null,
              open.consumedAt ? `Consumed ${new Date(open.consumedAt).toLocaleDateString()}` : null,
            ]
              .filter(Boolean)
              .join(" · "),
          }}
          onClose={() => setOpenId(null)}
          actions={
            <button
              type="button"
              className={open.consumedAt ? "btn-primary" : "btn-danger"}
              disabled={setConsumed.isPending}
              onClick={() => setConsumed.mutate({ pullId: open.id, consumed: !open.consumedAt })}
            >
              {open.consumedAt ? "Regain" : "Consume"}
            </button>
          }
        />
      )}
    </div>
  );
}
