"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function getStoreOrders() {
  const session = await auth();
  if (!session?.user?.storeId) return [];

  const orders = await prisma.order.findMany({
    where: { storeId: session.user.storeId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return orders.map((o) => ({
    id: o.id,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    address: o.address,
    items: o.items as { name: string; emoji: string; price: number; qty: number }[],
    total: o.total,
    paymentMethod: o.paymentMethod as "pix" | "dinheiro",
    needChange: o.needChange,
    changeFor: o.changeFor,
    status: o.status,
    createdAt: o.createdAt.toISOString(),
  }));
}

export async function updateOrderStatus(orderId: string, status: string) {
  const session = await auth();
  if (!session?.user?.storeId) throw new Error("Unauthorized");

  await prisma.order.updateMany({
    where: { id: orderId, storeId: session.user.storeId },
    data: { status },
  });
}
