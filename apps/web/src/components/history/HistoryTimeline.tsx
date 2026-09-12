import type { HistoryEvent } from "../../api/history";

const TYPE_LABELS: Record<string, string> = {
  TICKET_EARNED: "Ticket earned",
  TICKET_USED: "Ticket used",
  PULL_RESULT: "Pull",
  ITEM_RECEIVED: "Item received",
  ITEM_TRANSFERRED_OUT: "Item sent",
  ITEM_TRANSFERRED_IN: "Item received (transfer)",
  ENTRY_EXCLUDED: "Entry excluded",
  ENTRY_INCLUDED: "Entry included",
  ENTRY_CUSTOMIZED: "Entry customized",
};

export function HistoryTimeline({ events, showCharacter }: { events: HistoryEvent[]; showCharacter?: boolean }) {
  if (events.length === 0) {
    return <p>No history yet.</p>;
  }

  return (
    <ul className="entity-list history-list">
      {events.map((event) => (
        <li key={event.id}>
          <span>
            <span className="history-list__type">{TYPE_LABELS[event.type] ?? event.type}</span>
            {showCharacter && event.character?.name ? ` — ${event.character.name}` : ""}
            {" — "}
            {event.summary}
          </span>
          <time>{new Date(event.occurredAt).toLocaleString()}</time>
        </li>
      ))}
    </ul>
  );
}
