-- CreateEnum (idempotent)
DO $$ BEGIN
  CREATE TYPE "StoreType" AS ENUM ('FOOD', 'RETAIL', 'SERVICES', 'GAS_WATER', 'GENERAL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable (idempotent)
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "type" "StoreType" NOT NULL DEFAULT 'GENERAL';
