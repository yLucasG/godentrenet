"use client";

import { useState, useMemo } from "react";
import { createOrder } from "@/actions/order";

// ─── Types ─────────────────────────────────────────────────────────────────
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
}
type View = "products" | "checkout" | "success";
type PayMethod = "pix" | "dinheiro";
type DeliveryMethod = "DELIVERY" | "PICKUP" | "LOCAL";

function norm(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// ─── Icons ──────────────────────────────────────────────────────────────────
function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
    </svg>
  );
}

// ─── Price display ───────────────────────────────────────────────────────────
function Price({ value, sm }: { value: number; sm?: boolean }) {
  return (
    <div className={`s-price mono${sm ? " sm" : ""}`}>
      <span className="s-price-cur">R$</span>
      <span className="s-price-val">{value.toFixed(2).replace(".", ",")}</span>
    </div>
  );
}

// ─── Qty Stepper — inline ± controls ────────────────────────────────────────
function QtyStepper({ qty, onAdd, onRemove, sm }: {
  qty: number; onAdd: () => void; onRemove: () => void; sm?: boolean;
}) {
  const btn = sm
    ? "w-7 h-7 text-sm rounded-full flex items-center justify-center font-bold transition-all active:scale-90"
    : "w-8 h-8 text-base rounded-full flex items-center justify-center font-bold transition-all active:scale-90";
  const num = sm ? "w-5 text-xs" : "w-6 text-sm";
  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={e => { e.stopPropagation(); onRemove(); }}
        className={`${btn} bg-gray-100 text-gray-700 hover:bg-gray-200`}
        aria-label="Remover"
      >
        −
      </button>
      <span className={`${num} text-center font-bold text-gray-900 tabular-nums`}>{qty}</span>
      <button
        onClick={e => { e.stopPropagation(); onAdd(); }}
        className={`${btn} text-white hover:opacity-90`}
        style={{ background: "var(--primary)" }}
        aria-label="Adicionar"
      >
        +
      </button>
    </div>
  );
}

// ─── Featured card ───────────────────────────────────────────────────────────
function FeaturedCard({ product, tag, onAdd, onRemove, qty }: {
  product: Product; tag: string; onAdd: () => void; onRemove: () => void; qty: number;
}) {
  return (
    <div className="s-feat-card">
      <div className="s-feat-art">
        {product.imageUrl
          ? <img src={product.imageUrl} alt={product.name} className="s-feat-img" />
          : <span className="s-feat-emoji">{product.emoji}</span>
        }
      </div>
      <div className="s-feat-body">
        <span className="s-tag-pill">{tag}</span>
        <div className="s-feat-name">{product.name}</div>
        <div className="s-feat-foot">
          <Price value={product.price} />
          {qty > 0
            ? <QtyStepper qty={qty} onAdd={onAdd} onRemove={onRemove} />
            : (
              <button className="s-btn-add" onClick={onAdd} aria-label={`Adicionar ${product.name}`}>
                <span style={{ fontSize: 14 }}>+</span><span>ADICIONAR</span>
              </button>
            )
          }
        </div>
      </div>
    </div>
  );
}

// ─── Product card ────────────────────────────────────────────────────────────
function ProductCard({ product, onAdd, onRemove, qty }: {
  product: Product; onAdd: () => void; onRemove: () => void; qty: number;
}) {
  return (
    <div className={`s-prod-card${qty > 0 ? " in-cart" : ""}`}>
      <div className="s-prod-art">
        {product.imageUrl
          ? <img src={product.imageUrl} alt={product.name} className="s-prod-img" />
          : <span className="s-prod-emoji">{product.emoji}</span>
        }
      </div>
      <div className="s-prod-body">
        <div className="s-prod-name">{product.name}</div>
        <div className="s-prod-foot">
          <Price value={product.price} sm />
          {qty > 0
            ? <QtyStepper qty={qty} onAdd={onAdd} onRemove={onRemove} sm />
            : (
              <button className="s-btn-add sm" onClick={onAdd} aria-label={`Adicionar ${product.name}`}>
                <span style={{ fontSize: 20, lineHeight: 1 }}>+</span>
              </button>
            )
          }
        </div>
      </div>
    </div>
  );
}

