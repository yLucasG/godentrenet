import { listProducts } from "@/actions/product";
import { listCategories } from "@/actions/category";
import { ProductsClient } from "./ProductsClient";

export default async function ProdutosPage() {
  const [products, categories] = await Promise.all([listProducts(), listCategories()]);
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-6">Produtos</h1>
      <ProductsClient initialProducts={products} categories={categories} />
    </div>
  );
}
