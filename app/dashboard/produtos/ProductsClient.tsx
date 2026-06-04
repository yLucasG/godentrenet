"use client";

import { useState } from "react";
import { createProduct, updateProduct, deleteProduct, clearStoreProducts } from "@/actions/product";
import { Trash2 } from "lucide-react";
import type { Product } from "@prisma/client";
import { ProductModal, type SaveData } from "./ProductModal";
import { ImportModal } from "./ImportModal";

type CategoryOption = { id: string; name: string; emoji: string };
type ProductWithExtras = Product & {
  imageUrl?: string | null;
  categoryId?: string | null;
  category?: { id: string; name: string; emoji: string } | null;
};

export function ProductsClient({
  initialProducts,
  categories,
  storeType = "GENERAL",
}: {
  initialProducts: ProductWithExtras[];
  categories: CategoryOption[];
  storeType?: string;
}) {
  const [products, setProducts] = useState(initialProducts);
  const [modal, setModal] = useState<{ open: boolean; editing?: ProductWithExtras }>({ open: false });
  const [showImport, setShowImport] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleCreate(data: SaveData) {
    await createProduct({ ...data, imageUrl: data.imageUrl ?? undefined });
    window.location.reload();
  }

  async function handleUpdate(data: SaveData) {
    if (!modal.editing) return;
    await updateProduct(modal.editing.id, {
      ...data,
      active: modal.editing.active,
      imageUrl: data.imageUrl,
    });
    window.location.reload();
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este produto?")) return;
    setDeleting(id);
    await deleteProduct(id);
    setProducts((p) => p.filter((x) => x.id !== id));
    setDeleting(null);
  }

  async function handleToggle(product: ProductWithExtras) {
    await updateProduct(product.id, {
      name: product.name,
      price: product.price,
      emoji: product.emoji,
      active: !product.active,
      imageUrl: product.imageUrl,
      categoryId: product.categoryId ?? null,
    });
    setProducts((p) => p.map((x) => (x.id === product.id ? { ...x, active: !x.active } : x)));
  }

  const [clearing, setClearing] = useState(false);

  async function handleClearProducts() {
    if (!confirm("Tem certeza que deseja apagar TODOS os produtos do sistema? Esta ação não pode ser desfeita.")) return;
    setClearing(true);
    try {
      await clearStoreProducts();
      setProducts([]);
    } catch (err) {
      console.error(err);
      alert("Erro ao limpar produtos.");
    } finally {
      setClearing(false);
    }
  }

  return (
    <>
      {modal.open && (
        <ProductModal
          onClose={() => setModal({ open: false })}
          onSave={modal.editing ? handleUpdate : handleCreate}
          initial={modal.editing}
          categories={categories}
          storeType={storeType}
        />
      )}

      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onDone={() => { setShowImport(false); window.location.reload(); }}
          storeType={storeType}
        />
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setModal({ open: true })}
            className="text-gray-950 font-bold px-4 py-2 rounded-full text-sm transition-all"
            style={{ background: "#F59E0B" }}
          >
            + Novo produto
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
          >
            📥 Importar produtos
          </button>
        </div>
        {products.length > 0 && (
          <button
            onClick={handleClearProducts}
            disabled={clearing}
            className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 border border-red-900/30 hover:border-red-500/50 bg-red-950/10 px-4 py-2 rounded-lg transition-all duration-200 disabled:opacity-50"
          >
            <Trash2 size={15} />
            Limpar Produtos
          </button>
        )}
      </div>

      {products.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center">
          <p className="text-4xl mb-3">📦</p>
          <p className="text-gray-300 font-medium">Nenhum produto ainda</p>
          <p className="text-gray-500 text-sm mt-1">
            Adicione manualmente ou importe uma lista de uma vez.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <button onClick={() => setModal({ open: true })} className="text-amber-400 hover:text-amber-300 text-sm transition-colors">+ Adicionar produto</button>
            <span className="text-gray-700">·</span>
            <button onClick={() => setShowImport(true)} className="text-gray-400 hover:text-gray-300 text-sm transition-colors">📥 Importar lista</button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-gray-400 text-xs px-4 py-3 font-medium uppercase tracking-wider">Produto</th>
                <th className="text-left text-gray-400 text-xs px-4 py-3 font-medium uppercase tracking-wider">Categoria</th>
                <th className="text-left text-gray-400 text-xs px-4 py-3 font-medium uppercase tracking-wider">Preço</th>
                <th className="text-left text-gray-400 text-xs px-4 py-3 font-medium uppercase tracking-wider">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-xl flex-shrink-0">
                          {p.emoji}
                        </div>
                      )}
                      <span className="text-white text-sm">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {p.category ? (
                      <span className="text-gray-300 text-sm flex items-center gap-1">
                        <span>{p.category.emoji}</span>
                        <span>{p.category.name}</span>
                      </span>
                    ) : (
                      <span className="text-gray-600 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-sm">
                    R$ {p.price.toFixed(2).replace(".", ",")}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggle(p)}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                        p.active
                          ? "bg-amber-900/30 text-amber-400 hover:bg-amber-900/50"
                          : "bg-gray-800 text-gray-500 hover:bg-gray-700"
                      }`}
                    >
                      {p.active ? "Ativo" : "Inativo"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 justify-end">
                      <button
                        onClick={() => setModal({ open: true, editing: p })}
                        className="text-gray-400 hover:text-white text-sm transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={deleting === p.id}
                        className="text-red-500 hover:text-red-400 text-sm transition-colors disabled:opacity-50"
                      >
                        {deleting === p.id ? "..." : "Excluir"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
