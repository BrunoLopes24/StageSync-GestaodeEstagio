-- Phase 2: Remove ADMIN from Role enum
-- Pre-check verified: zero ADMIN rows in users table

-- 1. Create new enum without ADMIN
CREATE TYPE "Role_new" AS ENUM ('STUDENT', 'PROFESSOR');

-- 2. Drop the default before changing type
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;

-- 3. Switch column to new enum
ALTER TABLE "users"
  ALTER COLUMN "role" TYPE "Role_new"
  USING "role"::text::"Role_new";

-- 4. Re-add default
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'STUDENT'::"Role_new";

-- 5. Drop old enum and rename
DROP TYPE "Role";
ALTER TYPE "Role_new" RENAME TO "Role";
