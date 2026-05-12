import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StoreClient } from "./StoreClient";

export default async function StorefrontPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const store = await prisma.store.findFirst({
    where: { evolutionInstanceName: slug },
    include: {
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

  if (!store) notFound();

  return (
    <StoreClient
      storeId={store.id}
      instanceName={store.evolutionInstanceName ?? ""}
      storeName={store.name}
      products={store.products.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        emoji: p.emoji,
        imageUrl: p.imageUrl,
        categoryId: p.categoryId,
        categoryName: p.category?.name ?? null,
      }))}
      categories={store.categories}
    />
  );
}
