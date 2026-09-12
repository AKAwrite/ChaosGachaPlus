import { useState } from "react";
import type { Character } from "@chaosgachaplus/shared";
import { useInventory, useTransferItem } from "../../hooks/useInventory";
import { tierName, tierStyle } from "../../lib/tier";
import { CategoryGlyph } from "../common/CategoryGlyph";
import { TierPill } from "../common/TierPill";
import type { InventoryItem } from "../../api/inventory";

const MIN_SLOTS = 8;

interface InventoryGridProps {
  storyId: string;
  characterId: string;
  otherCharacters: Character[];
}

export function InventoryGrid({ storyId, characterId, otherCharacters }: InventoryGridProps) {
  const { data: items, isLoading } = useInventory(storyId, characterId);
  const transfer = useTransferItem(storyId);
  const [open, setOpen] = useState<InventoryItem | null>(null);
  const [target, setTarget] = useState("");

  if (isLoading) return <p className="dim">Loading...</p>;

  const owned = items ?? [];
  const emptySlots = Math.max(0, MIN_SLOTS - owned.length);

  return (
    <>
      <div className="inv-grid">
        {owned.map((item) => (
          <button
            key={item.id}
            type="button"
            className="inv-slot"
            style={tierStyle(item.rarity)}
            onClick={() => {
              setOpen(item);
              setTarget("");
            }}
            title={item.name}
          >
            <CategoryGlyph category="item" size={26} className="glyph" />
            <span className="inv-slot__name">{item.name}</span>
          </button>
        ))}
        {Array.from({ length: emptySlots }, (_, i) => (
          <div key={`empty-${i}`} className="inv-slot inv-slot--empty" aria-hidden="true" />
        ))}
      </div>

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(null)} role="presentation">
          <div
            className="modal"
            style={tierStyle(open.rarity)}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="row" style={{ justifyContent: "space-between" }}>
              <TierPill tier={tierName(open.rarity)} rarity={open.rarity} />
              <CategoryGlyph category="item" size={22} className="glyph" />
            </div>
            <h3 style={{ fontSize: "1.35rem" }}>{open.name}</h3>
            <p className="muted" style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>
              {open.description}
            </p>

            {otherCharacters.length > 0 && (
              <div className="stack">
                <label>
                  Give to
                  <select value={target} onChange={(e) => setTarget(e.target.value)}>
                    <option value="">Select a character...</option>
                    {otherCharacters.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            <div className="row">
              {otherCharacters.length > 0 && (
                <button
                  type="button"
                  className="btn-primary"
                  disabled={!target || transfer.isPending}
                  onClick={async () => {
                    await transfer.mutateAsync({ itemId: open.id, toCharacterId: target });
                    setOpen(null);
                  }}
                >
                  Transfer
                </button>
              )}
              <button type="button" className="btn-ghost" onClick={() => setOpen(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
