import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { RARITY_PRESETS, RARITY_PRESET_RANGES, GACHA_CATEGORIES } from "@chaosgachaplus/shared";
import { requireAuth, getAuthUserId } from "../middleware/requireAuth.js";
import { findOwnedCharacter } from "../lib/ownership.js";
import { logHistoryEvent } from "../lib/historyLog.js";
import type { Ticket } from "../../generated/client/index.js";

const baseTicketFields = {
  feat: z.string().trim().max(500).optional(),
  category: z.enum(GACHA_CATEGORIES),
  isAdvantage: z.boolean().default(false),
  /** Mint several identical tickets from one feat (e.g. "3 Gold tickets for being born"). */
  quantity: z.number().int().min(1).max(20).default(1),
};

const presetTicketSchema = z
  .object({ ...baseTicketFields, presetName: z.enum(RARITY_PRESETS) })
  .strict();

const customTicketSchema = z
  .object({
    ...baseTicketFields,
    minRarity: z.number().min(0).max(10),
    avgRarity: z.number().min(0).max(10),
    maxRarity: z.number().min(0).max(10),
  })
  .strict()
  .refine((data) => data.minRarity < data.avgRarity && data.avgRarity < data.maxRarity, {
    message: "minRarity must be < avgRarity must be < maxRarity",
    path: ["avgRarity"],
  });

const createTicketSchema = z.union([presetTicketSchema, customTicketSchema]);

function toTicketDTO(ticket: Ticket) {
  return {
    ...ticket,
    minRarity: Number(ticket.minRarity),
    avgRarity: Number(ticket.avgRarity),
    maxRarity: Number(ticket.maxRarity),
  };
}

export async function ticketRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAuth);

  app.post<{ Params: { storyId: string; characterId: string } }>(
    "/stories/:storyId/characters/:characterId/tickets",
    async (request, reply) => {
      const parsed = createTicketSchema.safeParse(request.body);
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

      const data = parsed.data;
      const { presetName, min, avg, max } =
        "presetName" in data
          ? { presetName: data.presetName, ...RARITY_PRESET_RANGES[data.presetName] }
          : { presetName: null, min: data.minRarity, avg: data.avgRarity, max: data.maxRarity };

      const label = `${presetName ?? `${min}-${avg}-${max}`} ${data.category}`;
      const feat = data.feat?.trim() ? data.feat.trim() : null;

      const tickets = await app.prisma.$transaction(async (tx) => {
        const created = [];
        for (let i = 0; i < data.quantity; i++) {
          created.push(
            await tx.ticket.create({
              data: {
                characterId: character.id,
                feat,
                category: data.category,
                isAdvantage: data.isAdvantage,
                presetName,
                minRarity: min,
                avgRarity: avg,
                maxRarity: max,
              },
            }),
          );
        }

        await logHistoryEvent(tx, {
          characterId: character.id,
          storyId: request.params.storyId,
          type: "TICKET_EARNED",
          summary:
            data.quantity > 1
              ? `Earned ${data.quantity}x ${label} tickets${feat ? `: ${feat}` : ""}`
              : `Earned a ${label} ticket${feat ? `: ${feat}` : ""}`,
          ticketId: created[0].id,
        });

        return created;
      });

      reply.code(201).send(tickets.map(toTicketDTO));
    },
  );

  app.get<{ Params: { storyId: string; characterId: string }; Querystring: { status?: string } }>(
    "/stories/:storyId/characters/:characterId/tickets",
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

      const status = request.query.status;
      const usedFilter = status === "used" ? { not: null } : status === "unused" ? null : undefined;

      const tickets = await app.prisma.ticket.findMany({
        where: { characterId: character.id, ...(usedFilter !== undefined ? { usedAt: usedFilter } : {}) },
        orderBy: { earnedAt: "desc" },
      });
      reply.send(tickets.map(toTicketDTO));
    },
  );

  app.delete<{ Params: { storyId: string; characterId: string; ticketId: string } }>(
    "/stories/:storyId/characters/:characterId/tickets/:ticketId",
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

      const ticket = await app.prisma.ticket.findFirst({
        where: { id: request.params.ticketId, characterId: character.id },
      });
      if (!ticket) {
        return reply.code(404).send({ error: "Ticket not found" });
      }

      await app.prisma.ticket.delete({ where: { id: ticket.id } });
      reply.code(204).send();
    },
  );
}
