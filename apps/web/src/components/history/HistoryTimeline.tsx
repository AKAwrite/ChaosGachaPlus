import type { HistoryEvent } from "../../api/history";

const TYPE_LABELS: Record<string, string> = {
  TICKET_EARNED: "Ticket",
  TICKET_USED: "Used",
  PULL_RESULT: "Pull",
  ITEM_RECEIVED: "Item",
  ITEM_TRANSFERRED_OUT: "Sent",
  ITEM_TRANSFERRED_IN: "Received",
  ENTRY_EXCLUDED: "Excluded",
  ENTRY_INCLUDED: "Included",
  ENTRY_CUSTOMIZED: "Customized",
};

export function HistoryTimeline({ events, showCharacter }: { events: HistoryEvent[]; showCharacter?: boolean }) {
  if (events.length === 0) {
    return <p className="dim">Nothing here yet.</p>;
  }

  return (
    <ul className="timeline">
      {events.map((event) => (
        <li key={event.id}>
          <span className="timeline__type">{TYPE_LABELS[event.type] ?? event.type}</span>
          <span className="timeline__text">
            {showCharacter && event.character?.name && <strong>{event.character.name} · </strong>}
            {event.summary}
          </span>
          <time className="timeline__time">{new Date(event.occurredAt).toLocaleString()}</time>
        </li>
      ))}
    </ul>
  );
}
