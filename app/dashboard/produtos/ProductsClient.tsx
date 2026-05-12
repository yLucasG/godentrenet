"use client";

import { useState } from "react";
import { createProduct, updateProduct, deleteProduct } from "@/actions/product";
import type { Product } from "@prisma/client";
import { ProductModal } from "./ProductModal";
import { ImportModal } from "./ImportModal";

type ProductWithImage = Product & { imageUrl?: string | null };

export function ProductsClient({ initialProducts }: { initialProducts: ProductWithImage[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [modal, setModal] = useState<{ open: boolean; editing?: ProductWithImage }>({ open: false });
  const [showImport, setShowImport] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleCreate(data: { name: string; price: number; emoji: string; imageUrl: string | null }) {
    await createProduct({ ...data, imageUrl: data.imageUrl ?? undefined });
    window.location.reload();
  }

  async function handleUpdate(data: { name: string; price: number; emoji: string; imageUrl: string | null }) {
    if (!modal.editing) return;
    await updateProduct(modal.editing.id, { ...data, active: modal.editing.active, imageUrl: data.imageUrl });
    window.location.reload();
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este produto?")) return;
    setDeleting(id);
    await deleteProduct(id);
    setProducts((p) => p.filter((x) => x.id !== id));
    setDeleting(null);
  }

  async function handleToggle(product: ProductWithImage) {
    await updateProduct(product.id, {
      name: product.name,
      price: product.price,
      emoji: product.emoji,
      active: !product.active,
      imageUrl: product.imageUrl,
    });
    setProducts((p) => p.map((x) => x.id === product.id ? { ...x, active: !x.active } : x));
  }

  return (
    <>
      {modal.open && (
        <ProductModal
          onClose={() => setModal({ open: false })}
          onSave={modal.editing ? handleUpdate : handleCreate}
          initial={modal.editing}
        />
      )}

      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onDone={() => { setShowImport(false); window.location.reload(); }}
        />
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setModal({ open: true })}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
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

      {products.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center">
          <p className="text-4xl mb-3">📦</p>
          <p className="text-gray-300 font-medium">Nenhum produto ainda</p>
          <p className="text-gray-500 text-sm mt-1">
            Adicione manualmente ou importe uma lista de uma vez.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <button onClick={() => setModal({ open: true })} className="text-emerald-400 hover:text-emerald-300 text-sm transition-colors">+ Adicionar produto</button>
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
                      {/* Thumbnail */}
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
                  <td className="px-4 py-3 text-gray-300 text-sm">
                    R$ {p.price.toFixed(2).replace(".", ",")}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggle(p)}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                        p.active
                          ? "bg-emerald-900/50 text-emerald-400 hover:bg-emerald-900"
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
