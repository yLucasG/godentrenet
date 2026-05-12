"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function getStoreId() {
  const session = await auth();
  if (!session?.user.storeId) throw new Error("Não autenticado.");
  return session.user.storeId;
}

export async function listCategories() {
  const storeId = await getStoreId();
  return prisma.category.findMany({
    where: { storeId },
    orderBy: { order: "asc" },
    include: { _count: { select: { products: true } } },
  });
}

export async function createCategory(data: { name: string; emoji: string }) {
  const storeId = await getStoreId();
  const count = await prisma.category.count({ where: { storeId } });
  await prisma.category.create({ data: { ...data, storeId, order: count } });
  revalidatePath("/dashboard/categorias");
  revalidatePath("/dashboard/produtos");
}

export async function updateCategory(id: string, data: { name: string; emoji: string }) {
  const storeId = await getStoreId();
  await prisma.category.updateMany({ where: { id, storeId }, data });
  revalidatePath("/dashboard/categorias");
  revalidatePath("/dashboard/produtos");
}

export async function deleteCategory(id: string) {
  const storeId = await getStoreId();
  await prisma.product.updateMany({ where: { categoryId: id, storeId }, data: { categoryId: null } });
  await prisma.category.deleteMany({ where: { id, storeId } });
  revalidatePath("/dashboard/categorias");
  revalidatePath("/dashboard/produtos");
}
