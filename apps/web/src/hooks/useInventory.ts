import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as inventoryApi from "../api/inventory";

export function useInventory(storyId: string, characterId: string) {
  return useQuery({
    queryKey: ["stories", storyId, "characters", characterId, "inventory"],
    queryFn: () => inventoryApi.listInventory(storyId, characterId),
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
