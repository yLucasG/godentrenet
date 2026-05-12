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

export function StoreClient({ storeId, instanceName, storeName, products }: Props) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [view, setView] = useState<View>("products");

  // Checkout form state
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
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) return prev.map((i) => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { product, qty: 1 }];
    });
  }

  function removeFromCart(productId: string) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === productId);
      if (!existing) return prev;
      if (existing.qty === 1) return prev.filter((i) => i.product.id !== productId);
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
        storeId,
        instanceName,
        storeName,
        customerPhone,
        customerName,
        address,
        items: cart.map((i) => ({
          name: i.product.name,
          emoji: i.product.emoji,
          price: i.product.price,
          qty: i.qty,
        })),
        total: totalPrice,
        paymentMethod: payment,
        needChange,
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

  // ─── PRODUCTS VIEW ───────────────────────────────────────────────────────────
  if (view === "products") {
    return (
      <div className="pb-32">
        {products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-3">🛍️</p>
            <p className="text-amber-800 font-semibold text-lg">Em breve!</p>
            <p className="text-amber-600 text-sm mt-1">Produtos serão divulgados em breve.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 p-4">
            {products.map((product) => {
              const qty = getQty(product.id);
              return (
                <div key={product.id} className="bg-white rounded-2xl shadow border border-amber-100 overflow-hidden flex flex-col">
                  <div className="bg-amber-50 flex items-center justify-center text-5xl py-5">
                    {product.emoji}
                  </div>
                  <div className="p-3 flex flex-col gap-1 flex-1">
                    <p className="font-semibold text-gray-800 text-sm leading-tight">{product.name}</p>
                    <p className="text-amber-700 font-bold text-sm">{fmt(product.price)}</p>
                    {qty === 0 ? (
                      <button
                        onClick={() => addToCart(product)}
                        className="mt-auto w-full bg-amber-600 hover:bg-amber-500 text-white rounded-xl py-1.5 text-sm font-medium transition-colors"
                      >
                        Adicionar
                      </button>
                    ) : (
                      <div className="mt-auto flex items-center justify-between bg-amber-50 rounded-xl px-2 py-1">
                        <button onClick={() => removeFromCart(product.id)} className="w-7 h-7 rounded-full bg-amber-600 text-white font-bold text-base flex items-center justify-center">−</button>
                        <span className="font-bold text-amber-800">{qty}</span>
                        <button onClick={() => addToCart(product)} className="w-7 h-7 rounded-full bg-amber-600 text-white font-bold text-base flex items-center justify-center">+</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalItems > 0 && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-amber-100 shadow-lg">
            <button
              onClick={() => setView("cart")}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3.5 rounded-2xl flex items-center justify-between px-5 text-sm transition-colors"
            >
              <span className="bg-amber-800 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">{totalItems}</span>
              <span>Ver sacola</span>
              <span>{fmt(totalPrice)}</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // ─── CART VIEW ────────────────────────────────────────────────────────────────
  if (view === "cart") {
    return (
      <div className="pb-32">
        <div className="p-4 space-y-3">
          <button onClick={() => setView("products")} className="text-amber-700 text-sm flex items-center gap-1">
            ← Continuar comprando
          </button>
          <h2 className="text-lg font-bold text-gray-800">Sua sacola</h2>

          {cart.map((item) => (
            <div key={item.product.id} className="bg-white rounded-2xl p-4 shadow border border-amber-100 flex items-center gap-3">
              <span className="text-3xl">{item.product.emoji}</span>
              <div className="flex-1">
                <p className="font-semibold text-gray-800 text-sm">{item.product.name}</p>
                <p className="text-amber-700 text-sm font-bold">{fmt(item.product.price * item.qty)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => removeFromCart(item.product.id)} className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 font-bold text-base flex items-center justify-center">−</button>
                <span className="w-5 text-center font-bold text-gray-800">{item.qty}</span>
                <button onClick={() => addToCart(item.product)} className="w-7 h-7 rounded-full bg-amber-600 text-white font-bold text-base flex items-center justify-center">+</button>
              </div>
            </div>
          ))}

          <div className="bg-white rounded-2xl p-4 shadow border border-amber-100">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Subtotal</span><span>{fmt(totalPrice)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500 mb-3">
              <span>Taxa de entrega</span><span className="text-amber-600">A definir</span>
            </div>
            <div className="flex justify-between font-bold text-gray-800 border-t border-amber-100 pt-3">
              <span>Total</span><span>{fmt(totalPrice)}</span>
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-amber-100 shadow-lg">
          <button
            onClick={() => setView("checkout")}
            className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3.5 rounded-2xl text-sm transition-colors"
          >
            Fechar pedido — {fmt(totalPrice)}
          </button>
        </div>
      </div>
    );
  }

  // ─── CHECKOUT VIEW ────────────────────────────────────────────────────────────
  if (view === "checkout") {
    const canSubmit = customerPhone.replace(/\D/g, "").length >= 10 && address.trim().length > 5;

    return (
      <div className="pb-36">
        <div className="p-4 space-y-4">
          <button onClick={() => setView("cart")} className="text-amber-700 text-sm flex items-center gap-1">
            ← Voltar para sacola
          </button>
          <h2 className="text-lg font-bold text-gray-800">Finalizar pedido</h2>

          {/* Dados do cliente */}
          <div className="bg-white rounded-2xl p-4 shadow border border-amber-100 space-y-3">
            <p className="font-semibold text-gray-700 text-sm">Seus dados</p>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Nome (opcional)</label>
              <input
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Seu nome"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">WhatsApp <span className="text-red-400">*</span></label>
              <input
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                placeholder="(87) 99999-9999"
                type="tel"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400"
              />
              <p className="text-xs text-gray-400 mt-1">Você receberá a confirmação aqui</p>
            </div>
          </div>

          {/* Endereço */}
          <div className="bg-white rounded-2xl p-4 shadow border border-amber-100 space-y-3">
            <p className="font-semibold text-gray-700 text-sm">📍 Endereço de entrega</p>
            <textarea
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Rua, número, bairro, referência..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 resize-none"
            />
          </div>

          {/* Pagamento */}
          <div className="bg-white rounded-2xl p-4 shadow border border-amber-100 space-y-3">
            <p className="font-semibold text-gray-700 text-sm">💳 Forma de pagamento</p>
            <p className="text-xs text-gray-400">O pagamento é feito na entrega</p>

            <div className="grid grid-cols-2 gap-2">
              {(["pix", "dinheiro"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => { setPayment(m); if (m === "pix") setNeedChange(false); }}
                  className={`py-3 rounded-xl border-2 text-sm font-medium transition-colors ${payment === m ? "border-amber-500 bg-amber-50 text-amber-800" : "border-gray-200 text-gray-600"}`}
                >
                  {m === "pix" ? "📱 PIX" : "💵 Dinheiro"}
                </button>
              ))}
            </div>

            {payment === "dinheiro" && (
              <div>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={needChange}
                    onChange={e => setNeedChange(e.target.checked)}
                    className="w-4 h-4 accent-amber-500"
                  />
                  Precisa de troco
                </label>
                {needChange && (
                  <div className="mt-2">
                    <label className="text-xs text-gray-500 mb-1 block">Troco para quanto?</label>
                    <input
                      value={changeFor}
                      onChange={e => setChangeFor(e.target.value)}
                      placeholder="Ex: 50,00"
                      type="number"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Resumo */}
          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
            <p className="font-semibold text-amber-800 text-sm mb-2">Resumo do pedido</p>
            {cart.map((item) => (
              <div key={item.product.id} className="flex justify-between text-xs text-gray-600 mb-1">
                <span>{item.product.emoji} {item.product.name} x{item.qty}</span>
                <span>{fmt(item.product.price * item.qty)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-amber-800 border-t border-amber-200 pt-2 mt-2">
              <span>Total</span><span>{fmt(totalPrice)}</span>
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-amber-100 shadow-lg">
          <button
            onClick={handleSubmitOrder}
            disabled={!canSubmit || submitting}
            className="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-gray-300 disabled:text-gray-400 text-white font-bold py-3.5 rounded-2xl text-sm transition-colors"
          >
            {submitting ? "Enviando pedido..." : `Finalizar pedido — ${fmt(totalPrice)}`}
          </button>
          {!canSubmit && (
            <p className="text-center text-xs text-gray-400 mt-2">Preencha WhatsApp e endereço</p>
          )}
        </div>
      </div>
    );
  }

  // ─── SUCCESS VIEW ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="text-7xl mb-6">🎉</div>
      <h2 className="text-2xl font-bold text-amber-800 mb-2">Pedido enviado!</h2>
      <p className="text-gray-600 mb-2">
        Você receberá a confirmação no WhatsApp <strong>{customerPhone}</strong>.
      </p>
      <p className="text-gray-500 text-sm mb-8">Em breve nosso entregador estará aí! 🛵</p>

      <div className="bg-white rounded-2xl p-5 shadow border border-amber-100 w-full max-w-xs text-left mb-6">
        <p className="font-semibold text-gray-700 text-sm mb-3">Resumo</p>
        {cart.map((item) => (
          <div key={item.product.id} className="flex justify-between text-sm text-gray-600 mb-1">
            <span>{item.product.emoji} {item.product.name} x{item.qty}</span>
            <span>{fmt(item.product.price * item.qty)}</span>
          </div>
        ))}
        <div className="flex justify-between font-bold text-amber-800 border-t border-amber-100 pt-2 mt-2">
          <span>Total</span><span>{fmt(totalPrice)}</span>
        </div>
        <p className="text-xs text-gray-400 mt-3">📍 {address}</p>
        <p className="text-xs text-gray-400">💳 {payment === "pix" ? "PIX" : needChange ? `Dinheiro — troco para ${changeFor}` : "Dinheiro"}</p>
      </div>

      <button
        onClick={() => { setCart([]); setView("products"); setOrderId(""); setCustomerPhone(""); setAddress(""); }}
        className="text-amber-700 text-sm hover:underline"
      >
        Fazer novo pedido
      </button>
      <p className="text-xs text-gray-400 mt-1">Pedido #{orderId.slice(-6).toUpperCase()}</p>
    </div>
  );
}
