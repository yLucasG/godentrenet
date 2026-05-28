"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { createPdvOrder } from "@/actions/order";

type Product = {
  id: string;
  name: string;
  price: number;
  emoji: string;
  imageUrl?: string | null;
  categoryId?: string | null;
};

type Category = { id: string; name: string; emoji: string };
type DeliveryMethod = "DELIVERY" | "PICKUP" | "LOCAL";
type PayMethod = "pix" | "dinheiro";

interface Props {
  storeName: string;
  acceptsPickup: boolean;
  acceptsLocal: boolean;
  products: Product[];
  categories: Category[];
}

function norm(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function fmt(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const ALL_DELIVERY_OPTS: [DeliveryMethod, string, string][] = [
  ["DELIVERY", "🛵", "Delivery"],
  ["PICKUP",   "🏪", "Retirada"],
  ["LOCAL",    "📍", "Local"],
];

export function PdvClient({ storeName, acceptsPickup, acceptsLocal, products, categories }: Props) {
  // ── Cart ─────────────────────────────────────────────────────────────────
  const [cart, setCart] = useState<Record<string, number>>({});

  // ── Form ─────────────────────────────────────────────────────────────────
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("LOCAL");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [localIdentifier, setLocalIdentifier] = useState("");
  const [payMethod, setPayMethod] = useState<PayMethod>("dinheiro");

  // ── UI ───────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("all");
  const [submitting, setSubmitting] = useState(false);
  const [flash, setFlash] = useState(false);

  // ── Derived ──────────────────────────────────────────────────────────────
  const cartItems = useMemo(() =>
    Object.entries(cart)
      .map(([id, qty]) => ({ product: products.find(p => p.id === id)!, qty }))
      .filter(i => i.product && i.qty > 0),
    [cart, products]
  );

  const total = useMemo(() =>
    cartItems.reduce((s, i) => s + i.product.price * i.qty, 0),
    [cartItems]
  );

  const cartCount = useMemo(() =>
    Object.values(cart).reduce((a, b) => a + b, 0),
    [cart]
  );

  const visibleCategories = useMemo(() => {
    const usedIds = new Set(products.map(p => p.categoryId).filter(Boolean));
    return categories.filter(c => usedIds.has(c.id));
  }, [products, categories]);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (activeCat !== "all") list = list.filter(p => p.categoryId === activeCat);
    if (search.trim()) {
      const q = norm(search);
      list = list.filter(p => norm(p.name).includes(q));
    }
    return list;
  }, [products, activeCat, search]);

  const deliveryOpts = ALL_DELIVERY_OPTS.filter(([m]) =>
    m === "DELIVERY" || (m === "PICKUP" && acceptsPickup) || (m === "LOCAL" && acceptsLocal)
  );

  // ── Handlers ─────────────────────────────────────────────────────────────
  function addToCart(id: string) {
    setCart(c => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
  }

  function setQty(id: string, qty: number) {
    if (qty <= 0) {
      setCart(c => { const n = { ...c }; delete n[id]; return n; });
    } else {
      setCart(c => ({ ...c, [id]: qty }));
    }
  }

  function clearCart() {
    setCart({});
    setCustomerName("");
    setCustomerPhone("");
    setLocalIdentifier("");
  }

  async function handleSubmit() {
    if (cartItems.length === 0 || submitting) return;
    setSubmitting(true);
    try {
      await createPdvOrder({
        items: cartItems.map(i => ({
          name: i.product.name,
          emoji: i.product.emoji,
          price: i.product.price,
          qty: i.qty,
        })),
        total,
        paymentMethod: payMethod,
        deliveryMethod,
        customerPhone: customerPhone.trim() || undefined,
        customerName: customerName.trim() || undefined,
        localIdentifier: localIdentifier.trim() || undefined,
        needChange: false,
      });
      clearCart();
      setFlash(true);
      setTimeout(() => setFlash(false), 1800);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao finalizar venda.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 bg-gray-950 flex flex-col">

      {/* Success flash */}
      {flash && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center pointer-events-none">
          <div className="bg-emerald-500 text-white font-black text-2xl px-12 py-7 rounded-2xl shadow-2xl scale-110 transition-transform">
            ✓ Venda registrada!
          </div>
        </div>
      )}

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="h-12 bg-gray-900 border-b border-gray-800 flex items-center px-4 gap-3 flex-shrink-0">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Dashboard
        </Link>
        <div className="w-px h-4 bg-gray-700" />
        <span className="text-white font-semibold text-sm">🖥️ PDV — {storeName}</span>
        {cartCount > 0 && (
          <span className="ml-auto bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-2.5 py-0.5 rounded-full">
            {cartCount} {cartCount === 1 ? "item" : "itens"}
          </span>
        )}
      </div>

      {/* ── Split screen ────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ══ LEFT: Products (65%) ══════════════════════════════════════ */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-800">

          {/* Search */}
          <div className="flex-shrink-0 p-3 border-b border-gray-800">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>
              </svg>
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setActiveCat("all"); }}
                placeholder="Busca rápida pelo nome..."
                className="w-full bg-gray-800 text-white pl-9 pr-9 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-gray-500"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-lg leading-none"
                >×</button>
              )}
            </div>
          </div>

          {/* Category tabs */}
          {visibleCategories.length > 0 && (
            <div className="flex-shrink-0 flex gap-1.5 px-3 py-2 overflow-x-auto border-b border-gray-800 scrollbar-hide">
              <button
                onClick={() => setActiveCat("all")}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeCat === "all"
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-800 text-gray-400 hover:text-white"
                }`}
              >
                🛍️ Tudo
              </button>
              {visibleCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCat(cat.id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeCat === cat.id
                      ? "bg-emerald-500 text-white"
                      : "bg-gray-800 text-gray-400 hover:text-white"
                  }`}
                >
                  {cat.emoji} {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* Product grid */}
          <div className="flex-1 overflow-y-auto p-3">
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-600">
                <span className="text-4xl">🔍</span>
                <span className="text-sm">Nenhum produto encontrado</span>
              </div>
            ) : (
              <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))" }}>
                {filteredProducts.map(product => {
                  const qty = cart[product.id] ?? 0;
                  return (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product.id)}
                      className={`relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all text-center min-h-[100px] active:scale-95 ${
                        qty > 0
                          ? "border-emerald-500 bg-emerald-500/10 shadow-sm shadow-emerald-500/20"
                          : "border-gray-700 bg-gray-800/60 hover:border-gray-500 hover:bg-gray-800"
                      }`}
                    >
                      {qty > 0 && (
                        <span className="absolute top-1.5 right-1.5 bg-emerald-500 text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center">
                          {qty}
                        </span>
                      )}
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-12 h-12 object-cover rounded-lg" />
                      ) : (
                        <span className="text-3xl">{product.emoji}</span>
                      )}
                      <span className="text-white text-xs font-medium leading-tight line-clamp-2 w-full">{product.name}</span>
                      <span className="text-emerald-400 text-xs font-bold">{fmt(product.price)}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ══ RIGHT: Comanda (35%) ══════════════════════════════════════ */}
        <div className="w-[360px] flex-shrink-0 flex flex-col overflow-hidden bg-gray-900/50">

          {/* Delivery method */}
          <div className="flex-shrink-0 p-3 border-b border-gray-800">
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2">Tipo de venda</p>
            <div className={`grid gap-1.5 ${deliveryOpts.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
              {deliveryOpts.map(([method, icon, label]) => (
                <button
                  key={method}
                  onClick={() => setDeliveryMethod(method)}
                  className={`flex flex-col items-center gap-0.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    deliveryMethod === method
                      ? "bg-emerald-500 text-white"
                      : "bg-gray-800 text-gray-400 hover:text-white"
                  }`}
                >
                  <span className="text-xl">{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Customer fields */}
          <div className="flex-shrink-0 p-3 border-b border-gray-800 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Nome (opcional)"
                className="bg-gray-800 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-gray-600 w-full"
              />
              <input
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="Telefone (opcional)"
                inputMode="tel"
                maxLength={11}
                className="bg-gray-800 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-gray-600 w-full"
              />
            </div>
            {deliveryMethod === "LOCAL" && (
              <input
                value={localIdentifier}
                onChange={e => setLocalIdentifier(e.target.value)}
                placeholder="Mesa, Comanda, Carro... (opcional)"
                className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-gray-600"
              />
            )}
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-600">
                <span className="text-5xl opacity-40">🛒</span>
                <span className="text-sm text-center px-6">Clique nos produtos<br/>para adicionar à venda</span>
              </div>
            ) : (
              <div className="divide-y divide-gray-800/50">
                {cartItems.map(({ product, qty }) => (
                  <div key={product.id} className="flex items-center gap-2.5 px-3 py-2.5">
                    <span className="text-xl flex-shrink-0">{product.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{product.name}</p>
                      <p className="text-gray-500 text-xs">{fmt(product.price)} un.</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => setQty(product.id, qty - 1)}
                        className="w-7 h-7 rounded-lg bg-gray-700 hover:bg-red-900/50 hover:text-red-400 text-white font-bold text-base flex items-center justify-center transition-colors"
                      >−</button>
                      <span className="text-white text-sm font-bold w-6 text-center tabular-nums">{qty}</span>
                      <button
                        onClick={() => setQty(product.id, qty + 1)}
                        className="w-7 h-7 rounded-lg bg-gray-700 hover:bg-emerald-900/50 hover:text-emerald-400 text-white font-bold text-base flex items-center justify-center transition-colors"
                      >+</button>
                    </div>
                    <span className="text-emerald-400 text-sm font-bold w-16 text-right flex-shrink-0 tabular-nums">
                      {fmt(product.price * qty)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Footer: total + payment + submit ────────────────────── */}
          <div className="flex-shrink-0 border-t border-gray-800 p-3 space-y-2.5">
            {/* Total */}
            <div className="flex items-center justify-between px-1">
              <span className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Total</span>
              <span className="text-white text-2xl font-black tabular-nums">{fmt(total)}</span>
            </div>

            {/* Payment */}
            <div className="grid grid-cols-2 gap-1.5">
              {(["pix", "dinheiro"] as PayMethod[]).map(m => (
                <button
                  key={m}
                  onClick={() => setPayMethod(m)}
                  className={`py-2 rounded-xl text-sm font-semibold transition-colors ${
                    payMethod === m
                      ? "bg-gray-600 text-white ring-1 ring-gray-500"
                      : "bg-gray-800 text-gray-400 hover:text-white"
                  }`}
                >
                  {m === "pix" ? "💳 PIX" : "💵 Dinheiro"}
                </button>
              ))}
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={submitting || cartItems.length === 0}
              className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl text-lg transition-all"
            >
              {submitting
                ? "Registrando..."
                : cartItems.length === 0
                ? "Adicione produtos"
                : `✓ Finalizar  ${fmt(total)}`}
            </button>

            {cartItems.length > 0 && (
              <button
                onClick={clearCart}
                className="w-full text-gray-600 hover:text-red-400 text-xs py-0.5 transition-colors"
              >
                Limpar carrinho
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
