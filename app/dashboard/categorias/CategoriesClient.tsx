"use client";

import { useState } from "react";
import { createCategory, updateCategory, deleteCategory, clearStoreCategories } from "@/actions/category";
import { X, Trash2 } from "lucide-react";
import { getStoreEmojis } from "@/lib/store-utils";

type Category = {
  id: string;
  name: string;
  emoji: string;
  order: number;
  _count: { products: number };
};

function CategoryModal({
  initial,
  onClose,
  onSave,
  storeType = "GENERAL",
}: {
  initial?: Category;
  onClose: () => void;
  onSave: (data: { name: string; emoji: string }) => Promise<void>;
  storeType?: string;
}) {
  const EMOJIS = getStoreEmojis(storeType);
  const [name, setName] = useState(initial?.name ?? "");
  const [emoji, setEmoji] = useState(initial?.emoji ?? EMOJIS[0] ?? "🛍️");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({ name: name.trim(), emoji });
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h3 className="text-white font-semibold text-sm">
            {initial ? "Editar categoria" : "Nova categoria"}
          </h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-gray-400 text-xs font-medium block mb-1.5">Nome da categoria *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Padaria, Bebidas..."
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-colors"
              autoFocus
            />
          </div>

          <div>
            <label className="text-gray-400 text-xs font-medium block mb-2">Emoji da categoria</label>
            <div className="flex flex-wrap gap-1.5">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`text-xl w-9 h-9 rounded-xl transition-colors ${
                    emoji === e ? "bg-amber-700 ring-1 ring-amber-500" : "bg-gray-800 hover:bg-gray-700"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl py-2.5 text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="flex-1 disabled:opacity-40 text-gray-950 font-bold rounded-xl py-2.5 text-sm transition-all" style={{ background: "#F59E0B" }}
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CategoriesClient({ initialCategories, storeType = "GENERAL" }: { initialCategories: Category[]; storeType?: string }) {
  const [categories, setCategories] = useState(initialCategories);
  const [modal, setModal] = useState<{ open: boolean; editing?: Category }>({ open: false });
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleCreate(data: { name: string; emoji: string }) {
    await createCategory(data);
    window.location.reload();
  }

  async function handleUpdate(data: { name: string; emoji: string }) {
    if (!modal.editing) return;
    await updateCategory(modal.editing.id, data);
    setCategories((cs) =>
      cs.map((c) => (c.id === modal.editing!.id ? { ...c, ...data } : c))
    );
  }

  async function handleDelete(id: string) {
    const cat = categories.find((c) => c.id === id);
    const count = cat?._count.products ?? 0;
    const msg =
      count > 0
        ? `Excluir "${cat?.name}"? Os ${count} produto(s) desta categoria ficarão sem categoria.`
        : `Excluir "${cat?.name}"?`;
    if (!confirm(msg)) return;
    setDeleting(id);
    await deleteCategory(id);
    setCategories((cs) => cs.filter((c) => c.id !== id));
    setDeleting(null);
  }

  const [clearing, setClearing] = useState(false);

  async function handleClearCategories() {
    if (!confirm("Tem certeza que deseja apagar TODAS as categorias do sistema? Os produtos ficarão sem categoria. Esta ação não pode ser desfeita.")) return;
    setClearing(true);
    try {
      await clearStoreCategories();
      setCategories([]);
    } catch (err) {
      console.error(err);
      alert("Erro ao limpar categorias.");
    } finally {
      setClearing(false);
    }
  }

  return (
    <>
      {modal.open && (
        <CategoryModal
          initial={modal.editing}
          onClose={() => setModal({ open: false })}
          onSave={modal.editing ? handleUpdate : handleCreate}
          storeType={storeType}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setModal({ open: true })}
          className="text-gray-950 font-bold px-4 py-2 rounded-full text-sm transition-all" style={{ background: "#F59E0B" }}
        >
          + Nova categoria
        </button>
        {categories.length > 0 && (
          <button
            onClick={handleClearCategories}
            disabled={clearing}
            className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 border border-red-900/30 hover:border-red-500/50 bg-red-950/10 px-4 py-2 rounded-lg transition-all duration-200 disabled:opacity-50"
          >
            <Trash2 size={15} />
            Limpar Categorias
          </button>
        )}
      </div>

      {categories.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center">
          <p className="text-4xl mb-3">🏷️</p>
          <p className="text-gray-300 font-medium">Nenhuma categoria ainda</p>
          <p className="text-gray-500 text-sm mt-1">
            Crie categorias para organizar seus produtos na loja.
          </p>
          <button
            onClick={() => setModal({ open: true })}
            className="text-amber-400 hover:text-amber-300 text-sm mt-4 transition-colors"
          >
            + Criar primeira categoria
          </button>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-gray-400 text-xs px-4 py-3 font-medium uppercase tracking-wider">Categoria</th>
                <th className="text-left text-gray-400 text-xs px-4 py-3 font-medium uppercase tracking-wider">Produtos</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-xl flex-shrink-0">
                        {cat.emoji}
                      </div>
                      <span className="text-white text-sm">{cat.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-sm">
                    {cat._count.products} produto{cat._count.products !== 1 ? "s" : ""}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 justify-end">
                      <button
                        onClick={() => setModal({ open: true, editing: cat })}
                        className="text-gray-400 hover:text-white text-sm transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        disabled={deleting === cat.id}
                        className="text-red-500 hover:text-red-400 text-sm transition-colors disabled:opacity-50"
                      >
                        {deleting === cat.id ? "..." : "Excluir"}
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
