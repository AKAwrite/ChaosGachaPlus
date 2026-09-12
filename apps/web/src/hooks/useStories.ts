import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as storiesApi from "../api/stories";

export function useStories() {
  return useQuery({ queryKey: ["stories"], queryFn: storiesApi.listStories });
}

export function useStory(storyId: string | undefined) {
  return useQuery({
    queryKey: ["stories", storyId],
    queryFn: () => storiesApi.getStory(storyId!),
    enabled: Boolean(storyId),
  });
}

export function useCreateStory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (title: string) => storiesApi.createStory(title),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stories"] }),
  });
}

export function useDeleteStory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (storyId: string) => storiesApi.deleteStory(storyId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stories"] }),
  });
}
