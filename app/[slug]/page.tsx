import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import StoreClient from "./StoreClient";

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
      }))}
    />
  );
}
