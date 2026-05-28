"use client";

import { useState, useTransition, useEffect } from "react";
import { Plus, Pencil, Trash2, Save, X, AlertTriangle, PackageSearch } from "lucide-react";
import {
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getProductIngredients,
  saveProductIngredients,
  type InventoryItemInput,
  type IngredientInput,
} from "@/actions/inventory";

// ─── Types ────────────────────────────────────────────────────────────────────
type InventoryItem = {
  id: string;
  name: string;
  sku: string | null;
  unit: string;
  currentStock: number;
  minStock: number;
  costPrice: number;
};

type Product = {
  id: string;
  name: string;
  emoji: string;
  price: number;
};

type Ingredient = {
  inventoryItemId: string;
  name: string;
  unit: string;
  quantity: number;
  costPrice: number;
};

const UNITS = ["UN", "KG", "G", "L", "ML", "CX", "PC", "DZ"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtQty(n: number, unit: string) {
  return `${n % 1 === 0 ? n : n.toFixed(3).replace(/\.?0+$/, "")} ${unit}`;
}

// ─── Insumo Modal ─────────────────────────────────────────────────────────────
function InsumoModal({
  item,
  onClose,
  onSaved,
}: {
  item: InventoryItem | null;
  onClose: () => void;
  onSaved: (updated: InventoryItem[]) => void;
}) {
  const isEdit = !!item;
  const [form, setForm] = useState<InventoryItemInput>({
    name: item?.name ?? "",
    sku: item?.sku ?? "",
    unit: item?.unit ?? "UN",
    currentStock: item?.currentStock ?? 0,
    minStock: item?.minStock ?? 0,
    costPrice: item?.costPrice ?? 0,
  });
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function set(k: keyof InventoryItemInput, v: string | number) {
    setForm(f => ({ ...f, [k]: v }));
  }

  function handleSubmit() {
    if (!form.name.trim()) { setError("Nome é obrigatório."); return; }
    setError("");
    startTransition(async () => {
      try {
        if (isEdit) {
          await updateInventoryItem(item.id, form);
        } else {
          await createInventoryItem(form);
        }
        onClose();
      } catch {
        setError("Erro ao salvar. Tente novamente.");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md bg-gray-900 rounded-2xl border border-gray-800 flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="text-white font-bold">{isEdit ? "Editar Insumo" : "Novo Insumo"}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-gray-400 text-xs font-medium block mb-1.5">Nome *</label>
              <input
                value={form.name}
                onChange={e => set("name", e.target.value)}
                placeholder="Ex: Carne moída, Pão brioche..."
                className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-gray-600"
              />
            </div>

            <div>
              <label className="text-gray-400 text-xs font-medium block mb-1.5">SKU / Código</label>
              <input
                value={form.sku ?? ""}
                onChange={e => set("sku", e.target.value)}
                placeholder="Opcional"
                className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-gray-600"
              />
            </div>

            <div>
              <label className="text-gray-400 text-xs font-medium block mb-1.5">Unidade</label>
              <select
                value={form.unit}
                onChange={e => set("unit", e.target.value)}
                className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            <div>
              <label className="text-gray-400 text-xs font-medium block mb-1.5">Estoque Atual</label>
              <input
                type="number" min={0} step="0.001"
                value={form.currentStock}
                onChange={e => set("currentStock", parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-gray-400 text-xs font-medium block mb-1.5">Estoque Mínimo</label>
              <input
                type="number" min={0} step="0.001"
                value={form.minStock}
                onChange={e => set("minStock", parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="col-span-2">
              <label className="text-gray-400 text-xs font-medium block mb-1.5">Custo Unitário (R$)</label>
              <input
                type="number" min={0} step="0.01"
                value={form.costPrice}
                onChange={e => set("costPrice", parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}
        </div>

        <div className="px-5 pb-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white text-sm transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-colors disabled:opacity-50"
          >
            {isPending ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Aba Insumos ──────────────────────────────────────────────────────────────
function AbaInsumos({
  items,
  setItems,
}: {
  items: InventoryItem[];
  setItems: (items: InventoryItem[]) => void;
}) {
  const [modal, setModal] = useState<"new" | InventoryItem | null>(null);
  const [, startTransition] = useTransition();

  function handleDelete(id: string) {
    if (!confirm("Excluir este insumo? Fichas técnicas que o usam serão afetadas.")) return;
    startTransition(async () => {
      await deleteInventoryItem(id);
      setItems(items.filter(i => i.id !== id));
    });
  }

  const lowStock = items.filter(i => i.currentStock <= i.minStock);

  return (
    <div>
      {/* Alert banner */}
      {lowStock.length > 0 && (
        <div className="mb-4 flex items-center gap-2.5 bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3">
          <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
          <p className="text-red-400 text-sm">
            <span className="font-semibold">{lowStock.length} {lowStock.length === 1 ? "insumo" : "insumos"}</span>
            {" "}abaixo do estoque mínimo:{" "}
            {lowStock.map(i => i.name).join(", ")}
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-500 text-sm">{items.length} {items.length === 1 ? "insumo" : "insumos"} cadastrados</p>
        <button
          onClick={() => setModal("new")}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-3 py-2 rounded-lg transition-colors"
        >
          <Plus size={15} />
          Novo Insumo
        </button>
      </div>

      {/* Table */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-700">
          <PackageSearch size={40} strokeWidth={1.2} />
          <p className="text-sm">Nenhum insumo cadastrado ainda.</p>
          <button
            onClick={() => setModal("new")}
            className="text-emerald-500 text-sm hover:text-emerald-400 underline underline-offset-2"
          >
            Criar primeiro insumo
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/60">
                <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Nome</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">SKU</th>
                <th className="text-center px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Unid.</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Estoque Atual</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Mínimo</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Custo Unit.</th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const isLow = item.currentStock <= item.minStock;
                return (
                  <tr
                    key={item.id}
                    className={`border-b border-gray-800 last:border-0 transition-colors ${
                      isLow
                        ? "bg-red-500/5 hover:bg-red-500/10"
                        : idx % 2 === 0 ? "bg-gray-900/20 hover:bg-gray-800/30" : "hover:bg-gray-800/30"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isLow && <AlertTriangle size={13} className="text-red-400 flex-shrink-0" />}
                        <span className={`font-medium ${isLow ? "text-red-300" : "text-white"}`}>
                          {item.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{item.sku || "—"}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="bg-gray-800 text-gray-400 text-xs px-2 py-0.5 rounded font-mono">{item.unit}</span>
                    </td>
                    <td className={`px-4 py-3 text-right tabular-nums font-semibold ${isLow ? "text-red-400" : "text-white"}`}>
                      {fmtQty(item.currentStock, item.unit)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-500">
                      {fmtQty(item.minStock, item.unit)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-400">{fmt(item.costPrice)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setModal(item)}
                          className="p-1.5 rounded-lg text-gray-600 hover:text-white hover:bg-gray-700 transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal !== null && (
        <InsumoModal
          item={modal === "new" ? null : modal}
          onClose={() => setModal(null)}
          onSaved={setItems}
        />
      )}
    </div>
  );
}

// ─── Aba Fichas Técnicas ──────────────────────────────────────────────────────
function AbaFichas({
  products,
  inventoryItems,
}: {
  products: Product[];
  inventoryItems: InventoryItem[];
}) {
  const [selectedProductId, setSelectedProductId] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const selectedProduct = products.find(p => p.id === selectedProductId) ?? null;

  async function loadIngredients(productId: string) {
    setLoading(true);
    setSaved(false);
    try {
      const rows = await getProductIngredients(productId);
      setIngredients(
        rows.map(r => ({
          inventoryItemId: r.inventoryItemId,
          name: r.inventoryItem.name,
          unit: r.inventoryItem.unit,
          quantity: r.quantity,
          costPrice: r.inventoryItem.costPrice,
        }))
      );
    } finally {
      setLoading(false);
    }
  }

  function handleProductChange(id: string) {
    setSelectedProductId(id);
    setIngredients([]);
    if (id) loadIngredients(id);
  }

  function addIngredient() {
    if (inventoryItems.length === 0) return;
    const first = inventoryItems[0];
    setIngredients(prev => [
      ...prev,
      { inventoryItemId: first.id, name: first.name, unit: first.unit, quantity: 1, costPrice: first.costPrice },
    ]);
  }

  function updateIngredient(idx: number, field: "inventoryItemId" | "quantity", value: string | number) {
    setIngredients(prev => {
      const next = [...prev];
      if (field === "inventoryItemId") {
        const item = inventoryItems.find(i => i.id === value);
        if (!item) return prev;
        next[idx] = { ...next[idx], inventoryItemId: item.id, name: item.name, unit: item.unit, costPrice: item.costPrice };
      } else {
        next[idx] = { ...next[idx], quantity: typeof value === "number" ? value : parseFloat(value) || 0 };
      }
      return next;
    });
  }

  function removeIngredient(idx: number) {
    setIngredients(prev => prev.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    if (!selectedProductId) return;
    setSaving(true);
    try {
      const payload: IngredientInput[] = ingredients.map(i => ({
        inventoryItemId: i.inventoryItemId,
        quantity: i.quantity,
      }));
      await saveProductIngredients(selectedProductId, payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  const cmv = ingredients.reduce((sum, i) => sum + i.quantity * i.costPrice, 0);
  const margin = selectedProduct && cmv > 0
    ? ((selectedProduct.price - cmv) / selectedProduct.price) * 100
    : null;

  return (
    <div>
      {/* Product selector */}
      <div className="mb-6">
        <label className="text-gray-400 text-xs font-medium block mb-2">Selecione o Produto</label>
        <select
          value={selectedProductId}
          onChange={e => handleProductChange(e.target.value)}
          className="w-full max-w-sm bg-gray-800 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">— escolha um produto —</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
          ))}
        </select>
      </div>

      {!selectedProductId && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-700">
          <span className="text-4xl opacity-40">📋</span>
          <p className="text-sm">Selecione um produto para editar sua ficha técnica.</p>
        </div>
      )}

      {selectedProductId && loading && (
        <div className="flex items-center justify-center py-16 text-gray-600 text-sm gap-2">
          <div className="w-4 h-4 border-2 border-gray-700 border-t-emerald-500 rounded-full animate-spin" />
          Carregando...
        </div>
      )}

      {selectedProductId && !loading && (
        <>
          {/* CMV summary */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-gray-900 rounded-xl border border-gray-800 px-4 py-3">
              <p className="text-gray-500 text-xs mb-1">Preço de Venda</p>
              <p className="text-white font-bold text-lg tabular-nums">{fmt(selectedProduct?.price ?? 0)}</p>
            </div>
            <div className="bg-gray-900 rounded-xl border border-gray-800 px-4 py-3">
              <p className="text-gray-500 text-xs mb-1">CMV (Custo)</p>
              <p className="text-emerald-400 font-bold text-lg tabular-nums">{fmt(cmv)}</p>
            </div>
            <div className="bg-gray-900 rounded-xl border border-gray-800 px-4 py-3">
              <p className="text-gray-500 text-xs mb-1">Margem Bruta</p>
              <p className={`font-bold text-lg tabular-nums ${margin !== null && margin < 30 ? "text-red-400" : "text-white"}`}>
                {margin !== null ? `${margin.toFixed(1)}%` : "—"}
              </p>
            </div>
          </div>

          {/* Ingredients header */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-400 text-sm font-medium">
              Ingredientes / Insumos
              {ingredients.length > 0 && (
                <span className="ml-2 text-gray-600 text-xs">({ingredients.length})</span>
              )}
            </p>
            {inventoryItems.length > 0 && (
              <button
                onClick={addIngredient}
                className="flex items-center gap-1.5 text-sm text-emerald-500 hover:text-emerald-400 border border-emerald-800/50 hover:border-emerald-600/50 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus size={14} />
                Adicionar Insumo
              </button>
            )}
          </div>

          {inventoryItems.length === 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/25 rounded-xl px-4 py-3 mb-4">
              <p className="text-yellow-400 text-sm">
                Cadastre insumos na aba <strong>Insumos</strong> antes de criar fichas técnicas.
              </p>
            </div>
          )}

          {/* Ingredients list */}
          {ingredients.length === 0 && inventoryItems.length > 0 && (
            <div className="rounded-xl border border-dashed border-gray-800 flex flex-col items-center justify-center py-10 gap-2 text-gray-700">
              <span className="text-3xl opacity-40">🧪</span>
              <p className="text-sm">Nenhum ingrediente adicionado.</p>
            </div>
          )}

          {ingredients.length > 0 && (
            <div className="rounded-xl border border-gray-800 overflow-hidden mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-900/60">
                    <th className="text-left px-4 py-2.5 text-gray-500 font-medium text-xs uppercase tracking-wider">Insumo</th>
                    <th className="text-center px-4 py-2.5 text-gray-500 font-medium text-xs uppercase tracking-wider w-36">Quantidade</th>
                    <th className="text-right px-4 py-2.5 text-gray-500 font-medium text-xs uppercase tracking-wider">Custo</th>
                    <th className="px-4 py-2.5 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {ingredients.map((ing, idx) => (
                    <tr key={idx} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/20">
                      <td className="px-4 py-2.5">
                        <select
                          value={ing.inventoryItemId}
                          onChange={e => updateIngredient(idx, "inventoryItemId", e.target.value)}
                          className="bg-gray-800 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-full max-w-xs"
                        >
                          {inventoryItems.map(item => (
                            <option key={item.id} value={item.id}>{item.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2 justify-center">
                          <input
                            type="number" min={0} step="0.001"
                            value={ing.quantity}
                            onChange={e => updateIngredient(idx, "quantity", e.target.value)}
                            className="w-24 bg-gray-800 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-right tabular-nums"
                          />
                          <span className="text-gray-500 text-xs font-mono w-8">{ing.unit}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-gray-400 text-xs">
                        {fmt(ing.quantity * ing.costPrice)}
                      </td>
                      <td className="px-4 py-2.5">
                        <button
                          onClick={() => removeIngredient(idx)}
                          className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {/* Total row */}
                  <tr className="border-t-2 border-gray-700 bg-gray-900/40">
                    <td className="px-4 py-2.5 text-gray-400 text-xs font-bold uppercase tracking-wider" colSpan={2}>
                      CMV Total
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-emerald-400 font-bold">
                      {fmt(cmv)}
                    </td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Save button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                saved
                  ? "bg-emerald-700 text-white"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white"
              } disabled:opacity-50`}
            >
              <Save size={15} />
              {saving ? "Salvando..." : saved ? "✓ Salvo!" : "Salvar Ficha Técnica"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Root component ───────────────────────────────────────────────────────────
type Tab = "insumos" | "fichas";

export function EstoqueClient({
  initialItems,
  products,
}: {
  initialItems: InventoryItem[];
  products: Product[];
}) {
  const [tab, setTab] = useState<Tab>("insumos");
  const [items, setItems] = useState<InventoryItem[]>(initialItems);

  const lowCount = items.filter(i => i.currentStock <= i.minStock).length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-white font-bold text-xl">Estoque</h1>
        <p className="text-gray-500 text-sm mt-1">Gerencie insumos e fichas técnicas dos seus produtos.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit mb-6">
        {([
          { key: "insumos", label: "Insumos", icon: "📦" },
          { key: "fichas", label: "Fichas Técnicas", icon: "🧪" },
        ] as { key: Tab; label: string; icon: string }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t.key
                ? "bg-gray-800 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
            {t.key === "insumos" && lowCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                {lowCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "insumos" && (
        <AbaInsumos items={items} setItems={setItems} />
      )}
      {tab === "fichas" && (
        <AbaFichas products={products} inventoryItems={items} />
      )}
    </div>
  );
}
