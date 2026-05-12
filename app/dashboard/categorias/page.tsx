import { listCategories } from "@/actions/category";
import { CategoriesClient } from "./CategoriesClient";

export default async function CategoriasPage() {
  const categories = await listCategories();
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-2">Categorias</h1>
      <p className="text-gray-400 text-sm mb-6">
        Organize seus produtos em categorias. Elas aparecem como chips na loja pública.
      </p>
      <CategoriesClient initialCategories={categories} />
    </div>
  );
}
