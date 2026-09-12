import { type FormEvent, useState } from "react";
import {
  GACHA_CATEGORIES,
  RARITY_PRESETS,
  RARITY_PRESET_RANGES,
  type GachaCategory,
  type RarityPresetName,
} from "@chaosgachaplus/shared";
import { useCreateTicket } from "../../hooks/useTickets";
import type { CreateTicketInput } from "../../api/tickets";

export function TicketForm({ storyId, characterId }: { storyId: string; characterId: string }) {
  const createTicket = useCreateTicket(storyId, characterId);

  const [feat, setFeat] = useState("");
  const [category, setCategory] = useState<GachaCategory>("random");
  const [isAdvantage, setIsAdvantage] = useState(false);
  const [quantity, setQuantity] = useState("1");
  const [useCustom, setUseCustom] = useState(false);
  const [presetName, setPresetName] = useState<RarityPresetName>("Bronze");
  const [minRarity, setMinRarity] = useState("0.5");
  const [avgRarity, setAvgRarity] = useState("2.3");
  const [maxRarity, setMaxRarity] = useState("4.3");

  const preset = RARITY_PRESET_RANGES[presetName];

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const base = {
      feat: feat.trim() || undefined,
      category,
      isAdvantage,
      quantity: Math.max(1, Math.min(20, Number(quantity) || 1)),
    };

    const input: CreateTicketInput = useCustom
      ? {
          ...base,
          minRarity: Number(minRarity),
          avgRarity: Number(avgRarity),
          maxRarity: Number(maxRarity),
        }
      : { ...base, presetName };

    await createTicket.mutateAsync(input);
    setFeat("");
    setIsAdvantage(false);
    setQuantity("1");
  }

  return (
    <form onSubmit={handleSubmit} className="stack">
      <label>
        Feat <span className="dim">(optional)</span>
        <input
          type="text"
          value={feat}
          placeholder="Killed the demon lord, was born, survived the fall..."
          onChange={(e) => setFeat(e.target.value)}
        />
      </label>

      <div className="field-row">
        <label>
          Category
          <select value={category} onChange={(e) => setCategory(e.target.value as GachaCategory)}>
            {GACHA_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label>
          How many
          <input type="number" min="1" max="20" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </label>
      </div>

      <div className="stack">
        <div className="seg">
          <button type="button" aria-pressed={!useCustom} onClick={() => setUseCustom(false)}>
            Preset
          </button>
          <button type="button" aria-pressed={useCustom} onClick={() => setUseCustom(true)}>
            Custom range
          </button>
        </div>

        {useCustom ? (
          <div className="field-row">
            <label>
              Min
              <input type="number" step="0.1" min="0" max="10" value={minRarity} onChange={(e) => setMinRarity(e.target.value)} />
            </label>
            <label>
              Avg
              <input type="number" step="0.1" min="0" max="10" value={avgRarity} onChange={(e) => setAvgRarity(e.target.value)} />
            </label>
            <label>
              Max
              <input type="number" step="0.1" min="0" max="10" value={maxRarity} onChange={(e) => setMaxRarity(e.target.value)} />
            </label>
          </div>
        ) : (
          <label>
            Tier
            <select value={presetName} onChange={(e) => setPresetName(e.target.value as RarityPresetName)}>
              {RARITY_PRESETS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <span className="dim">
              rarity {preset.min} – {preset.max}, centred on {preset.avg}
            </span>
          </label>
        )}
      </div>

      <label className="check">
        <input type="checkbox" checked={isAdvantage} onChange={(e) => setIsAdvantage(e.target.checked)} />
        Advantage — roll twice, keep one
      </label>

      <div>
        <button type="submit" className="btn-primary" disabled={createTicket.isPending}>
          {Number(quantity) > 1 ? `Add ${quantity} tickets` : "Add ticket"}
        </button>
      </div>
    </form>
  );
}
