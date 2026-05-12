-- AlterTable: Add new columns to Store (IF NOT EXISTS for idempotency)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Store' AND column_name='userId') THEN
    ALTER TABLE "Store" ADD COLUMN "userId" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Store' AND column_name='phoneNumber') THEN
    ALTER TABLE "Store" ADD COLUMN "phoneNumber" TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='Store_userId_key') THEN
    ALTER TABLE "Store" ADD CONSTRAINT "Store_userId_key" UNIQUE ("userId");
  END IF;
END $$;

-- CreateTable User
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

-- CreateTable Product
CREATE TABLE IF NOT EXISTS "Product" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '🛍️',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable BotConfig
CREATE TABLE IF NOT EXISTS "BotConfig" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "welcomeMessage" TEXT NOT NULL DEFAULT 'Ola! Seja bem-vindo.',
    "requireKeyword" BOOLEAN NOT NULL DEFAULT false,
    "keyword" TEXT NOT NULL DEFAULT '@hello',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),

    CONSTRAINT "BotConfig_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "BotConfig_storeId_key" ON "BotConfig"("storeId");

-- CreateTable Message
CREATE TABLE IF NOT EXISTS "Message" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "fromPhone" TEXT NOT NULL,
    "fromName" TEXT,
    "text" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey Store -> User
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='Store_userId_fkey') THEN
    ALTER TABLE "Store" ADD CONSTRAINT "Store_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey Product -> Store
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='Product_storeId_fkey') THEN
    ALTER TABLE "Product" ADD CONSTRAINT "Product_storeId_fkey"
        FOREIGN KEY ("storeId") REFERENCES "Store"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey BotConfig -> Store
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='BotConfig_storeId_fkey') THEN
    ALTER TABLE "BotConfig" ADD CONSTRAINT "BotConfig_storeId_fkey"
        FOREIGN KEY ("storeId") REFERENCES "Store"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey Message -> Store
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='Message_storeId_fkey') THEN
    ALTER TABLE "Message" ADD CONSTRAINT "Message_storeId_fkey"
        FOREIGN KEY ("storeId") REFERENCES "Store"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
