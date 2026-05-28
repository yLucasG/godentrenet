"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
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

// ─── Search normalization (strips diacritics) ───────────────────────────────
function norm(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// ─── Icons ──────────────────────────────────────────────────────────────────
function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>
    </svg>
  );
}
function CartIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4h2l2.5 11h11l2-8H6"/><circle cx="9" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/>
    </svg>
  );
}

// ─── Corner brackets ────────────────────────────────────────────────────────
function Corners() {
  return (
    <>
      <div className="corner tl" />
      <div className="corner tr" />
      <div className="corner bl" />
      <div className="corner br" />
    </>
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

// ─── Featured card ───────────────────────────────────────────────────────────
function FeaturedCard({
  product, tag, onAdd, qty,
}: {
  product: Product; tag: string; onAdd: () => void; qty: number;
}) {
  return (
    <div className="s-feat-card">
      <div className="s-feat-art">
        {product.imageUrl
          ? <img src={product.imageUrl} alt={product.name} className="s-feat-img" />
          : <span className="s-feat-emoji">{product.emoji}</span>
        }
        <div className="scan-overlay" />
      </div>
      <div className="s-feat-body">
        <span className="s-tag-pill">{tag}</span>
        <div className="s-feat-name">{product.name}</div>
        <div className="s-feat-foot">
          <Price value={product.price} />
          <button className="s-btn-add" onClick={onAdd} aria-label={`Adicionar ${product.name}`}>
            {qty > 0
              ? <span className="s-qty mono">×{qty}</span>
              : <><span style={{ fontSize: 14 }}>+</span><span>ADICIONAR</span></>
            }
          </button>
        </div>
      </div>
      <Corners />
    </div>
  );
}

// ─── Product card ────────────────────────────────────────────────────────────
function ProductCard({
  product, onAdd, qty,
}: {
  product: Product; onAdd: () => void; qty: number;
}) {
  return (
    <div className={`s-prod-card${qty > 0 ? " in-cart" : ""}`}>
      <div className="s-prod-art">
        {product.imageUrl
          ? <img src={product.imageUrl} alt={product.name} className="s-prod-img" />
          : <span className="s-prod-emoji">{product.emoji}</span>
        }
        <div className="scan-overlay" />
      </div>
      <div className="s-prod-body">
        <div className="s-prod-name">{product.name}</div>
        <div className="s-prod-foot">
          <Price value={product.price} sm />
          <button className="s-btn-add sm" onClick={onAdd} aria-label={`Adicionar ${product.name}`}>
            {qty > 0
              ? <span className="s-qty mono">×{qty}</span>
              : <span style={{ fontSize: 20, lineHeight: 1 }}>+</span>
            }
          </button>
        </div>
      </div>
      <Corners />
    </div>
  );
}

// ─── Cart bar ────────────────────────────────────────────────────────────────
function CartBar({
  cart, products, onCheckout,
}: {
  cart: Record<string, number>;
  products: Product[];
  onCheckout: () => void;
}) {
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const total = Object.entries(cart).reduce((sum, [id, q]) => {
    const p = products.find(x => x.id === id);
    return sum + (p ? p.price * q : 0);
  }, 0);

  return (
    <div className={`s-cart-bar${count > 0 ? " visible" : ""}`} aria-hidden={count === 0}>
      <div className="s-cart-info">
        <span className="s-cart-icon"><CartIcon /></span>
        <div className="s-cart-lines">
          <span className="s-cart-count mono">{String(count).padStart(2, "0")} ITENS</span>
          <span className="s-cart-total mono">R$ {total.toFixed(2).replace(".", ",")}</span>
        </div>
      </div>
      <button className="s-cart-cta" onClick={onCheckout} aria-label="Finalizar pedido">
        FINALIZAR →
      </button>
    </div>
  );
}

// ─── Products view ───────────────────────────────────────────────────────────
function ProductsView({
  storeName, logoUrl, products, dbCategories, cart, onAdd, onCheckout,
}: {
  storeName: string;
  logoUrl: string | null;
  products: Product[];
  dbCategories: Category[];
  cart: Record<string, number>;
  onAdd: (p: Product) => void;
  onCheckout: () => void;
}) {
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("all");
  const chipRowRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const syncArrows = useCallback(() => {
    const el = chipRowRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    syncArrows();
    const el = chipRowRef.current;
    if (!el) return;
    const ro = new ResizeObserver(syncArrows);
    ro.observe(el);
    return () => ro.disconnect();
  }, [syncArrows]);

  function scrollChips(dir: "left" | "right") {
    const el = chipRowRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "right" ? 200 : -200, behavior: "smooth" });
  }

  // Only show categories that have at least one product
  const visibleCategories = useMemo(() => {
    const usedIds = new Set(products.map(p => p.categoryId).filter(Boolean));
    return dbCategories.filter(c => usedIds.has(c.id));
  }, [products, dbCategories]);

  // Featured = first 2 products (only in "all" view with no search)
  const featured = activeCat === "all" && !search.trim()
    ? products.slice(0, 2)
    : [];

  const filtered = useMemo(() => {
    let list = products.filter(p => !featured.includes(p));
    if (activeCat !== "all") list = list.filter(p => p.categoryId === activeCat);
    if (search.trim()) {
      const q = norm(search);
      list = list.filter(p => norm(p.name).includes(q));
    }
    return list;
  }, [products, featured, activeCat, search]);

  const activeCatLabel = visibleCategories.find(c => c.id === activeCat)?.name ?? "TODOS OS PRODUTOS";
  const initials = storeName.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();

  return (
    <>
      <div className="store-scroll">
        {/* Header */}
        <header className="store-header">
          <div className="store-header-center">
            <div className="logo-wrap">
              {logoUrl
                ? <img src={logoUrl} alt={storeName} className="logo-img" />
                : <div className="logo-fallback">{initials}</div>
              }
            </div>
            <div className="store-brand">{storeName}</div>
          </div>
          <div className="store-ticker">
            <span className="ticker-dot" />
            <span className="mono">EM FUNCIONAMENTO</span>
          </div>
        </header>

        {/* Search */}
        <div className="store-search">
          <SearchIcon />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar produto…"
            aria-label="Buscar produto"
          />
        </div>

        {/* Categories — only shown when store has DB categories with products */}
        {visibleCategories.length > 0 && (
          <div className="s-cats">
            <div className="s-section-head" style={{ padding: "6px 18px 12px", marginBottom: 0, borderBottom: 0 }}>
              <span className="s-section-label mono">› CATEGORIAS</span>
            </div>
            <div className="s-chip-wrap">
              {canLeft && (
                <button className="s-chip-arrow s-chip-arrow--left" onClick={() => scrollChips("left")} aria-label="Anterior">
                  ‹
                </button>
              )}
              <div className="s-chip-row" ref={chipRowRef} onScroll={syncArrows}>
                <button
                  className={`s-chip${activeCat === "all" ? " active" : ""}`}
                  onClick={() => setActiveCat("all")}
                >
                  <span className="s-chip-icon">🛍️</span>
                  <span>TUDO</span>
                </button>
                {visibleCategories.map(cat => (
                  <button
                    key={cat.id}
                    className={`s-chip${activeCat === cat.id ? " active" : ""}`}
                    onClick={() => setActiveCat(cat.id)}
                  >
                    <span className="s-chip-icon">{cat.emoji}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
              {canRight && (
                <button className="s-chip-arrow s-chip-arrow--right" onClick={() => scrollChips("right")} aria-label="Próximo">
                  ›
                </button>
              )}
            </div>
          </div>
        )}

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
                  qty={cart[p.id] ?? 0}
                />
              ))}
            </div>
          </section>
        )}

        {filtered.length === 0 && featured.length === 0 && (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-mute)", fontSize: 14 }}>
            Nenhum produto encontrado.
          </div>
        )}
      </div>

      <CartBar cart={cart} products={products} onCheckout={onCheckout} />
    </>
  );
}

