"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag, X, Minus, Plus, ChevronLeft,
  MapPin, Smartphone, Check, ChevronRight, Package,
} from "lucide-react";
import { createOrder } from "@/actions/order";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Product { id: string; name: string; price: number; emoji: string; }
interface CartItem { product: Product; qty: number; }
interface Props { storeId: string; instanceName: string; storeName: string; products: Product[]; }
type View = "products" | "checkout" | "success";

// ─── Constants ────────────────────────────────────────────────────────────────
const CARD_GRADIENTS = [
  "from-orange-50 to-amber-50",    "from-emerald-50 to-teal-50",
  "from-violet-50 to-purple-50",   "from-rose-50 to-pink-50",
  "from-blue-50 to-sky-50",        "from-lime-50 to-green-50",
  "from-fuchsia-50 to-pink-50",    "from-indigo-50 to-violet-50",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.05)]">
      <div className="h-28 bg-gradient-to-br from-slate-100 to-slate-50 animate-pulse" />
      <div className="p-4 space-y-2.5">
        <div className="h-3 bg-slate-100 rounded-full w-3/4 animate-pulse" />
        <div className="h-4 bg-slate-100 rounded-full w-2/5 animate-pulse" />
        <div className="h-10 bg-slate-100 rounded-2xl mt-3 animate-pulse" />
      </div>
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({
  product, idx, qty, onAdd, onRemove,
}: {
  product: Product; idx: number; qty: number;
  onAdd: (p: Product) => void; onRemove: (id: string) => void;
}) {
  const [justAdded, setJustAdded] = useState(false);
  const grad = CARD_GRADIENTS[idx % CARD_GRADIENTS.length];

  const handleAdd = useCallback(() => {
    onAdd(product);
    if (qty === 0) {
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1400);
    }
  }, [onAdd, product, qty]);

  return (
    <motion.article
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(idx * 0.07, 0.42), duration: 0.38, ease: [0.22, 0.61, 0.36, 1] }}
      className="relative bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.05)] hover:shadow-[0_18px_50px_rgb(0,0,0,0.10)] hover:-translate-y-0.5 transition-all duration-300 will-change-transform"
    >
      {/* Badge */}
      {idx < 2 && (
        <div className="absolute top-2.5 left-2.5 z-10">
          <span className="bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
            {idx === 0 ? "⭐ Destaque" : "🔥 Popular"}
          </span>
        </div>
      )}

      {/* Emoji area */}
      <div className={`relative h-28 bg-gradient-to-br ${grad} flex items-center justify-center overflow-hidden`}>
        <span className="text-5xl select-none drop-shadow-sm">{product.emoji}</span>
        <AnimatePresence>
          {qty > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
              className="absolute top-2 right-2 w-6 h-6 bg-emerald-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md"
            >
              {qty}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Info */}
      <div className="p-3.5">
        <p className="font-semibold text-slate-800 text-[13px] leading-snug truncate">{product.name}</p>
        <p className="text-emerald-600 font-bold text-sm mt-0.5">{fmt(product.price)}</p>

        <AnimatePresence mode="wait" initial={false}>
          {qty === 0 ? (
            <motion.button
              key="add" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              whileTap={{ scale: 0.95 }} onClick={handleAdd}
              className="mt-2.5 w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs py-2.5 rounded-2xl transition-colors flex items-center justify-center gap-1.5"
              aria-label={`Adicionar ${product.name} ao carrinho`}
            >
              <AnimatePresence mode="wait">
                {justAdded ? (
                  <motion.span key="ok" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className="flex items-center gap-1">
                    <Check size={13} strokeWidth={3} /> Adicionado!
                  </motion.span>
                ) : (
                  <motion.span key="plus-icon" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className="flex items-center gap-1">
                    <Plus size={13} strokeWidth={2.5} /> Adicionar
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          ) : (
            <motion.div
              key="ctrl" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              className="mt-2.5 flex items-center bg-emerald-50 rounded-2xl p-1"
            >
              <motion.button
                whileTap={{ scale: 0.85 }} onClick={() => onRemove(product.id)}
                className="flex-1 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-red-50 transition-colors"
                aria-label="Remover item"
              >
                <Minus size={13} strokeWidth={2.5} />
              </motion.button>
              <motion.span key={qty} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="w-8 text-center font-bold text-slate-800 text-sm">
                {qty}
              </motion.span>
              <motion.button
                whileTap={{ scale: 0.85 }} onClick={handleAdd}
                className="flex-1 h-8 rounded-xl bg-emerald-500 shadow-sm flex items-center justify-center text-white hover:bg-emerald-600 transition-colors"
                aria-label="Adicionar mais"
              >
                <Plus size={13} strokeWidth={2.5} />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.article>
  );
}

// ─── Cart Sheet (bottom mobile / right drawer desktop) ────────────────────────
function CartSheet({
  cart, onAdd, onRemove, onClose, onCheckout,
}: {
  cart: CartItem[];
  onAdd: (p: Product) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
  onCheckout: () => void;
}) {
  const total = cart.reduce((s, i) => s + i.product.price * i.qty, 0);
  const count = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[3px]"
        aria-label="Fechar sacola"
      />

      {/* Mobile: bottom sheet */}
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 32, stiffness: 320 }}
        className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-[2rem] shadow-[0_-20px_60px_rgb(0,0,0,0.15)] max-h-[85dvh] flex flex-col md:hidden"
        role="dialog" aria-modal="true" aria-label="Sacola de compras"
      >
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>
        <CartContent cart={cart} count={count} total={total} onAdd={onAdd} onRemove={onRemove} onClose={onClose} onCheckout={onCheckout} />
      </motion.div>

      {/* Desktop: right drawer */}
      <motion.div
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 32, stiffness: 320 }}
        className="hidden md:flex fixed right-0 top-0 bottom-0 z-50 bg-white shadow-[-20px_0_60px_rgb(0,0,0,0.08)] w-96 flex-col"
        role="dialog" aria-modal="true" aria-label="Sacola de compras"
      >
        <CartContent cart={cart} count={count} total={total} onAdd={onAdd} onRemove={onRemove} onClose={onClose} onCheckout={onCheckout} />
      </motion.div>
    </>
  );
}

