import type { PrismaClient } from "../../generated/client/index.js";

export async function findOwnedStory(prisma: PrismaClient, userId: string, storyId: string) {
  return prisma.story.findFirst({ where: { id: storyId, userId } });
}

export async function findOwnedCharacter(
  prisma: PrismaClient,
  userId: string,
  storyId: string,
  characterId: string,
) {
  // Includes the story so callers get settings like dedupeMode without a second round trip.
  return prisma.character.findFirst({
    where: { id: characterId, storyId, story: { userId } },
    include: { story: true },
  });
}
