-- AlterTable Product: add configurable options field
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "options" JSONB;
