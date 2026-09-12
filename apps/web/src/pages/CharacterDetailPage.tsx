import { Link, useParams } from "react-router-dom";
import { useCharacter, useCharacters } from "../hooks/useCharacters";
import { useStory } from "../hooks/useStories";
import { DedupeControl } from "../components/pull/DedupeControl";
import { useDeleteTicket, useTickets } from "../hooks/useTickets";
import { usePulls } from "../hooks/useRolls";
import { useCharacterHistory } from "../hooks/useHistory";
import { AppShell } from "../components/common/AppShell";
import { Collapsible } from "../components/common/Collapsible";
import { CharacterSheet } from "../components/character/CharacterSheet";
import { InventoryGrid } from "../components/inventory/InventoryGrid";
import { RollSession } from "../components/pull/RollSession";
import { TicketForm } from "../components/pull/TicketForm";
import { HistoryTimeline } from "../components/history/HistoryTimeline";
import { TierPill } from "../components/common/TierPill";

export function CharacterDetailPage() {
  const { storyId, characterId } = useParams<{ storyId: string; characterId: string }>();
  const { data: character } = useCharacter(storyId, characterId);
  const { data: story } = useStory(storyId);
  const { data: allCharacters } = useCharacters(storyId);
  const { data: tickets } = useTickets(storyId!, characterId!);
  const { data: pulls } = usePulls(storyId!, characterId!);
  const { data: historyEvents } = useCharacterHistory(storyId!, characterId!);
  const deleteTicket = useDeleteTicket(storyId!, characterId!);

  const unusedTickets = tickets?.filter((t) => !t.usedAt) ?? [];
  const otherCharacters = (allCharacters ?? []).filter((c) => c.id !== characterId);
  const acquired = pulls ?? [];
  const best = acquired.reduce<(typeof acquired)[number] | null>(
    (top, pull) => (!top || pull.rarity > top.rarity ? pull : top),
    null,
  );

  return (
    <AppShell>
      <main className="page">
        <div className="page-head">
          <div>
            <div className="page-head__sub">
              <Link to={`/stories/${storyId}`}>&larr; Back to story</Link>
            </div>
            <h1>{character?.name ?? "..."}</h1>
            <div className="row" style={{ marginTop: "0.5rem" }}>
              <span className="dim">{acquired.length} acquired</span>
              <span className="dim">·</span>
              <span className="dim">{unusedTickets.length} tickets ready</span>
              {best && (
                <>
                  <span className="dim">·</span>
                  <span className="dim">best</span>
                  <TierPill tier={best.tier} rarity={best.rarity} />
                </>
              )}
            </div>
          </div>
        </div>

        <section className="section">
          <h2>Roll</h2>
          <div className="panel stack">
            <RollSession
              storyId={storyId!}
              characterId={characterId!}
              tickets={unusedTickets}
              onDeleteTicket={(id) => deleteTicket.mutate(id)}
            />
            {story && <DedupeControl storyId={storyId!} mode={story.dedupeMode} />}
          </div>
          <Collapsible title="Earn a ticket">
            <TicketForm storyId={storyId!} characterId={characterId!} />
          </Collapsible>
        </section>

        <section className="section">
          <h2>Character sheet</h2>
          <CharacterSheet storyId={storyId!} characterId={characterId!} pulls={acquired} />
        </section>

        <section className="section">
          <h2>Inventory</h2>
          <InventoryGrid storyId={storyId!} characterId={characterId!} otherCharacters={otherCharacters} />
        </section>

        <section className="section">
          <Collapsible title="Pull history" count={acquired.length}>
            <ul className="list">
              {acquired.map((pull) => (
                <li key={pull.id} className="list-row">
                  <span className="row" style={{ gap: "0.5rem" }}>
                    <TierPill tier={pull.tier} rarity={pull.rarity} />
                    <strong>{pull.name}</strong>
                    {pull.ticketFeat && <span className="dim">from "{pull.ticketFeat}"</span>}
                  </span>
                  <span className="dim">{new Date(pull.rolledAt).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          </Collapsible>

          <Collapsible title="Character log" count={historyEvents?.length}>
            <HistoryTimeline events={historyEvents ?? []} />
          </Collapsible>
        </section>
      </main>
    </AppShell>
  );
}
