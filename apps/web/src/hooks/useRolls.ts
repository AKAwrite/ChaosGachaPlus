import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  return useMutation({
    mutationFn: (selections: Array<{ ticketId: string; optionIndex: number }>) =>
      pullsApi.commitRolls(storyId, characterId, selections),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories", storyId, "characters", characterId, "tickets"] });
      queryClient.invalidateQueries({ queryKey: ["stories", storyId, "characters", characterId, "pulls"] });
      queryClient.invalidateQueries({ queryKey: ["stories", storyId, "characters", characterId, "inventory"] });
      queryClient.invalidateQueries({ queryKey: ["stories", storyId, "characters", characterId, "history"] });
    },
  });
}
