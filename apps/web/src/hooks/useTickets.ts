import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as ticketsApi from "../api/tickets";
import type { CreateTicketInput, TicketStatusFilter } from "../api/tickets";

export function useTickets(storyId: string, characterId: string, status: TicketStatusFilter = "all") {
  return useQuery({
    queryKey: ["stories", storyId, "characters", characterId, "tickets", status],
    queryFn: () => ticketsApi.listTickets(storyId, characterId, status),
  });
}

export function useCreateTicket(storyId: string, characterId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTicketInput) => ticketsApi.createTicket(storyId, characterId, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["stories", storyId, "characters", characterId, "tickets"] }),
  });
}

export function useDeleteTicket(storyId: string, characterId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ticketId: string) => ticketsApi.deleteTicket(storyId, characterId, ticketId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["stories", storyId, "characters", characterId, "tickets"] }),
  });
}
