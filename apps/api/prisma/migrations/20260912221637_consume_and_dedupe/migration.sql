-- CreateEnum
CREATE TYPE "DedupeMode" AS ENUM ('off', 'character', 'story');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "HistoryEventType" ADD VALUE 'ENTRY_CONSUMED';
ALTER TYPE "HistoryEventType" ADD VALUE 'ENTRY_RESTORED';

-- AlterTable
ALTER TABLE "InventoryItem" ADD COLUMN     "consumedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Pull" ADD COLUMN     "consumedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Story" ADD COLUMN     "dedupeMode" "DedupeMode" NOT NULL DEFAULT 'off';
