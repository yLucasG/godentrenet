"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function getStoreId() {
  const session = await auth();
  if (!session?.user.storeId) throw new Error("Não autenticado.");
  return session.user.storeId;
}

export async function listProducts() {
  const storeId = await getStoreId();
  return prisma.product.findMany({ where: { storeId }, orderBy: { createdAt: "asc" } });
}

export async function createProduct(data: { name: string; price: number; emoji: string }) {
  const storeId = await getStoreId();
  await prisma.product.create({ data: { ...data, storeId } });
  revalidatePath("/dashboard/produtos");
}

export async function updateProduct(id: string, data: { name: string; price: number; emoji: string; active: boolean }) {
  const storeId = await getStoreId();
  await prisma.product.updateMany({ where: { id, storeId }, data });
  revalidatePath("/dashboard/produtos");
}

export async function deleteProduct(id: string) {
  const storeId = await getStoreId();
  await prisma.product.deleteMany({ where: { id, storeId } });
  revalidatePath("/dashboard/produtos");
}