// ─── Checkout view ───────────────────────────────────────────────────────────
function CheckoutView({
  cart, products, storeId, instanceName, storeName, acceptsPickup, acceptsLocal, onBack, onSuccess,
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
      {/* Header */}
      <div className="s-checkout-head">
        <button className="s-back-btn" onClick={onBack} aria-label="Voltar">←</button>
        <div>
          <div className="s-checkout-title">Finalizar pedido</div>
          <div className="s-checkout-sub mono">CONFIRME SEUS DADOS</div>
        </div>
      </div>

      {/* Order summary */}
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
        <Corners />
      </div>

      {/* Form */}
      <div className="s-form">
        {/* Delivery method selector */}
        {(acceptsPickup || acceptsLocal) && (
          <div className="s-field">
            <label className="s-field-label">Como quer receber?</label>
            <div className="s-payment-opts">
              <button
                className={`s-pay-opt${deliveryMethod === "DELIVERY" ? " selected" : ""}`}
                onClick={() => setDeliveryMethod("DELIVERY")}
                role="radio"
                aria-checked={deliveryMethod === "DELIVERY"}
              >
                <span className="s-pay-radio" />
                <span className="s-pay-label">🛵 Receber em casa</span>
              </button>
              {acceptsPickup && (
                <button
                  className={`s-pay-opt${deliveryMethod === "PICKUP" ? " selected" : ""}`}
                  onClick={() => setDeliveryMethod("PICKUP")}
                  role="radio"
                  aria-checked={deliveryMethod === "PICKUP"}
                >
                  <span className="s-pay-radio" />
                  <span className="s-pay-label">🏪 Vou retirar</span>
                </button>
              )}
              {acceptsLocal && (
                <button
                  className={`s-pay-opt${deliveryMethod === "LOCAL" ? " selected" : ""}`}
                  onClick={() => setDeliveryMethod("LOCAL")}
                  role="radio"
                  aria-checked={deliveryMethod === "LOCAL"}
                >
                  <span className="s-pay-radio" />
                  <span className="s-pay-label">📍 Estou no local</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Phone */}
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

        {/* Address — only for DELIVERY */}
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

        {/* Local identifier — only for LOCAL */}
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

        {/* Payment */}
        <div className="s-field">
          <label className="s-field-label">Forma de pagamento</label>
          <div className="s-payment-opts">
            {([
              ["pix", "💳 PIX"],
              ["dinheiro", "💵 Dinheiro"],
            ] as [PayMethod, string][]).map(([val, label]) => (
              <button
                key={val}
                className={`s-pay-opt${payMethod === val ? " selected" : ""}`}
                onClick={() => setPayMethod(val)}
                role="radio"
                aria-checked={payMethod === val}
              >
                <span className="s-pay-radio" />
                <span className="s-pay-label">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Troco */}
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

        <button
          className="s-submit-btn"
          onClick={handleSubmit}
          disabled={submitting}
        >
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
        <div className="s-success-sub mono">
          AGUARDE A CONFIRMAÇÃO VIA WHATSAPP
        </div>
        <button className="s-success-back" onClick={onBack}>
          Voltar à loja
        </button>
        <Corners />
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
