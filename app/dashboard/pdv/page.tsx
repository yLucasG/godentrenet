import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PdvClient } from "./PdvClient";

export default async function PdvPage() {
  const session = await auth();
  if (!session?.user.storeId) redirect("/login");

  const storeId = session.user.storeId;

  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: {
      name: true,
      acceptsPickup: true,
      acceptsLocal: true,
      products: {
        where: { active: true },
        orderBy: { createdAt: "asc" },
        include: { category: { select: { id: true, name: true, emoji: true } } },
      },
      categories: {
        orderBy: { order: "asc" },
        select: { id: true, name: true, emoji: true },
      },
    },
  });

  if (!store) redirect("/login");

  return (
    <PdvClient
      storeName={store.name}
      acceptsPickup={store.acceptsPickup}
      acceptsLocal={store.acceptsLocal}
      products={store.products.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        emoji: p.emoji,
        imageUrl: p.imageUrl ?? null,
        categoryId: p.categoryId ?? null,
      }))}
      categories={store.categories}
    />
  );
}
