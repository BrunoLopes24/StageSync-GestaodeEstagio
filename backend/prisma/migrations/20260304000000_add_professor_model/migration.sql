-- Step 1: Add PROFESSOR to Role enum
ALTER TYPE "Role" ADD VALUE 'PROFESSOR';

-- Step 2: Add email column as NULLABLE first
ALTER TABLE "users" ADD COLUMN "email" TEXT;

-- Step 3: Validate no NULL institutional_email in source data
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "student_identities" si
    JOIN "users" u ON u."student_identity_id" = si."id"
    WHERE si."institutional_email" IS NULL
  ) THEN
    RAISE EXCEPTION 'ABORT: Found users with NULL institutional_email';
  END IF;
END $$;

-- Step 4: Validate no case-insensitive duplicates
DO $$
BEGIN
  IF EXISTS (
    SELECT LOWER(TRIM(si."institutional_email")), COUNT(*)
    FROM "student_identities" si
    JOIN "users" u ON u."student_identity_id" = si."id"
    GROUP BY LOWER(TRIM(si."institutional_email"))
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'ABORT: Found duplicate emails (case-insensitive)';
  END IF;
END $$;

-- Step 5: Populate email (normalized) from StudentIdentity for existing users
UPDATE "users" u
SET "email" = LOWER(TRIM(si."institutional_email"))
FROM "student_identities" si
WHERE u."student_identity_id" = si."id";

-- Step 6: Handle any users without student_identity (e.g. admin) — give them a placeholder
UPDATE "users"
SET "email" = 'admin_' || "id" || '@placeholder.local'
WHERE "email" IS NULL;

-- Step 7: Verify no NULLs remain
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "users" WHERE "email" IS NULL) THEN
    RAISE EXCEPTION 'ABORT: Users with NULL email after population';
  END IF;
END $$;

-- Step 8: Make email NOT NULL
ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL;

-- Step 9: Add UNIQUE constraint
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- Step 10: Make student_identity_id nullable
ALTER TABLE "users" ALTER COLUMN "student_identity_id" DROP NOT NULL;

-- Step 11: Create professor_access table
CREATE TABLE "professor_access" (
    "id"          TEXT NOT NULL,
    "student_id"  TEXT NOT NULL,
    "code_hash"   TEXT NOT NULL,
    "is_active"   BOOLEAN NOT NULL DEFAULT true,
    "used_at"     TIMESTAMP(3),
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at"  TIMESTAMP(3),
    CONSTRAINT "professor_access_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "professor_access_code_hash_key" ON "professor_access"("code_hash");
CREATE INDEX "professor_access_student_id_idx" ON "professor_access"("student_id");

ALTER TABLE "professor_access"
    ADD CONSTRAINT "professor_access_student_id_fkey"
    FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 12: Partial index — one active unused code per student (DB-level enforcement)
CREATE UNIQUE INDEX "professor_access_active_per_student"
ON "professor_access"("student_id")
WHERE "is_active" = true AND "used_at" IS NULL;

-- Step 13: Create professor_student_links table
CREATE TABLE "professor_student_links" (
    "id"           TEXT NOT NULL,
    "professor_id" TEXT NOT NULL,
    "student_id"   TEXT NOT NULL,
    "is_active"    BOOLEAN NOT NULL DEFAULT true,
    "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "professor_student_links_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "professor_student_links_professor_id_student_id_key"
    ON "professor_student_links"("professor_id", "student_id");
CREATE INDEX "professor_student_links_student_id_idx"
    ON "professor_student_links"("student_id");

ALTER TABLE "professor_student_links"
    ADD CONSTRAINT "professor_student_links_professor_id_fkey"
    FOREIGN KEY ("professor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "professor_student_links"
    ADD CONSTRAINT "professor_student_links_student_id_fkey"
    FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
