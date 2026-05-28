-- AlterTable Store: add theme field
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "theme" TEXT NOT NULL DEFAULT 'amber-dark';
