-- CreateTable
CREATE TABLE "StockExpiry" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "batchName" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "expirationDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockExpiry_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "StockExpiry" ADD CONSTRAINT "StockExpiry_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockExpiry" ADD CONSTRAINT "StockExpiry_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
