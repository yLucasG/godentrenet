"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createOrder } from "@/actions/order";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Product {
  id: string;
  name: string;
  price: number;
  emoji: string;
  imageUrl?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
}
interface Category {
  id: string;
  name: string;
  emoji: string;
}
interface CartItem { product: Product; qty: number }
interface Props {
  storeId: string;
  instanceName: string;
  storeName: string;
  logoUrl: string | null;
  products: Product[];
  categories: Category[];
  acceptsPickup: boolean;
  acceptsLocal: boolean;
  theme: string;
}
type View = "products" | "checkout" | "success";
type PayMethod = "pix" | "dinheiro";
type DeliveryMethod = "DELIVERY" | "PICKUP" | "LOCAL";

function norm(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

const fmt = (n: number) => `R$ ${n.toFixed(2).replace(".", ",")}`;

// ─── Icons ────────────────────────────────────────────────────────────────────
function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
    </svg>
  );
}

// ─── Product Sheet (Bottom Sheet) ────────────────────────────────────────────
function ProductSheet({ product, onClose, onAddToCart }: {
  product: Product;
  onClose: () => void;
  onAddToCart: (product: Product, qty: number) => void;
}) {
  const [localQty, setLocalQty] = useState(1);
  const total = product.price * localQty;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-50"
        style={{ background: "rgba(0,0,0,0.48)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white flex flex-col overflow-hidden"
        style={{ borderRadius: "2.5rem 2.5rem 0 0", maxHeight: "92dvh" }}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 32, stiffness: 360 }}
      >
        {/* Handle */}
        <div className="flex-shrink-0 pt-3 pb-1">
          <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto" />
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {/* Hero image */}
          <div
            className="mx-4 mt-3 mb-5 overflow-hidden flex items-center justify-center"
            style={{ borderRadius: "1.75rem", background: "var(--surface-tint)", aspectRatio: "4/3" }}
          >
            {product.imageUrl
              ? <img src={product.imageUrl} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontSize: 90, lineHeight: 1 }}>{product.emoji}</span>
            }
          </div>

          {/* Info */}
          <div className="px-5 pb-6">
            <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 leading-tight">
              {product.name}
            </h2>
            <p className="text-xl font-bold mt-2" style={{ color: "var(--primary)" }}>
              {fmt(product.price)}
            </p>
          </div>
        </div>

        {/* Sticky footer: qty + CTA */}
        <div
          className="flex-shrink-0 flex items-center gap-3 px-5 py-4 bg-white"
          style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}
        >
          {/* Qty stepper pill */}
          <div className="flex items-center gap-2 rounded-full px-2 py-1.5 bg-gray-100">
            <button
              onClick={() => setLocalQty(q => Math.max(1, q - 1))}
              className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-700 font-bold text-xl transition-transform active:scale-90"
            >−</button>
            <span className="w-7 text-center font-bold text-sm tabular-nums text-gray-900 select-none">{localQty}</span>
            <button
              onClick={() => setLocalQty(q => q + 1)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xl transition-transform active:scale-90"
              style={{ background: "var(--primary)" }}
            >+</button>
          </div>

          {/* Add to order */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            className="flex-1 rounded-full py-3.5 text-white text-sm font-bold tracking-tight"
            style={{ background: "#0f172a" }}
            onClick={() => { onAddToCart(product, localQty); onClose(); }}
          >
            Adicionar · {fmt(total)}
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}

// ─── Cart Sheet (Bottom Sheet) ────────────────────────────────────────────────
function CartSheet({ cart, products, onClose, onAdd, onRemove, onCheckout }: {
  cart: Record<string, number>;
  products: Product[];
  onClose: () => void;
  onAdd: (p: Product) => void;
  onRemove: (p: Product) => void;
  onCheckout: () => void;
}) {
  const cartItems: CartItem[] = Object.entries(cart)
    .map(([id, qty]) => ({ product: products.find(p => p.id === id)!, qty }))
    .filter(i => i.product);

  const total = cartItems.reduce((s, i) => s + i.product.price * i.qty, 0);
  const totalItems = cartItems.reduce((s, i) => s + i.qty, 0);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-50"
        style={{ background: "rgba(0,0,0,0.48)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white flex flex-col overflow-hidden"
        style={{ borderRadius: "2.5rem 2.5rem 0 0", maxHeight: "85dvh" }}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 32, stiffness: 360 }}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-5 pt-3 pb-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold tracking-tight text-gray-900">Meu Pedido</h2>
            <span className="text-sm font-medium text-gray-400">
              {totalItems} {totalItems === 1 ? "item" : "itens"}
            </span>
          </div>
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {cartItems.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm font-medium">
              Seu carrinho está vazio
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {cartItems.map(({ product, qty }) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-3 rounded-2xl p-3"
                  style={{ background: "rgba(0,0,0,0.03)" }}
                >
                  {/* Thumbnail */}
                  <div
                    className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
                    style={{ background: "var(--surface-tint)" }}
                  >
                    {product.imageUrl
                      ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      : <span className="text-2xl">{product.emoji}</span>
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 leading-tight truncate">{product.name}</p>
                    <p className="text-sm font-bold mt-0.5" style={{ color: "var(--primary)" }}>
                      {fmt(product.price * qty)}
                    </p>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => onRemove(product)}
                      className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-base transition-colors active:scale-90"
                      style={{ background: "rgba(0,0,0,0.07)", color: "#374151" }}
                    >
                      {qty === 1 ? <TrashIcon /> : "−"}
                    </button>
                    <span className="w-5 text-center font-bold text-sm tabular-nums text-gray-900 select-none">{qty}</span>
                    <button
                      onClick={() => onAdd(product)}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-base transition-colors active:scale-90"
                      style={{ background: "var(--primary)" }}
                    >+</button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-5 py-4 bg-white" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-500 font-medium text-sm">Total do pedido</span>
            <span className="text-xl font-extrabold tracking-tight text-gray-900">{fmt(total)}</span>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => { onClose(); onCheckout(); }}
            className="w-full rounded-full py-4 text-white font-bold text-sm tracking-tight"
            style={{ background: "#0f172a" }}
          >
            Confirmar Pedido →
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}

// ─── Product Card (new premium design) ───────────────────────────────────────
function ProductCard({ product, qty, onOpen, onAdd, onRemove }: {
  product: Product;
  qty: number;
  onOpen: () => void;
  onAdd: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      className="bg-white rounded-3xl p-3 border flex flex-col gap-2.5 cursor-pointer"
      style={{
        borderColor: qty > 0 ? "var(--primary)" : "rgba(0,0,0,0.06)",
        boxShadow: qty > 0
          ? "0 10px 40px -20px rgba(0,0,0,0.05), 0 0 0 1.5px var(--primary)"
          : "0 10px 40px -20px rgba(0,0,0,0.05)",
      }}
      onClick={onOpen}
    >
      {/* Image — ~60% of card */}
      <div
        className="w-full rounded-2xl overflow-hidden flex items-center justify-center"
        style={{ aspectRatio: "1/1", background: "var(--surface-tint)" }}
      >
        {product.imageUrl
          ? <img src={product.imageUrl} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <span style={{ fontSize: 48, lineHeight: 1 }}>{product.emoji}</span>
        }
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1">
        <p className="text-[12.5px] font-extrabold tracking-tight text-gray-900 leading-snug line-clamp-2 min-h-[2.5em]">
          {product.name}
        </p>
        <div className="flex items-center justify-between gap-1 mt-0.5">
          <span className="text-sm font-bold text-gray-900 tabular-nums">
            R$ {product.price.toFixed(2).replace(".", ",")}
          </span>
          {qty > 0 ? (
            <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
              <button
                onClick={onRemove}
                className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-bold text-sm transition-transform active:scale-90"
              >−</button>
              <span className="w-4 text-center font-bold text-xs tabular-nums text-gray-900 select-none">{qty}</span>
              <button
                onClick={onAdd}
                className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-sm transition-transform active:scale-90"
                style={{ background: "var(--primary)" }}
              >+</button>
            </div>
          ) : (
            <button
              onClick={e => { e.stopPropagation(); onOpen(); }}
              className="w-7 h-7 rounded-full flex items-center justify-center text-white font-semibold text-lg leading-none transition-transform active:scale-90"
              style={{ background: "var(--primary)", boxShadow: "0 4px 12px -4px var(--primary-glow)" }}
            >+</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Featured Card ────────────────────────────────────────────────────────────
function FeaturedCard({ product, tag, qty, onOpen, onAdd, onRemove }: {
  product: Product;
  tag: string;
  qty: number;
  onOpen: () => void;
  onAdd: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      className="bg-white rounded-3xl p-3 border flex flex-col gap-2.5 cursor-pointer"
      style={{
        borderColor: qty > 0 ? "var(--primary)" : "rgba(0,0,0,0.06)",
        boxShadow: "0 10px 40px -20px rgba(0,0,0,0.06)",
      }}
      onClick={onOpen}
    >
      {/* Image */}
      <div
        className="w-full rounded-2xl overflow-hidden flex items-center justify-center relative"
        style={{ aspectRatio: "1/1", background: "var(--surface-tint)" }}
      >
        {product.imageUrl
          ? <img src={product.imageUrl} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <span style={{ fontSize: 48, lineHeight: 1 }}>{product.emoji}</span>
        }
        {/* Tag badge */}
        <span
          className="absolute top-2 left-2 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full"
          style={{ background: "var(--primary)" }}
        >{tag}</span>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1">
        <p className="text-[12.5px] font-extrabold tracking-tight text-gray-900 leading-snug line-clamp-2 min-h-[2.5em]">
          {product.name}
        </p>
        <div className="flex items-center justify-between gap-1 mt-0.5">
          <span className="text-sm font-bold text-gray-900 tabular-nums">
            R$ {product.price.toFixed(2).replace(".", ",")}
          </span>
          {qty > 0 ? (
            <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
              <button onClick={onRemove} className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-bold text-sm active:scale-90">−</button>
              <span className="w-4 text-center font-bold text-xs tabular-nums text-gray-900 select-none">{qty}</span>
              <button onClick={onAdd} className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-sm active:scale-90" style={{ background: "var(--primary)" }}>+</button>
            </div>
          ) : (
            <button
              onClick={e => { e.stopPropagation(); onOpen(); }}
              className="w-7 h-7 rounded-full flex items-center justify-center text-white font-semibold text-lg leading-none active:scale-90"
              style={{ background: "var(--primary)" }}
            >+</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Floating Cart Bar ────────────────────────────────────────────────────────
function FloatingCartBar({ cart, products, onOpenCart }: {
  cart: Record<string, number>;
  products: Product[];
  onOpenCart: () => void;
}) {
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const total = Object.entries(cart).reduce((sum, [id, q]) => {
    const p = products.find(x => x.id === id);
    return sum + (p ? p.price * q : 0);
  }, 0);

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          className="fixed bottom-6 left-1/2 z-40 w-[90%] max-w-sm"
          style={{ x: "-50%" }}
          initial={{ opacity: 0, y: 24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.95 }}
          transition={{ type: "spring", damping: 28, stiffness: 380 }}
        >
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onOpenCart}
            aria-label="Ver carrinho"
            className="w-full flex justify-between items-center px-5 py-3.5 rounded-full text-white"
            style={{
              background: "rgba(26,26,26,0.92)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow: "0 20px 48px -8px rgba(0,0,0,0.45)",
            }}
          >
            <div className="flex items-center gap-3">
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full min-w-[28px] text-center tabular-nums"
                style={{ background: "rgba(255,255,255,0.18)" }}
              >{count}</span>
              <span className="text-sm font-semibold tracking-tight">Ver Carrinho</span>
            </div>
            <span className="font-bold text-sm tracking-tight tabular-nums">{fmt(total)}</span>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Products view ────────────────────────────────────────────────────────────
function ProductsView({ storeName, logoUrl, products, dbCategories, cart, onOpenProduct, onAdd, onRemove, onOpenCart }: {
  storeName: string;
  logoUrl: string | null;
  products: Product[];
  dbCategories: Category[];
  cart: Record<string, number>;
  onOpenProduct: (p: Product) => void;
  onAdd: (p: Product) => void;
  onRemove: (p: Product) => void;
  onOpenCart: () => void;
}) {
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("all");

  const visibleCategories = useMemo(() => {
    const usedIds = new Set(products.map(p => p.categoryId).filter(Boolean));
    return dbCategories.filter(c => usedIds.has(c.id));
  }, [products, dbCategories]);

  const featured = activeCat === "all" && !search.trim() ? products.slice(0, 2) : [];

  const filtered = useMemo(() => {
    let list = products.filter(p => !featured.includes(p));
    if (activeCat !== "all") list = list.filter(p => p.categoryId === activeCat);
    if (search.trim()) {
      const q = norm(search);
      list = list.filter(p => norm(p.name).includes(q));
    }
    return list;
  }, [products, featured, activeCat, search]);

  const activeCatLabel = visibleCategories.find(c => c.id === activeCat)?.name ?? "Todos";
  const initials = storeName.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();

  return (
    <>
      {/* ── Sticky Glassmorphism Header ── */}
      <header
        className="sticky top-0 z-30"
        style={{
          background: "rgba(255,255,255,0.72)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        {/* Store identity */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 max-w-[480px] mx-auto">
          <div className="shrink-0">
            {logoUrl
              ? <img src={logoUrl} alt={storeName} className="w-10 h-10 rounded-full object-cover" style={{ boxShadow: "0 0 0 2px rgba(0,0,0,0.06)" }} />
              : <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: "var(--surface-tint)", color: "var(--primary)" }}>{initials}</div>
            }
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-gray-900 text-base leading-tight truncate">{storeName}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" style={{ animation: "s-pulse 1.6s ease-in-out infinite", boxShadow: "0 0 5px rgba(52,211,153,0.7)" }} />
              <span className="text-[11px] text-gray-400 font-medium">Em funcionamento</span>
            </div>
          </div>
        </div>

        {/* Search pill */}
        <div className="px-4 pb-3 max-w-[480px] mx-auto">
          <div className="flex items-center gap-2.5 rounded-full px-4 py-2.5" style={{ background: "rgba(0,0,0,0.05)" }}>
            <span className="text-gray-400 shrink-0"><SearchIcon /></span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar produto…"
              aria-label="Buscar produto"
              className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400 font-medium"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600 leading-none text-xl shrink-0" aria-label="Limpar">×</button>
            )}
          </div>
        </div>

        {/* Category pills */}
        {visibleCategories.length > 0 && (
          <div className="flex gap-2 pb-3 px-4 overflow-x-auto scrollbar-hide max-w-[480px] mx-auto">
            <button
              onClick={() => setActiveCat("all")}
              className="shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold whitespace-nowrap transition-colors"
              style={activeCat === "all" ? { background: "#0f172a", color: "#fff" } : { background: "rgba(0,0,0,0.06)", color: "#6b7280" }}
            >🛍️ Tudo</button>
            {visibleCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCat(cat.id)}
                className="shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold whitespace-nowrap transition-colors"
                style={activeCat === cat.id ? { background: "#0f172a", color: "#fff" } : { background: "rgba(0,0,0,0.06)", color: "#6b7280" }}
              >{cat.emoji} {cat.name}</button>
            ))}
          </div>
        )}
      </header>

      {/* ── Products content ── */}
      <div className="max-w-[480px] mx-auto px-4 pb-32">
        {/* Featured grid */}
        {featured.length > 0 && (
          <section className="pt-5 pb-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">✦ Em Destaque</p>
            <div className="grid grid-cols-2 gap-3">
              {featured.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.35, delay: i * 0.07 }}
                >
                  <FeaturedCard
                    product={p}
                    tag={i === 0 ? "Destaque" : "Popular"}
                    qty={cart[p.id] ?? 0}
                    onOpen={() => onOpenProduct(p)}
                    onAdd={() => onAdd(p)}
                    onRemove={() => onRemove(p)}
                  />
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Product grid */}
        {filtered.length > 0 && (
          <section className="pt-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                {activeCat === "all" ? "✦ Todos os Produtos" : `✦ ${activeCatLabel}`}
              </p>
              <span
                className="text-[10px] font-semibold text-gray-400 px-2.5 py-0.5 rounded-full"
                style={{ background: "rgba(0,0,0,0.05)" }}
              >{filtered.length} itens</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {filtered.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.35, delay: Math.min(i * 0.05, 0.25) }}
                >
                  <ProductCard
                    product={p}
                    qty={cart[p.id] ?? 0}
                    onOpen={() => onOpenProduct(p)}
                    onAdd={() => onAdd(p)}
                    onRemove={() => onRemove(p)}
                  />
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {filtered.length === 0 && featured.length === 0 && (
          <div className="text-center py-20 text-gray-400 text-sm font-medium">
            Nenhum produto encontrado
          </div>
        )}
      </div>

      <FloatingCartBar cart={cart} products={products} onOpenCart={onOpenCart} />
    </>
  );
}

// ─── Checkout view ────────────────────────────────────────────────────────────
function CheckoutView({ cart, products, storeId, instanceName, storeName, acceptsPickup, acceptsLocal, onBack, onSuccess }: {
  cart: Record<string, number>;
  products: Product[];
  storeId: string;
  instanceName: string;
  storeName: string;
  acceptsPickup: boolean;
  acceptsLocal: boolean;
  onBack: () => void;
  onSuccess: () => void;
}) {
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("DELIVERY");
  const [localIdentifier, setLocalIdentifier] = useState("");
  const [payMethod, setPayMethod] = useState<PayMethod>("pix");
  const [changeFor, setChangeFor] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const cartItems: CartItem[] = Object.entries(cart)
    .map(([id, qty]) => ({ product: products.find(p => p.id === id)!, qty }))
    .filter(i => i.product);

  const total = cartItems.reduce((s, i) => s + i.product.price * i.qty, 0);

  function validate() {
    const e: Record<string, string> = {};
    if (phone.replace(/\D/g, "").length < 8) e.phone = "Número muito curto";
    if (deliveryMethod === "DELIVERY" && address.trim().length < 3) e.address = "Endereço obrigatório";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await createOrder({
        storeId, instanceName, storeName,
        customerPhone: phone,
        address: deliveryMethod === "DELIVERY" ? address.trim() : "",
        items: cartItems.map(i => ({ name: i.product.name, emoji: i.product.emoji, price: i.product.price, qty: i.qty })),
        total,
        paymentMethod: payMethod,
        needChange: payMethod === "dinheiro" && !!changeFor,
        changeFor: payMethod === "dinheiro" && changeFor ? parseFloat(changeFor) : undefined,
        deliveryMethod,
        localIdentifier: localIdentifier.trim() || undefined,
      });
      onSuccess();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao enviar pedido.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="s-checkout">
      <div className="s-checkout-head">
        <button className="s-back-btn" onClick={onBack} aria-label="Voltar">←</button>
        <div>
          <div className="s-checkout-title">Finalizar pedido</div>
          <div className="s-checkout-sub mono">CONFIRME SEUS DADOS</div>
        </div>
      </div>

      <div className="s-order-summary">
        <div className="s-order-head">› RESUMO DO PEDIDO</div>
        {cartItems.map(i => (
          <div key={i.product.id} className="s-order-item">
            <span className="s-order-item-name">
              {i.product.name}<span className="s-order-item-qty">×{i.qty}</span>
            </span>
            <span className="s-order-item-price mono">{fmt(i.product.price * i.qty)}</span>
          </div>
        ))}
        <div className="s-order-total">
          <span className="s-order-total-label mono">TOTAL</span>
          <span className="s-order-total-val mono">{fmt(total)}</span>
        </div>
      </div>

      <div className="s-form">
        {(acceptsPickup || acceptsLocal) && (
          <div className="s-field">
            <label className="s-field-label">Como quer receber?</label>
            <div className="s-payment-opts">
              <button className={`s-pay-opt${deliveryMethod === "DELIVERY" ? " selected" : ""}`} onClick={() => setDeliveryMethod("DELIVERY")} role="radio" aria-checked={deliveryMethod === "DELIVERY"}>
                <span className="s-pay-radio" /><span className="s-pay-label">🛵 Receber em casa</span>
              </button>
              {acceptsPickup && (
                <button className={`s-pay-opt${deliveryMethod === "PICKUP" ? " selected" : ""}`} onClick={() => setDeliveryMethod("PICKUP")} role="radio" aria-checked={deliveryMethod === "PICKUP"}>
                  <span className="s-pay-radio" /><span className="s-pay-label">🏪 Vou retirar</span>
                </button>
              )}
              {acceptsLocal && (
                <button className={`s-pay-opt${deliveryMethod === "LOCAL" ? " selected" : ""}`} onClick={() => setDeliveryMethod("LOCAL")} role="radio" aria-checked={deliveryMethod === "LOCAL"}>
                  <span className="s-pay-radio" /><span className="s-pay-label">📍 Estou no local</span>
                </button>
              )}
            </div>
          </div>
        )}

        <div className="s-field">
          <label className="s-field-label">WhatsApp</label>
          <div className="s-field-row">
            <span className="s-field-prefix mono">+55</span>
            <input className={`s-input with-prefix${errors.phone ? " error" : ""}`} value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ""))} placeholder="87988444564" inputMode="tel" maxLength={11} />
          </div>
          {errors.phone && <span className="s-field-error">{errors.phone}</span>}
        </div>

        {deliveryMethod === "DELIVERY" && (
          <div className="s-field">
            <label className="s-field-label">Endereço de entrega</label>
            <input className={`s-input${errors.address ? " error" : ""}`} value={address} onChange={e => setAddress(e.target.value)} placeholder="Rua, número, bairro" />
            {errors.address && <span className="s-field-error">{errors.address}</span>}
          </div>
        )}

        {deliveryMethod === "LOCAL" && (
          <div className="s-field">
            <label className="s-field-label">Identificador <span style={{ opacity: 0.5, fontWeight: 400 }}>(opcional)</span></label>
            <input className="s-input" value={localIdentifier} onChange={e => setLocalIdentifier(e.target.value)} placeholder="Ex: Mesa 2, Comanda 10..." />
          </div>
        )}

        <div className="s-field">
          <label className="s-field-label">Forma de pagamento</label>
          <div className="s-payment-opts">
            {([["pix", "💳 PIX"], ["dinheiro", "💵 Dinheiro"]] as [PayMethod, string][]).map(([val, label]) => (
              <button key={val} className={`s-pay-opt${payMethod === val ? " selected" : ""}`} onClick={() => setPayMethod(val)} role="radio" aria-checked={payMethod === val}>
                <span className="s-pay-radio" /><span className="s-pay-label">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {payMethod === "dinheiro" && (
          <div className="s-field">
            <label className="s-field-label">Troco para (opcional)</label>
            <input className="s-input" value={changeFor} onChange={e => setChangeFor(e.target.value.replace(/[^\d.,]/g, ""))} placeholder="Ex: 50,00" inputMode="decimal" />
          </div>
        )}

        <button className="s-submit-btn" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "ENVIANDO…" : "CONFIRMAR PEDIDO →"}
        </button>
      </div>
    </div>
  );
}

// ─── Success view ─────────────────────────────────────────────────────────────
function SuccessView({ onBack }: { onBack: () => void }) {
  return (
    <div className="s-success">
      <div className="s-success-card">
        <div className="s-check-circle">✓</div>
        <div className="s-success-title">Pedido enviado!</div>
        <div className="s-success-sub mono">AGUARDE A CONFIRMAÇÃO VIA WHATSAPP</div>
        <button className="s-success-back" onClick={onBack}>Voltar à loja</button>
      </div>
    </div>
  );
}

// ─── Root component ───────────────────────────────────────────────────────────
export function StoreClient({ storeId, instanceName, storeName, logoUrl, products, categories, acceptsPickup, acceptsLocal, theme }: Props) {
  const [view, setView] = useState<View>("products");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [sheetProduct, setSheetProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  function addToCart(p: Product) {
    setCart(c => ({ ...c, [p.id]: (c[p.id] ?? 0) + 1 }));
  }

  function addQtyToCart(p: Product, qty: number) {
    setCart(c => ({ ...c, [p.id]: (c[p.id] ?? 0) + qty }));
  }

  function removeFromCart(p: Product) {
    setCart(c => {
      const next = { ...c };
      const qty = (next[p.id] ?? 0) - 1;
      if (qty <= 0) delete next[p.id];
      else next[p.id] = qty;
      return next;
    });
  }

  function resetCart() {
    setCart({});
    setView("products");
  }

  return (
    <div className="store-root" data-theme={theme}>
      {view === "products" && (
        <ProductsView
          storeName={storeName}
          logoUrl={logoUrl}
          products={products}
          dbCategories={categories}
          cart={cart}
          onOpenProduct={setSheetProduct}
          onAdd={addToCart}
          onRemove={removeFromCart}
          onOpenCart={() => setCartOpen(true)}
        />
      )}
      {view === "checkout" && (
        <CheckoutView
          cart={cart}
          products={products}
          storeId={storeId}
          instanceName={instanceName}
          storeName={storeName}
          acceptsPickup={acceptsPickup}
          acceptsLocal={acceptsLocal}
          onBack={() => setView("products")}
          onSuccess={() => setView("success")}
        />
      )}
      {view === "success" && <SuccessView onBack={resetCart} />}

      {/* ── Bottom Sheets ── */}
      <AnimatePresence>
        {sheetProduct && (
          <ProductSheet
            key="product-sheet"
            product={sheetProduct}
            onClose={() => setSheetProduct(null)}
            onAddToCart={addQtyToCart}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {cartOpen && (
          <CartSheet
            key="cart-sheet"
            cart={cart}
            products={products}
            onClose={() => setCartOpen(false)}
            onAdd={addToCart}
            onRemove={removeFromCart}
            onCheckout={() => setView("checkout")}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
