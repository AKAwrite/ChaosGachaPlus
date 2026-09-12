import { useQuery } from "@tanstack/react-query";
import * as historyApi from "../api/history";

export function useCharacterHistory(storyId: string, characterId: string) {
  return useQuery({
    queryKey: ["stories", storyId, "characters", characterId, "history"],
    queryFn: () => historyApi.listCharacterHistory(storyId, characterId),
  });
}

export function useStoryHistory(storyId: string) {
  return useQuery({
    queryKey: ["stories", storyId, "history"],
    queryFn: () => historyApi.listStoryHistory(storyId),
  });
}
