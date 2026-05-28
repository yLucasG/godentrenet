"use client";

import { useState, useRef, useCallback, useTransition } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, X, ShoppingCart, Loader2, Package, Receipt, Building2 } from "lucide-react";
import { parseNFe, confirmPurchase, type ParsedNFe } from "@/actions/purchases";

// ─── Types ────────────────────────────────────────────────────────────────────
type PurchaseRow = {
  id: string;
  invoiceNumber: string | null;
  supplierName: string | null;
  totalAmount: number;
  issueDate: string | null;
  createdAt: string;
  itemCount: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtQty(n: number) {
  return n % 1 === 0 ? String(n) : n.toFixed(3).replace(/\.?0+$/, "");
}

type Stage = "idle" | "parsing" | "review" | "saving" | "done";

// ─── Review Modal ─────────────────────────────────────────────────────────────
function ReviewModal({
  data,
  onConfirm,
  onCancel,
  saving,
}: {
  data: ParsedNFe;
  onConfirm: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const newItems = data.items.filter((i) => !i.existingItemId);
  const updateItems = data.items.filter((i) => i.existingItemId);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 overflow-y-auto p-4 pt-8">
      <div className="w-full max-w-3xl bg-gray-950 rounded-2xl border border-gray-800 flex flex-col mb-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div>
            <h2 className="text-white font-bold text-lg">Revisão da Compra</h2>
            <p className="text-gray-500 text-xs mt-0.5">Confirme os dados antes de importar para o estoque</p>
          </div>
          <button onClick={onCancel} className="text-gray-500 hover:text-white transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Supplier + NF info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Building2 size={14} className="text-gray-500" />
                <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">Fornecedor</span>
              </div>
              <p className="text-white font-semibold text-sm">{data.supplierName || "—"}</p>
              {data.supplierCnpj && (
                <p className="text-gray-500 text-xs mt-0.5 font-mono">{data.supplierCnpj}</p>
              )}
            </div>
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Receipt size={14} className="text-gray-500" />
                <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">Nota Fiscal</span>
              </div>
              <p className="text-white font-semibold text-sm">
                NF {data.invoiceNumber || "s/n"}
              </p>
              <p className="text-gray-500 text-xs mt-0.5">
                {data.issueDate ? fmtDate(data.issueDate) : "Data não informada"}
                {" · "}
                <span className="text-emerald-400 font-semibold">{fmt(data.totalAmount)}</span>
              </p>
            </div>
          </div>

          {/* Items summary badges */}
          <div className="flex gap-3">
            {updateItems.length > 0 && (
              <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
                <Package size={14} className="text-blue-400" />
                <span className="text-blue-400 text-sm font-medium">
                  {updateItems.length} insumo{updateItems.length > 1 ? "s" : ""} com estoque atualizado
                </span>
              </div>
            )}
            {newItems.length > 0 && (
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span className="text-emerald-400 text-sm font-medium">
                  {newItems.length} insumo{newItems.length > 1 ? "s" : ""} novo{newItems.length > 1 ? "s" : ""} a criar
                </span>
              </div>
            )}
          </div>

          {/* Items table */}
          <div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3">
              Itens da Nota ({data.items.length})
            </p>
            <div className="rounded-xl border border-gray-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-900/60">
                    <th className="text-left px-4 py-2.5 text-gray-500 font-medium text-xs">Nome / SKU</th>
                    <th className="text-right px-4 py-2.5 text-gray-500 font-medium text-xs">Qtd</th>
                    <th className="text-right px-4 py-2.5 text-gray-500 font-medium text-xs">V. Unit.</th>
                    <th className="text-right px-4 py-2.5 text-gray-500 font-medium text-xs">Total</th>
                    <th className="text-center px-4 py-2.5 text-gray-500 font-medium text-xs">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/20">
                      <td className="px-4 py-3">
                        <p className="text-white text-sm font-medium">{item.name}</p>
                        {item.sku && (
                          <p className="text-gray-600 text-xs font-mono">{item.sku}</p>
                        )}
                        {item.existingItemId && item.existingItemName !== item.name && (
                          <p className="text-blue-400 text-xs">↳ {item.existingItemName}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-300 text-xs">
                        {fmtQty(item.quantity)} <span className="text-gray-600">{item.unit}</span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-400 text-xs">{fmt(item.unitPrice)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-white font-medium text-xs">{fmt(item.totalPrice)}</td>
                      <td className="px-4 py-3 text-center">
                        {item.existingItemId ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/25 whitespace-nowrap">
                            + {fmtQty(item.existingStock ?? 0)} → {fmtQty((item.existingStock ?? 0) + item.quantity)} {item.unit}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                            ✦ Novo
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bills */}
          {data.bills.length > 0 && (
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3">
                Contas a Pagar ({data.bills.length})
              </p>
              <div className="rounded-xl border border-gray-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 bg-gray-900/60">
                      <th className="text-left px-4 py-2.5 text-gray-500 font-medium text-xs">Duplicata</th>
                      <th className="text-left px-4 py-2.5 text-gray-500 font-medium text-xs">Vencimento</th>
                      <th className="text-right px-4 py-2.5 text-gray-500 font-medium text-xs">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.bills.map((bill, idx) => (
                      <tr key={idx} className="border-b border-gray-800 last:border-0">
                        <td className="px-4 py-3 text-gray-400 font-mono text-xs">{bill.number || "—"}</td>
                        <td className="px-4 py-3 text-white text-sm">{bill.dueDate ? fmtDate(bill.dueDate) : "—"}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-orange-400 font-semibold text-sm">{fmt(bill.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {data.bills.length === 0 && (
            <div className="flex items-center gap-2 bg-gray-900 rounded-xl border border-gray-800 px-4 py-3">
              <AlertCircle size={14} className="text-gray-600" />
              <p className="text-gray-600 text-sm">Nenhum boleto/duplicata encontrado na NF-e.</p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-800 bg-gray-950 rounded-b-2xl">
          <p className="text-gray-600 text-xs">
            {data.items.length} iten{data.items.length !== 1 ? "s" : ""} ·{" "}
            {data.bills.length} conta{data.bills.length !== 1 ? "s" : ""} a pagar
          </p>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:text-white text-sm transition-colors disabled:opacity-40"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  Confirmar Compra
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Root Component ───────────────────────────────────────────────────────────
export function ComprasClient({ initialPurchases }: { initialPurchases: PurchaseRow[] }) {
  const [stage, setStage] = useState<Stage>("idle");
  const [parsed, setParsed] = useState<ParsedNFe | null>(null);
  const [parseError, setParseError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [purchases, setPurchases] = useState<PurchaseRow[]>(initialPurchases);
  const [, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".xml")) {
      setParseError("Apenas arquivos .xml são aceitos.");
      return;
    }
    setParseError("");
    setStage("parsing");
    try {
      const text = await file.text();
      const result = await parseNFe(text);
      setParsed(result);
      setStage("review");
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Erro ao processar o XML.");
      setStage("idle");
    }
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  }

  async function handleConfirm() {
    if (!parsed) return;
    setStage("saving");
    try {
      await confirmPurchase(parsed);
      setStage("done");
      // Refresh list - reload after short delay for UX
      setTimeout(() => window.location.reload(), 1800);
    } catch {
      setParseError("Erro ao salvar a compra. Tente novamente.");
      setStage("review");
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-white font-bold text-xl">Compras</h1>
        <p className="text-gray-500 text-sm mt-1">Importe notas fiscais em XML para atualizar o estoque automaticamente.</p>
      </div>

      {/* Dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => stage === "idle" && fileInputRef.current?.click()}
        className={`relative rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-4 py-14 mb-8 ${
          stage === "parsing"
            ? "border-blue-500/40 bg-blue-500/5 cursor-default"
            : stage === "done"
            ? "border-emerald-500/40 bg-emerald-500/5 cursor-default"
            : isDragging
            ? "border-emerald-500 bg-emerald-500/10 scale-[1.01]"
            : "border-gray-700 hover:border-gray-500 bg-gray-900/30 hover:bg-gray-900/50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xml,application/xml,text/xml"
          className="hidden"
          onChange={handleFileInput}
        />

        {stage === "idle" && (
          <>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border transition-colors ${
              isDragging ? "border-emerald-500/40 bg-emerald-500/15" : "border-gray-700 bg-gray-800"
            }`}>
              <Upload size={28} className={isDragging ? "text-emerald-400" : "text-gray-500"} />
            </div>
            <div className="text-center">
              <p className={`font-semibold text-base ${isDragging ? "text-emerald-300" : "text-gray-300"}`}>
                {isDragging ? "Solte o arquivo aqui" : "Arraste o XML da NF-e aqui"}
              </p>
              <p className="text-gray-600 text-sm mt-1">ou clique para selecionar o arquivo</p>
            </div>
            <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2">
              <FileText size={14} className="text-gray-500" />
              <span className="text-gray-500 text-xs">Formato aceito: .xml (NF-e padrão SEFAZ)</span>
            </div>
            {parseError && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-2.5">
                <AlertCircle size={14} className="text-red-400" />
                <span className="text-red-400 text-sm">{parseError}</span>
              </div>
            )}
          </>
        )}

        {stage === "parsing" && (
          <>
            <Loader2 size={40} className="text-blue-400 animate-spin" />
            <p className="text-blue-300 font-semibold">Lendo a Nota Fiscal...</p>
            <p className="text-gray-600 text-sm">Extraindo itens e verificando o estoque</p>
          </>
        )}

        {stage === "done" && (
          <>
            <CheckCircle2 size={48} className="text-emerald-400" />
            <p className="text-emerald-300 font-semibold text-lg">Compra importada com sucesso!</p>
            <p className="text-gray-500 text-sm">Recarregando...</p>
          </>
        )}
      </div>

      {/* Review modal */}
      {(stage === "review" || stage === "saving") && parsed && (
        <ReviewModal
          data={parsed}
          onConfirm={handleConfirm}
          onCancel={() => { setStage("idle"); setParsed(null); }}
          saving={stage === "saving"}
        />
      )}

      {/* History table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-400 text-sm font-semibold">
            Histórico de Compras
            {purchases.length > 0 && <span className="text-gray-600 font-normal ml-2">({purchases.length})</span>}
          </p>
        </div>

        {purchases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-700 rounded-2xl border border-dashed border-gray-800">
            <ShoppingCart size={36} strokeWidth={1.2} />
            <p className="text-sm">Nenhuma compra registrada ainda.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900/60">
                  <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">NF / Fornecedor</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Data Emissão</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Itens</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Total</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Importado em</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((p, idx) => (
                  <tr
                    key={p.id}
                    className={`border-b border-gray-800 last:border-0 ${idx % 2 === 0 ? "bg-gray-900/20" : ""} hover:bg-gray-800/30`}
                  >
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">
                        {p.invoiceNumber ? `NF ${p.invoiceNumber}` : "NF s/n"}
                      </p>
                      {p.supplierName && (
                        <p className="text-gray-500 text-xs mt-0.5">{p.supplierName}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-400 text-xs">
                      {p.issueDate ? fmtDate(p.issueDate) : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="bg-gray-800 text-gray-400 text-xs px-2 py-0.5 rounded font-mono">
                        {p.itemCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-white font-semibold">
                      {fmt(p.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 text-xs">
                      {fmtDate(p.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
