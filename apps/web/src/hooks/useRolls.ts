import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Ticket } from "@chaosgachaplus/shared";
import * as pullsApi from "../api/pulls";

export function usePulls(storyId: string, characterId: string) {
  return useQuery({
    queryKey: ["stories", storyId, "characters", characterId, "pulls"],
    queryFn: () => pullsApi.listPulls(storyId, characterId),
  });
}

/** Optimistic: flipping "consumed" is cheap and reversible, so don't make the user wait for the round trip. */
export function useSetPullConsumed(storyId: string, characterId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["stories", storyId, "characters", characterId, "pulls"];

  return useMutation({
    mutationFn: ({ pullId, consumed }: { pullId: string; consumed: boolean }) =>
      pullsApi.setPullConsumed(storyId, characterId, pullId, consumed),
    onMutate: async ({ pullId, consumed }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<pullsApi.Pull[]>(queryKey);
      queryClient.setQueryData<pullsApi.Pull[]>(queryKey, (old) =>
        old?.map((pull) =>
          pull.id === pullId ? { ...pull, consumedAt: consumed ? new Date().toISOString() : null } : pull,
        ),
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["stories", storyId, "characters", characterId, "history"] });
    },
  });
}

export function useProposeRolls(storyId: string, characterId: string) {
  return useMutation({
    mutationFn: (ticketIds: string[]) => pullsApi.proposeRolls(storyId, characterId, ticketIds),
  });
}

export function useCommitRolls(storyId: string, characterId: string) {
  const queryClient = useQueryClient();
  const base = ["stories", storyId, "characters", characterId];

  return useMutation({
    mutationFn: (selections: Array<{ ticketId: string; optionIndex: number }>) =>
      pullsApi.commitRolls(storyId, characterId, selections),
    onSuccess: (createdPulls, selections) => {
      const usedIds = new Set(selections.map((s) => s.ticketId));
      const tickets = queryClient.getQueryData<Ticket[]>([...base, "tickets", "all"]);
      const featById = new Map(tickets?.map((ticket) => [ticket.id, ticket.feat]));

      // The response already carries the new pulls, and we know locally which
      // tickets were spent - writing both straight into the cache means the
      // sheet updates on confirm instead of after a round trip.
      queryClient.setQueryData<pullsApi.Pull[]>([...base, "pulls"], (old) => [
        ...createdPulls.map((pull) => ({ ...pull, ticketFeat: featById.get(pull.ticketId) ?? null })),
        ...(old ?? []),
      ]);
      queryClient.setQueryData<Ticket[]>([...base, "tickets", "all"], (old) =>
        old?.map((ticket) =>
          usedIds.has(ticket.id) ? { ...ticket, usedAt: ticket.usedAt ?? new Date().toISOString() } : ticket,
        ),
      );

      // These two genuinely need the server: inventory rows and log entries are
      // created there and aren't in the response.
      queryClient.invalidateQueries({ queryKey: [...base, "inventory"] });
      queryClient.invalidateQueries({ queryKey: [...base, "history"] });
    },
  });
}
