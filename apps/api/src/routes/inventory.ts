import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireAuth, getAuthUserId } from "../middleware/requireAuth.js";
import { findOwnedCharacter } from "../lib/ownership.js";
import { logHistoryEvent } from "../lib/historyLog.js";
import type { InventoryItem } from "../../generated/client/index.js";

const transferSchema = z.object({
  toCharacterId: z.string().uuid(),
});

function toItemDTO(item: InventoryItem) {
  return { ...item, rarity: Number(item.rarity) };
}

export async function inventoryRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAuth);

  app.get<{ Params: { storyId: string; characterId: string } }>(
    "/stories/:storyId/characters/:characterId/inventory",
    async (request, reply) => {
      const character = await findOwnedCharacter(
        app.prisma,
        getAuthUserId(request),
        request.params.storyId,
        request.params.characterId,
      );
      if (!character) {
        return reply.code(404).send({ error: "Character not found" });
      }

      const items = await app.prisma.inventoryItem.findMany({
        where: { characterId: character.id },
        orderBy: { acquiredAt: "desc" },
      });
      reply.send(items.map(toItemDTO));
    },
  );

  app.post<{ Params: { itemId: string }; Body: { consumed?: boolean } }>(
    "/items/:itemId/consume",
    async (request, reply) => {
      const userId = getAuthUserId(request);
      const item = await app.prisma.inventoryItem.findFirst({
        where: { id: request.params.itemId, character: { story: { userId } } },
        include: { character: true },
      });
      if (!item) {
        return reply.code(404).send({ error: "Item not found" });
      }

      const consumed = request.body?.consumed ?? true;
      const updated = await app.prisma.inventoryItem.update({
        where: { id: item.id },
        data: { consumedAt: consumed ? new Date() : null },
      });

      await logHistoryEvent(app.prisma, {
        characterId: item.characterId,
        storyId: item.character.storyId,
        type: consumed ? "ENTRY_CONSUMED" : "ENTRY_RESTORED",
        summary: consumed ? `Used up ${item.name}` : `Recovered ${item.name}`,
        itemId: item.id,
      });

      reply.send(toItemDTO(updated));
    },
  );

  // Moves an item to another character in the same Story (kept in-story so
  // an item transfer stays diegetic to a single narrative).
  app.post<{ Params: { itemId: string } }>("/items/:itemId/transfer", async (request, reply) => {
    const parsed = transferSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }

    const userId = getAuthUserId(request);
    const item = await app.prisma.inventoryItem.findFirst({
      where: { id: request.params.itemId, character: { story: { userId } } },
      include: { character: true },
    });
    if (!item) {
      return reply.code(404).send({ error: "Item not found" });
    }

    const destination = await app.prisma.character.findFirst({
      where: { id: parsed.data.toCharacterId, storyId: item.character.storyId, story: { userId } },
    });
    if (!destination) {
      return reply.code(404).send({ error: "Destination character not found in the same story" });
    }
    if (destination.id === item.characterId) {
      return reply.code(400).send({ error: "Item is already on that character" });
    }

    const [updatedItem] = await app.prisma.$transaction(async (tx) => {
      const fromCharacterId = item.characterId;
      const updated = await tx.inventoryItem.update({
        where: { id: item.id },
        data: { characterId: destination.id },
      });
      await tx.itemTransfer.create({
        data: { itemId: item.id, fromCharacterId, toCharacterId: destination.id },
      });
      await logHistoryEvent(tx, {
        characterId: fromCharacterId,
        storyId: item.character.storyId,
        type: "ITEM_TRANSFERRED_OUT",
        summary: `Sent ${item.name} to another character`,
        itemId: item.id,
      });
      await logHistoryEvent(tx, {
        characterId: destination.id,
        storyId: item.character.storyId,
        type: "ITEM_TRANSFERRED_IN",
        summary: `Received ${item.name} from another character`,
        itemId: item.id,
      });
      return [updated];
    });

    reply.send(toItemDTO(updatedItem));
  });
}
