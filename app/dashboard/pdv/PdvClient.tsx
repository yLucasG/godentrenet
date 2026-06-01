"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { FileText, X, Copy, CheckCheck, Loader2, Menu, ChevronLeft } from "lucide-react";
import { createPdvOrder } from "@/actions/order";
import { generateNFCePayload } from "@/actions/fiscal";
import { navItems } from "@/app/dashboard/SidebarNav";

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
  const [nfcePayload, setNfcePayload] = useState<string | null>(null);
  const [loadingNfce, setLoadingNfce] = useState(false);
  const [copied, setCopied] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  // ── Derived ──────────────────────────────────────────────────────────────
  const cartItems = useMemo(() =>
    Object.entries(cart)
      .map(([id, qty]) => ({ product: products.find(p => p.id === id)!, qty }))
      .filter(i => i.product && i.qty > 0),
    [cart, products]
  );
  const total = useMemo(() => cartItems.reduce((s, i) => s + i.product.price * i.qty, 0), [cartItems]);
  const cartCount = useMemo(() => Object.values(cart).reduce((a, b) => a + b, 0), [cart]);

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
        items: cartItems.map(i => ({ name: i.product.name, emoji: i.product.emoji, price: i.product.price, qty: i.qty })),
        total, paymentMethod: payMethod, deliveryMethod,
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

  async function handleNFCe() {
    if (cartItems.length === 0) return;
    setLoadingNfce(true);
    try {
      const payload = await generateNFCePayload(
        cartItems.map(i => ({ name: i.product.name, qty: i.qty, price: i.product.price })),
        payMethod, total
      );
      setNfcePayload(JSON.stringify(payload, null, 2));
    } catch {
      alert("Erro ao gerar payload NFC-e.");
    } finally {
      setLoadingNfce(false);
    }
  }

  function handleCopy() {
    if (!nfcePayload) return;
    navigator.clipboard.writeText(nfcePayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 bg-gray-950 flex flex-col">

      {/* ── Hamburger nav overlay ─────────────────────────────────────── */}
      {navOpen && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/60" onClick={() => setNavOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-[61] w-56 bg-[#0d0d14] border-r border-gray-800/60 flex flex-col shadow-2xl">
            <div className="px-4 py-5 border-b border-gray-800/60 flex items-center justify-between">
              <div>
                <p className="text-[9px] text-gray-600 uppercase tracking-[0.2em] font-semibold">GODENTRENET</p>
                <p className="text-white font-bold mt-0.5 text-sm">{storeName}</p>
              </div>
              <button onClick={() => setNavOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                <ChevronLeft size={18} />
              </button>
            </div>
            <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
              {navItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setNavOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    item.href === "/dashboard/pdv"
                      ? "bg-amber-500/10 text-amber-400"
                      : "text-gray-500 hover:text-gray-200 hover:bg-white/5"
                  }`}
                >
                  <span className="text-base shrink-0">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </>
      )}

      {/* NFC-e modal */}
      {nfcePayload && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg bg-gray-950 rounded-2xl border border-gray-800 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 flex-shrink-0">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-amber-400" />
                <span className="text-white font-bold text-sm">Payload NFC-e (Focus NFe)</span>
              </div>
              <button onClick={() => setNfcePayload(null)} className="text-gray-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            <pre className="flex-1 overflow-y-auto p-4 text-xs text-amber-300 font-mono leading-relaxed bg-gray-900/50">
              {nfcePayload}
            </pre>
            <div className="px-5 py-3 border-t border-gray-800 flex gap-2 flex-shrink-0">
              <p className="text-gray-600 text-xs flex-1 self-center">Integração com API emissora em breve.</p>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  copied ? "bg-amber-600 text-gray-950" : "bg-gray-800 hover:bg-gray-700 text-gray-300"
                }`}
              >
                {copied ? <><CheckCheck size={14} /> Copiado!</> : <><Copy size={14} /> Copiar JSON</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success flash */}
      {flash && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center pointer-events-none">
          <div className="bg-amber-500 text-gray-950 font-black text-2xl px-12 py-7 rounded-2xl shadow-2xl scale-110">
            ✓ Venda registrada!
          </div>
        </div>
      )}

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="h-11 bg-gray-900 border-b border-gray-800 flex items-center px-3 gap-2.5 flex-shrink-0">
        <button
          onClick={() => setNavOpen(true)}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          aria-label="Menu"
        >
          <Menu size={16} />
        </button>
        <div className="w-px h-4 bg-gray-800" />
        <span className="text-white font-semibold text-sm truncate">🖥️ PDV — {storeName}</span>
        {cartCount > 0 && (
          <span className="ml-auto bg-amber-500/15 text-amber-400 border border-amber-500/25 text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0">
            {cartCount} {cartCount === 1 ? "item" : "itens"}
          </span>
        )}
      </div>

      {/* ── Split screen ────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ══ LEFT: Produtos ══════════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-800/60">

          {/* Search */}
          <div className="flex-shrink-0 px-3 py-2.5 border-b border-gray-800/60">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>
              </svg>
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setActiveCat("all"); }}
                placeholder="Busca rápida pelo nome..."
                className="w-full bg-gray-900 text-white pl-8 pr-8 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder:text-gray-600 border border-gray-800"
              />
              {search && (
                <button onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white text-base leading-none">×</button>
              )}
            </div>
          </div>

          {/* Category tabs */}
          {visibleCategories.length > 0 && (
            <div className="flex-shrink-0 flex gap-1.5 px-3 py-2 overflow-x-auto border-b border-gray-800/60 scrollbar-hide">
              <button onClick={() => setActiveCat("all")}
                className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeCat === "all" ? "bg-amber-500 text-gray-950 font-bold" : "bg-gray-800/60 text-gray-500 hover:text-white border border-gray-800"
                }`}>
                🛍️ Tudo
              </button>
              {visibleCategories.map(cat => (
                <button key={cat.id} onClick={() => setActiveCat(cat.id)}
                  className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeCat === cat.id ? "bg-amber-500 text-gray-950 font-bold" : "bg-gray-800/60 text-gray-500 hover:text-white border border-gray-800"
                  }`}>
                  {cat.emoji} {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* Product grid — 5 colunas com cards menores */}
          <div className="flex-1 overflow-y-auto p-3">
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-700">
                <span className="text-4xl">🔍</span>
                <span className="text-sm">Nenhum produto encontrado</span>
              </div>
            ) : (
              <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>
                {filteredProducts.map(product => {
                  const qty = cart[product.id] ?? 0;
                  return (
                    <button key={product.id} onClick={() => addToCart(product.id)}
                      className={`relative flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border transition-all text-center min-h-[88px] active:scale-95 ${
                        qty > 0
                          ? "border-amber-500/60 bg-amber-500/8 shadow-sm shadow-amber-500/15"
                          : "border-gray-800 bg-gray-900/50 hover:border-gray-700 hover:bg-gray-900"
                      }`}
                    >
                      {qty > 0 && (
                        <span className="absolute top-1 right-1 bg-amber-500 text-gray-950 text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center leading-none">
                          {qty}
                        </span>
                      )}
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-10 h-10 object-contain rounded-lg" />
                      ) : (
                        <span className="text-2xl">{product.emoji}</span>
                      )}
                      <span className="text-white text-[10px] font-medium leading-tight line-clamp-2 w-full">{product.name}</span>
                      <span className="text-amber-400 text-[10px] font-bold">{fmt(product.price)}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ══ RIGHT: Comanda (310px) ═══════════════════════════════════════ */}
        <div className="w-[310px] flex-shrink-0 flex flex-col overflow-hidden bg-[#0d0d14] border-l border-gray-800/60">

          {/* ─ Tipo de venda ─────────────────────────────────────────────── */}
          <div className="flex-shrink-0 px-4 pt-3 pb-3 border-b border-gray-800/60">
            <p className="text-gray-600 text-[9px] font-bold uppercase tracking-widest mb-2">Tipo de venda</p>
            <div className={`grid gap-1.5 ${deliveryOpts.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
              {deliveryOpts.map(([method, icon, label]) => (
                <button key={method} onClick={() => setDeliveryMethod(method)}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    deliveryMethod === method
                      ? "bg-amber-500 text-gray-950 shadow-lg shadow-amber-500/20"
                      : "bg-gray-800/50 text-gray-500 hover:text-white hover:bg-gray-800 border border-gray-800"
                  }`}
                >
                  <span className="text-xl leading-none">{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ─ Dados do cliente ──────────────────────────────────────────── */}
          <div className="flex-shrink-0 px-4 py-3 border-b border-gray-800/60 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input value={customerName} onChange={e => setCustomerName(e.target.value)}
                placeholder="Nome (opcional)"
                className="bg-gray-800/50 border border-gray-800 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder:text-gray-600 w-full" />
              <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="Telefone (opcional)" inputMode="tel" maxLength={11}
                className="bg-gray-800/50 border border-gray-800 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder:text-gray-600 w-full" />
            </div>
            {deliveryMethod === "LOCAL" && (
              <input value={localIdentifier} onChange={e => setLocalIdentifier(e.target.value)}
                placeholder="Mesa, Comanda, Carro... (opcional)"
                className="w-full bg-gray-800/50 border border-gray-800 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder:text-gray-600" />
            )}
          </div>

          {/* ─ Itens do carrinho ─────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-700 px-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-800/40 border border-gray-800 flex items-center justify-center">
                  <span className="text-2xl opacity-40">🛒</span>
                </div>
                <div>
                  <p className="text-gray-600 text-xs font-medium">Carrinho vazio</p>
                  <p className="text-gray-700 text-[10px] mt-0.5">Clique nos produtos para adicionar</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-800/40 px-1">
                {cartItems.map(({ product, qty }) => (
                  <div key={product.id} className="flex items-center gap-2.5 px-3 py-2.5">
                    {/* thumb */}
                    <div className="w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {product.imageUrl
                        ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain p-0.5" />
                        : <span className="text-lg">{product.emoji}</span>
                      }
                    </div>
                    {/* info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium leading-tight truncate">{product.name}</p>
                      <p className="text-gray-600 text-[10px] mt-0.5">{fmt(product.price)} / un.</p>
                    </div>
                    {/* qty controls */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => setQty(product.id, qty - 1)}
                        className="w-6 h-6 rounded-md bg-gray-800 hover:bg-red-900/40 hover:text-red-400 text-gray-400 flex items-center justify-center text-sm font-bold transition-colors">−</button>
                      <span className="text-white text-xs font-bold w-5 text-center tabular-nums">{qty}</span>
                      <button onClick={() => setQty(product.id, qty + 1)}
                        className="w-6 h-6 rounded-md bg-gray-800 hover:bg-amber-900/30 hover:text-amber-400 text-gray-400 flex items-center justify-center text-sm font-bold transition-colors">+</button>
                    </div>
                    {/* subtotal */}
                    <span className="text-amber-400 text-xs font-bold w-14 text-right flex-shrink-0 tabular-nums">
                      {fmt(product.price * qty)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ─ Footer: total + pagamento + finalizar ─────────────────────── */}
          <div className="flex-shrink-0 border-t border-gray-800/60 px-4 pt-3 pb-4 space-y-2.5">
            {/* Total */}
            <div className="flex items-center justify-between py-1">
              <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total</span>
              <span className="text-white text-2xl font-black tabular-nums">{fmt(total)}</span>
            </div>

            {/* Pagamento */}
            <div className="grid grid-cols-2 gap-2">
              {(["pix", "dinheiro"] as PayMethod[]).map(m => (
                <button key={m} onClick={() => setPayMethod(m)}
                  className={`py-2 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    payMethod === m
                      ? "bg-gray-700 text-white ring-1 ring-gray-600"
                      : "bg-gray-800/50 text-gray-500 hover:text-white hover:bg-gray-800 border border-gray-800"
                  }`}>
                  <span>{m === "pix" ? "💳" : "💵"}</span>
                  <span>{m === "pix" ? "PIX" : "Dinheiro"}</span>
                </button>
              ))}
            </div>

            {/* Finalizar */}
            <button onClick={handleSubmit} disabled={submitting || cartItems.length === 0}
              className="w-full active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-gray-950 font-bold py-3 rounded-full text-sm transition-all"
              style={{ background: "#F59E0B" }}>
              {submitting ? "Registrando..." : cartItems.length === 0 ? "Adicione produtos" : `✓ Finalizar  ${fmt(total)}`}
            </button>

            {/* NFC-e */}
            <button onClick={handleNFCe} disabled={loadingNfce || cartItems.length === 0}
              className="w-full flex items-center justify-center gap-1.5 border border-gray-800/80 hover:border-gray-700 text-gray-600 hover:text-gray-400 text-xs font-medium py-2 rounded-xl transition-colors disabled:opacity-30">
              {loadingNfce
                ? <><Loader2 size={12} className="animate-spin" /> Gerando...</>
                : <><FileText size={12} /> Gerar NFC-e (JSON)</>
              }
            </button>

            {cartItems.length > 0 && (
              <button onClick={clearCart}
                className="w-full text-gray-700 hover:text-red-500 text-[10px] transition-colors text-center">
                Limpar carrinho
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
