import { useCallback, useState } from "react";
import type { Ticket } from "@chaosgachaplus/shared";
import { useCommitRolls, useProposeRolls } from "../../hooks/useRolls";
import type { ProposalsByTicket } from "../../api/pulls";
import { CategoryGlyph } from "../common/CategoryGlyph";
import { PullCard } from "./PullCard";
import { RollReel } from "./RollReel";

interface RollSessionProps {
  storyId: string;
  characterId: string;
  tickets: Ticket[];
  onDeleteTicket: (ticketId: string) => void;
}

function ticketLabel(ticket: Ticket) {
  const range = ticket.presetName ?? `${ticket.minRarity}-${ticket.maxRarity}`;
  return `${range} ${ticket.category}`;
}

export function RollSession({ storyId, characterId, tickets, onDeleteTicket }: RollSessionProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [proposals, setProposals] = useState<ProposalsByTicket | null>(null);
  const [spinning, setSpinning] = useState<Record<string, boolean>>({});
  const [chosen, setChosen] = useState<Record<string, number>>({});

  const propose = useProposeRolls(storyId, characterId);
  const commit = useCommitRolls(storyId, characterId);

  const handleReelDone = useCallback((ticketId: string) => {
    setSpinning((prev) => ({ ...prev, [ticketId]: false }));
  }, []);

  function toggleSelected(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function roll(ticketIds: string[]) {
    const result = await propose.mutateAsync(ticketIds);
    setProposals((prev) => ({ ...prev, ...result }));
    setSpinning((prev) => {
      const next = { ...prev };
      for (const id of ticketIds) next[id] = true;
      return next;
    });
    setChosen((prev) => {
      const next = { ...prev };
      for (const id of ticketIds) delete next[id];
      return next;
    });
  }

  async function confirm() {
    if (!proposals) return;
    const selections = Object.keys(proposals).map((ticketId) => ({
      ticketId,
      optionIndex: chosen[ticketId] ?? 0,
    }));
    await commit.mutateAsync(selections);
    setProposals(null);
    setChosen({});
    setSpinning({});
    setSelectedIds([]);
  }

  function discard() {
    setProposals(null);
    setChosen({});
    setSpinning({});
  }

  // ------------------------------------------------------------- results

  if (proposals) {
    const ticketIds = Object.keys(proposals);
    const anySpinning = ticketIds.some((id) => spinning[id]);
    // An advantage roll has to be picked deliberately - no silent default.
    const awaitingChoice = ticketIds.filter(
      (id) => proposals[id].options.length > 1 && chosen[id] === undefined,
    );
    const canConfirm = !anySpinning && awaitingChoice.length === 0;

    return (
      <div className="roll-stage">
        {ticketIds.map((ticketId, ticketIndex) => {
          const ticket = tickets.find((t) => t.id === ticketId);
          const { options, decoys } = proposals[ticketId];
          const isSpinning = spinning[ticketId];
          const isPair = options.length > 1;

          return (
            <div key={ticketId} className="roll-ticket">
              <div className="roll-ticket__label">
                {ticket && <CategoryGlyph category={ticket.category} size={16} />}
                <span>{ticket ? ticketLabel(ticket) : "Ticket"}</span>
                {ticket?.feat && <span>· {ticket.feat}</span>}
                {isPair && <span className="badge badge--adv">Advantage · pick one</span>}
              </div>

              <div className={`roll-options${isPair ? " roll-options--pair" : ""}`}>
                {options.map((option, optionIndex) =>
                  isSpinning ? (
                    <RollReel
                      key={option.optionIndex}
                      decoys={decoys}
                      targetName={option.name}
                      delayMs={ticketIndex * 160 + optionIndex * 220}
                      onDone={() => handleReelDone(ticketId)}
                    />
                  ) : (
                    <PullCard
                      key={option.optionIndex}
                      option={option}
                      selectable={isPair}
                      selected={isPair && chosen[ticketId] === option.optionIndex}
                      onSelect={() => setChosen((prev) => ({ ...prev, [ticketId]: option.optionIndex }))}
                    />
                  ),
                )}
              </div>

              {!isSpinning && (
                <div className="row">
                  <button
                    type="button"
                    className="btn-ghost btn-sm"
                    onClick={() => roll([ticketId])}
                    disabled={propose.isPending}
                  >
                    Reroll
                  </button>
                  <span className="dim">Nothing is saved until you confirm.</span>
                </div>
              )}
            </div>
          );
        })}

        <div className="row">
          <button type="button" className="btn-primary btn-lg" onClick={confirm} disabled={!canConfirm || commit.isPending}>
            {commit.isPending ? "Saving..." : "Confirm"}
          </button>
          <button type="button" className="btn-ghost" onClick={discard} disabled={anySpinning}>
            Discard
          </button>
          {awaitingChoice.length > 0 && !anySpinning && (
            <span className="dim">Pick a result for each advantage roll to continue.</span>
          )}
        </div>
      </div>
    );
  }

  // ------------------------------------------------------ ticket picking

  if (tickets.length === 0) {
    return <p className="empty">No unused tickets. Earn one above to roll.</p>;
  }

  return (
    <div className="stack">
      <ul className="list">
        {tickets.map((ticket) => {
          const on = selectedIds.includes(ticket.id);
          return (
            <li key={ticket.id}>
              <div className={`ticket-chip${on ? " ticket-chip--on" : ""}`} onClick={() => toggleSelected(ticket.id)}>
                <input type="checkbox" checked={on} onChange={() => toggleSelected(ticket.id)} onClick={(e) => e.stopPropagation()} style={{ width: "auto", accentColor: "var(--accent)" }} />
                <CategoryGlyph category={ticket.category} size={18} />
                <span className="ticket-chip__body">
                  <span className="ticket-chip__title">
                    {ticketLabel(ticket)}
                    {ticket.isAdvantage && <span className="badge badge--adv">ADV</span>}
                  </span>
                  {ticket.feat && <span className="ticket-chip__feat">{ticket.feat}</span>}
                </span>
                <button
                  type="button"
                  className="btn-danger btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteTicket(ticket.id);
                  }}
                >
                  Delete
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="row">
        <button
          type="button"
          className="btn-primary btn-lg"
          onClick={() => roll(selectedIds)}
          disabled={selectedIds.length === 0 || propose.isPending}
        >
          {propose.isPending ? "Rolling..." : `Roll${selectedIds.length > 0 ? ` ${selectedIds.length}` : ""}`}
        </button>
        {selectedIds.length === 0 && <span className="dim">Select one or more tickets.</span>}
      </div>
    </div>
  );
}
