"use client";

import { useState, useTransition } from "react";
import { updateOrderStatus, getStoreOrders, clearStoreOrders } from "@/actions/orders-dashboard";
import { RefreshCw, Trash2, FileText, X, Copy, CheckCheck, Loader2 } from "lucide-react";
import { generateNFCePayload } from "@/actions/fiscal";

// ─── Types ────────────────────────────────────────────────────────────────────
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
  deliveryMethod: string;
  localIdentifier: string | null;
};

// ─── Kanban config ────────────────────────────────────────────────────────────
const COLUMNS = [
  {
    statuses: ["pending"],
    label: "Novos / Em Análise",
    icon: "🔔",
    accent: "#f97316",           // orange-500
    advanceLabel: "→ Em Produção",
    advanceNext: "preparing",
    emptyText: "Nenhum pedido novo",
  },
  {
    statuses: ["preparing"],
    label: "Em Produção / Separação",
    icon: "⚡",
    accent: "#eab308",           // yellow-500
    advanceLabel: "→ Pronto p/ Entrega",
    advanceNext: "delivering",
    emptyText: "Nada em produção",
  },
  {
    statuses: ["delivering", "delivered"],
    label: "Prontos / Despachados",
    icon: "✅",
    accent: "#22c55e",           // green-500
    advanceLabel: "✓ Confirmar Entrega",
    advanceNext: "delivered",
    emptyText: "Nenhum pedido despachado",
  },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

// ─── Delivery badge ───────────────────────────────────────────────────────────
function DeliveryBadge({ method, identifier }: { method: string; identifier: string | null }) {
  if (method === "DELIVERY") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-red-500/15 text-red-400 border border-red-500/25">
        🛵 Delivery
      </span>
    );
  }
  if (method === "PICKUP") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/25">
        🏪 Retirada
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/25">
      📍 {identifier || "Local"}
    </span>
  );
}

