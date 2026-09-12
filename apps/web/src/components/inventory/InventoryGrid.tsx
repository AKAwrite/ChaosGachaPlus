import { useState } from "react";
import type { Character } from "@chaosgachaplus/shared";
import { useInventory, useSetItemConsumed, useTransferItem } from "../../hooks/useInventory";
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
  const setConsumed = useSetItemConsumed(storyId, characterId);
  const [openId, setOpenId] = useState<string | null>(null);
  const [target, setTarget] = useState("");
  const [showConsumed, setShowConsumed] = useState(false);

  if (isLoading) return <p className="dim">Loading...</p>;

  const all = items ?? [];
  const consumedCount = all.filter((item) => item.consumedAt).length;
  const owned: InventoryItem[] = showConsumed ? all : all.filter((item) => !item.consumedAt);
  const open = all.find((item) => item.id === openId) ?? null;
  const emptySlots = Math.max(0, MIN_SLOTS - owned.length);

  return (
    <>
      {consumedCount > 0 && (
        <label className="check">
          <input type="checkbox" checked={showConsumed} onChange={(e) => setShowConsumed(e.target.checked)} />
          <span className="dim">Show used up ({consumedCount})</span>
        </label>
      )}
      <div className="inv-grid">
        {owned.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`inv-slot${item.consumedAt ? " inv-slot--consumed" : ""}`}
            style={tierStyle(item.rarity)}
            onClick={() => {
              setOpenId(item.id);
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
        <div className="modal-backdrop" onClick={() => setOpenId(null)} role="presentation">
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

            {open.consumedAt && <p className="dim">Used up {new Date(open.consumedAt).toLocaleDateString()}</p>}

            {otherCharacters.length > 0 && !open.consumedAt && (
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
            )}

            <div className="row">
              {otherCharacters.length > 0 && !open.consumedAt && (
                <button
                  type="button"
                  className="btn-primary"
                  disabled={!target || transfer.isPending}
                  onClick={async () => {
                    await transfer.mutateAsync({ itemId: open.id, toCharacterId: target });
                    setOpenId(null);
                  }}
                >
                  Transfer
                </button>
              )}
              <button
                type="button"
                className={open.consumedAt ? "btn-primary" : "btn-danger"}
                disabled={setConsumed.isPending}
                onClick={() => setConsumed.mutate({ itemId: open.id, consumed: !open.consumedAt })}
              >
                {open.consumedAt ? "Recover" : "Use up"}
              </button>
              <button type="button" className="btn-ghost" onClick={() => setOpenId(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
