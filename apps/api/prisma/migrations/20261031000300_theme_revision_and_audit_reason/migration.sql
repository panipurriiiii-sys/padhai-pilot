-- Found by the local-env-qa drift check (prisma migrate diff: migrations -> schema.prisma).
-- Idempotent: the theme table may already have been applied by hand from prisma/sql/ in some environments.

CREATE TABLE IF NOT EXISTS "PlatformThemeRevision" (
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

CREATE UNIQUE INDEX IF NOT EXISTS "PlatformThemeRevision_revision_key" ON "PlatformThemeRevision"("revision");
CREATE UNIQUE INDEX IF NOT EXISTS "PlatformThemeRevision_revisionId_key" ON "PlatformThemeRevision"("revisionId");
CREATE INDEX IF NOT EXISTS "PlatformThemeRevision_isActive_idx" ON "PlatformThemeRevision"("isActive");
CREATE INDEX IF NOT EXISTS "PlatformThemeRevision_createdAt_idx" ON "PlatformThemeRevision"("createdAt");

-- AssessmentAudit.reason exists in schema.prisma but in no earlier migration.
ALTER TABLE "AssessmentAudit" ADD COLUMN IF NOT EXISTS "reason" TEXT;
