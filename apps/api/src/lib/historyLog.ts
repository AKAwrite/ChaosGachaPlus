import type { Prisma, HistoryEventType } from "../../generated/client/index.js";

type Tx = Prisma.TransactionClient;

export interface LogEventInput {
  /** Omit for a Story-scoped event not tied to one specific Character (e.g. entry customization). */
  characterId?: string;
  storyId: string;
  type: HistoryEventType;
  summary: string;
  ticketId?: string;
  pullId?: string;
  itemId?: string;
  customizationId?: string;
  metadata?: Prisma.InputJsonValue;
}

export function logHistoryEvent(tx: Tx, input: LogEventInput) {
  return tx.historyEvent.create({ data: input });
}
