-- AlterTable Store: add pickup and local acceptance flags
ALTER TABLE "Store" ADD COLUMN "acceptsPickup" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Store" ADD COLUMN "acceptsLocal"  BOOLEAN NOT NULL DEFAULT true;

-- AlterTable Order: add delivery method and local identifier
ALTER TABLE "Order" ADD COLUMN "deliveryMethod"  TEXT NOT NULL DEFAULT 'DELIVERY';
ALTER TABLE "Order" ADD COLUMN "localIdentifier" TEXT;
