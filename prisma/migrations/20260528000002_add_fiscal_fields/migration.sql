-- AlterTable Store: fiscal fields
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "cnpj"              TEXT;
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "stateRegistration" TEXT;
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "taxRegime"         TEXT DEFAULT 'Simples Nacional';

-- AlterTable Product: tax classification fields
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "ncm"      TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "cfop"     TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "cest"     TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "icmsRate" DOUBLE PRECISION;