// ─── Floating Cart Bar (dark glass pill) ─────────────────────────────────────
function FloatingCartBar({ cart, products, onCheckout }: {
  cart: Record<string, number>;
  products: Product[];
  onCheckout: () => void;
}) {
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const total = Object.entries(cart).reduce((sum, [id, q]) => {
    const p = products.find(x => x.id === id);
    return sum + (p ? p.price * q : 0);
  }, 0);

  if (count === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-50">
      <button
        onClick={onCheckout}
        aria-label="Ver carrinho"
        className="w-full flex justify-between items-center px-5 py-3.5 rounded-full text-white transition-transform active:scale-[0.98]"
        style={{
          background: "rgba(26,26,26,0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          boxShadow: "0 20px 48px -8px rgba(0,0,0,0.45)",
        }}
      >
        <div className="flex items-center gap-3">
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full min-w-[28px] text-center"
            style={{ background: "rgba(255,255,255,0.18)" }}
          >
            {count}
          </span>
          <span className="text-sm font-semibold tracking-tight">Ver Carrinho</span>
        </div>
        <span className="font-bold text-sm tracking-tight">
          R$ {total.toFixed(2).replace(".", ",")}
        </span>
      </button>
    </div>
  );
}

// ─── Products view ───────────────────────────────────────────────────────────
function ProductsView({ storeName, logoUrl, products, dbCategories, cart, onAdd, onRemove, onCheckout }: {
  storeName: string;
  logoUrl: string | null;
  products: Product[];
  dbCategories: Category[];
  cart: Record<string, number>;
  onAdd: (p: Product) => void;
  onRemove: (p: Product) => void;
  onCheckout: () => void;
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
      <header className="sticky top-0 z-40" style={{ background: "rgba(255,255,255,0.72)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        {/* Store identity */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <div className="shrink-0">
            {logoUrl
              ? <img src={logoUrl} alt={storeName} className="w-10 h-10 rounded-full object-cover" style={{ boxShadow: "0 0 0 2px rgba(0,0,0,0.06)" }} />
              : <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: "var(--surface-tint)", color: "var(--primary)" }}>{initials}</div>
            }
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-gray-900 text-base leading-tight truncate">{storeName}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" style={{ boxShadow: "0 0 6px rgba(52,211,153,0.7)", animation: "s-pulse 1.6s ease-in-out infinite" }} />
              <span className="text-[11px] text-gray-400 font-medium">Em funcionamento</span>
            </div>
          </div>
        </div>

        {/* Search pill */}
        <div className="px-4 pb-3">
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
              <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600 leading-none text-lg shrink-0" aria-label="Limpar busca">×</button>
            )}
          </div>
        </div>

        {/* Category pills — horizontal scroll */}
        {visibleCategories.length > 0 && (
          <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveCat("all")}
              className="shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold whitespace-nowrap transition-colors"
              style={activeCat === "all" ? { background: "#0f172a", color: "#fff" } : { background: "rgba(0,0,0,0.06)", color: "#6b7280" }}
            >
              🛍️ Tudo
            </button>
            {visibleCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCat(cat.id)}
                className="shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold whitespace-nowrap transition-colors"
                style={activeCat === cat.id ? { background: "#0f172a", color: "#fff" } : { background: "rgba(0,0,0,0.06)", color: "#6b7280" }}
              >
                {cat.emoji} {cat.name}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ── Scrollable content ── */}
      <div className="store-scroll">
        {/* Featured */}
        {featured.length > 0 && (
          <section className="s-section">
            <div className="s-section-head">
              <span className="s-section-label mono">› EM DESTAQUE</span>
            </div>
            <div className="s-feat-row">
              {featured.map((p, i) => (
                <FeaturedCard
                  key={p.id}
                  product={p}
                  tag={i === 0 ? "DESTAQUE" : "POPULAR"}
                  onAdd={() => onAdd(p)}
                  onRemove={() => onRemove(p)}
                  qty={cart[p.id] ?? 0}
                />
              ))}
            </div>
          </section>
        )}

        {/* Product grid */}
        {filtered.length > 0 && (
          <section className="s-section">
            <div className="s-section-head">
              <span className="s-section-label mono">
                › {activeCat === "all" ? "TODOS OS PRODUTOS" : activeCatLabel.toUpperCase()}
              </span>
              <span className="s-section-count mono">{filtered.length} ITENS</span>
            </div>
            <div className="s-prod-grid">
              {filtered.map(p => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onAdd={() => onAdd(p)}
                  onRemove={() => onRemove(p)}
                  qty={cart[p.id] ?? 0}
                />
              ))}
            </div>
          </section>
        )}

        {filtered.length === 0 && featured.length === 0 && (
          <div className="text-center py-16 px-6" style={{ color: "var(--text-mute)", fontSize: 14 }}>
            Nenhum produto encontrado.
          </div>
        )}
      </div>

      <FloatingCartBar cart={cart} products={products} onCheckout={onCheckout} />
    </>
  );
}

