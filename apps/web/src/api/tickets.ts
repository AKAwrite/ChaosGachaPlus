import type { GachaCategory, RarityPresetName, Ticket } from "@chaosgachaplus/shared";
import { apiFetch } from "./client";

interface BaseTicketInput {
  feat: string;
  category: GachaCategory;
  isAdvantage: boolean;
}

export type CreateTicketInput =
  | (BaseTicketInput & { presetName: RarityPresetName })
  | (BaseTicketInput & { minRarity: number; avgRarity: number; maxRarity: number });

export type TicketStatusFilter = "all" | "used" | "unused";

export function listTickets(storyId: string, characterId: string, status: TicketStatusFilter = "all") {
  const query = status === "all" ? "" : `?status=${status}`;
  return apiFetch<Ticket[]>(`/stories/${storyId}/characters/${characterId}/tickets${query}`);
}

export function createTicket(storyId: string, characterId: string, input: CreateTicketInput) {
  return apiFetch<Ticket>(`/stories/${storyId}/characters/${characterId}/tickets`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function deleteTicket(storyId: string, characterId: string, ticketId: string) {
  return apiFetch<void>(`/stories/${storyId}/characters/${characterId}/tickets/${ticketId}`, {
    method: "DELETE",
  });
}
