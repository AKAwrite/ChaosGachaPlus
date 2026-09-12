import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as inventoryApi from "../api/inventory";

export function useInventory(storyId: string, characterId: string) {
  return useQuery({
    queryKey: ["stories", storyId, "characters", characterId, "inventory"],
    queryFn: () => inventoryApi.listInventory(storyId, characterId),
  });
}

export function useSetItemConsumed(storyId: string, characterId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["stories", storyId, "characters", characterId, "inventory"];

  return useMutation({
    mutationFn: ({ itemId, consumed }: { itemId: string; consumed: boolean }) =>
      inventoryApi.setItemConsumed(itemId, consumed),
    onMutate: async ({ itemId, consumed }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<inventoryApi.InventoryItem[]>(queryKey);
      queryClient.setQueryData<inventoryApi.InventoryItem[]>(queryKey, (old) =>
        old?.map((item) =>
          item.id === itemId ? { ...item, consumedAt: consumed ? new Date().toISOString() : null } : item,
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

export function useTransferItem(storyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, toCharacterId }: { itemId: string; toCharacterId: string }) =>
      inventoryApi.transferItem(itemId, toCharacterId),
    onSuccess: () => {
      // Invalidate broadly (not just this character) since the destination
      // character's inventory/history also changed.
      queryClient.invalidateQueries({ queryKey: ["stories", storyId] });
    },
  });
}