// ─── NFC-e payload modal ──────────────────────────────────────────────────────
function NfceModal({ payload, onClose }: { payload: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg bg-gray-950 rounded-2xl border border-gray-800 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-amber-400" />
            <span className="text-white font-bold text-sm">Payload NFC-e</span>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
        <pre className="flex-1 overflow-y-auto p-4 text-xs text-amber-300 font-mono leading-relaxed bg-gray-900/50">{payload}</pre>
        <div className="px-5 py-3 border-t border-gray-800 flex gap-2 flex-shrink-0">
          <p className="text-gray-600 text-xs flex-1 self-center">Integração com API emissora em breve.</p>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${copied ? "bg-amber-700 text-white" : "bg-gray-800 hover:bg-gray-700 text-gray-300"}`}
          >
            {copied ? <><CheckCheck size={14} /> Copiado!</> : <><Copy size={14} /> Copiar JSON</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Order card ───────────────────────────────────────────────────────────────
function OrderCard({
  order,
  accentColor,
  advanceLabel,
  advanceNext,
  onAdvance,
  onCancel,
  busy,
}: {
  order: Order;
  accentColor: string;
  advanceLabel: string;
  advanceNext: string;
  onAdvance: (id: string, next: string) => void;
  onCancel: (id: string) => void;
  busy: boolean;
}) {
  const [nfcePayload, setNfcePayload] = useState<string | null>(null);
  const [loadingNfce, setLoadingNfce] = useState(false);
  const isDone = order.status === "delivered";
  const totalItems = order.items.reduce((s, i) => s + i.qty, 0);

  async function handleNFCe() {
    setLoadingNfce(true);
    try {
      const payload = await generateNFCePayload(
        order.items.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
        order.paymentMethod,
        order.total
      );
      setNfcePayload(JSON.stringify(payload, null, 2));
    } catch {
      alert("Erro ao gerar NFC-e.");
    } finally {
      setLoadingNfce(false);
    }
  }

  return (
    <div
      className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 flex flex-col"
      style={{ borderLeftColor: accentColor, borderLeftWidth: 3 }}
    >
      {/* Card header */}
      <div className="px-3 pt-3 pb-2 flex items-start justify-between gap-2">
        <DeliveryBadge method={order.deliveryMethod} identifier={order.localIdentifier} />
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-gray-600 text-[10px] tabular-nums">{timeAgo(order.createdAt)}</span>
          <span className="text-gray-700 text-[10px] font-mono">#{order.id.slice(-5).toUpperCase()}</span>
        </div>
      </div>

      {/* Customer */}
      <div className="px-3 pb-2">
        <p className="text-white font-semibold text-sm leading-tight">
          {order.customerName || "Cliente"}
        </p>
        {order.customerPhone !== "55000000000" && (
          <p className="text-gray-500 text-xs mt-0.5">📱 {order.customerPhone}</p>
        )}
      </div>

      {/* Items */}
      <div className="mx-3 mb-2 bg-gray-800/60 rounded-xl p-2.5 space-y-1">
        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">
          {totalItems} {totalItems === 1 ? "item" : "itens"}
        </p>
        {order.items.map((item, i) => (
          <div key={i} className="flex items-center justify-between gap-2">
            <span className="text-gray-300 text-xs truncate">
              {item.emoji} {item.name}
              <span className="text-gray-500 ml-1">×{item.qty}</span>
            </span>
            <span className="text-gray-500 text-[11px] flex-shrink-0 tabular-nums">
              {fmt(item.price * item.qty)}
            </span>
          </div>
        ))}
      </div>

      {/* Total + payment */}
      <div className="px-3 pb-2.5 flex items-center justify-between">
        <span className="text-white font-bold text-sm tabular-nums">{fmt(order.total)}</span>
        <span className="text-gray-500 text-xs">
          {order.paymentMethod === "pix" ? "💳 PIX" : "💵 Dinheiro"}
          {order.needChange && order.changeFor
            ? ` · troco p/ ${fmt(order.changeFor)}`
            : ""}
        </span>
      </div>

      {/* Actions */}
      <div className="border-t border-gray-800 px-3 py-2 flex gap-2">
        {!isDone && (
          <button
            onClick={() => onCancel(order.id)}
            disabled={busy}
            className="px-2.5 py-1.5 rounded-lg border border-gray-700 text-gray-500 hover:text-red-400 hover:border-red-800 text-xs transition-colors disabled:opacity-40"
          >
            Cancelar
          </button>
        )}
        {isDone ? (
          <div className="flex-1 text-center text-amber-500 text-xs font-semibold py-1.5">
            ✓ Entregue
          </div>
        ) : (
          <button
            onClick={() => onAdvance(order.id, advanceNext)}
            disabled={busy}
            className="flex-1 py-1.5 rounded-lg text-xs font-bold text-white transition-colors disabled:opacity-40"
            style={{ backgroundColor: accentColor, opacity: busy ? 0.6 : 1 }}
          >
            {advanceLabel}
          </button>
        )}
        <button
          onClick={handleNFCe}
          disabled={loadingNfce || busy}
          title="Gerar NFC-e"
          className="px-2 py-1.5 rounded-lg border border-gray-700 text-gray-500 hover:text-amber-400 hover:border-amber-800 text-xs transition-colors disabled:opacity-40"
        >
          {loadingNfce ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
        </button>
      </div>

      {nfcePayload && <NfceModal payload={nfcePayload} onClose={() => setNfcePayload(null)} />}
    </div>
  );
}

// ─── Kanban column ────────────────────────────────────────────────────────────
function KanbanColumn({
  col,
  orders,
  onAdvance,
  onCancel,
  busy,
}: {
  col: (typeof COLUMNS)[number];
  orders: Order[];
  onAdvance: (id: string, next: string) => void;
  onCancel: (id: string) => void;
  busy: boolean;
}) {
  return (
    <div className="flex flex-col flex-1 min-w-[280px] max-w-[420px] overflow-hidden rounded-2xl bg-gray-900 border border-gray-800">
      {/* Column header */}
      <div
        className="flex-shrink-0 px-4 py-3 flex items-center justify-between"
        style={{ borderBottom: `3px solid ${col.accent}` }}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">{col.icon}</span>
          <span className="text-white font-bold text-sm">{col.label}</span>
        </div>
        {orders.length > 0 && (
          <span
            className="text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center"
            style={{ backgroundColor: col.accent }}
          >
            {orders.length}
          </span>
        )}
      </div>

      {/* Cards list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-700">
            <span className="text-3xl opacity-40">📋</span>
            <span className="text-sm">{col.emptyText}</span>
          </div>
        ) : (
          orders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              accentColor={col.accent}
              advanceLabel={col.advanceLabel}
              advanceNext={col.advanceNext}
              onAdvance={onAdvance}
              onCancel={onCancel}
              busy={busy}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Root component ───────────────────────────────────────────────────────────
export function OrdersClient({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [isPending, startTransition] = useTransition();
  const [refreshing, setRefreshing] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);

  const activeOrders = orders.filter(o => o.status !== "cancelled");
  const cancelledOrders = orders.filter(o => o.status === "cancelled");
  const pendingCount = orders.filter(o => o.status === "pending").length;

  function handleAdvance(orderId: string, nextStatus: string) {
    startTransition(async () => {
      await updateOrderStatus(orderId, nextStatus);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o));
    });
  }

  function handleCancel(orderId: string) {
    startTransition(async () => {
      await updateOrderStatus(orderId, "cancelled");
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "cancelled" } : o));
    });
  }

  async function handleRefresh() {
    setRefreshing(true);
    const fresh = await getStoreOrders();
    setOrders(fresh);
    setRefreshing(false);
  }

  async function handleClear() {
    if (!confirm("Apagar TODOS os pedidos? Esta ação não pode ser desfeita.")) return;
    setClearing(true);
    try {
      await clearStoreOrders();
      setOrders([]);
    } finally {
      setClearing(false);
    }
  }

  const busy = isPending || refreshing || clearing;

  return (
    <div className="flex flex-col" style={{ height: "100vh" }}>
      {/* ── Top bar ───────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-950">
        <div>
          <h1 className="text-white font-bold text-lg leading-none">Pedidos</h1>
          {pendingCount > 0 ? (
            <p className="text-orange-400 text-xs mt-1">
              {pendingCount} novo{pendingCount > 1 ? "s" : ""} aguardando
            </p>
          ) : (
            <p className="text-gray-600 text-xs mt-1">Quadro Kanban</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {cancelledOrders.length > 0 && (
            <button
              onClick={() => setShowCancelled(v => !v)}
              className="text-xs text-gray-500 hover:text-gray-300 border border-gray-800 px-3 py-2 rounded-lg transition-colors"
            >
              {showCancelled ? "Ocultar" : `Ver`} cancelados ({cancelledOrders.length})
            </button>
          )}
          {orders.length > 0 && (
            <button
              onClick={handleClear}
              disabled={busy}
              className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 border border-red-900/30 hover:border-red-500/40 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <Trash2 size={13} />
              Limpar
            </button>
          )}
          <button
            onClick={handleRefresh}
            disabled={busy}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white border border-gray-700 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            Atualizar
          </button>
        </div>
      </div>

      {/* ── Kanban board ─────────────────────────────────────────────── */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {COLUMNS.map(col => {
          const colOrders = activeOrders
            .filter(o => col.statuses.includes(o.status as never))
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

          return (
            <KanbanColumn
              key={col.label}
              col={col}
              orders={colOrders}
              onAdvance={handleAdvance}
              onCancel={handleCancel}
              busy={busy}
            />
          );
        })}
      </div>

      {/* ── Cancelled orders (collapsed panel) ───────────────────────── */}
      {showCancelled && cancelledOrders.length > 0 && (
        <div className="flex-shrink-0 border-t border-gray-800 bg-gray-950 px-4 pb-4">
          <p className="text-gray-600 text-xs font-bold uppercase tracking-widest py-3">
            Cancelados ({cancelledOrders.length})
          </p>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {cancelledOrders.map(order => (
              <div
                key={order.id}
                className="flex-shrink-0 w-56 bg-gray-900/60 border border-gray-800 rounded-xl p-3 opacity-60"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <DeliveryBadge method={order.deliveryMethod} identifier={order.localIdentifier} />
                  <span className="text-gray-600 text-[10px]">{timeAgo(order.createdAt)}</span>
                </div>
                <p className="text-gray-400 text-xs font-medium truncate">{order.customerName || "Cliente"}</p>
                <p className="text-gray-600 text-xs mt-0.5">{fmt(order.total)} · {order.items.reduce((s,i)=>s+i.qty,0)} itens</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
