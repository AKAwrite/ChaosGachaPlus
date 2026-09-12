import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireAuth, getAuthUserId } from "../middleware/requireAuth.js";
import { findOwnedCharacter } from "../lib/ownership.js";
import { logHistoryEvent } from "../lib/historyLog.js";
import { loadRollContext, rollForTicket } from "../services/rollService.js";
import type { Pull, PullProposal } from "../../generated/client/index.js";

const proposeSchema = z.object({
  ticketIds: z.array(z.string().uuid()).min(1).max(20),
});

const commitSchema = z.object({
  selections: z
    .array(z.object({ ticketId: z.string().uuid(), optionIndex: z.number().int().min(0).max(1).default(0) }))
    .min(1)
    .max(20),
});

type ProposalFields = Pick<
  PullProposal,
  "ticketId" | "optionIndex" | "resolvedCategory" | "resolvedName" | "resolvedDescription" | "tier" | "color"
> & { resolvedRarity: PullProposal["resolvedRarity"] | number; luckPercent: PullProposal["luckPercent"] | number };

function toProposalDTO(proposal: ProposalFields) {
  return {
    ticketId: proposal.ticketId,
    optionIndex: proposal.optionIndex,
    category: proposal.resolvedCategory,
    name: proposal.resolvedName,
    rarity: Number(proposal.resolvedRarity),
    description: proposal.resolvedDescription,
    tier: proposal.tier,
    color: proposal.color,
    luckPercent: Number(proposal.luckPercent),
  };
}

function toPullDTO(pull: Pull) {
  return {
    ...pull,
    rarity: Number(pull.rarity),
    luckPercent: Number(pull.luckPercent),
  };
}

