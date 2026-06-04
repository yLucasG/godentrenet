import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { listProducts } from "@/actions/product";
import { listCategories } from "@/actions/category";
import { ProductsClient } from "./ProductsClient";

export default async function ProdutosPage() {
  const session = await auth();
  const storeId = session?.user?.storeId;

  const [products, categories, store] = await Promise.all([
    listProducts(),
    listCategories(),
    storeId
      ? prisma.store.findUnique({ where: { id: storeId }, select: { type: true } })
      : Promise.resolve(null),
  ]);

  const storeType = store?.type ?? "GENERAL";

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-6">Produtos</h1>
      <ProductsClient initialProducts={products} categories={categories} storeType={storeType} />
    </div>
  );
}
