"use client";

import { useState } from "react";
import { createProduct, updateProduct, deleteProduct } from "@/actions/product";
import type { Product } from "@prisma/client";

const EMOJIS = ["🍞", "🥐", "🎂", "🧁", "🍕", "🍔", "🌮", "☕", "🧃", "🛍️", "🥩", "🥗"];

function ProductModal({
  onClose,
  onSave,
  initial,
}: {
  onClose: () => void;
  onSave: (data: { name: string; price: number; emoji: string }) => Promise<void>;
  initial?: Product;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [price, setPrice] = useState(initial?.price?.toString() ?? "");
  const [emoji, setEmoji] = useState(initial?.emoji ?? "🛍️");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name || !price) return;
    setSaving(true);
    await onSave({ name, price: parseFloat(price), emoji });
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-sm space-y-4">
        <h3 className="text-white font-semibold">{initial ? "Editar produto" : "Novo produto"}</h3>

        <div>
          <label className="text-gray-400 text-sm block mb-1">Emoji</label>
          <div className="flex flex-wrap gap-2">
            {EMOJIS.map(e => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={`text-xl w-9 h-9 rounded-lg transition-colors ${emoji === e ? "bg-green-700" : "bg-gray-800 hover:bg-gray-700"}`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-gray-400 text-sm block mb-1">Nome</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ex: Pão Francês"
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
          />
        </div>

        <div>
          <label className="text-gray-400 text-sm block mb-1">Preço (R$)</label>
          <input
            type="number"
            value={price}
            onChange={e => setPrice(e.target.value)}
            placeholder="0,00"
            step="0.01"
            min="0"
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg py-2 text-sm transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name || !price}
            className="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProductsClient({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [modal, setModal] = useState<{ open: boolean; editing?: Product }>({ open: false });
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleCreate(data: { name: string; price: number; emoji: string }) {
    await createProduct(data);
    window.location.reload();
  }

  async function handleUpdate(data: { name: string; price: number; emoji: string }) {
    if (!modal.editing) return;
    await updateProduct(modal.editing.id, { ...data, active: modal.editing.active });
    window.location.reload();
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    await deleteProduct(id);
    setProducts(p => p.filter(x => x.id !== id));
    setDeleting(null);
  }

  async function handleToggle(product: Product) {
    await updateProduct(product.id, {
      name: product.name,
      price: product.price,
      emoji: product.emoji,
      active: !product.active,
    });
    setProducts(p => p.map(x => x.id === product.id ? { ...x, active: !x.active } : x));
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

      <button
        onClick={() => setModal({ open: true })}
        className="mb-6 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        + Adicionar produto
      </button>

      {products.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <p className="text-gray-400">Nenhum produto cadastrado ainda.</p>
          <p className="text-gray-500 text-sm mt-1">Adicione produtos para exibi-los na sua loja.</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-gray-400 text-sm px-4 py-3 font-medium">Produto</th>
                <th className="text-left text-gray-400 text-sm px-4 py-3 font-medium">Preço</th>
                <th className="text-left text-gray-400 text-sm px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {products.map(p => (
                <tr key={p.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="mr-2 text-lg">{p.emoji}</span>
                    <span className="text-white text-sm">{p.name}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-sm">
                    R$ {p.price.toFixed(2).replace(".", ",")}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggle(p)}
                      className={`text-xs px-2 py-1 rounded-full font-medium transition-colors ${
                        p.active
                          ? "bg-green-900/50 text-green-400 hover:bg-green-900"
                          : "bg-gray-800 text-gray-500 hover:bg-gray-700"
                      }`}
                    >
                      {p.active ? "Ativo" : "Inativo"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
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
