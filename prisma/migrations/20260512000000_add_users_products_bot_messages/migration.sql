-- AlterTable: Add new columns to Store
ALTER TABLE "Store" ADD COLUMN "userId" TEXT,
                    ADD COLUMN "phoneNumber" TEXT;

ALTER TABLE "Store" ADD CONSTRAINT "Store_userId_key" UNIQUE ("userId");

-- CreateTable User
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateTable Product
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '🛍️',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable BotConfig
CREATE TABLE "BotConfig" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "welcomeMessage" TEXT NOT NULL DEFAULT 'Olá! Seja bem-vindo.',
    "requireKeyword" BOOLEAN NOT NULL DEFAULT false,
    "keyword" TEXT NOT NULL DEFAULT '@hello',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BotConfig_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BotConfig_storeId_key" ON "BotConfig"("storeId");

-- CreateTable Message
CREATE TABLE "Message" (
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
ALTER TABLE "Store" ADD CONSTRAINT "Store_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey Product -> Store
ALTER TABLE "Product" ADD CONSTRAINT "Product_storeId_fkey"
    FOREIGN KEY ("storeId") REFERENCES "Store"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey BotConfig -> Store
ALTER TABLE "BotConfig" ADD CONSTRAINT "BotConfig_storeId_fkey"
    FOREIGN KEY ("storeId") REFERENCES "Store"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey Message -> Store
ALTER TABLE "Message" ADD CONSTRAINT "Message_storeId_fkey"
    FOREIGN KEY ("storeId") REFERENCES "Store"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
