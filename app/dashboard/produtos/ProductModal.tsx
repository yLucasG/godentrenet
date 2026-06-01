"use client";

import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Sparkles, Loader2 } from "lucide-react";
import type { Product } from "@prisma/client";
import { suggestTaxClassificationWithAI } from "@/actions/fiscal";

const EMOJIS = ["🍞", "🥐", "🎂", "🧁", "🍕", "🍔", "🌮", "☕", "🧃", "🛍️", "🥩", "🥗", "🥟", "🍫", "🍦", "🍪", "🧀", "🥚", "🥤", "💧", "🌭", "🫕", "🥘", "🍜"];

type CategoryOption = { id: string; name: string; emoji: string };
type Tab = "geral" | "fiscal";

export interface SaveData {
  name: string;
  price: number;
  emoji: string;
  imageUrl: string | null;
  categoryId: string | null;
  ncm?: string | null;
  cfop?: string | null;
  cest?: string | null;
  icmsRate?: number | null;
}

interface Props {
  onClose: () => void;
  onSave: (data: SaveData) => Promise<void>;
  initial?: Product & { imageUrl?: string | null; categoryId?: string | null };
  categories: CategoryOption[];
}

export function ProductModal({ onClose, onSave, initial, categories }: Props) {
  const [tab, setTab] = useState<Tab>("geral");

  // ── Geral ──────────────────────────────────────────────────────────────────
  const [name, setName] = useState(initial?.name ?? "");
  const [price, setPrice] = useState(initial?.price?.toString() ?? "");
  const [emoji, setEmoji] = useState(initial?.emoji ?? "🛍️");
  const [categoryId, setCategoryId] = useState<string | null>(initial?.categoryId ?? null);
  const [imageUrl, setImageUrl] = useState<string | null>(initial?.imageUrl ?? null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initial?.imageUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Fiscal ─────────────────────────────────────────────────────────────────
  const [ncm, setNcm] = useState(initial?.ncm ?? "");
  const [cfop, setCfop] = useState(initial?.cfop ?? "");
  const [cest, setCest] = useState(initial?.cest ?? "");
  const [icmsRate, setIcmsRate] = useState(initial?.icmsRate?.toString() ?? "");
  const [suggesting, setSuggesting] = useState(false);
  const [aiError, setAiError] = useState("");

  // ── Image helpers ──────────────────────────────────────────────────────────
  function handleFileSelect(file: File) {
    if (!file.type.startsWith("image/")) return;
    setPendingFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }

  function clearImage() {
    setPendingFile(null);
    setPreviewUrl(null);
    setImageUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ── AI Suggestion ──────────────────────────────────────────────────────────
  async function handleAiSuggest() {
    if (!name.trim()) { setAiError("Digite o nome do produto primeiro."); return; }
    setAiError("");
    setSuggesting(true);
    try {
      const result = await suggestTaxClassificationWithAI(name.trim());
      setNcm(result.ncm);
      setCfop(result.cfop);
      setCest(result.cest ?? "");
      setIcmsRate(result.icmsRate?.toString() ?? "");
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Erro ao consultar IA.");
    } finally {
      setSuggesting(false);
    }
  }

  // ── Save ───────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!name || !price) return;
    setSaving(true);
    try {
      let finalImageUrl = imageUrl;
      if (pendingFile) {
        setUploading(true);
        const fd = new FormData();
        fd.append("file", pendingFile);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Erro ao enviar imagem");
        finalImageUrl = json.url;
        setUploading(false);
      }
      await onSave({
        name: name.trim(),
        price: parseFloat(price),
        emoji,
        imageUrl: finalImageUrl,
        categoryId,
        ncm: ncm.trim() || null,
        cfop: cfop.trim() || null,
        cest: cest.trim() || null,
        icmsRate: icmsRate ? parseFloat(icmsRate) : null,
      });
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao salvar produto");
    } finally {
      setSaving(false);
      setUploading(false);
    }
  }

  const canSave = name.trim().length > 0 && parseFloat(price) > 0;
  const hasFiscal = !!(ncm || cfop);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 sticky top-0 bg-gray-900 z-10 flex-shrink-0">
          <h3 className="text-white font-semibold text-sm">{initial ? "Editar produto" : "Novo produto"}</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 px-5 pt-4 flex-shrink-0">
          {([
            { key: "geral", label: "Geral" },
            { key: "fiscal", label: "Fiscal", badge: hasFiscal },
          ] as { key: Tab; label: string; badge?: boolean }[]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                tab === t.key
                  ? "bg-gray-800 text-white"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {t.label}
              {t.badge && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1">
          {tab === "geral" && (
            <div className="p-5 space-y-4">
              {/* Image upload */}
              <div>
                <label className="text-gray-400 text-xs font-medium block mb-2">Imagem do produto</label>
                {previewUrl ? (
                  <div className="relative rounded-2xl overflow-hidden bg-gray-800 h-36">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button onClick={clearImage} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors">
                      <X size={13} />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">
                      {pendingFile ? "Novo arquivo" : "Imagem atual"}
                    </div>
                  </div>
                ) : (
                  <label
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    className={`flex flex-col items-center justify-center gap-2 h-28 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
                      dragOver ? "border-amber-500 bg-amber-500/10" : "border-gray-700 hover:border-gray-500 hover:bg-gray-800/50"
                    }`}
                  >
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }} />
                    <ImageIcon size={20} className="text-gray-500" />
                    <p className="text-gray-500 text-xs text-center">
                      Clique ou arraste uma imagem<br />
                      <span className="text-gray-600">ou use o emoji abaixo</span>
                    </p>
                  </label>
                )}
              </div>

              {!previewUrl && (
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-2">Emoji (se não tiver imagem)</label>
                  <div className="flex flex-wrap gap-1.5">
                    {EMOJIS.map((e) => (
                      <button key={e} onClick={() => setEmoji(e)} className={`text-xl w-9 h-9 rounded-xl transition-colors ${emoji === e ? "bg-amber-700 ring-1 ring-amber-500" : "bg-gray-800 hover:bg-gray-700"}`}>
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-gray-400 text-xs font-medium block mb-1.5">Nome do produto *</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Pão Francês" className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-colors" />
              </div>

              <div>
                <label className="text-gray-400 text-xs font-medium block mb-1.5">Preço (R$) *</label>
                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0,00" step="0.01" min="0" className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-colors" />
              </div>

              {categories.length > 0 && (
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1.5">Categoria</label>
                  <div className="flex flex-wrap gap-1.5">
                    <button onClick={() => setCategoryId(null)} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${!categoryId ? "bg-amber-700 text-white ring-1 ring-amber-500" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
                      Sem categoria
                    </button>
                    {categories.map((cat) => (
                      <button key={cat.id} onClick={() => setCategoryId(cat.id)} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center gap-1 ${categoryId === cat.id ? "bg-amber-700 text-white ring-1 ring-amber-500" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
                        <span>{cat.emoji}</span>
                        <span>{cat.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "fiscal" && (
            <div className="p-5 space-y-5">
              {/* AI suggestion button */}
              <div className="bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border border-violet-500/20 rounded-xl p-4">
                <p className="text-gray-300 text-xs mb-3">
                  Use IA para sugerir automaticamente o NCM e CFOP com base no nome do produto.
                </p>
                <button
                  onClick={handleAiSuggest}
                  disabled={suggesting || !name.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors disabled:opacity-50 w-full justify-center"
                >
                  {suggesting ? (
                    <><Loader2 size={14} className="animate-spin" /> Consultando IA...</>
                  ) : (
                    <><Sparkles size={14} /> Sugerir Tributação com IA</>
                  )}
                </button>
                {!name.trim() && (
                  <p className="text-gray-600 text-[11px] text-center mt-2">Preencha o nome do produto na aba Geral primeiro.</p>
                )}
                {aiError && (
                  <p className="text-red-400 text-xs mt-2 text-center">{aiError}</p>
                )}
              </div>

              {/* Tax fields */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-400 text-xs font-medium block mb-1.5">
                      NCM <span className="text-gray-600">(8 dígitos)</span>
                    </label>
                    <input
                      value={ncm}
                      onChange={(e) => setNcm(e.target.value.replace(/\D/g, "").slice(0, 8))}
                      placeholder="00000000"
                      maxLength={8}
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs font-medium block mb-1.5">
                      CFOP <span className="text-gray-600">(4 dígitos)</span>
                    </label>
                    <input
                      value={cfop}
                      onChange={(e) => setCfop(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="5102"
                      maxLength={4}
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-400 text-xs font-medium block mb-1.5">
                      CEST <span className="text-gray-600">(7 dígitos)</span>
                    </label>
                    <input
                      value={cest}
                      onChange={(e) => setCest(e.target.value.replace(/\D/g, "").slice(0, 7))}
                      placeholder="Opcional"
                      maxLength={7}
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs font-medium block mb-1.5">
                      Alíq. ICMS <span className="text-gray-600">(%)</span>
                    </label>
                    <input
                      type="number"
                      value={icmsRate}
                      onChange={(e) => setIcmsRate(e.target.value)}
                      placeholder="Opcional"
                      min={0}
                      max={100}
                      step={0.01}
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* CFOP helper */}
              <div className="bg-gray-800/50 rounded-xl p-3 space-y-1">
                <p className="text-gray-500 text-[11px] font-bold uppercase tracking-wider mb-1">CFOPs comuns</p>
                {[
                  ["5102", "Venda de mercadoria adquirida/recebida"],
                  ["5405", "Venda de mercadoria sujeita à ST"],
                  ["5933", "Prestação de serviço p/ consumidor final"],
                ].map(([code, desc]) => (
                  <button
                    key={code}
                    onClick={() => setCfop(code)}
                    className={`w-full text-left text-xs px-2 py-1 rounded-lg transition-colors ${cfop === code ? "bg-amber-700/40 text-amber-300" : "text-gray-500 hover:text-gray-300 hover:bg-gray-700/50"}`}
                  >
                    <span className="font-mono text-white">{code}</span> — {desc}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-3 flex gap-2 border-t border-gray-800 flex-shrink-0">
          <button onClick={onClose} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl py-2.5 text-sm transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !canSave}
            className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white rounded-xl py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
          >
            {uploading ? (
              <><Upload size={14} className="animate-bounce" /> Enviando...</>
            ) : saving ? (
              "Salvando..."
            ) : (
              "Salvar"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
