-- CreateEnum
CREATE TYPE "EntryCategory" AS ENUM ('ability', 'item', 'familiar', 'trait', 'skill');

-- CreateEnum
CREATE TYPE "TicketCategory" AS ENUM ('ability', 'item', 'familiar', 'trait', 'skill', 'random');

-- CreateEnum
CREATE TYPE "RarityPreset" AS ENUM ('Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Legendary', 'Mythical', 'Divine');

-- CreateEnum
CREATE TYPE "HistoryEventType" AS ENUM ('TICKET_EARNED', 'TICKET_USED', 'PULL_RESULT', 'ITEM_RECEIVED', 'ITEM_TRANSFERRED_OUT', 'ITEM_TRANSFERRED_IN', 'ENTRY_EXCLUDED', 'ENTRY_INCLUDED', 'ENTRY_CUSTOMIZED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Story" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Character" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GachaEntry" (
    "id" TEXT NOT NULL,
    "category" "EntryCategory" NOT NULL,
    "sourceIndex" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "rarity" DECIMAL(3,1) NOT NULL,
    "description" TEXT NOT NULL,
    "isNsfw" BOOLEAN NOT NULL DEFAULT false,
    "isCharacter" BOOLEAN NOT NULL DEFAULT false,
    "isTech" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GachaEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "feat" TEXT NOT NULL,
    "category" "TicketCategory" NOT NULL,
    "presetName" "RarityPreset",
    "minRarity" DECIMAL(3,1) NOT NULL,
    "avgRarity" DECIMAL(3,1) NOT NULL,
    "maxRarity" DECIMAL(3,1) NOT NULL,
    "isAdvantage" BOOLEAN NOT NULL DEFAULT false,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PullProposal" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "optionIndex" INTEGER NOT NULL DEFAULT 0,
    "gachaEntryId" TEXT,
    "customizationId" TEXT,
    "resolvedCategory" "EntryCategory" NOT NULL,
    "resolvedName" TEXT NOT NULL,
    "resolvedRarity" DECIMAL(3,1) NOT NULL,
    "resolvedDescription" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "luckPercent" DECIMAL(6,3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PullProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pull" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "chosenOptionIndex" INTEGER NOT NULL DEFAULT 0,
    "gachaEntryId" TEXT,
    "customizationId" TEXT,
    "category" "EntryCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "rarity" DECIMAL(3,1) NOT NULL,
    "description" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "luckPercent" DECIMAL(6,3) NOT NULL,
    "rolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pull_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "sourcePullId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rarity" DECIMAL(3,1) NOT NULL,
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemTransfer" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "fromCharacterId" TEXT NOT NULL,
    "toCharacterId" TEXT NOT NULL,
    "transferredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItemTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GachaEntryCustomization" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storyId" TEXT,
    "baseEntryId" TEXT,
    "category" "EntryCategory" NOT NULL,
    "name" TEXT,
    "rarity" DECIMAL(3,1),
    "description" TEXT,
    "isExcluded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GachaEntryCustomization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoryEvent" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "type" "HistoryEventType" NOT NULL,
    "summary" TEXT NOT NULL,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ticketId" TEXT,
    "pullId" TEXT,
    "itemId" TEXT,
    "customizationId" TEXT,

    CONSTRAINT "HistoryEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Story_userId_idx" ON "Story"("userId");

-- CreateIndex
CREATE INDEX "Character_storyId_idx" ON "Character"("storyId");

-- CreateIndex
CREATE INDEX "GachaEntry_category_rarity_idx" ON "GachaEntry"("category", "rarity");

-- CreateIndex
CREATE UNIQUE INDEX "GachaEntry_category_sourceIndex_key" ON "GachaEntry"("category", "sourceIndex");

-- CreateIndex
CREATE INDEX "Ticket_characterId_usedAt_idx" ON "Ticket"("characterId", "usedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PullProposal_ticketId_optionIndex_key" ON "PullProposal"("ticketId", "optionIndex");

-- CreateIndex
CREATE UNIQUE INDEX "Pull_ticketId_key" ON "Pull"("ticketId");

-- CreateIndex
CREATE INDEX "InventoryItem_characterId_idx" ON "InventoryItem"("characterId");

-- CreateIndex
CREATE INDEX "ItemTransfer_itemId_idx" ON "ItemTransfer"("itemId");

-- CreateIndex
CREATE INDEX "GachaEntryCustomization_userId_storyId_idx" ON "GachaEntryCustomization"("userId", "storyId");

-- CreateIndex
CREATE INDEX "GachaEntryCustomization_baseEntryId_idx" ON "GachaEntryCustomization"("baseEntryId");

-- CreateIndex
CREATE INDEX "HistoryEvent_characterId_occurredAt_idx" ON "HistoryEvent"("characterId", "occurredAt");

-- CreateIndex
CREATE INDEX "HistoryEvent_storyId_occurredAt_idx" ON "HistoryEvent"("storyId", "occurredAt");

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PullProposal" ADD CONSTRAINT "PullProposal_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PullProposal" ADD CONSTRAINT "PullProposal_gachaEntryId_fkey" FOREIGN KEY ("gachaEntryId") REFERENCES "GachaEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PullProposal" ADD CONSTRAINT "PullProposal_customizationId_fkey" FOREIGN KEY ("customizationId") REFERENCES "GachaEntryCustomization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pull" ADD CONSTRAINT "Pull_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pull" ADD CONSTRAINT "Pull_gachaEntryId_fkey" FOREIGN KEY ("gachaEntryId") REFERENCES "GachaEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pull" ADD CONSTRAINT "Pull_customizationId_fkey" FOREIGN KEY ("customizationId") REFERENCES "GachaEntryCustomization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_sourcePullId_fkey" FOREIGN KEY ("sourcePullId") REFERENCES "Pull"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemTransfer" ADD CONSTRAINT "ItemTransfer_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GachaEntryCustomization" ADD CONSTRAINT "GachaEntryCustomization_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GachaEntryCustomization" ADD CONSTRAINT "GachaEntryCustomization_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GachaEntryCustomization" ADD CONSTRAINT "GachaEntryCustomization_baseEntryId_fkey" FOREIGN KEY ("baseEntryId") REFERENCES "GachaEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoryEvent" ADD CONSTRAINT "HistoryEvent_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoryEvent" ADD CONSTRAINT "HistoryEvent_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoryEvent" ADD CONSTRAINT "HistoryEvent_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoryEvent" ADD CONSTRAINT "HistoryEvent_pullId_fkey" FOREIGN KEY ("pullId") REFERENCES "Pull"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoryEvent" ADD CONSTRAINT "HistoryEvent_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InventoryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoryEvent" ADD CONSTRAINT "HistoryEvent_customizationId_fkey" FOREIGN KEY ("customizationId") REFERENCES "GachaEntryCustomization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
