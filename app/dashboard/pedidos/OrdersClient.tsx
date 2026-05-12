"use client";

import { useState, useTransition } from "react";
import { updateOrderStatus, getStoreOrders } from "@/actions/orders-dashboard";

type Order = {
  id: string;
  customerName: string | null;
  customerPhone: string;
  address: string;
  items: { name: string; emoji: string; price: number; qty: number }[];
  total: number;
  paymentMethod: "pix" | "dinheiro";
  needChange: boolean;
  changeFor: number | null;
  status: string;
  createdAt: string;
};

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending:    { label: "Pendente",          color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/30" },
  preparing:  { label: "Em preparo",        color: "text-blue-400",   bg: "bg-blue-400/10 border-blue-400/30" },
  delivering: { label: "Saiu p/ entrega",   color: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/30" },
  delivered:  { label: "Entregue",          color: "text-green-400",  bg: "bg-green-400/10 border-green-400/30" },
  cancelled:  { label: "Cancelado",         color: "text-red-400",    bg: "bg-red-400/10 border-red-400/30" },
};

const NEXT_STATUS: Record<string, string | null> = {
  pending:    "preparing",
  preparing:  "delivering",
  delivering: "delivered",
  delivered:  null,
  cancelled:  null,
};

const NEXT_LABEL: Record<string, string> = {
  pending:    "→ Iniciar preparo",
  preparing:  "→ Saiu para entrega",
  delivering: "→ Marcar como entregue",
};

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "agora mesmo";
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function OrdersClient({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [filter, setFilter] = useState<string>("active");
  const [isPending, startTransition] = useTransition();
  const [refreshing, setRefreshing] = useState(false);

  const activeStatuses = ["pending", "preparing", "delivering"];
  const filtered = filter === "active"
    ? orders.filter((o) => activeStatuses.includes(o.status))
    : filter === "done"
    ? orders.filter((o) => o.status === "delivered" || o.status === "cancelled")
    : orders;

  const pendingCount = orders.filter((o) => o.status === "pending").length;

  function handleAdvance(orderId: string, nextStatus: string) {
    startTransition(async () => {
      await updateOrderStatus(orderId, nextStatus);
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: nextStatus } : o));
    });
  }

  function handleCancel(orderId: string) {
    startTransition(async () => {
      await updateOrderStatus(orderId, "cancelled");
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: "cancelled" } : o));
    });
  }

  async function handleRefresh() {
    setRefreshing(true);
    const fresh = await getStoreOrders();
    setOrders(fresh);
    setRefreshing(false);
  }

  return (
    <div className="p-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Pedidos</h1>
          {pendingCount > 0 && (
            <p className="text-yellow-400 text-sm mt-0.5">
              {pendingCount} pedido{pendingCount > 1 ? "s" : ""} aguardando
            </p>
          )}
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white border border-gray-700 px-3 py-2 rounded-lg transition-colors"
        >
          <svg className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Atualizar
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-900 rounded-xl p-1 w-fit">
        {[
          { key: "active", label: "Ativos" },
          { key: "done",   label: "Histórico" },
          { key: "all",    label: "Todos" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === key ? "bg-gray-700 text-white" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {label}
            {key === "active" && pendingCount > 0 && (
              <span className="ml-1.5 bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-3">📋</p>
          <p className="text-gray-400 font-medium">Nenhum pedido aqui</p>
          <p className="text-gray-600 text-sm mt-1">
            {filter === "active" ? "Pedidos novos aparecerão aqui" : "Sem histórico ainda"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => {
            const s = STATUS_LABELS[order.status] ?? STATUS_LABELS.pending;
            const next = NEXT_STATUS[order.status];

            return (
              <div key={order.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                {/* Top bar */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${s.bg} ${s.color}`}>
                      {s.label}
                    </span>
                    <span className="text-gray-500 text-xs">#{order.id.slice(-6).toUpperCase()}</span>
                  </div>
                  <span className="text-gray-500 text-xs">{timeAgo(order.createdAt)}</span>
                </div>

                {/* Body */}
                <div className="p-4 space-y-3">
                  {/* Customer */}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-white font-semibold text-sm">
                        {order.customerName || "Cliente"}
                      </p>
                      <p className="text-gray-400 text-xs mt-0.5">📱 {order.customerPhone}</p>
                    </div>
                    <p className="text-orange-400 font-bold text-lg">{fmt(order.total)}</p>
                  </div>

                  {/* Items */}
                  <div className="bg-gray-800/50 rounded-xl p-3 space-y-1.5">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-gray-300">{item.emoji} {item.name} <span className="text-gray-500">×{item.qty}</span></span>
                        <span className="text-gray-400">{fmt(item.price * item.qty)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Address + Payment */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-800/50 rounded-xl p-3">
                      <p className="text-gray-500 text-xs mb-1">Endereço</p>
                      <p className="text-gray-300 text-xs leading-snug">{order.address}</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-xl p-3">
                      <p className="text-gray-500 text-xs mb-1">Pagamento</p>
                      <p className="text-gray-300 text-xs">
                        {order.paymentMethod === "pix" ? "PIX" : "Dinheiro"}
                        {order.needChange && order.changeFor && (
                          <span className="block text-yellow-400">troco p/ {fmt(order.changeFor)}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  {(next || order.status === "pending" || order.status === "preparing") && (
                    <div className="flex gap-2 pt-1">
                      {next && (
                        <button
                          onClick={() => handleAdvance(order.id, next)}
                          disabled={isPending}
                          className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                        >
                          {NEXT_LABEL[order.status]}
                        </button>
                      )}
                      {(order.status === "pending" || order.status === "preparing") && (
                        <button
                          onClick={() => handleCancel(order.id)}
                          disabled={isPending}
                          className="px-4 py-2.5 rounded-xl border border-red-800 text-red-400 hover:bg-red-900/30 text-sm transition-colors"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
