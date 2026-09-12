import type { FastifyInstance } from "fastify";
import { requireAuth, getAuthUserId } from "../middleware/requireAuth.js";
import { findOwnedStory, findOwnedCharacter } from "../lib/ownership.js";

export async function historyRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAuth);

  app.get<{ Params: { storyId: string } }>("/stories/:storyId/history", async (request, reply) => {
    const story = await findOwnedStory(app.prisma, getAuthUserId(request), request.params.storyId);
    if (!story) {
      return reply.code(404).send({ error: "Story not found" });
    }

    const events = await app.prisma.historyEvent.findMany({
      where: { storyId: story.id },
      orderBy: { occurredAt: "desc" },
      take: 200,
      include: { character: { select: { name: true } } },
    });
    reply.send(events);
  });

  app.get<{ Params: { storyId: string; characterId: string } }>(
    "/stories/:storyId/characters/:characterId/history",
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

      const events = await app.prisma.historyEvent.findMany({
        where: { characterId: character.id },
        orderBy: { occurredAt: "desc" },
        take: 200,
      });
      reply.send(events);
    },
  );
}
