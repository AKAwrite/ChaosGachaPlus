import { useState } from "react";
import type { Character } from "@chaosgachaplus/shared";
import { useInventory, useTransferItem } from "../../hooks/useInventory";

interface InventoryListProps {
  storyId: string;
  characterId: string;
  otherCharacters: Character[];
}

export function InventoryList({ storyId, characterId, otherCharacters }: InventoryListProps) {
  const { data: items, isLoading } = useInventory(storyId, characterId);
  const transfer = useTransferItem(storyId);
  const [targetByItem, setTargetByItem] = useState<Record<string, string>>({});

  return (
    <section>
      <h2>Inventory {items ? `(${items.length})` : ""}</h2>
      {isLoading && <p>Loading...</p>}
      {items && items.length === 0 && <p>No items yet.</p>}
      <ul className="entity-list">
        {items?.map((item) => (
          <li key={item.id}>
            <span>
              <strong>{item.name}</strong> ({item.rarity.toFixed(1)})
            </span>
            {otherCharacters.length > 0 && (
              <span className="transfer-controls">
                <select
                  value={targetByItem[item.id] ?? ""}
                  onChange={(e) => setTargetByItem((prev) => ({ ...prev, [item.id]: e.target.value }))}
                >
                  <option value="" disabled>
                    Send to...
                  </option>
                  {otherCharacters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!targetByItem[item.id] || transfer.isPending}
                  onClick={() => transfer.mutate({ itemId: item.id, toCharacterId: targetByItem[item.id] })}
                >
                  Send
                </button>
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
