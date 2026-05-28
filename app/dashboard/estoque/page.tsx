import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EstoqueClient } from "./EstoqueClient";

export default async function EstoquePage() {
  const session = await auth();
  if (!session?.user?.storeId) redirect("/login");

  const storeId = session.user.storeId;

  const [inventoryItems, products] = await Promise.all([
    prisma.inventoryItem.findMany({
      where: { storeId },
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      where: { storeId, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, emoji: true, price: true },
    }),
  ]);

  return <EstoqueClient initialItems={inventoryItems} products={products} />;
}
