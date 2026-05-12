CREATE TABLE IF NOT EXISTS "Order" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerName" TEXT,
    "address" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "needChange" BOOLEAN NOT NULL DEFAULT false,
    "changeFor" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='Order_storeId_fkey') THEN
    ALTER TABLE "Order" ADD CONSTRAINT "Order_storeId_fkey"
        FOREIGN KEY ("storeId") REFERENCES "Store"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
