"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function getStoreId() {
  const session = await auth();
  if (!session?.user?.storeId) throw new Error("Não autenticado.");
  return session.user.storeId;
}

export type StockExpiryInput = {
  inventoryItemId: string;
  batchName?: string;
  quantity: number;
  expirationDate: string; // ISO date string "YYYY-MM-DD"
  notes?: string;
};

export async function createStockExpiry(data: StockExpiryInput) {
  const storeId = await getStoreId();
  await prisma.stockExpiry.create({
    data: {
      storeId,
      inventoryItemId: data.inventoryItemId,
      batchName: data.batchName || null,
      quantity: data.quantity,
      expirationDate: new Date(data.expirationDate),
      notes: data.notes || null,
    },
  });
  revalidatePath("/dashboard/estoque");
}

export async function updateStockExpiry(id: string, data: StockExpiryInput) {
  const storeId = await getStoreId();
  await prisma.stockExpiry.updateMany({
    where: { id, storeId },
    data: {
      inventoryItemId: data.inventoryItemId,
      batchName: data.batchName || null,
      quantity: data.quantity,
      expirationDate: new Date(data.expirationDate),
      notes: data.notes || null,
    },
  });
  revalidatePath("/dashboard/estoque");
}

export async function deleteStockExpiry(id: string) {
  const storeId = await getStoreId();
  await prisma.stockExpiry.deleteMany({ where: { id, storeId } });
  revalidatePath("/dashboard/estoque");
}
