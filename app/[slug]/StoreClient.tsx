"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createOrder } from "@/actions/order";
import {
  Sparkles, Search, X, Plus, Minus, ShoppingBag, ArrowRight, Tag,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface ProductOption {
  id: string;
  label: string;
  price: number;
}
interface Product {
  id: string;
  name: string;
  price: number;
  emoji: string;
  imageUrl?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  options?: ProductOption[] | null;
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
interface Category { id: string; name: string; emoji: string; }
type View = "products" | "checkout" | "success";
type PayMethod = "pix" | "dinheiro";
type DeliveryMethod = "DELIVERY" | "PICKUP" | "LOCAL";

function norm(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}
const fmt = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ─── Ambient Glows ───────────────────────────────────────────────────────────
function AmbientGlows() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      <div className="animate-glow-pulse absolute left-1/2 top-0 h-96 w-[120%] -translate-x-1/2 rounded-full"
        style={{ background: "hsl(var(--primary) / 0.10)", filter: "blur(80px)" }} />
      <div className="animate-glow-pulse absolute bottom-0 right-0 h-72 w-72 rounded-full"
        style={{ background: "hsl(var(--accent) / 0.08)", filter: "blur(80px)", animationDelay: "1.5s" }} />
    </div>
  );
}

// ─── Section Label ────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="flex items-center text-xs font-bold uppercase tracking-section text-muted-foreground">
      <span className="mr-2 text-primary">›</span>
      {children}
    </h2>
  );
}