export async function pullRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAuth);

  // Rolls (or re-rolls) a preview for each ticket - nothing is persisted as
  // history yet, so this can be called as many times as the player wants.
  app.post<{ Params: { storyId: string; characterId: string } }>(
    "/stories/:storyId/characters/:characterId/tickets/propose",
    async (request, reply) => {
      const parsed = proposeSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: parsed.error.flatten() });
      }

      const userId = getAuthUserId(request);
      const character = await findOwnedCharacter(app.prisma, userId, request.params.storyId, request.params.characterId);
      if (!character) {
        return reply.code(404).send({ error: "Character not found" });
      }

      const { ticketIds } = parsed.data;
      const tickets = await app.prisma.ticket.findMany({
        where: { id: { in: ticketIds }, characterId: character.id },
      });
      if (tickets.length !== ticketIds.length) {
        return reply.code(404).send({ error: "One or more tickets were not found" });
      }
      const alreadyUsed = tickets.filter((t) => t.usedAt !== null);
      if (alreadyUsed.length > 0) {
        return reply.code(409).send({ error: "One or more tickets have already been used", ticketIds: alreadyUsed.map((t) => t.id) });
      }

      // Clear any previous reroll and load the pool context concurrently, then
      // roll everything and persist the proposals in a single write.
      const [, context] = await Promise.all([
        app.prisma.pullProposal.deleteMany({ where: { ticketId: { in: ticketIds } } }),
        loadRollContext(
          app.prisma,
          userId,
          request.params.storyId,
          character.id,
          character.story.dedupeMode,
        ),
      ]);

      const rolled = await Promise.all(
        tickets.map(async (ticket) => ({
          ticket,
          ...(await rollForTicket(app.prisma, context, ticket)),
        })),
      );

      const rows = rolled.flatMap(({ ticket, results }) =>
        results.map((result, optionIndex) => ({
          ticketId: ticket.id,
          optionIndex,
          gachaEntryId: result.entry.gachaEntryId ?? null,
          customizationId: result.entry.customizationId ?? null,
          resolvedCategory: result.entry.category,
          resolvedName: result.entry.name,
          resolvedRarity: result.rarity,
          resolvedDescription: result.entry.description,
          tier: result.tier,
          color: result.color,
          luckPercent: result.luckPercent,
        })),
      );
      await app.prisma.pullProposal.createMany({ data: rows });

      const grouped: Record<string, { options: ReturnType<typeof toProposalDTO>[]; decoys: string[] }> = {};
      for (const { ticket, decoys } of rolled) {
        grouped[ticket.id] = {
          options: rows.filter((row) => row.ticketId === ticket.id).map(toProposalDTO),
          decoys,
        };
      }

      reply.send(grouped);
    },
  );

  // Confirms a chosen proposal per ticket: this is the point of no return -
  // creates the permanent Pull, marks the ticket used, and (for item rolls)
  // drops the item into the character's inventory.
  app.post<{ Params: { storyId: string; characterId: string } }>(
    "/stories/:storyId/characters/:characterId/tickets/commit",
    async (request, reply) => {
      const parsed = commitSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: parsed.error.flatten() });
      }

      const userId = getAuthUserId(request);
      const character = await findOwnedCharacter(app.prisma, userId, request.params.storyId, request.params.characterId);
      if (!character) {
        return reply.code(404).send({ error: "Character not found" });
      }

      const { selections } = parsed.data;
      const ticketIds = selections.map((s) => s.ticketId);
      const [tickets, proposals] = await Promise.all([
        app.prisma.ticket.findMany({ where: { id: { in: ticketIds }, characterId: character.id } }),
        app.prisma.pullProposal.findMany({ where: { ticketId: { in: ticketIds } } }),
      ]);
      if (tickets.length !== ticketIds.length) {
        return reply.code(404).send({ error: "One or more tickets were not found" });
      }
      const alreadyUsed = tickets.filter((t) => t.usedAt !== null);
      if (alreadyUsed.length > 0) {
        return reply.code(409).send({ error: "One or more tickets have already been used", ticketIds: alreadyUsed.map((t) => t.id) });
      }

      const proposalByKey = new Map(proposals.map((p) => [`${p.ticketId}:${p.optionIndex}`, p]));
      for (const selection of selections) {
        if (!proposalByKey.has(`${selection.ticketId}:${selection.optionIndex}`)) {
          return reply.code(409).send({ error: `No proposal found for ticket ${selection.ticketId} - propose a roll first` });
        }
      }

      // Batched rather than per-ticket: every statement here is a round trip to
      // a database that may be a continent away, so a five-ticket confirm used
      // to cost ~25 of them. This is a fixed handful regardless of batch size.
      const pulls = await app.prisma.$transaction(async (tx) => {
        const chosen = selections.map((selection) => ({
          selection,
          proposal: proposalByKey.get(`${selection.ticketId}:${selection.optionIndex}`)!,
        }));

        const created = await tx.pull.createManyAndReturn({
          data: chosen.map(({ selection, proposal }) => ({
            ticketId: selection.ticketId,
            chosenOptionIndex: selection.optionIndex,
            gachaEntryId: proposal.gachaEntryId,
            customizationId: proposal.customizationId,
            category: proposal.resolvedCategory,
            name: proposal.resolvedName,
            rarity: proposal.resolvedRarity,
            description: proposal.resolvedDescription,
            tier: proposal.tier,
            luckPercent: proposal.luckPercent,
          })),
        });

        await Promise.all([
          tx.ticket.updateMany({ where: { id: { in: ticketIds } }, data: { usedAt: new Date() } }),
          tx.pullProposal.deleteMany({ where: { ticketId: { in: ticketIds } } }),
        ]);

        const itemPulls = created.filter((pull) => pull.category === "item");
        const items = itemPulls.length
          ? await tx.inventoryItem.createManyAndReturn({
              data: itemPulls.map((pull) => ({
                characterId: character.id,
                sourcePullId: pull.id,
                name: pull.name,
                description: pull.description,
                rarity: pull.rarity,
              })),
            })
          : [];

        await tx.historyEvent.createMany({
          data: [
            ...created.map((pull) => ({
              characterId: character.id,
              storyId: request.params.storyId,
              type: "PULL_RESULT" as const,
              summary: `Rolled ${pull.name} (${pull.tier}, ${pull.category})`,
              ticketId: pull.ticketId,
              pullId: pull.id,
            })),
            ...items.map((item) => ({
              characterId: character.id,
              storyId: request.params.storyId,
              type: "ITEM_RECEIVED" as const,
              summary: `Received item: ${item.name}`,
              pullId: item.sourcePullId,
              itemId: item.id,
            })),
          ],
        });

        return created;
      });

      reply.send(pulls.map(toPullDTO));
    },
  );

  app.get<{ Params: { storyId: string; characterId: string } }>(
    "/stories/:storyId/characters/:characterId/pulls",
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

      const pulls = await app.prisma.pull.findMany({
        where: { ticket: { characterId: character.id } },
        orderBy: { rolledAt: "desc" },
        include: { ticket: { select: { feat: true } } },
      });
      reply.send(
        pulls.map((pull) => ({
          ...toPullDTO(pull),
          ticketFeat: pull.ticket.feat,
        })),
      );
    },
  );

  // Consuming is a story event, not a deletion: the pull keeps its place in
  // history, it just stops counting as something the character still has.
  app.post<{ Params: { storyId: string; characterId: string; pullId: string }; Body: { consumed?: boolean } }>(
    "/stories/:storyId/characters/:characterId/pulls/:pullId/consume",
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

      const pull = await app.prisma.pull.findFirst({
        where: { id: request.params.pullId, ticket: { characterId: character.id } },
      });
      if (!pull) {
        return reply.code(404).send({ error: "Pull not found" });
      }

      const consumed = request.body?.consumed ?? true;
      const updated = await app.prisma.pull.update({
        where: { id: pull.id },
        data: { consumedAt: consumed ? new Date() : null },
      });

      await logHistoryEvent(app.prisma, {
        characterId: character.id,
        storyId: request.params.storyId,
        type: consumed ? "ENTRY_CONSUMED" : "ENTRY_RESTORED",
        summary: consumed ? `Consumed ${pull.name}` : `Regained ${pull.name}`,
        pullId: pull.id,
      });

      reply.send(toPullDTO(updated));
    },
  );
}
