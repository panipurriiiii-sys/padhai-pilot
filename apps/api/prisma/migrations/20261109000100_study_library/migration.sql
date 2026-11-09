-- Study Library: platform-level + institute-scoped resource library
-- Migration: 20261109000100_study_library

CREATE TABLE IF NOT EXISTS "LibraryMaterial" (
    "id"            TEXT NOT NULL,
    "instituteId"   TEXT,
    "uploadedBy"    TEXT NOT NULL,
    "title"         TEXT NOT NULL,
    "description"   TEXT,
    "board"         TEXT NOT NULL,
    "classLevel"    TEXT,
    "subject"       TEXT,
    "contentType"   TEXT NOT NULL,
    "fileUrl"       TEXT,
    "externalUrl"   TEXT,
    "yearOrEdition" TEXT,
    "tags"          TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "isApproved"    BOOLEAN NOT NULL DEFAULT false,
    "viewCount"     INTEGER NOT NULL DEFAULT 0,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LibraryMaterial_pkey" PRIMARY KEY ("id")
);

-- FK to Institute (nullable, cascade on delete)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'LibraryMaterial_instituteId_fkey'
  ) THEN
    ALTER TABLE "LibraryMaterial"
      ADD CONSTRAINT "LibraryMaterial_instituteId_fkey"
      FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- FK to User (cascade on delete)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'LibraryMaterial_uploadedBy_fkey'
  ) THEN
    ALTER TABLE "LibraryMaterial"
      ADD CONSTRAINT "LibraryMaterial_uploadedBy_fkey"
      FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS "LibraryMaterial_board_classLevel_subject_idx"
  ON "LibraryMaterial"("board", "classLevel", "subject");

CREATE INDEX IF NOT EXISTS "LibraryMaterial_instituteId_idx"
  ON "LibraryMaterial"("instituteId");

CREATE INDEX IF NOT EXISTS "LibraryMaterial_contentType_idx"
  ON "LibraryMaterial"("contentType");

CREATE INDEX IF NOT EXISTS "LibraryMaterial_isApproved_idx"
  ON "LibraryMaterial"("isApproved");
