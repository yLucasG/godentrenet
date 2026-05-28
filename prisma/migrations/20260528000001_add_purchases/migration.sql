-- CreateTable Supplier
CREATE TABLE IF NOT EXISTS "Supplier" (
  "id"        TEXT NOT NULL,
  "storeId"   TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "cnpj"      TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable Purchase
CREATE TABLE IF NOT EXISTS "Purchase" (
  "id"            TEXT NOT NULL,
  "storeId"       TEXT NOT NULL,
  "supplierId"    TEXT,
  "invoiceNumber" TEXT,
  "issueDate"     TIMESTAMP(3),
  "totalAmount"   DOUBLE PRECISION NOT NULL,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable PurchaseItem
CREATE TABLE IF NOT EXISTS "PurchaseItem" (
  "id"              TEXT NOT NULL,
  "purchaseId"      TEXT NOT NULL,
  "inventoryItemId" TEXT,
  "name"            TEXT NOT NULL,
  "sku"             TEXT,
  "quantity"        DOUBLE PRECISION NOT NULL,
  "unitPrice"       DOUBLE PRECISION NOT NULL,
  "totalPrice"      DOUBLE PRECISION NOT NULL,
  CONSTRAINT "PurchaseItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable FinancialTransaction
CREATE TABLE IF NOT EXISTS "FinancialTransaction" (
  "id"          TEXT NOT NULL,
  "storeId"     TEXT NOT NULL,
  "type"        TEXT NOT NULL,
  "status"      TEXT NOT NULL DEFAULT 'PENDING',
  "description" TEXT NOT NULL,
  "amount"      DOUBLE PRECISION NOT NULL,
  "dueDate"     TIMESTAMP(3) NOT NULL,
  "paidAt"      TIMESTAMP(3),
  "purchaseId"  TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FinancialTransaction_pkey" PRIMARY KEY ("id")
);

-- AlterTable InventoryItem (add purchaseItems back-relation — no SQL needed, only schema)

-- AddForeignKey Supplier -> Store
ALTER TABLE "Supplier"
  ADD CONSTRAINT "Supplier_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey Purchase -> Store
ALTER TABLE "Purchase"
  ADD CONSTRAINT "Purchase_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey Purchase -> Supplier
ALTER TABLE "Purchase"
  ADD CONSTRAINT "Purchase_supplierId_fkey"
  FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey PurchaseItem -> Purchase
ALTER TABLE "PurchaseItem"
  ADD CONSTRAINT "PurchaseItem_purchaseId_fkey"
  FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey PurchaseItem -> InventoryItem
ALTER TABLE "PurchaseItem"
  ADD CONSTRAINT "PurchaseItem_inventoryItemId_fkey"
  FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey FinancialTransaction -> Store
ALTER TABLE "FinancialTransaction"
  ADD CONSTRAINT "FinancialTransaction_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey FinancialTransaction -> Purchase
ALTER TABLE "FinancialTransaction"
  ADD CONSTRAINT "FinancialTransaction_purchaseId_fkey"
  FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
