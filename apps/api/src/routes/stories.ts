import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireAuth, getAuthUserId } from "../middleware/requireAuth.js";
import { findOwnedStory } from "../lib/ownership.js";

const createStorySchema = z.object({
  title: z.string().trim().min(1).max(200),
});

export async function storyRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAuth);

  app.post("/stories", async (request, reply) => {
    const parsed = createStorySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }

    const story = await app.prisma.story.create({
      data: { title: parsed.data.title, userId: getAuthUserId(request) },
    });
    reply.code(201).send(story);
  });

  app.get("/stories", async (request, reply) => {
    const stories = await app.prisma.story.findMany({
      where: { userId: getAuthUserId(request) },
      orderBy: { createdAt: "desc" },
    });
    reply.send(stories);
  });

  app.get<{ Params: { storyId: string } }>("/stories/:storyId", async (request, reply) => {
    const story = await findOwnedStory(app.prisma, getAuthUserId(request), request.params.storyId);
    if (!story) {
      return reply.code(404).send({ error: "Story not found" });
    }
    reply.send(story);
  });

  app.patch<{ Params: { storyId: string } }>("/stories/:storyId", async (request, reply) => {
    const parsed = createStorySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }

    const story = await findOwnedStory(app.prisma, getAuthUserId(request), request.params.storyId);
    if (!story) {
      return reply.code(404).send({ error: "Story not found" });
    }

    const updated = await app.prisma.story.update({
      where: { id: story.id },
      data: { title: parsed.data.title },
    });
    reply.send(updated);
  });

  app.delete<{ Params: { storyId: string } }>("/stories/:storyId", async (request, reply) => {
    const story = await findOwnedStory(app.prisma, getAuthUserId(request), request.params.storyId);
    if (!story) {
      return reply.code(404).send({ error: "Story not found" });
    }

    await app.prisma.story.delete({ where: { id: story.id } });
    reply.code(204).send();
  });
}
