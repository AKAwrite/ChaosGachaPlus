import { useEffect } from "react";
import type { GachaCategory } from "@chaosgachaplus/shared";
import { tierName, tierStyle } from "../../lib/tier";
import { CategoryGlyph } from "./CategoryGlyph";
import { TierPill } from "./TierPill";

export interface EntryDetail {
  name: string;
  description: string;
  rarity: number;
  category: GachaCategory;
  footnote?: string;
}

export function EntryDetailModal({ entry, onClose }: { entry: EntryDetail; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div className="modal" style={tierStyle(entry.rarity)} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <TierPill tier={tierName(entry.rarity)} rarity={entry.rarity} />
          <CategoryGlyph category={entry.category} size={22} className="glyph" />
        </div>
        <h3 style={{ fontSize: "1.35rem" }}>{entry.name}</h3>
        <p className="muted" style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>
          {entry.description}
        </p>
        {entry.footnote && <p className="dim">{entry.footnote}</p>}
        <div>
          <button type="button" className="btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
