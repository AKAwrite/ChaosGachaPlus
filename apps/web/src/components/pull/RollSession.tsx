import { useState } from "react";
import type { Ticket } from "@chaosgachaplus/shared";
import { useCommitRolls, useProposeRolls } from "../../hooks/useRolls";
import type { ProposalsByTicket } from "../../api/pulls";
import { PullCard } from "./PullCard";

interface RollSessionProps {
  storyId: string;
  characterId: string;
  tickets: Ticket[];
  onDone: () => void;
  onDeleteTicket: (ticketId: string) => void;
}

export function RollSession({ storyId, characterId, tickets, onDone, onDeleteTicket }: RollSessionProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [proposals, setProposals] = useState<ProposalsByTicket | null>(null);
  const [chosen, setChosen] = useState<Record<string, number>>({});
  const propose = useProposeRolls(storyId, characterId);
  const commit = useCommitRolls(storyId, characterId);

  function toggleSelected(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleRoll(ticketIds: string[]) {
    const result = await propose.mutateAsync(ticketIds);
    setProposals((prev) => ({ ...prev, ...result }));
    setChosen((prev) => {
      const next = { ...prev };
      for (const id of ticketIds) next[id] = 0;
      return next;
    });
  }

  async function handleConfirm() {
    if (!proposals) return;
    const selections = Object.keys(proposals).map((ticketId) => ({
      ticketId,
      optionIndex: chosen[ticketId] ?? 0,
    }));
    await commit.mutateAsync(selections);
    setProposals(null);
    setChosen({});
    setSelectedIds([]);
    onDone();
  }

  if (proposals) {
    const ticketIds = Object.keys(proposals);
    return (
      <div className="roll-session">
        <h3>Roll results</h3>
        {ticketIds.map((ticketId) => {
          const ticket = tickets.find((t) => t.id === ticketId);
          const options = proposals[ticketId];
          return (
            <div key={ticketId} className="roll-session__ticket">
              <p className="roll-session__feat">{ticket?.feat}</p>
              <div className="roll-session__options">
                {options.map((option) => (
                  <PullCard
                    key={option.optionIndex}
                    option={option}
                    selectable={options.length > 1}
                    selected={options.length > 1 && chosen[ticketId] === option.optionIndex}
                    onSelect={() => setChosen((prev) => ({ ...prev, [ticketId]: option.optionIndex }))}
                  />
                ))}
              </div>
              <button type="button" onClick={() => handleRoll([ticketId])} disabled={propose.isPending}>
                Reroll
              </button>
            </div>
          );
        })}
        <div className="roll-session__actions">
          <button type="button" onClick={handleConfirm} disabled={commit.isPending}>
            Confirm and save to history
          </button>
          <button
            type="button"
            className="danger"
            onClick={() => {
              setProposals(null);
              setChosen({});
            }}
          >
            Discard (nothing was saved)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="roll-session">
      <h3>Use tickets</h3>
      {tickets.length === 0 && <p>No unused tickets to roll.</p>}
      <ul className="entity-list">
        {tickets.map((ticket) => (
          <li key={ticket.id}>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={selectedIds.includes(ticket.id)}
                onChange={() => toggleSelected(ticket.id)}
              />
              <strong>{ticket.category}</strong> — {ticket.feat}
              {ticket.isAdvantage ? " ⚡" : ""}
            </label>
            <button type="button" className="danger" onClick={() => onDeleteTicket(ticket.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => handleRoll(selectedIds)} disabled={selectedIds.length === 0 || propose.isPending}>
        Roll {selectedIds.length > 0 ? `(${selectedIds.length})` : ""}
      </button>
    </div>
  );
}
