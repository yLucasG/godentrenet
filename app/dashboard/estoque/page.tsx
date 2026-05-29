import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EstoqueClient } from "./EstoqueClient";

export default async function EstoquePage() {
  const session = await auth();
  if (!session?.user?.storeId) redirect("/login");

  const storeId = session.user.storeId;

  const [inventoryItems, products, stockExpiries] = await Promise.all([
    prisma.inventoryItem.findMany({
      where: { storeId },
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      where: { storeId, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, emoji: true, price: true },
    }),
    prisma.stockExpiry.findMany({
      where: { storeId },
      include: { inventoryItem: { select: { name: true, unit: true } } },
      orderBy: { expirationDate: "asc" },
    }),
  ]);

  const expiries = stockExpiries.map((e) => ({
    id: e.id,
    inventoryItemId: e.inventoryItemId,
    inventoryItemName: e.inventoryItem.name,
    inventoryItemUnit: e.inventoryItem.unit,
    batchName: e.batchName,
    quantity: e.quantity,
    expirationDate: e.expirationDate.toISOString(),
    notes: e.notes,
  }));

  return (
    <EstoqueClient
      initialItems={inventoryItems}
      products={products}
      initialExpiries={expiries}
    />
  );
}
