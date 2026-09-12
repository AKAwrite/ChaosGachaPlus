import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as pullsApi from "../api/pulls";

export function usePulls(storyId: string, characterId: string) {
  return useQuery({
    queryKey: ["stories", storyId, "characters", characterId, "pulls"],
    queryFn: () => pullsApi.listPulls(storyId, characterId),
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
