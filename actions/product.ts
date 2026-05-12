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
  return prisma.product.findMany({
    where: { storeId },
    orderBy: { createdAt: "asc" },
    include: { category: { select: { id: true, name: true, emoji: true } } },
  });
}

export async function createProduct(data: {
  name: string;
  price: number;
  emoji: string;
  imageUrl?: string | null;
  categoryId?: string | null;
}) {
  const storeId = await getStoreId();
  const { categoryId, ...rest } = data;
  await prisma.product.create({
    data: { ...rest, storeId, ...(categoryId ? { categoryId } : {}) },
  });
  revalidatePath("/dashboard/produtos");
}

export async function updateProduct(
  id: string,
  data: {
    name: string;
    price: number;
    emoji: string;
    active: boolean;
    imageUrl?: string | null;
    categoryId?: string | null;
  }
) {
  const storeId = await getStoreId();
  const { categoryId, ...rest } = data;
  await prisma.product.updateMany({
    where: { id, storeId },
    data: { ...rest, categoryId: categoryId ?? null },
  });
  revalidatePath("/dashboard/produtos");
}

export async function deleteProduct(id: string) {
  const storeId = await getStoreId();
  await prisma.product.deleteMany({ where: { id, storeId } });
  revalidatePath("/dashboard/produtos");
}
