import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireAuth, getAuthUserId } from "../middleware/requireAuth.js";
import { findOwnedStory, findOwnedCharacter } from "../lib/ownership.js";

const characterSchema = z.object({
  name: z.string().trim().min(1).max(200),
});

export async function characterRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAuth);

  app.post<{ Params: { storyId: string } }>("/stories/:storyId/characters", async (request, reply) => {
    const parsed = characterSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }

    const story = await findOwnedStory(app.prisma, getAuthUserId(request), request.params.storyId);
    if (!story) {
      return reply.code(404).send({ error: "Story not found" });
    }

    const character = await app.prisma.character.create({
      data: { name: parsed.data.name, storyId: story.id },
    });
    reply.code(201).send(character);
  });

  app.get<{ Params: { storyId: string } }>("/stories/:storyId/characters", async (request, reply) => {
    const story = await findOwnedStory(app.prisma, getAuthUserId(request), request.params.storyId);
    if (!story) {
      return reply.code(404).send({ error: "Story not found" });
    }

    const characters = await app.prisma.character.findMany({
      where: { storyId: story.id },
      orderBy: { createdAt: "desc" },
    });
    reply.send(characters);
  });

  app.get<{ Params: { storyId: string; characterId: string } }>(
    "/stories/:storyId/characters/:characterId",
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
      reply.send(character);
    },
  );

  app.patch<{ Params: { storyId: string; characterId: string } }>(
    "/stories/:storyId/characters/:characterId",
    async (request, reply) => {
      const parsed = characterSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: parsed.error.flatten() });
      }

      const character = await findOwnedCharacter(
        app.prisma,
        getAuthUserId(request),
        request.params.storyId,
        request.params.characterId,
      );
      if (!character) {
        return reply.code(404).send({ error: "Character not found" });
      }

      const updated = await app.prisma.character.update({
        where: { id: character.id },
        data: { name: parsed.data.name },
      });
      reply.send(updated);
    },
  );

  app.delete<{ Params: { storyId: string; characterId: string } }>(
    "/stories/:storyId/characters/:characterId",
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

      await app.prisma.character.delete({ where: { id: character.id } });
      reply.code(204).send();
    },
  );
}
