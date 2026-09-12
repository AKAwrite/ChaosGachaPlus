import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as charactersApi from "../api/characters";

export function useCharacters(storyId: string | undefined) {
  return useQuery({
    queryKey: ["stories", storyId, "characters"],
    queryFn: () => charactersApi.listCharacters(storyId!),
    enabled: Boolean(storyId),
  });
}

export function useCharacter(storyId: string | undefined, characterId: string | undefined) {
  return useQuery({
    queryKey: ["stories", storyId, "characters", characterId],
    queryFn: () => charactersApi.getCharacter(storyId!, characterId!),
    enabled: Boolean(storyId) && Boolean(characterId),
  });
}

export function useCreateCharacter(storyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => charactersApi.createCharacter(storyId, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stories", storyId, "characters"] }),
  });
}

export function useDeleteCharacter(storyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (characterId: string) => charactersApi.deleteCharacter(storyId, characterId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stories", storyId, "characters"] }),
  });
}