// ─── Product Dialog (centered modal — igual ao redesign) ─────────────────────
function ProductDialog({
  product, onClose, onAddToCart,
}: {
  product: Product;
  onClose: () => void;
  onAddToCart: (product: Product, qty: number, selectedOptions: ProductOption[]) => void;
}) {
  const [qty, setQty] = useState(1);
  // single-select options (type: size) vs multi-select (type: addon)
  // Por ora: se price === 0 → radio; se price > 0 → checkbox
  const singleOpts = product.options?.filter(o => o.price === 0) ?? [];
  const multiOpts  = product.options?.filter(o => o.price > 0) ?? [];
  const [selectedSingle, setSelectedSingle] = useState<string | null>(
    singleOpts.length > 0 ? singleOpts[0].id : null
  );
  const [selectedMulti, setSelectedMulti] = useState<Set<string>>(new Set());

  const selectedOptions = [
    ...(selectedSingle ? singleOpts.filter(o => o.id === selectedSingle) : []),
    ...multiOpts.filter(o => selectedMulti.has(o.id)),
  ];
  const extrasTotal = selectedOptions.reduce((s, o) => s + o.price, 0);
  const total = (product.price + extrasTotal) * qty;

  function toggleMulti(id: string) {
    setSelectedMulti(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const hasOptions = (product.options?.length ?? 0) > 0;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-card border border-border/60"
        style={{ maxHeight: "90dvh", overflowY: "auto" }}
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 32, stiffness: 380 }}
        onClick={e => e.stopPropagation()}
      >
        {/* fechar */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-4" />
        </button>

        {/* imagem hero */}
        <div className="relative h-60 w-full overflow-hidden"
          style={{ background: "linear-gradient(to bottom, hsl(var(--primary) / 0.20), hsl(var(--card) / 0.8))" }}
        >
          <div aria-hidden
            className="animate-glow-pulse absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: "hsl(var(--primary) / 0.35)", filter: "blur(40px)" }}
          />
          {product.imageUrl
            ? <img src={product.imageUrl} alt={product.name}
                className="animate-float relative z-10 h-full w-full object-contain p-8 drop-shadow-[0_20px_40px_rgba(0,0,0,0.6)]" />
            : <span className="animate-float relative z-10 flex h-full items-center justify-center"
                style={{ fontSize: 96, lineHeight: 1 }}>{product.emoji}</span>
          }
          {/* badge */}
          {product.categoryName && (
            <span className="absolute left-5 top-5 z-20 rounded-full bg-primary px-3 py-1 text-[0.65rem] font-bold tracking-wide text-primary-foreground">
              {product.categoryName}
            </span>
          )}
        </div>

        {/* body */}
        <div className="px-6 pb-6">
          {/* título */}
          <div className="mt-4 text-center">
            <h2 className="font-display text-2xl font-extrabold text-foreground">{product.name}</h2>
          </div>

          {/* ── Opções single-select (variações sem custo, ex: tamanho) ── */}
          {singleOpts.length > 0 && (
            <div className="mt-5 grid grid-cols-3 gap-2">
              {singleOpts.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedSingle(opt.id)}
                  className={`rounded-xl border py-3 text-sm font-semibold transition-all ${
                    selectedSingle === opt.id
                      ? "border-primary/50 bg-gradient-to-br from-primary to-accent text-primary-foreground"
                      : "border-border/60 bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {/* ── Opções multi-select (adicionais com custo) ── */}
          {multiOpts.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-bold uppercase tracking-section text-muted-foreground">Adicionais</p>
              {multiOpts.map(opt => {
                const checked = selectedMulti.has(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleMulti(opt.id)}
                    className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
                      checked
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : "border-border/60 bg-secondary text-foreground"
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span className={checked ? "text-primary" : "text-muted-foreground"}>
                      {opt.price > 0 ? `+ ${fmt(opt.price)}` : "Grátis"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Price + info cards ── */}
          <div className={`mt-${hasOptions ? "3" : "5"} grid grid-cols-2 gap-2`}>
            <div className="rounded-xl border border-border/60 bg-secondary px-4 py-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Tag className="size-3.5 text-primary" />
                Preço
              </div>
              <div className="font-display mt-0.5 text-lg font-extrabold text-foreground">
                {fmt(product.price)}
              </div>
            </div>
            <div className="rounded-xl border border-border/60 bg-secondary px-4 py-3">
              <div className="text-xs text-muted-foreground">Categoria</div>
              <div className="font-display mt-0.5 text-base font-bold text-foreground line-clamp-1">
                {product.categoryName ?? "–"}
              </div>
            </div>
          </div>

          {/* ── Qty stepper ── */}
          <div className="mt-4 flex items-center justify-between rounded-xl border border-border/60 bg-secondary px-4 py-2.5">
            <span className="text-sm font-semibold text-foreground">Quantidade</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQty(q => Math.max(1, q - 1))}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-card/60 text-foreground transition-transform active:scale-90"
              >
                <Minus className="size-4" strokeWidth={2.5} />
              </button>
              <span className="w-6 text-center font-bold tabular-nums text-foreground">{qty}</span>
              <button
                type="button"
                onClick={() => setQty(q => q + 1)}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground transition-transform active:scale-90"
              >
                <Plus className="size-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* ── CTA ── */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => { onAddToCart(product, qty, selectedOptions); onClose(); }}
            className="glow-primary mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-primary to-accent py-4 text-base font-bold text-primary-foreground transition-transform active:scale-[0.98]"
          >
            <Sparkles className="size-5" />
            Adicionar {fmt(total)}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Cart Sheet (Bottom Sheet) ────────────────────────────────────────────────
function CartSheet({
  cart, products, onClose, onAdd, onRemove, onCheckout,
}: {
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
      <motion.div
        className="fixed inset-0 z-50"
        style={{ background: "rgba(0,0,0,0.60)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex max-w-lg flex-col overflow-hidden bg-card"
        style={{ borderRadius: "2rem 2rem 0 0", maxHeight: "85dvh" }}
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 32, stiffness: 360 }}
      >
        <div className="flex-shrink-0 px-6 pt-3 pb-4"
          style={{ borderBottom: "1px solid hsl(var(--border) / 0.5)" }}>
          <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="size-5 text-primary" />
              <h2 className="font-display text-xl font-extrabold text-foreground">Seu pedido</h2>
            </div>
            <span className="text-sm text-muted-foreground">
              {totalItems} {totalItems === 1 ? "item" : "itens"}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {cartItems.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Seu carrinho está vazio.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              <AnimatePresence initial={false}>
                {cartItems.map(({ product, qty }) => (
                  <motion.li
                    key={product.id}
                    layout
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-3 rounded-2xl border border-border/60 bg-secondary p-2 pr-3"
                  >
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-muted flex items-center justify-center">
                      {product.imageUrl
                        ? <img src={product.imageUrl} alt={product.name} className="h-full w-full object-contain p-1.5" />
                        : <span className="text-2xl">{product.emoji}</span>
                      }
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-bold text-foreground">{product.name}</p>
                      <p className="text-sm font-semibold text-primary">{fmt(product.price * qty)}</p>
                    </div>
                    <div className="flex items-center gap-1 rounded-xl bg-card/60 p-1">
                      <button onClick={() => onRemove(product)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-card active:scale-90">
                        <Minus className="size-4" strokeWidth={2.5} />
                      </button>
                      <span className="w-5 text-center text-sm font-bold tabular-nums text-foreground select-none">{qty}</span>
                      <button onClick={() => onAdd(product)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground transition-transform active:scale-90">
                        <Plus className="size-4" strokeWidth={2.5} />
                      </button>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="flex-shrink-0 px-6 py-5"
            style={{ borderTop: "1px solid hsl(var(--border) / 0.5)" }}>
            <div className="flex items-center justify-between">
              <span className="font-display text-lg font-extrabold text-foreground">Total</span>
              <span className="font-display text-2xl font-extrabold text-glow">{fmt(total)}</span>
            </div>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => { onClose(); onCheckout(); }}
              className="glow-primary mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-primary to-accent py-4 text-base font-bold text-primary-foreground"
            >
              <Sparkles className="size-5" />
              Confirmar pedido
            </motion.button>
          </div>
        )}
      </motion.div>
    </>
  );
}

// ─── Product Card (sem overflow-hidden no root para não cortar o stepper) ────
function ProductCard({
  product, qty, onOpen, onAdd, onRemove,
}: {
  product: Product;
  qty: number;
  onOpen: () => void;
  onAdd: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      className={`animate-rise group relative flex flex-col rounded-3xl border bg-card transition-all duration-300 hover:-translate-y-1 ${
        qty > 0
          ? "border-primary/50 glow-primary"
          : "border-border/60 hover:border-primary/50"
      }`}
    >
      {/* image — overflow-hidden apenas aqui */}
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Ver ${product.name}`}
        className="relative aspect-square w-full overflow-hidden rounded-t-3xl"
      >
        <div aria-hidden className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, hsl(var(--primary) / 0.15), transparent 60%, hsl(var(--card)))" }} />
        <div aria-hidden
          className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: "hsl(var(--primary) / 0.25)", filter: "blur(22px)" }} />
        {product.imageUrl
          ? <img src={product.imageUrl} alt={product.name}
              className="relative z-10 h-full w-full object-contain p-4 drop-shadow-[0_10px_25px_rgba(0,0,0,0.45)] transition-transform duration-500 group-hover:scale-110" />
          : <span className="relative z-10 flex h-full items-center justify-center transition-transform duration-500 group-hover:scale-110"
              style={{ fontSize: 48, lineHeight: 1 }}>{product.emoji}</span>
        }
      </button>

      {/* body */}
      <div className="flex flex-1 flex-col p-4 pt-2">
        <button type="button" onClick={onOpen} className="text-left">
          <h3 className="font-display line-clamp-1 text-base font-bold leading-tight text-foreground">
            {product.name}
          </h3>
        </button>

        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="font-display text-lg font-extrabold text-foreground shrink-0">
            {fmt(product.price)}
          </span>

          {qty === 0 ? (
            <button type="button" onClick={onAdd}
              aria-label={`Adicionar ${product.name}`}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground transition-transform active:scale-90">
              <Plus className="size-5" strokeWidth={2.5} />
            </button>
          ) : (
            <div
              className="glow-primary flex shrink-0 items-center gap-1 rounded-xl bg-secondary p-1"
              onClick={e => e.stopPropagation()}
            >
              <button type="button" onClick={onRemove}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-card/60 active:scale-90">
                <Minus className="size-4" strokeWidth={2.5} />
              </button>
              <span className="min-w-[1.25rem] text-center text-sm font-bold tabular-nums text-foreground select-none">{qty}</span>
              <button type="button" onClick={onAdd}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground transition-transform active:scale-90">
                <Plus className="size-4" strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Featured Carousel ────────────────────────────────────────────────────────
function FeaturedCarousel({
  featured, onOpenProduct, onAdd,
}: {
  featured: Product[];
  onOpenProduct: (p: Product) => void;
  onAdd: (p: Product) => void;
}) {
  if (featured.length === 0) return null;

  return (
    <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 scrollbar-hide sm:mx-0 sm:px-0 sm:overflow-visible sm:snap-none">
      {featured.map((p, i) => (
        <article key={p.id}
          className="animate-rise group relative w-[82%] shrink-0 snap-center overflow-hidden rounded-[1.75rem] border border-border/60 bg-gradient-to-br from-card to-background cursor-pointer sm:w-[calc(50%-8px)] sm:shrink-0"
          style={{ animationDelay: `${i * 80}ms` }}
          onClick={() => onOpenProduct(p)}
        >
          <div aria-hidden className="animate-glow-pulse absolute -right-10 -top-10 h-48 w-48 rounded-full"
            style={{ background: "hsl(var(--primary) / 0.25)", filter: "blur(60px)" }} />

          <div className="relative h-44 w-full overflow-hidden">
            {p.imageUrl
              ? <img src={p.imageUrl} alt={p.name}
                  className="animate-float h-full w-full object-contain p-5 drop-shadow-[0_18px_35px_rgba(0,0,0,0.55)] transition-transform duration-500 group-hover:scale-105" />
              : <span className="animate-float flex h-full items-center justify-center transition-transform duration-500 group-hover:scale-105"
                  style={{ fontSize: 96, lineHeight: 1 }}>{p.emoji}</span>
            }
          </div>

          <div className="relative px-5 pb-5">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-primary-foreground">
                {i === 0 ? "Destaque" : "Popular"}
              </span>
            </div>
            <h3 className="font-display mt-3 text-xl font-extrabold leading-tight text-foreground">{p.name}</h3>
            <div className="mt-4 flex items-center justify-between">
              <span className="font-display text-2xl font-extrabold text-glow">{fmt(p.price)}</span>
              <button type="button"
                onClick={e => { e.stopPropagation(); onAdd(p); }}
                className="glow-primary flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-accent px-4 py-2.5 text-sm font-bold text-primary-foreground transition-transform active:scale-95">
                <Plus className="size-4" strokeWidth={2.5} />
                Adicionar
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

// ─── Floating Cart Bar ────────────────────────────────────────────────────────
function FloatingCartBar({
  cart, products, onOpenCart,
}: {
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
          className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-5"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 380 }}
        >
          <div className="glow-primary glass pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-3xl border border-primary/30 p-2 pl-4">
            <div className="relative">
              <ShoppingBag className="size-7 text-primary" />
              <span className="absolute -right-2 -top-2 flex min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[0.7rem] font-bold text-primary-foreground">
                {count}
              </span>
            </div>
            <div className="flex-1 leading-tight">
              <p className="text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
                {count} {count === 1 ? "item" : "itens"}
              </p>
              <p className="font-display text-lg font-extrabold text-foreground">{fmt(total)}</p>
            </div>
            <button type="button" onClick={onOpenCart}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-br from-primary to-accent px-5 py-3.5 text-sm font-bold text-primary-foreground transition-transform active:scale-95">
              Finalizar
              <ArrowRight className="size-4" strokeWidth={2.5} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Products View ────────────────────────────────────────────────────────────
function ProductsView({
  storeName, logoUrl, products, dbCategories, cart,
  onOpenProduct, onAdd, onRemove, onOpenCart,
}: {
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

  return (
    <>
      <AmbientGlows />
      <div className="mx-auto w-full max-w-lg px-4 pb-36">

        {/* Header */}
        <header className="relative flex flex-col items-center pt-10 text-center">
          <div aria-hidden className="animate-glow-pulse pointer-events-none absolute -top-10 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full"
            style={{ background: "hsl(var(--primary) / 0.22)", filter: "blur(60px)" }} />
          <div className="relative">
            {logoUrl
              ? <img src={logoUrl} alt={storeName} className="glow-primary animate-float h-20 w-20 rounded-3xl object-cover" />
              : <div className="glow-primary animate-float grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-primary to-accent">
                  <Sparkles className="size-9 text-primary-foreground" strokeWidth={2.2} />
                </div>
            }
          </div>
          <h1 className="font-display mt-5 text-balance text-3xl font-extrabold tracking-tight text-foreground">
            {storeName}
          </h1>
          <div className="glass mt-5 flex items-center justify-center gap-2 rounded-full border border-border/60 px-5 py-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
            <span className="text-sm font-semibold text-foreground">Em funcionamento</span>
          </div>
        </header>

        {/* Search */}
        <div className="group relative mt-7">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5">
            <Search className="size-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
          </div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar produto..."
            aria-label="Buscar produto"
            className="glass h-14 w-full rounded-2xl border border-border/60 pl-12 pr-12 text-base text-foreground outline-none placeholder:text-muted-foreground transition-all focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} aria-label="Limpar busca"
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-muted-foreground transition-colors hover:text-foreground">
              <X className="size-5" />
            </button>
          )}
        </div>

        {/* Categories */}
        {visibleCategories.length > 0 && (
          <div className="mt-6">
            <SectionLabel>Categorias</SectionLabel>
            <div className="-mx-1 mt-3 flex flex-nowrap gap-3 overflow-x-auto px-1 pb-2 scrollbar-hide sm:flex-wrap sm:overflow-visible sm:pb-0">
              {[{ id: "all", label: "Tudo", emoji: "✦" }, ...visibleCategories.map(c => ({ id: c.id, label: c.name, emoji: c.emoji }))].map(cat => (
                <button key={cat.id} onClick={() => setActiveCat(cat.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold whitespace-nowrap transition-all ${
                    activeCat === cat.id
                      ? "glow-primary border-primary/50 bg-gradient-to-br from-primary to-accent text-primary-foreground"
                      : "glass border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  <span className="text-base leading-none">{cat.emoji}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Featured */}
        {featured.length > 0 && (
          <section className="mt-7">
            <SectionLabel>Em destaque</SectionLabel>
            <div className="mt-3">
              <FeaturedCarousel featured={featured} onOpenProduct={onOpenProduct} onAdd={onAdd} />
            </div>
          </section>
        )}

        {/* Grid */}
        <section className="mt-7">
          <SectionLabel>
            {activeCat === "all" ? "Cardápio" : dbCategories.find(c => c.id === activeCat)?.name ?? "Produtos"}
            <span className="ml-2 font-normal normal-case tracking-normal text-muted-foreground/70">
              {filtered.length} {filtered.length === 1 ? "produto" : "produtos"}
            </span>
          </SectionLabel>

          {filtered.length === 0 ? (
            <p className="mt-8 text-center text-sm text-muted-foreground">Nenhum produto encontrado.</p>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
              {filtered.map((p, i) => (
                <motion.div key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.2) }}
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
          )}
        </section>
      </div>

      <FloatingCartBar cart={cart} products={products} onOpenCart={onOpenCart} />
    </>
  );
}

// ─── Checkout View ────────────────────────────────────────────────────────────
function CheckoutView({
  cart, products, storeId, instanceName, storeName,
  acceptsPickup, acceptsLocal, onBack, onSuccess,
}: {
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
        items: cartItems.map(i => ({
          name: i.product.name, emoji: i.product.emoji,
          price: i.product.price, qty: i.qty,
        })),
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
            <input className={`s-input with-prefix${errors.phone ? " error" : ""}`} value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, ""))} placeholder="87988444564"
              inputMode="tel" maxLength={11} />
          </div>
          {errors.phone && <span className="s-field-error">{errors.phone}</span>}
        </div>

        {deliveryMethod === "DELIVERY" && (
          <div className="s-field">
            <label className="s-field-label">Endereço de entrega</label>
            <input className={`s-input${errors.address ? " error" : ""}`} value={address}
              onChange={e => setAddress(e.target.value)} placeholder="Rua, número, bairro" />
            {errors.address && <span className="s-field-error">{errors.address}</span>}
          </div>
        )}

        {deliveryMethod === "LOCAL" && (
          <div className="s-field">
            <label className="s-field-label">Identificador <span style={{ opacity: 0.5, fontWeight: 400 }}>(opcional)</span></label>
            <input className="s-input" value={localIdentifier}
              onChange={e => setLocalIdentifier(e.target.value)} placeholder="Ex: Mesa 2, Comanda 10..." />
          </div>
        )}

        <div className="s-field">
          <label className="s-field-label">Forma de pagamento</label>
          <div className="s-payment-opts">
            {([["pix", "💳 PIX"], ["dinheiro", "💵 Dinheiro"]] as [PayMethod, string][]).map(([val, label]) => (
              <button key={val} className={`s-pay-opt${payMethod === val ? " selected" : ""}`}
                onClick={() => setPayMethod(val)} role="radio" aria-checked={payMethod === val}>
                <span className="s-pay-radio" /><span className="s-pay-label">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {payMethod === "dinheiro" && (
          <div className="s-field">
            <label className="s-field-label">Troco para (opcional)</label>
            <input className="s-input" value={changeFor}
              onChange={e => setChangeFor(e.target.value.replace(/[^\d.,]/g, ""))}
              placeholder="Ex: 50,00" inputMode="decimal" />
          </div>
        )}

        <button className="s-submit-btn" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "ENVIANDO…" : "CONFIRMAR PEDIDO →"}
        </button>
      </div>
    </div>
  );
}

// ─── Success View ─────────────────────────────────────────────────────────────
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

// ─── Root Component ───────────────────────────────────────────────────────────
export function StoreClient({
  storeId, instanceName, storeName, logoUrl,
  products, categories, acceptsPickup, acceptsLocal, theme,
}: Props) {
  const [view, setView] = useState<View>("products");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [dialogProduct, setDialogProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  function addToCart(p: Product) {
    setCart(c => ({ ...c, [p.id]: (c[p.id] ?? 0) + 1 }));
  }
  function addQtyToCart(p: Product, qty: number, _selectedOptions: ProductOption[]) {
    // options afetam o preço no dialog mas o carrinho armazena apenas qty base
    // (implementação completa de options no carrinho em fase futura)
    setCart(c => ({ ...c, [p.id]: (c[p.id] ?? 0) + qty }));
  }
  function removeFromCart(p: Product) {
    setCart(c => {
      const next = { ...c };
      const qty = (next[p.id] ?? 0) - 1;
      if (qty <= 0) delete next[p.id]; else next[p.id] = qty;
      return next;
    });
  }
  function resetCart() { setCart({}); setView("products"); }

  return (
    <div className="store-root relative min-h-screen overflow-x-hidden" data-theme={theme}>
      {view === "products" && (
        <ProductsView
          storeName={storeName} logoUrl={logoUrl}
          products={products} dbCategories={categories}
          cart={cart}
          onOpenProduct={setDialogProduct}
          onAdd={addToCart} onRemove={removeFromCart}
          onOpenCart={() => setCartOpen(true)}
        />
      )}
      {view === "checkout" && (
        <CheckoutView
          cart={cart} products={products}
          storeId={storeId} instanceName={instanceName}
          storeName={storeName}
          acceptsPickup={acceptsPickup} acceptsLocal={acceptsLocal}
          onBack={() => setView("products")}
          onSuccess={() => setView("success")}
        />
      )}
      {view === "success" && <SuccessView onBack={resetCart} />}

      {/* Product Dialog */}
      <AnimatePresence>
        {dialogProduct && (
          <ProductDialog
            key="product-dialog"
            product={dialogProduct}
            onClose={() => setDialogProduct(null)}
            onAddToCart={addQtyToCart}
          />
        )}
      </AnimatePresence>

      {/* Cart Sheet */}
      <AnimatePresence>
        {cartOpen && (
          <CartSheet
            key="cart-sheet"
            cart={cart} products={products}
            onClose={() => setCartOpen(false)}
            onAdd={addToCart} onRemove={removeFromCart}
            onCheckout={() => setView("checkout")}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
