"use client";

import { useState, useEffect } from "react";
import { Upload, X, Loader2, Check, ArrowLeft, FileText, Image as ImageIcon } from "lucide-react";
import { importProductsBulk } from "@/actions/product";
import { listCategories } from "@/actions/category";

type Category = { id: string; name: string; emoji: string };

const EMOJI_MAP: [RegExp, string][] = [
  [/pão|paes|pao|baguete|brioche|ciabatta/i, "🍞"],
  [/croissant/i, "🥐"],
  [/bolo|torta|confeit/i, "🎂"],
  [/cupcake|brigadeiro|docin/i, "🧁"],
  [/pizza/i, "🍕"],
  [/hambur/i, "🍔"],
  [/salgad|coxinha|esfiha|empada|kibe/i, "🥟"],
  [/frango|galinha|peito/i, "🍗"],
  [/carne|bife|churrasco|picanha/i, "🥩"],
  [/café|cafe|cappuccino|espresso/i, "☕"],
  [/suco|vitamina/i, "🧃"],
  [/refrigerante|refri|coca|guaraná/i, "🥤"],
  [/agua|água/i, "💧"],
  [/leite/i, "🥛"],
  [/queijo/i, "🧀"],
  [/salada/i, "🥗"],
  [/ovo|ovos/i, "🥚"],
  [/chocolate|cacau/i, "🍫"],
  [/sorvete|gelato|açaí/i, "🍦"],
  [/biscoito|bolacha|cookie/i, "🍪"],
  [/doce|trufa|bombom/i, "🍬"],
  [/misto|lanche/i, "🥪"],
];

function suggestEmoji(name: string): string {
  for (const [regex, emoji] of EMOJI_MAP) {
    if (regex.test(name)) return emoji;
  }
  return "🛍️";
}

function parseProductText(text: string): ParsedItem[] {
  const results: ParsedItem[] = [];
  const lines = text.split(/[\n\r]+/).map((l) => l.trim()).filter((l) => l.length > 2);

  for (const line of lines) {
    if (/^(nome|produto|item|preço|valor|price|name|qtd|quant)/i.test(line)) continue;

    // Try multiple price patterns in order of specificity
    const patterns = [
      /R\$\s*([\d]{1,5}[.,][\d]{2})/,                  // R$ 10,50
      /(?:[-–:;,|]\s*)([\d]{1,5}[.,][\d]{2})(?:\s|$)/, // - 10,50
      /\t([\d]{1,5}[.,][\d]{2})(?:\s|$)/,               // tab 10,50
      /\s{2,}([\d]{1,5}[.,][\d]{2})(?:\s|$)/,           // spaces 10,50
      /\s([\d]{1,5}[.,][\d]{2})(?:\s|$)/,               // space 10,50
    ];

    let priceStr: string | null = null;
    let matchFull = "";
    let matchIndex = -1;

    for (const p of patterns) {
      const m = p.exec(line);
      if (m) {
        priceStr = m[1];
        matchFull = m[0];
        matchIndex = m.index;
        break;
      }
    }

    if (!priceStr) continue;

    const price = parseFloat(priceStr.replace(",", "."));
    if (isNaN(price) || price <= 0 || price > 9999) continue;

    const namePart = line.slice(0, matchIndex).trim().replace(/[-–:;,.|]+$/, "").trim();
    if (namePart.length < 2 || namePart.length > 80) continue;

    results.push({ name: namePart, price, emoji: suggestEmoji(namePart), selected: true, categoryId: null });
  }

  return results;
}

type ParsedItem = {
  name: string;
  price: number;
  emoji: string;
  selected: boolean;
  categoryId: string | null;
};

type Step = "upload" | "preview" | "saving" | "done";

const EMOJIS = ["🍞", "🥐", "🎂", "🧁", "🍕", "🍔", "🌮", "☕", "🧃", "🛍️", "🥩", "🥗", "🥟", "🍫", "🍦", "🍪", "🧀", "🥚", "🥤", "💧"];

