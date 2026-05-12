"use client";

import { useState } from "react";
import { createOrder } from "@/actions/order";

interface Product {
  id: string;
  name: string;
  price: number;
  emoji: string;
}

interface CartItem {
  product: Product;
  qty: number;
}

type View = "products" | "cart" | "checkout" | "success";

interface Props {
  storeId: string;
  instanceName: string;
  storeName: string;
  products: Product[];
}

function fmt(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function PhoneIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function BagIcon({ count }: { count: number }) {
  return (
    <div className="relative">
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
          {count}
        </span>
      )}
    </div>
  );
}

function ArrowLeft({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-5">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      {label}
    </button>
  );
}

export function StoreClient({ storeId, instanceName, storeName, products }: Props) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [view, setView] = useState<View>("products");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [address, setAddress] = useState("");
  const [payment, setPayment] = useState<"dinheiro" | "pix">("pix");
  const [needChange, setNeedChange] = useState(false);
  const [changeFor, setChangeFor] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState("");

  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  const totalPrice = cart.reduce((s, i) => s + i.product.price * i.qty, 0);

  function addToCart(product: Product) {
    setCart((prev) => {
      const ex = prev.find((i) => i.product.id === product.id);
      if (ex) return prev.map((i) => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { product, qty: 1 }];
    });
  }

  function removeFromCart(productId: string) {
    setCart((prev) => {
      const ex = prev.find((i) => i.product.id === productId);
      if (!ex) return prev;
      if (ex.qty === 1) return prev.filter((i) => i.product.id !== productId);
      return prev.map((i) => i.product.id === productId ? { ...i, qty: i.qty - 1 } : i);
    });
  }

  function getQty(productId: string) {
    return cart.find((i) => i.product.id === productId)?.qty ?? 0;
  }

  async function handleSubmitOrder() {
    if (!customerPhone || !address) return;
    setSubmitting(true);
    try {
      const result = await createOrder({
        storeId, instanceName, storeName, customerPhone, customerName, address,
        items: cart.map((i) => ({ name: i.product.name, emoji: i.product.emoji, price: i.product.price, qty: i.qty })),
        total: totalPrice, paymentMethod: payment, needChange,
        changeFor: needChange && changeFor ? parseFloat(changeFor.replace(",", ".")) : undefined,
      });
      setOrderId(result.orderId);
      setView("success");
    } catch (err) {
      alert("Erro ao enviar pedido. Tente novamente.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  const Header = ({ showBag = false }: { showBag?: boolean }) => (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-5 pt-10 pb-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-orange-400 text-xs font-semibold tracking-widest uppercase mb-1">Cardápio</p>
          <h1 className="text-white text-2xl font-bold leading-tight">{storeName}</h1>
          {view === "products" && (
            <p className="text-gray-400 text-xs mt-1">{products.length} {products.length === 1 ? "item disponível" : "itens disponíveis"}</p>
          )}
        </div>
        {showBag && totalItems > 0 && (
          <button onClick={() => setView("cart")} className="mt-1">
            <BagIcon count={totalItems} />
          </button>
        )}
      </div>
    </div>
  );

  // ─── PRODUCTS VIEW ───────────────────────────────────────────────────────────
  if (view === "products") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header showBag />

        <div className="flex-1 px-4 py-5 pb-32">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-4xl mb-4">🛍️</div>
              <p className="font-semibold text-gray-700 text-lg">Em breve!</p>
              <p className="text-gray-400 text-sm mt-1 max-w-xs">Os produtos deste estabelecimento serão divulgados em breve.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {products.map((product) => {
                const qty = getQty(product.id);
                return (
                  <div key={product.id} className="bg-white rounded-2xl shadow-sm overflow-hidden flex items-stretch">
                    <div className="w-24 bg-orange-50 flex items-center justify-center text-4xl flex-shrink-0">
                      {product.emoji}
                    </div>
                    <div className="flex-1 p-4 flex flex-col justify-between min-h-[80px]">
                      <div>
                        <p className="font-semibold text-gray-800 text-sm leading-snug">{product.name}</p>
                        <p className="text-orange-500 font-bold text-base mt-0.5">{fmt(product.price)}</p>
                      </div>
                      <div className="flex justify-end mt-2">
                        {qty === 0 ? (
                          <button
                            onClick={() => addToCart(product)}
                            className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-sm font-semibold px-5 py-1.5 rounded-xl transition-all"
                          >
                            Adicionar
                          </button>
                        ) : (
                          <div className="flex items-center gap-3 bg-orange-50 rounded-xl px-3 py-1.5">
                            <button
                              onClick={() => removeFromCart(product.id)}
                              className="w-6 h-6 rounded-lg bg-orange-500 text-white font-bold text-sm flex items-center justify-center active:scale-95"
                            >
                              −
                            </button>
                            <span className="font-bold text-gray-800 text-sm w-4 text-center">{qty}</span>
                            <button
                              onClick={() => addToCart(product)}
                              className="w-6 h-6 rounded-lg bg-orange-500 text-white font-bold text-sm flex items-center justify-center active:scale-95"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {totalItems > 0 && (
          <div className="fixed bottom-0 left-0 right-0 px-4 pb-5 pt-2 bg-gradient-to-t from-gray-50 via-gray-50">
            <button
              onClick={() => setView("cart")}
              className="w-full bg-gray-900 hover:bg-gray-800 active:scale-[0.98] text-white font-bold py-4 rounded-2xl flex items-center justify-between px-5 transition-all shadow-xl"
            >
              <span className="bg-orange-500 text-white text-xs font-bold rounded-lg w-7 h-7 flex items-center justify-center">
                {totalItems}
              </span>
              <span className="text-sm">Ver sacola</span>
              <span className="text-orange-400 font-bold">{fmt(totalPrice)}</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // ─── CART VIEW ────────────────────────────────────────────────────────────────
  if (view === "cart") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 px-4 py-5 pb-36">
          <ArrowLeft onClick={() => setView("products")} label="Continuar comprando" />
          <h2 className="text-lg font-bold text-gray-800 mb-4">Sua sacola</h2>

          <div className="space-y-3">
            {cart.map((item) => (
              <div key={item.product.id} className="bg-white rounded-2xl shadow-sm flex items-center overflow-hidden">
                <div className="w-16 h-16 bg-orange-50 flex items-center justify-center text-3xl flex-shrink-0">
                  {item.product.emoji}
                </div>
                <div className="flex-1 px-3 py-3">
                  <p className="font-semibold text-gray-800 text-sm">{item.product.name}</p>
                  <p className="text-orange-500 font-bold text-sm mt-0.5">{fmt(item.product.price * item.qty)}</p>
                </div>
                <div className="flex items-center gap-2 pr-3">
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-sm flex items-center justify-center"
                  >−</button>
                  <span className="w-5 text-center font-bold text-gray-800 text-sm">{item.qty}</span>
                  <button
                    onClick={() => addToCart(item.product)}
                    className="w-7 h-7 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm flex items-center justify-center"
                  >+</button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-4 mt-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal ({totalItems} {totalItems === 1 ? "item" : "itens"})</span>
                <span>{fmt(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-400">
                <span>Taxa de entrega</span>
                <span className="text-green-600 font-medium">A combinar</span>
              </div>
              <div className="border-t border-gray-100 pt-3 mt-1 flex justify-between font-bold text-gray-800">
                <span>Total</span>
                <span className="text-orange-500">{fmt(totalPrice)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 px-4 pb-5 pt-2 bg-gradient-to-t from-gray-50 via-gray-50">
          <button
            onClick={() => setView("checkout")}
            className="w-full bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-bold py-4 rounded-2xl text-sm transition-all shadow-xl"
          >
            Ir para o checkout — {fmt(totalPrice)}
          </button>
        </div>
      </div>
    );
  }

  // ─── CHECKOUT VIEW ────────────────────────────────────────────────────────────
  if (view === "checkout") {
    const canSubmit = customerPhone.replace(/\D/g, "").length >= 10 && address.trim().length > 5;

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 px-4 py-5 pb-40">
          <ArrowLeft onClick={() => setView("cart")} label="Voltar para a sacola" />
          <h2 className="text-lg font-bold text-gray-800 mb-5">Finalizar pedido</h2>

          {/* Dados pessoais */}
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-3">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-xl bg-orange-100 flex items-center justify-center text-orange-500">
                <PhoneIcon />
              </div>
              <p className="font-semibold text-gray-800 text-sm">Seus dados</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Nome <span className="text-gray-300">(opcional)</span></label>
                <input
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:bg-white transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                  WhatsApp <span className="text-red-400">*</span>
                </label>
                <input
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="(87) 9 9999-9999"
                  type="tel"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:bg-white transition-colors"
                />
                <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                  <span>📩</span> Confirmaremos seu pedido aqui
                </p>
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-3">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-xl bg-orange-100 flex items-center justify-center text-orange-500">
                <MapPinIcon />
              </div>
              <p className="font-semibold text-gray-800 text-sm">Endereço de entrega <span className="text-red-400">*</span></p>
            </div>
            <textarea
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Rua e número, bairro, ponto de referência..."
              rows={3}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:bg-white transition-colors resize-none"
            />
          </div>

          {/* Pagamento */}
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-3">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-xl bg-orange-100 flex items-center justify-center">
                <span className="text-sm">💳</span>
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">Pagamento na entrega</p>
                <p className="text-xs text-gray-400">Pague quando receber</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              {(["pix", "dinheiro"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => { setPayment(m); if (m === "pix") setNeedChange(false); }}
                  className={`py-3.5 rounded-xl border-2 text-sm font-semibold transition-all flex flex-col items-center gap-1 ${
                    payment === m
                      ? "border-orange-400 bg-orange-50 text-orange-700"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  <span className="text-xl">{m === "pix" ? "📱" : "💵"}</span>
                  <span>{m === "pix" ? "PIX" : "Dinheiro"}</span>
                </button>
              ))}
            </div>

            {payment === "dinheiro" && (
              <div className="bg-gray-50 rounded-xl p-3 space-y-3">
                <label className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer select-none">
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${needChange ? "bg-orange-500 border-orange-500" : "border-gray-300"}`}
                    onClick={() => setNeedChange(!needChange)}>
                    {needChange && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  Preciso de troco
                </label>
                {needChange && (
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">Troco para quanto?</label>
                    <input
                      value={changeFor}
                      onChange={e => setChangeFor(e.target.value)}
                      placeholder="Ex: 50,00"
                      type="number"
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-400 transition-colors"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Resumo */}
          <div className="bg-gray-900 rounded-2xl p-4">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Resumo do pedido</p>
            {cart.map((item) => (
              <div key={item.product.id} className="flex justify-between text-sm text-gray-300 mb-2">
                <span className="flex items-center gap-1.5">{item.product.emoji} {item.product.name} <span className="text-gray-500">×{item.qty}</span></span>
                <span>{fmt(item.product.price * item.qty)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-white border-t border-gray-700 pt-3 mt-2">
              <span>Total</span>
              <span className="text-orange-400">{fmt(totalPrice)}</span>
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 px-4 pb-5 pt-2 bg-gradient-to-t from-gray-50 via-gray-50">
          {!canSubmit && (
            <p className="text-center text-xs text-gray-400 mb-2">Preencha o WhatsApp e o endereço para continuar</p>
          )}
          <button
            onClick={handleSubmitOrder}
            disabled={!canSubmit || submitting}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 active:scale-[0.98] text-white font-bold py-4 rounded-2xl text-sm transition-all shadow-xl"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Enviando pedido...
              </span>
            ) : `Confirmar pedido — ${fmt(totalPrice)}`}
          </button>
        </div>
      </div>
    );
  }

  // ─── SUCCESS VIEW ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-5 pt-10 pb-8">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-3xl mb-4 shadow-lg">
            ✓
          </div>
          <h1 className="text-white text-2xl font-bold">Pedido confirmado!</h1>
          <p className="text-gray-400 text-sm mt-1">#{orderId.slice(-8).toUpperCase()}</p>
        </div>
      </div>

      <div className="flex-1 px-4 py-5 space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-2xl">📩</span>
          <div>
            <p className="font-semibold text-green-800 text-sm">Confirmação enviada!</p>
            <p className="text-green-700 text-xs mt-0.5">
              Uma mensagem foi enviada para <strong>{customerPhone}</strong> com os detalhes do seu pedido.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Itens do pedido</p>
          <div className="space-y-2.5">
            {cart.map((item) => (
              <div key={item.product.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{item.product.emoji}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-700">{item.product.name}</p>
                    <p className="text-xs text-gray-400">quantidade: {item.qty}</p>
                  </div>
                </div>
                <span className="font-bold text-gray-800 text-sm">{fmt(item.product.price * item.qty)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 mt-4 pt-3 flex justify-between">
            <span className="font-bold text-gray-700 text-sm">Total</span>
            <span className="font-bold text-orange-500">{fmt(totalPrice)}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-2.5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Detalhes</p>
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <MapPinIcon />
            <span>{address}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>💳</span>
            <span>{payment === "pix" ? "PIX" : needChange && changeFor ? `Dinheiro — troco para R$ ${changeFor}` : "Dinheiro"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>🛵</span>
            <span>Em breve nosso entregador estará aí!</span>
          </div>
        </div>

        <button
          onClick={() => { setCart([]); setView("products"); setOrderId(""); setCustomerPhone(""); setAddress(""); setCustomerName(""); }}
          className="w-full py-3.5 rounded-2xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all"
        >
          Fazer novo pedido
        </button>
      </div>
    </div>
  );
}
