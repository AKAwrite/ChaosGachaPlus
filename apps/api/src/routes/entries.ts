import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { CONCRETE_GACHA_CATEGORIES } from "@chaosgachaplus/shared";
import { requireAuth, getAuthUserId } from "../middleware/requireAuth.js";
import { findOwnedStory } from "../lib/ownership.js";
import { logHistoryEvent } from "../lib/historyLog.js";
import type { GachaEntry, GachaEntryCustomization } from "../../generated/client/index.js";

const listEntriesSchema = z.object({
  category: z.enum(CONCRETE_GACHA_CATEGORIES).optional(),
  search: z.string().trim().min(1).max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

const createCustomizationSchema = z
  .object({
    storyId: z.string().uuid().nullable().optional(),
    baseEntryId: z.string().uuid().nullable().optional(),
    category: z.enum(CONCRETE_GACHA_CATEGORIES).optional(),
    name: z.string().trim().min(1).max(200).nullable().optional(),
    rarity: z.number().min(0).max(10).nullable().optional(),
    description: z.string().trim().max(5000).nullable().optional(),
    isExcluded: z.boolean().default(false),
  })
  .refine((data) => data.baseEntryId || (data.category && data.name != null && data.rarity != null), {
    message: "A custom entry (no baseEntryId) requires category, name and rarity",
  });

const updateCustomizationSchema = z.object({
  name: z.string().trim().min(1).max(200).nullable().optional(),
  rarity: z.number().min(0).max(10).nullable().optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  isExcluded: z.boolean().optional(),
});

function toEntryDTO(entry: GachaEntry) {
  return { ...entry, rarity: Number(entry.rarity) };
}

function toCustomizationDTO(c: GachaEntryCustomization) {
  return { ...c, rarity: c.rarity === null ? null : Number(c.rarity) };
}

export async function entryRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAuth);

  app.get("/entries", async (request, reply) => {
    const parsed = listEntriesSchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }
    const { category, search, limit, offset } = parsed.data;

    const entries = await app.prisma.gachaEntry.findMany({
      where: {
        ...(category ? { category } : {}),
        ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
      },
      orderBy: { name: "asc" },
      take: limit,
      skip: offset,
    });
    reply.send(entries.map(toEntryDTO));
  });

  app.get<{ Querystring: { storyId?: string } }>("/customizations", async (request, reply) => {
    const userId = getAuthUserId(request);
    const { storyId } = request.query;

    const customizations = await app.prisma.gachaEntryCustomization.findMany({
      where: { userId, ...(storyId ? { OR: [{ storyId: null }, { storyId }] } : {}) },
      orderBy: { createdAt: "desc" },
    });
    reply.send(customizations.map(toCustomizationDTO));
  });

  app.post("/customizations", async (request, reply) => {
    const parsed = createCustomizationSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }
    const userId = getAuthUserId(request);
    const data = parsed.data;

    if (data.storyId) {
      const story = await findOwnedStory(app.prisma, userId, data.storyId);
      if (!story) {
        return reply.code(404).send({ error: "Story not found" });
      }
    }

    let category = data.category;
    if (data.baseEntryId) {
      const baseEntry = await app.prisma.gachaEntry.findUnique({ where: { id: data.baseEntryId } });
      if (!baseEntry) {
        return reply.code(404).send({ error: "Base entry not found" });
      }
      category = baseEntry.category;
    }

    const customization = await app.prisma.gachaEntryCustomization.create({
      data: {
        userId,
        storyId: data.storyId ?? null,
        baseEntryId: data.baseEntryId ?? null,
        category: category!,
        name: data.name ?? null,
        rarity: data.rarity ?? null,
        description: data.description ?? null,
        isExcluded: data.isExcluded,
      },
    });

    if (data.storyId) {
      await logHistoryEvent(app.prisma, {
        storyId: data.storyId,
        type: data.isExcluded ? "ENTRY_EXCLUDED" : "ENTRY_CUSTOMIZED",
        summary: data.isExcluded
          ? `Excluded "${data.name ?? "an entry"}" from this story's pool`
          : `Customized "${data.name ?? "an entry"}" for this story`,
        customizationId: customization.id,
      });
    }

    reply.code(201).send(toCustomizationDTO(customization));
  });

  app.patch<{ Params: { customizationId: string } }>("/customizations/:customizationId", async (request, reply) => {
    const parsed = updateCustomizationSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }

    const userId = getAuthUserId(request);
    const existing = await app.prisma.gachaEntryCustomization.findFirst({
      where: { id: request.params.customizationId, userId },
    });
    if (!existing) {
      return reply.code(404).send({ error: "Customization not found" });
    }

    const updated = await app.prisma.gachaEntryCustomization.update({
      where: { id: existing.id },
      data: parsed.data,
    });
    reply.send(toCustomizationDTO(updated));
  });

  app.delete<{ Params: { customizationId: string } }>("/customizations/:customizationId", async (request, reply) => {
    const userId = getAuthUserId(request);
    const existing = await app.prisma.gachaEntryCustomization.findFirst({
      where: { id: request.params.customizationId, userId },
    });
    if (!existing) {
      return reply.code(404).send({ error: "Customization not found" });
    }

    await app.prisma.gachaEntryCustomization.delete({ where: { id: existing.id } });
    reply.code(204).send();
  });
}
