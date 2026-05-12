"use client";

import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import type { Product } from "@prisma/client";

const EMOJIS = ["🍞", "🥐", "🎂", "🧁", "🍕", "🍔", "🌮", "☕", "🧃", "🛍️", "🥩", "🥗", "🥟", "🍫", "🍦", "🍪", "🧀", "🥚", "🥤", "💧", "🌭", "🫕", "🥘", "🍜"];

interface SaveData {
  name: string;
  price: number;
  emoji: string;
  imageUrl: string | null;
}

interface Props {
  onClose: () => void;
  onSave: (data: SaveData) => Promise<void>;
  initial?: Product & { imageUrl?: string | null };
}

export function ProductModal({ onClose, onSave, initial }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [price, setPrice] = useState(initial?.price?.toString() ?? "");
  const [emoji, setEmoji] = useState(initial?.emoji ?? "🛍️");
  const [imageUrl, setImageUrl] = useState<string | null>(initial?.imageUrl ?? null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initial?.imageUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h3 className="text-white font-semibold text-sm">{initial ? "Editar produto" : "Novo produto"}</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Image upload */}
          <div>
            <label className="text-gray-400 text-xs font-medium block mb-2">Imagem do produto</label>
            {previewUrl ? (
              <div className="relative rounded-2xl overflow-hidden bg-gray-800 h-36">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                <button
                  onClick={clearImage}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                >
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
                  dragOver
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-gray-700 hover:border-gray-500 hover:bg-gray-800/50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                />
                <ImageIcon size={20} className="text-gray-500" />
                <p className="text-gray-500 text-xs text-center">
                  Clique ou arraste uma imagem<br />
                  <span className="text-gray-600">ou use o emoji abaixo</span>
                </p>
              </label>
            )}
          </div>

          {/* Emoji (shown when no image or as override) */}
          {!previewUrl && (
            <div>
              <label className="text-gray-400 text-xs font-medium block mb-2">Emoji (se não tiver imagem)</label>
              <div className="flex flex-wrap gap-1.5">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => setEmoji(e)}
                    className={`text-xl w-9 h-9 rounded-xl transition-colors ${emoji === e ? "bg-emerald-700 ring-1 ring-emerald-500" : "bg-gray-800 hover:bg-gray-700"}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="text-gray-400 text-xs font-medium block mb-1.5">Nome do produto *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Pão Francês"
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Price */}
          <div>
            <label className="text-gray-400 text-xs font-medium block mb-1.5">Preço (R$) *</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0,00"
              step="0.01"
              min="0"
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl py-2.5 text-sm transition-colors">
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !canSave}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
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
    </div>
  );
}
