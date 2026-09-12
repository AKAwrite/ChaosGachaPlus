import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as entriesApi from "../api/entries";
import type { CreateCustomizationInput } from "../api/entries";

export function useEntries(params: entriesApi.ListEntriesParams) {
  return useQuery({
    queryKey: ["entries", params],
    queryFn: () => entriesApi.listEntries(params),
    placeholderData: (previous) => previous,
  });
}

export function useCustomizations(storyId?: string) {
  return useQuery({
    queryKey: ["customizations", storyId ?? "global"],
    queryFn: () => entriesApi.listCustomizations(storyId),
  });
}

export function useCreateCustomization(storyId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCustomizationInput) => entriesApi.createCustomization(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customizations", storyId ?? "global"] }),
  });
}

export function useUpdateCustomization(storyId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateCustomizationInput> }) =>
      entriesApi.updateCustomization(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customizations", storyId ?? "global"] }),
  });
}

export function useDeleteCustomization(storyId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => entriesApi.deleteCustomization(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customizations", storyId ?? "global"] }),
  });
}
