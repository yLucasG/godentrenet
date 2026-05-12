"use client";

import { useState, useRef } from "react";
import { updateStore } from "@/actions/store";
import type { Store } from "@prisma/client";
import { X, Upload, Image as ImageIcon } from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://entrenet.tech";

export function ConfigClient({ store }: { store: Store & { logoUrl?: string | null } }) {
  const [name, setName] = useState(store.name);
  const [phoneNumber, setPhoneNumber] = useState(store.phoneNumber ?? "");
  const [logoUrl, setLogoUrl] = useState<string | null>(store.logoUrl ?? null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(store.logoUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const publicUrl = `${BASE_URL}/${store.evolutionInstanceName}`;

  function handleFileSelect(file: File) {
    if (!file.type.startsWith("image/")) return;
    setPendingFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  function clearLogo() {
    setPendingFile(null);
    setPreviewUrl(null);
    setLogoUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      let finalLogoUrl = logoUrl;

      if (pendingFile) {
        setUploading(true);
        const fd = new FormData();
        fd.append("file", pendingFile);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Erro ao enviar imagem");
        finalLogoUrl = json.url;
        setLogoUrl(json.url);
        setPendingFile(null);
        setUploading(false);
      }

      await updateStore(store.id, {
        name,
        phoneNumber: phoneNumber || undefined,
        logoUrl: finalLogoUrl,
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
      setUploading(false);
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      {/* Logo */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-white text-sm font-semibold mb-1">Logo da loja</h2>
        <p className="text-gray-500 text-xs mb-4">
          Aparece no cabeçalho da loja pública. Recomendado: quadrado, mínimo 200×200px.
        </p>

        {previewUrl ? (
          <div className="relative w-28 h-28 rounded-2xl overflow-hidden bg-gray-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Logo" className="w-full h-full object-cover" />
            <button
              onClick={clearLogo}
              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
              aria-label="Remover logo"
            >
              <X size={12} />
            </button>
            {pendingFile && (
              <div className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">
                Novo arquivo
              </div>
            )}
          </div>
        ) : (
          <label
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files[0];
              if (file) handleFileSelect(file);
            }}
            className={`flex flex-col items-center justify-center gap-2 w-full h-32 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
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
            <ImageIcon size={24} className="text-gray-500" />
            <p className="text-gray-500 text-xs text-center">
              Clique ou arraste uma imagem
            </p>
          </label>
        )}
      </div>

      {/* Informações gerais */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <div>
          <label className="text-white text-sm font-medium block mb-1">Nome da loja</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
          />
        </div>

        <div>
          <label className="text-white text-sm font-medium block mb-1">Número do WhatsApp</label>
          <p className="text-gray-500 text-xs mb-1">Com código do país, sem espaços. Ex: 5587988444564</p>
          <input
            value={phoneNumber}
            onChange={e => setPhoneNumber(e.target.value)}
            placeholder="5587988444564"
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
          />
        </div>

        <div>
          <label className="text-white text-sm font-medium block mb-1">URL pública</label>
          <div className="flex items-center gap-2">
            <input
              value={publicUrl}
              readOnly
              className="flex-1 bg-gray-800/50 border border-gray-700 text-gray-400 rounded-lg px-3 py-2 text-sm cursor-default"
            />
            <a
              href={publicUrl}
              target="_blank"
              className="text-green-500 text-sm hover:underline whitespace-nowrap"
            >
              Abrir →
            </a>
          </div>
          <p className="text-gray-500 text-xs mt-1">Esta é a página que seus clientes veem.</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving || !name}
          className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
        >
          {uploading ? (
            <><Upload size={13} className="animate-bounce" /> Enviando...</>
          ) : saving ? (
            "Salvando..."
          ) : (
            "Salvar"
          )}
        </button>
        {saved && <span className="text-green-400 text-sm">Salvo ✓</span>}
      </div>
    </div>
  );
}
