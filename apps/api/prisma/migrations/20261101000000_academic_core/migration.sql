-- AlterTable
ALTER TABLE "Batch" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "schedule" TEXT;

-- AlterTable
ALTER TABLE "Enrollment" ADD COLUMN     "endedAt" TIMESTAMP(3),
ADD COLUMN     "promotedFromBatchId" TEXT;

-- AlterTable
ALTER TABLE "InvitationCode" ADD COLUMN     "label" TEXT,
ADD COLUMN     "revokedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "expiresAt" DROP NOT NULL;

-- AlterTable
ALTER TABLE "TimetableSlot" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "BatchPromotion" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "sourceBatchId" TEXT NOT NULL,
    "targetBatchId" TEXT NOT NULL,
    "promotedById" TEXT NOT NULL,
    "movedCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "archivedSource" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BatchPromotion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BatchPromotion_instituteId_createdAt_idx" ON "BatchPromotion"("instituteId", "createdAt");

-- CreateIndex
CREATE INDEX "BatchPromotion_sourceBatchId_idx" ON "BatchPromotion"("sourceBatchId");

-- CreateIndex
CREATE INDEX "BatchPromotion_targetBatchId_idx" ON "BatchPromotion"("targetBatchId");

-- CreateIndex
CREATE INDEX "InvitationCode_batchId_idx" ON "InvitationCode"("batchId");

-- CreateIndex
CREATE INDEX "TimetableSlot_instituteId_dayOfWeek_idx" ON "TimetableSlot"("instituteId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "Announcement_instituteId_createdAt_idx" ON "Announcement"("instituteId", "createdAt");

-- AddForeignKey
ALTER TABLE "BatchPromotion" ADD CONSTRAINT "BatchPromotion_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchPromotion" ADD CONSTRAINT "BatchPromotion_sourceBatchId_fkey" FOREIGN KEY ("sourceBatchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchPromotion" ADD CONSTRAINT "BatchPromotion_targetBatchId_fkey" FOREIGN KEY ("targetBatchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

