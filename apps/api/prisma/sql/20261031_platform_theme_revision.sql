-- CreateTable
CREATE TABLE "PlatformThemeRevision" (
    "id" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "revisionId" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "action" TEXT NOT NULL,
    "restoredFrom" INTEGER,
    "previousRevision" INTEGER,
    "changeSummary" JSONB,
    "reason" TEXT,
    "actorId" TEXT NOT NULL,
    "actorEmail" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformThemeRevision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlatformThemeRevision_revision_key" ON "PlatformThemeRevision"("revision");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformThemeRevision_revisionId_key" ON "PlatformThemeRevision"("revisionId");

-- CreateIndex
CREATE INDEX "PlatformThemeRevision_isActive_idx" ON "PlatformThemeRevision"("isActive");

-- CreateIndex
CREATE INDEX "PlatformThemeRevision_createdAt_idx" ON "PlatformThemeRevision"("createdAt");