// ─── Checkout view ───────────────────────────────────────────────────────────
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
  const fmt = (n: number) => `R$ ${n.toFixed(2).replace(".", ",")}`;

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
        storeId,
        instanceName,
        storeName,
        customerPhone: phone,
        address: deliveryMethod === "DELIVERY" ? address.trim() : "",
        items: cartItems.map(i => ({
          name: i.product.name,
          emoji: i.product.emoji,
          price: i.product.price,
          qty: i.qty,
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
              {i.product.name}
              <span className="s-order-item-qty">×{i.qty}</span>
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
              <button
                className={`s-pay-opt${deliveryMethod === "DELIVERY" ? " selected" : ""}`}
                onClick={() => setDeliveryMethod("DELIVERY")}
                role="radio" aria-checked={deliveryMethod === "DELIVERY"}
              >
                <span className="s-pay-radio" />
                <span className="s-pay-label">🛵 Receber em casa</span>
              </button>
              {acceptsPickup && (
                <button
                  className={`s-pay-opt${deliveryMethod === "PICKUP" ? " selected" : ""}`}
                  onClick={() => setDeliveryMethod("PICKUP")}
                  role="radio" aria-checked={deliveryMethod === "PICKUP"}
                >
                  <span className="s-pay-radio" />
                  <span className="s-pay-label">🏪 Vou retirar</span>
                </button>
              )}
              {acceptsLocal && (
                <button
                  className={`s-pay-opt${deliveryMethod === "LOCAL" ? " selected" : ""}`}
                  onClick={() => setDeliveryMethod("LOCAL")}
                  role="radio" aria-checked={deliveryMethod === "LOCAL"}
                >
                  <span className="s-pay-radio" />
                  <span className="s-pay-label">📍 Estou no local</span>
                </button>
              )}
            </div>
          </div>
        )}

        <div className="s-field">
          <label className="s-field-label">WhatsApp</label>
          <div className="s-field-row">
            <span className="s-field-prefix mono">+55</span>
            <input
              className={`s-input with-prefix${errors.phone ? " error" : ""}`}
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, ""))}
              placeholder="87988444564"
              inputMode="tel"
              maxLength={11}
            />
          </div>
          {errors.phone && <span className="s-field-error">{errors.phone}</span>}
        </div>

        {deliveryMethod === "DELIVERY" && (
          <div className="s-field">
            <label className="s-field-label">Endereço de entrega</label>
            <input
              className={`s-input${errors.address ? " error" : ""}`}
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Rua, número, bairro"
            />
            {errors.address && <span className="s-field-error">{errors.address}</span>}
          </div>
        )}

        {deliveryMethod === "LOCAL" && (
          <div className="s-field">
            <label className="s-field-label">Identificador <span style={{ opacity: 0.5, fontWeight: 400 }}>(opcional)</span></label>
            <input
              className="s-input"
              value={localIdentifier}
              onChange={e => setLocalIdentifier(e.target.value)}
              placeholder="Ex: Mesa 2, Comanda 10, Provador 3..."
            />
          </div>
        )}

        <div className="s-field">
          <label className="s-field-label">Forma de pagamento</label>
          <div className="s-payment-opts">
            {([ ["pix", "💳 PIX"], ["dinheiro", "💵 Dinheiro"] ] as [PayMethod, string][]).map(([val, label]) => (
              <button
                key={val}
                className={`s-pay-opt${payMethod === val ? " selected" : ""}`}
                onClick={() => setPayMethod(val)}
                role="radio" aria-checked={payMethod === val}
              >
                <span className="s-pay-radio" />
                <span className="s-pay-label">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {payMethod === "dinheiro" && (
          <div className="s-field">
            <label className="s-field-label">Troco para (opcional)</label>
            <input
              className="s-input"
              value={changeFor}
              onChange={e => setChangeFor(e.target.value.replace(/[^\d.,]/g, ""))}
              placeholder="Ex: 50,00"
              inputMode="decimal"
            />
          </div>
        )}

        <button className="s-submit-btn" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "ENVIANDO…" : "CONFIRMAR PEDIDO →"}
        </button>
      </div>
    </div>
  );
}

// ─── Success view ────────────────────────────────────────────────────────────
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

// ─── Root component ──────────────────────────────────────────────────────────
export function StoreClient({ storeId, instanceName, storeName, logoUrl, products, categories, acceptsPickup, acceptsLocal }: Props) {
  const [view, setView] = useState<View>("products");
  const [cart, setCart] = useState<Record<string, number>>({});

  function addToCart(p: Product) {
    setCart(c => ({ ...c, [p.id]: (c[p.id] ?? 0) + 1 }));
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
    <div className="store-root">
      {view === "products" && (
        <ProductsView
          storeName={storeName}
          logoUrl={logoUrl}
          products={products}
          dbCategories={categories}
          cart={cart}
          onAdd={addToCart}
          onRemove={removeFromCart}
          onCheckout={() => setView("checkout")}
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
    </div>
  );
}