function CartContent({
  cart, count, total, onAdd, onRemove, onClose, onCheckout,
}: {
  cart: CartItem[]; count: number; total: number;
  onAdd: (p: Product) => void; onRemove: (id: string) => void;
  onClose: () => void; onCheckout: () => void;
}) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
        <div>
          <h2 className="font-bold text-slate-800 text-base">Sua sacola</h2>
          <p className="text-slate-400 text-xs mt-0.5 font-light">{count} {count === 1 ? "item" : "itens"}</p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
          aria-label="Fechar"
        >
          <X size={16} />
        </button>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-5 py-2">
        <AnimatePresence initial={false}>
          {cart.map((item) => (
            <motion.div
              key={item.product.id} layout
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-2xl flex-shrink-0">
                {item.product.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-700 text-sm truncate">{item.product.name}</p>
                <p className="text-emerald-600 font-bold text-sm">{fmt(item.product.price * item.qty)}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <motion.button whileTap={{ scale: 0.85 }} onClick={() => onRemove(item.product.id)}
                  className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors"
                  aria-label="Remover"
                >
                  <Minus size={12} strokeWidth={2.5} />
                </motion.button>
                <span className="font-bold text-slate-800 text-sm w-5 text-center">{item.qty}</span>
                <motion.button whileTap={{ scale: 0.85 }} onClick={() => onAdd(item.product)}
                  className="w-7 h-7 rounded-xl bg-emerald-500 flex items-center justify-center text-white hover:bg-emerald-600 transition-colors"
                  aria-label="Adicionar"
                >
                  <Plus size={12} strokeWidth={2.5} />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-slate-100 flex-shrink-0">
        <div className="flex justify-between text-sm text-slate-500 mb-1">
          <span className="font-light">Subtotal</span><span className="font-medium">{fmt(total)}</span>
        </div>
        <div className="flex justify-between text-xs text-slate-400 mb-4">
          <span className="font-light">Taxa de entrega</span><span className="text-emerald-600 font-semibold">A combinar</span>
        </div>
        <motion.button
          whileTap={{ scale: 0.98 }} onClick={onCheckout}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-2xl text-sm transition-colors flex items-center justify-center gap-2 shadow-[0_8px_24px_rgb(16,185,129,0.3)]"
        >
          Finalizar pedido <ChevronRight size={16} strokeWidth={2.5} />
        </motion.button>
      </div>
    </>
  );
}

// ─── Checkout Field ────────────────────────────────────────────────────────────
function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-400 mb-1.5 block">
        {label} {required && <span className="text-red-400">*</span>}
        {!required && <span className="text-slate-300 font-light">(opcional)</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-slate-400 mt-1.5 font-light flex items-center gap-1">{hint}</p>}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function StoreClient({ storeId, instanceName, storeName, products }: Props) {
  const [ready, setReady] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [view, setView] = useState<View>("products");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [address, setAddress] = useState("");
  const [payment, setPayment] = useState<"dinheiro" | "pix">("pix");
  const [needChange, setNeedChange] = useState(false);
  const [changeFor, setChangeFor] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 250);
    return () => clearTimeout(t);
  }, []);

  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  const totalPrice = cart.reduce((s, i) => s + i.product.price * i.qty, 0);

  const addToCart = useCallback((product: Product) => {
    setCart(prev => {
      const ex = prev.find(i => i.product.id === product.id);
      if (ex) return prev.map(i => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { product, qty: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => {
      const ex = prev.find(i => i.product.id === productId);
      if (!ex) return prev;
      if (ex.qty === 1) return prev.filter(i => i.product.id !== productId);
      return prev.map(i => i.product.id === productId ? { ...i, qty: i.qty - 1 } : i);
    });
  }, []);

  async function handleSubmitOrder() {
    const phoneDigits = customerPhone.replace(/\D/g, "");
    if (phoneDigits.length < 8 || address.trim().length < 3) return;
    setSubmitting(true);
    try {
      const result = await createOrder({
        storeId, instanceName, storeName, customerPhone, customerName, address,
        items: cart.map(i => ({ name: i.product.name, emoji: i.product.emoji, price: i.product.price, qty: i.qty })),
        total: totalPrice, paymentMethod: payment, needChange,
        changeFor: needChange && changeFor ? parseFloat(changeFor.replace(",", ".")) : undefined,
      });
      setOrderId(result.orderId);
      setView("success");
    } catch {
      alert("Erro ao enviar pedido. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Products View ──────────────────────────────────────────────────────────
  if (view === "products") {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Glassmorphism Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-white/60 shadow-[0_1px_20px_rgb(0,0,0,0.04)]">
          <div className="px-5 py-4 flex items-center justify-between max-w-2xl mx-auto">
            <div>
              <h1 className="font-bold text-slate-800 text-xl leading-tight">{storeName}</h1>
              <p className="text-slate-400 text-[11px] mt-0.5 font-light tracking-wide">Cardápio Digital</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => totalItems > 0 && setShowCart(true)}
              className="relative w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
              aria-label={`Sacola com ${totalItems} itens`}
            >
              <ShoppingBag size={20} strokeWidth={2} />
              <AnimatePresence>
                {totalItems > 0 && (
                  <motion.span
                    initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </header>

        {/* Category nav — sticky below header */}
        <div className="sticky top-[73px] z-20 bg-white/80 backdrop-blur-md border-b border-slate-100/80">
          <div className="px-5 py-3 flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] max-w-2xl mx-auto">
            <button className="flex-shrink-0 bg-emerald-500 text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow-[0_2px_8px_rgb(16,185,129,0.3)]">
              Tudo
            </button>
          </div>
        </div>

        {/* Product grid */}
        <div className="px-4 py-5 pb-32 max-w-2xl mx-auto">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
              <div className="w-20 h-20 rounded-3xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex items-center justify-center text-4xl">🛍️</div>
              <div>
                <p className="font-bold text-slate-700 text-lg">Em breve!</p>
                <p className="text-slate-400 text-sm mt-1 font-light max-w-[220px]">Os produtos serão divulgados em breve.</p>
              </div>
            </div>
          ) : !ready ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: Math.min(products.length, 6) }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {products.map((p, i) => (
                <ProductCard
                  key={p.id} product={p} idx={i}
                  qty={cart.find(c => c.product.id === p.id)?.qty ?? 0}
                  onAdd={addToCart} onRemove={removeFromCart}
                />
              ))}
            </div>
          )}
        </div>

        {/* Floating cart bar */}
        <AnimatePresence>
          {totalItems > 0 && (
            <motion.div
              initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-0 inset-x-0 z-30 px-4 pb-6 pt-3 bg-gradient-to-t from-slate-100 via-slate-50/95"
            >
              <div className="max-w-2xl mx-auto">
                <motion.button
                  whileTap={{ scale: 0.98 }} onClick={() => setShowCart(true)}
                  className="w-full bg-slate-900 text-white font-bold py-4 rounded-3xl flex items-center justify-between px-5 shadow-[0_12px_40px_rgb(15,23,42,0.25)]"
                  aria-label={`Ver sacola — ${totalItems} itens — ${fmt(totalPrice)}`}
                >
                  <span className="bg-emerald-500 text-white text-xs font-bold rounded-xl px-2.5 py-1 min-w-[52px] text-center">
                    {totalItems} {totalItems === 1 ? "item" : "itens"}
                  </span>
                  <span className="text-sm font-semibold tracking-wide">Ver sacola</span>
                  <span className="text-emerald-400 font-bold">{fmt(totalPrice)}</span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cart Sheet / Drawer */}
        <AnimatePresence>
          {showCart && (
            <CartSheet
              cart={cart} onAdd={addToCart} onRemove={removeFromCart}
              onClose={() => setShowCart(false)}
              onCheckout={() => { setShowCart(false); setView("checkout"); }}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ─── Checkout View ──────────────────────────────────────────────────────────
  if (view === "checkout") {
    const phoneDigits = customerPhone.replace(/\D/g, "");
    const phoneOk = phoneDigits.length >= 8;
    const addressOk = address.trim().length >= 3;
    const canSubmit = phoneOk && addressOk;

    return (
      <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} className="min-h-screen bg-slate-50">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-[0_1px_20px_rgb(0,0,0,0.04)]">
          <div className="px-5 py-4 flex items-center gap-3 max-w-2xl mx-auto">
            <button
              onClick={() => setView("products")}
              className="w-9 h-9 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
              aria-label="Voltar"
            >
              <ChevronLeft size={18} />
            </button>
            <div>
              <h1 className="font-bold text-slate-800 text-base">Finalizar pedido</h1>
              <p className="text-slate-400 text-xs font-light">{totalItems} {totalItems === 1 ? "item" : "itens"} · {fmt(totalPrice)}</p>
            </div>
          </div>
        </header>

        <div className="px-4 py-5 pb-40 space-y-3 max-w-2xl mx-auto">
          {/* Customer */}
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
            <div className="px-5 pt-4 pb-1 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-2xl bg-emerald-100 flex items-center justify-center" aria-hidden>
                <Smartphone size={15} className="text-emerald-600" />
              </div>
              <p className="font-semibold text-slate-700 text-sm">Seus dados</p>
            </div>
            <div className="px-5 pb-4 pt-3 space-y-3">
              <Field label="Nome">
                <input
                  value={customerName} onChange={e => setCustomerName(e.target.value)}
                  placeholder="Seu nome completo" autoComplete="name"
                  className="w-full bg-slate-50 rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:bg-white transition-all"
                />
              </Field>
              <Field label="WhatsApp" required hint="📩 Você receberá a confirmação do pedido aqui">
                <input
                  value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="87 9 9999-9999" type="tel" autoComplete="tel"
                  className={`w-full bg-slate-50 rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 transition-all ${
                    customerPhone && !phoneOk
                      ? "ring-2 ring-red-300/60 bg-red-50/40 focus:ring-red-300/60"
                      : "focus:ring-emerald-400/40 focus:bg-white"
                  }`}
                  aria-invalid={customerPhone ? !phoneOk : undefined}
                />
              </Field>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
            <div className="px-5 pt-4 pb-1 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-2xl bg-blue-100 flex items-center justify-center" aria-hidden>
                <MapPin size={15} className="text-blue-500" />
              </div>
              <p className="font-semibold text-slate-700 text-sm">Endereço de entrega <span className="text-red-400">*</span></p>
            </div>
            <div className="px-5 pb-4 pt-3">
              <textarea
                value={address} onChange={e => setAddress(e.target.value)}
                placeholder="Rua, número, bairro, ponto de referência..." rows={3}
                autoComplete="street-address"
                className="w-full bg-slate-50 rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:bg-white transition-all resize-none"
              />
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
            <div className="px-5 pt-4 pb-1 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-2xl bg-violet-100 flex items-center justify-center" aria-hidden>
                <span className="text-sm">💳</span>
              </div>
              <div>
                <p className="font-semibold text-slate-700 text-sm">Pagamento na entrega</p>
                <p className="text-slate-400 text-[11px] font-light">Pague quando receber</p>
              </div>
            </div>
            <div className="px-5 pb-4 pt-3">
              <div className="grid grid-cols-2 gap-2 mb-3" role="radiogroup" aria-label="Forma de pagamento">
                {(["pix", "dinheiro"] as const).map((m) => (
                  <motion.button
                    key={m} whileTap={{ scale: 0.97 }}
                    onClick={() => { setPayment(m); if (m === "pix") setNeedChange(false); }}
                    role="radio" aria-checked={payment === m}
                    className={`py-3.5 rounded-2xl border-2 text-sm font-semibold transition-all flex flex-col items-center gap-1 ${
                      payment === m
                        ? "border-emerald-400 bg-emerald-50 text-emerald-700 shadow-[0_4px_16px_rgb(16,185,129,0.15)]"
                        : "border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200"
                    }`}
                  >
                    <span className="text-xl">{m === "pix" ? "📱" : "💵"}</span>
                    <span>{m === "pix" ? "PIX" : "Dinheiro"}</span>
                  </motion.button>
                ))}
              </div>

              <AnimatePresence>
                {payment === "dinheiro" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-slate-50 rounded-2xl p-3 space-y-3">
                      <button
                        onClick={() => setNeedChange(!needChange)}
                        className="flex items-center gap-2.5 text-sm text-slate-700 w-full text-left select-none"
                        aria-pressed={needChange}
                      >
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${needChange ? "bg-emerald-500 border-emerald-500" : "border-slate-300 bg-white"}`}>
                          {needChange && <Check size={11} strokeWidth={3} className="text-white" />}
                        </div>
                        Preciso de troco
                      </button>
                      <AnimatePresence>
                        {needChange && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <label className="text-xs text-slate-400 mb-1.5 block font-light" htmlFor="changeFor">Troco para quanto?</label>
                            <input
                              id="changeFor" value={changeFor} onChange={e => setChangeFor(e.target.value)}
                              placeholder="Ex: 50,00" type="number" inputMode="decimal"
                              className="w-full bg-white rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 border border-slate-200 transition-all"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Order summary */}
          <div className="bg-slate-900 rounded-3xl overflow-hidden">
            <div className="px-5 py-4">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-3">Resumo do pedido</p>
              <div className="space-y-2">
                {cart.map(item => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span className="text-slate-300 font-light flex items-center gap-1.5">
                      {item.product.emoji} {item.product.name}
                      <span className="text-slate-600 text-xs">×{item.qty}</span>
                    </span>
                    <span className="text-slate-300">{fmt(item.product.price * item.qty)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold border-t border-slate-700/80 pt-3 mt-1">
                  <span className="text-white">Total</span>
                  <span className="text-emerald-400 text-lg">{fmt(totalPrice)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed CTA */}
        <div className="fixed bottom-0 inset-x-0 px-4 pb-7 pt-3 bg-gradient-to-t from-slate-50 via-slate-50/95">
          <div className="max-w-2xl mx-auto">
            {!canSubmit && (
              <p className="text-center text-xs text-slate-400 mb-2.5 font-light">
                {!phoneOk && !addressOk ? "Preencha o WhatsApp e o endereço" : !phoneOk ? "Informe seu WhatsApp" : "Informe o endereço de entrega"}
              </p>
            )}
            <motion.button
              whileTap={{ scale: canSubmit ? 0.98 : 1 }}
              onClick={handleSubmitOrder}
              disabled={!canSubmit || submitting}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-4 rounded-3xl text-sm transition-all flex items-center justify-center gap-2 shadow-[0_8px_28px_rgb(16,185,129,0.35)] disabled:shadow-none"
              aria-label="Confirmar pedido"
            >
              {submitting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Enviando pedido...
                </>
              ) : (
                <>Confirmar pedido — {fmt(totalPrice)} <Check size={15} strokeWidth={3} /></>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }

  // ─── Success View ───────────────────────────────────────────────────────────
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-slate-50">
      <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10 text-center max-w-sm mx-auto">
        <motion.div
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 14, stiffness: 180, delay: 0.05 }}
          className="w-24 h-24 rounded-[2rem] bg-emerald-500 flex items-center justify-center mb-7 shadow-[0_20px_60px_rgb(16,185,129,0.45)]"
          aria-hidden
        >
          <Check size={46} strokeWidth={3} className="text-white" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
          <h1 className="text-2xl font-bold text-slate-800">Pedido confirmado!</h1>
          <p className="text-slate-400 text-sm mt-1 font-light">#{orderId.slice(-8).toUpperCase()}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }} className="w-full mt-7 space-y-3">
          <div className="bg-emerald-50 border border-emerald-200/80 rounded-3xl p-4 flex items-start gap-3 text-left">
            <span className="text-2xl flex-shrink-0" aria-hidden>📩</span>
            <div>
              <p className="font-semibold text-emerald-800 text-sm">Confirmação enviada!</p>
              <p className="text-emerald-700 text-xs mt-0.5 font-light">
                Mensagem enviada para <strong className="font-semibold">{customerPhone}</strong>
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.05)] p-4 text-left">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Itens</p>
            {cart.map(item => (
              <div key={item.product.id} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                <span className="text-sm text-slate-700 font-light flex items-center gap-2">
                  {item.product.emoji} {item.product.name}
                  <span className="text-slate-400 text-xs">×{item.qty}</span>
                </span>
                <span className="text-sm font-semibold text-slate-700">{fmt(item.product.price * item.qty)}</span>
              </div>
            ))}
            <div className="flex justify-between pt-3 mt-1">
              <span className="font-bold text-slate-700 text-sm">Total</span>
              <span className="font-bold text-emerald-600">{fmt(totalPrice)}</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.05)] p-4 text-left space-y-2.5">
            <div className="flex items-start gap-2 text-sm text-slate-600 font-light">
              <MapPin size={14} className="text-slate-400 mt-0.5 flex-shrink-0" aria-hidden />
              <span>{address}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500 font-light">
              <span aria-hidden>💳</span>
              <span>{payment === "pix" ? "PIX" : needChange && changeFor ? `Dinheiro — troco p/ R$ ${changeFor}` : "Dinheiro"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500 font-light">
              <span aria-hidden>🛵</span>
              <span>Em breve nosso entregador estará aí!</span>
            </div>
          </div>
        </motion.div>

        <motion.button
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
          onClick={() => { setCart([]); setView("products"); setOrderId(""); setCustomerPhone(""); setAddress(""); setCustomerName(""); }}
          className="mt-7 text-slate-400 text-sm font-light hover:text-slate-600 transition-colors flex items-center gap-2"
          aria-label="Fazer novo pedido"
        >
          <Package size={14} aria-hidden /> Fazer novo pedido
        </motion.button>
      </div>
    </motion.div>
  );
}
