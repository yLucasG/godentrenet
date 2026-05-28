"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function getStoreId() {
  const session = await auth();
  if (!session?.user?.storeId) throw new Error("Não autenticado.");
  return session.user.storeId;
}

// ─── Types ────────────────────────────────────────────────────────────────────
export type InventoryItemInput = {
  name: string;
  sku?: string;
  unit: string;
  currentStock: number;
  minStock: number;
  costPrice: number;
};

export type IngredientInput = {
  inventoryItemId: string;
  quantity: number;
};

// ─── Insumos (InventoryItem) ──────────────────────────────────────────────────
export async function getInventoryItems() {
  const storeId = await getStoreId();
  return prisma.inventoryItem.findMany({
    where: { storeId },
    orderBy: { name: "asc" },
  });
}

export async function createInventoryItem(data: InventoryItemInput) {
  const storeId = await getStoreId();
  await prisma.inventoryItem.create({
    data: { ...data, storeId },
  });
  revalidatePath("/dashboard/estoque");
}

export async function updateInventoryItem(id: string, data: InventoryItemInput) {
  const storeId = await getStoreId();
  await prisma.inventoryItem.updateMany({
    where: { id, storeId },
    data,
  });
  revalidatePath("/dashboard/estoque");
}

export async function deleteInventoryItem(id: string) {
  const storeId = await getStoreId();
  await prisma.inventoryItem.deleteMany({ where: { id, storeId } });
  revalidatePath("/dashboard/estoque");
}

// ─── Fichas Técnicas (ProductIngredient) ─────────────────────────────────────
export async function getProductIngredients(productId: string) {
  const storeId = await getStoreId();
  const product = await prisma.product.findFirst({ where: { id: productId, storeId } });
  if (!product) throw new Error("Produto não encontrado.");
  return prisma.productIngredient.findMany({
    where: { productId },
    include: { inventoryItem: true },
    orderBy: { inventoryItem: { name: "asc" } },
  });
}

export async function saveProductIngredients(productId: string, ingredients: IngredientInput[]) {
  const storeId = await getStoreId();
  const product = await prisma.product.findFirst({ where: { id: productId, storeId } });
  if (!product) throw new Error("Produto não encontrado.");

  await prisma.$transaction([
    prisma.productIngredient.deleteMany({ where: { productId } }),
    ...(ingredients.length > 0
      ? [
          prisma.productIngredient.createMany({
            data: ingredients.map((i) => ({
              productId,
              inventoryItemId: i.inventoryItemId,
              quantity: i.quantity,
            })),
          }),
        ]
      : []),
  ]);

  revalidatePath("/dashboard/estoque");
}

// ─── Produtos para o seletor de fichas ───────────────────────────────────────
export async function getProductsForRecipe() {
  const storeId = await getStoreId();
  return prisma.product.findMany({
    where: { storeId, active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, emoji: true, price: true },
  });
}
