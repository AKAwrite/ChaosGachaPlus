import { type FormEvent, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { GACHA_CATEGORIES, RARITY_PRESETS, type GachaCategory, type RarityPresetName } from "@chaosgachaplus/shared";
import { useCharacter } from "../hooks/useCharacters";
import { useCreateTicket, useDeleteTicket, useTickets } from "../hooks/useTickets";
import type { CreateTicketInput } from "../api/tickets";

type RarityMode = "preset" | "custom";

export function CharacterDetailPage() {
  const { storyId, characterId } = useParams<{ storyId: string; characterId: string }>();
  const { data: character } = useCharacter(storyId, characterId);
  const { data: tickets, isLoading } = useTickets(storyId!, characterId!);
  const createTicket = useCreateTicket(storyId!, characterId!);
  const deleteTicket = useDeleteTicket(storyId!, characterId!);

  const [feat, setFeat] = useState("");
  const [category, setCategory] = useState<GachaCategory>("ability");
  const [isAdvantage, setIsAdvantage] = useState(false);
  const [rarityMode, setRarityMode] = useState<RarityMode>("preset");
  const [presetName, setPresetName] = useState<RarityPresetName>("Bronze");
  const [minRarity, setMinRarity] = useState("0");
  const [avgRarity, setAvgRarity] = useState("1");
  const [maxRarity, setMaxRarity] = useState("3");

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!feat.trim()) return;

    const input: CreateTicketInput =
      rarityMode === "preset"
        ? { feat: feat.trim(), category, isAdvantage, presetName }
        : {
            feat: feat.trim(),
            category,
            isAdvantage,
            minRarity: Number(minRarity),
            avgRarity: Number(avgRarity),
            maxRarity: Number(maxRarity),
          };

    await createTicket.mutateAsync(input);
    setFeat("");
    setIsAdvantage(false);
  }

  const unusedTickets = tickets?.filter((t) => !t.usedAt) ?? [];
  const usedTickets = tickets?.filter((t) => t.usedAt) ?? [];

  return (
    <main>
      <header className="app-header">
        <div>
          <Link to={`/stories/${storyId}`}>&larr; Back to story</Link>
          <h1>{character?.name ?? "..."}</h1>
        </div>
      </header>

      <h2>Earn a new ticket</h2>
      <form onSubmit={handleCreate} className="ticket-form">
        <label>
          What feat earned it?
          <input type="text" value={feat} onChange={(e) => setFeat(e.target.value)} required />
        </label>

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

        <fieldset>
          <legend>Rarity</legend>
          <label>
            <input
              type="radio"
              checked={rarityMode === "preset"}
              onChange={() => setRarityMode("preset")}
            />
            Preset
          </label>
          <label>
            <input
              type="radio"
              checked={rarityMode === "custom"}
              onChange={() => setRarityMode("custom")}
            />
            Custom range
          </label>

          {rarityMode === "preset" ? (
            <select value={presetName} onChange={(e) => setPresetName(e.target.value as RarityPresetName)}>
              {RARITY_PRESETS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          ) : (
            <div className="rarity-range">
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
          )}
        </fieldset>

        <label className="checkbox-label">
          <input type="checkbox" checked={isAdvantage} onChange={(e) => setIsAdvantage(e.target.checked)} />
          Advantage (roll twice, pick one)
        </label>

        <button type="submit" disabled={createTicket.isPending}>
          Add ticket
        </button>
      </form>

      {isLoading && <p>Loading...</p>}

      <h2>Unused tickets ({unusedTickets.length})</h2>
      {unusedTickets.length === 0 && <p>No unused tickets.</p>}
      <ul className="entity-list">
        {unusedTickets.map((ticket) => (
          <li key={ticket.id}>
            <span>
              <strong>{ticket.category}</strong> — {ticket.feat}
              {ticket.presetName ? ` (${ticket.presetName})` : ` (${ticket.minRarity}-${ticket.avgRarity}-${ticket.maxRarity})`}
              {ticket.isAdvantage ? " ⚡ advantage" : ""}
            </span>
            <button type="button" className="danger" onClick={() => deleteTicket.mutate(ticket.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>

      <h2>Used tickets ({usedTickets.length})</h2>
      {usedTickets.length === 0 && <p>No tickets used yet.</p>}
      <ul className="entity-list">
        {usedTickets.map((ticket) => (
          <li key={ticket.id}>
            <span>
              <strong>{ticket.category}</strong> — {ticket.feat}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
