-- CreateTable InventoryItem
CREATE TABLE IF NOT EXISTS "InventoryItem" (
  "id"           TEXT NOT NULL,
  "storeId"      TEXT NOT NULL,
  "name"         TEXT NOT NULL,
  "sku"          TEXT,
  "unit"         TEXT NOT NULL DEFAULT 'UN',
  "currentStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "minStock"     DOUBLE PRECISION NOT NULL DEFAULT 0,
  "costPrice"    DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable ProductIngredient
CREATE TABLE IF NOT EXISTS "ProductIngredient" (
  "id"              TEXT NOT NULL,
  "productId"       TEXT NOT NULL,
  "inventoryItemId" TEXT NOT NULL,
  "quantity"        DOUBLE PRECISION NOT NULL,
  CONSTRAINT "ProductIngredient_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProductIngredient_productId_inventoryItemId_key" UNIQUE ("productId", "inventoryItemId")
);

-- AlterTable Product
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isTracked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "linkedInventoryItemId" TEXT;

-- AddForeignKey InventoryItem -> Store
ALTER TABLE "InventoryItem"
  ADD CONSTRAINT "InventoryItem_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey ProductIngredient -> Product
ALTER TABLE "ProductIngredient"
  ADD CONSTRAINT "ProductIngredient_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey ProductIngredient -> InventoryItem
ALTER TABLE "ProductIngredient"
  ADD CONSTRAINT "ProductIngredient_inventoryItemId_fkey"
  FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey Product -> InventoryItem (linkedInventoryItem)
ALTER TABLE "Product"
  ADD CONSTRAINT "Product_linkedInventoryItemId_fkey"
  FOREIGN KEY ("linkedInventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
