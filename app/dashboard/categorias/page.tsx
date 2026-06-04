import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { listCategories } from "@/actions/category";
import { CategoriesClient } from "./CategoriesClient";

export default async function CategoriasPage() {
  const session = await auth();
  const storeId = session?.user?.storeId;

  const [categories, store] = await Promise.all([
    listCategories(),
    storeId
      ? prisma.store.findUnique({ where: { id: storeId }, select: { type: true } })
      : Promise.resolve(null),
  ]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-2">Categorias</h1>
      <p className="text-gray-400 text-sm mb-6">
        Organize seus produtos em categorias. Elas aparecem como chips na loja pública.
      </p>
      <CategoriesClient initialCategories={categories} storeType={store?.type ?? "GENERAL"} />
    </div>
  );
}
