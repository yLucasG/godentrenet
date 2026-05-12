"use client";

import { useState } from "react";
import { updateStore } from "@/actions/store";
import type { Store } from "@prisma/client";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://entrenet.tech";

export function ConfigClient({ store }: { store: Store }) {
  const [name, setName] = useState(store.name);
  const [phoneNumber, setPhoneNumber] = useState(store.phoneNumber ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const publicUrl = `${BASE_URL}/${store.evolutionInstanceName}`;

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    await updateStore(store.id, { name, phoneNumber: phoneNumber || undefined });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="max-w-lg space-y-6">
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
          className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {saving ? "Salvando..." : "Salvar"}
        </button>
        {saved && <span className="text-green-400 text-sm">Salvo ✓</span>}
      </div>
    </div>
  );
}