export function ImportModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [step, setStep] = useState<Step>("upload");
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState("");
  const [items, setItems] = useState<ParsedItem[]>([]);
  const [saved, setSaved] = useState(0);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [globalCategory, setGlobalCategory] = useState("");

  useEffect(() => {
    listCategories().then((cats) => setCategories(cats)).catch(() => {});
  }, []);

  async function processFile(file: File) {
    setProcessing(true);
    setError("");
    setOcrProgress(0);
    setOcrStatus("Lendo arquivo...");

    try {
      let text = "";

      if (file.type.startsWith("image/")) {
        setOcrStatus("Iniciando reconhecimento de texto...");
        const { createWorker } = await import("tesseract.js");
        const worker = await createWorker("por", 1, {
          logger: (m: { status: string; progress: number }) => {
            if (m.status === "recognizing text") {
              setOcrProgress(Math.round(m.progress * 100));
              setOcrStatus(`Reconhecendo texto... ${Math.round(m.progress * 100)}%`);
            } else {
              setOcrStatus(m.status);
            }
          },
        });
        const { data } = await worker.recognize(file);
        text = data.text;
        await worker.terminate();
      } else {
        text = await file.text();
      }

      const parsed = parseProductText(text);

      if (parsed.length === 0) {
        setError(
          file.type.startsWith("image/")
            ? "Não foi possível extrair produtos da imagem. Tente com uma foto mais nítida ou use um arquivo de texto."
            : "Nenhum produto encontrado. Verifique o formato (ex: 'Pão Francês 0,50' por linha)."
        );
        setProcessing(false);
        return;
      }

      setItems(parsed);
      setStep("preview");
    } catch (err) {
      setError("Erro ao processar arquivo. Tente novamente.");
      console.error(err);
    } finally {
      setProcessing(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function toggleItem(i: number) {
    setItems((prev) => prev.map((item, idx) => idx === i ? { ...item, selected: !item.selected } : item));
  }

  function toggleAll() {
    const allSelected = items.every((i) => i.selected);
    setItems((prev) => prev.map((item) => ({ ...item, selected: !allSelected })));
  }

  function updateItem(i: number, field: keyof ParsedItem, value: string | number | boolean | null) {
    setItems((prev) => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  }

  async function handleSave() {
    const selected = items.filter((i) => i.selected && i.name.trim() && i.price > 0);
    if (selected.length === 0) return;

    setStep("saving");
    try {
      const count = await importProductsBulk(selected, globalCategory.trim());
      setSaved(count);
      setStep("done");
    } catch {
      setError("Erro ao salvar produtos. Tente novamente.");
      setStep("preview");
    }
  }

  const selectedCount = items.filter((i) => i.selected).length;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            {step === "preview" && (
              <button onClick={() => { setStep("upload"); setItems([]); setError(""); }}
                className="w-7 h-7 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                <ArrowLeft size={14} />
              </button>
            )}
            <h3 className="text-white font-semibold text-sm">
              {step === "upload" && "Importar produtos"}
              {step === "preview" && `${items.length} produto${items.length > 1 ? "s" : ""} encontrado${items.length > 1 ? "s" : ""}`}
              {step === "saving" && "Salvando produtos..."}
              {step === "done" && "Importação concluída!"}
            </h3>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* ── UPLOAD STEP ── */}
          {step === "upload" && (
            <div className="space-y-4">
              {!processing ? (
                <>
                  <label
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-8 cursor-pointer transition-all ${
                      dragging ? "border-emerald-500 bg-emerald-500/10" : "border-gray-700 hover:border-gray-500 hover:bg-gray-800/50"
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/*,.txt,.csv"
                      className="hidden"
                      onChange={handleFileInput}
                    />
                    <div className="w-12 h-12 rounded-2xl bg-gray-800 flex items-center justify-center">
                      <Upload size={22} className="text-gray-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-white font-medium text-sm">Clique ou arraste um arquivo</p>
                      <p className="text-gray-500 text-xs mt-1">Foto da lista, TXT ou CSV</p>
                    </div>
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-800/50 rounded-xl p-3 flex items-start gap-2.5">
                      <ImageIcon size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-white text-xs font-medium">Foto ou imagem</p>
                        <p className="text-gray-500 text-[11px] mt-0.5">JPG, PNG — o sistema lê o texto automaticamente</p>
                      </div>
                    </div>
                    <div className="bg-gray-800/50 rounded-xl p-3 flex items-start gap-2.5">
                      <FileText size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-white text-xs font-medium">Arquivo de texto</p>
                        <p className="text-gray-500 text-[11px] mt-0.5">TXT ou CSV — uma linha por produto com o preço</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800/50 rounded-xl p-3">
                    <p className="text-gray-400 text-xs font-medium mb-1.5">Exemplos de formatos aceitos:</p>
                    <pre className="text-gray-500 text-[11px] leading-relaxed">{`Pão Francês R$ 0,50
Croissant - 3,50
Bolo de Cenoura 15,00
Café;2,00`}</pre>
                  </div>

                  {error && (
                    <div className="bg-red-900/30 border border-red-800 rounded-xl p-3">
                      <p className="text-red-400 text-xs">{error}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <div className="relative w-16 h-16">
                    <div className="w-16 h-16 rounded-full border-4 border-gray-700" />
                    <div
                      className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"
                      style={{ animationDuration: "0.8s" }}
                    />
                    {ocrProgress > 0 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{ocrProgress}%</span>
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-white text-sm font-medium">{ocrStatus || "Processando..."}</p>
                    <p className="text-gray-500 text-xs mt-1">Aguarde, isso pode levar alguns segundos</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── PREVIEW STEP ── */}
          {step === "preview" && (
            <div className="space-y-3">
              {/* Global category input */}
              <div className="bg-gray-800/60 rounded-xl p-3 space-y-1.5">
                <label className="text-gray-400 text-xs font-medium">
                  Categoria global para esta lista{" "}
                  <span className="text-gray-600">(Opcional)</span>
                </label>
                <input
                  value={globalCategory}
                  onChange={(e) => setGlobalCategory(e.target.value)}
                  placeholder="Ex: Bebidas, Pães, Salgados..."
                  className="w-full bg-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-gray-600"
                />
                <p className="text-gray-600 text-[11px]">Se não existir, criaremos automaticamente para você.</p>
              </div>

              <div className="flex items-center justify-between">
                <button onClick={toggleAll} className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                  {items.every((i) => i.selected) ? "Desmarcar todos" : "Selecionar todos"}
                </button>
                <span className="text-gray-500 text-xs">{selectedCount} selecionado{selectedCount !== 1 ? "s" : ""}</span>
              </div>

              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={i} className={`bg-gray-800 rounded-xl p-3 flex flex-col gap-2 transition-opacity ${!item.selected ? "opacity-50" : ""}`}>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => toggleItem(i)}
                        className="w-4 h-4 accent-emerald-500 flex-shrink-0"
                      />
                      {/* Emoji picker */}
                      <select
                        value={item.emoji}
                        onChange={(e) => updateItem(i, "emoji", e.target.value)}
                        className="bg-gray-700 text-white text-lg rounded-lg px-1 py-1 border-none focus:outline-none w-12 text-center cursor-pointer"
                      >
                        {EMOJIS.map((e) => <option key={e} value={e}>{e}</option>)}
                      </select>
                      {/* Name */}
                      <input
                        value={item.name}
                        onChange={(e) => updateItem(i, "name", e.target.value)}
                        className="flex-1 bg-gray-700 text-white text-sm rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 min-w-0"
                      />
                      {/* Price */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="text-gray-500 text-xs">R$</span>
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => updateItem(i, "price", parseFloat(e.target.value) || 0)}
                          step="0.01"
                          min="0"
                          className="w-20 bg-gray-700 text-white text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-right"
                        />
                      </div>
                    </div>
                    {/* Category selector */}
                    {categories.length > 0 && (
                      <div className="flex items-center gap-2 pl-7">
                        <span className="text-gray-500 text-xs flex-shrink-0">Categoria:</span>
                        <select
                          value={item.categoryId ?? ""}
                          onChange={(e) => updateItem(i, "categoryId", e.target.value || null)}
                          className="flex-1 bg-gray-700 text-white text-xs rounded-lg px-2 py-1 border-none focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                        >
                          <option value="">— sem categoria —</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SAVING STEP ── */}
          {step === "saving" && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 size={40} className="text-emerald-500 animate-spin" />
              <div className="text-center">
                <p className="text-white font-medium">Importando produtos...</p>
                <p className="text-gray-400 text-sm mt-1">Inserindo {items.filter((i) => i.selected).length} produto{items.filter((i) => i.selected).length !== 1 ? "s" : ""} de uma vez só</p>
              </div>
            </div>
          )}

          {/* ── DONE STEP ── */}
          {step === "done" && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center">
                <Check size={28} strokeWidth={3} className="text-white" />
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-lg">{saved} produto{saved !== 1 ? "s" : ""} importado{saved !== 1 ? "s" : ""}!</p>
                <p className="text-gray-400 text-sm mt-1">Seus produtos já estão na loja.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === "preview" && (
          <div className="px-5 pb-5 border-t border-gray-800 pt-4">
            <button
              onClick={handleSave}
              disabled={selectedCount === 0}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl text-sm transition-colors"
            >
              Importar {selectedCount} produto{selectedCount !== 1 ? "s" : ""}
            </button>
          </div>
        )}

        {step === "done" && (
          <div className="px-5 pb-5 border-t border-gray-800 pt-4">
            <button onClick={onDone} className="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
