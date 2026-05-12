"use client";

import { useState } from "react";
import { saveBotConfig } from "@/actions/bot";
import type { BotConfig } from "@prisma/client";

export function BotConfigClient({ initial }: { initial: BotConfig | null }) {
  const [welcomeMessage, setWelcomeMessage] = useState(
    initial?.welcomeMessage ?? "Olá! Seja bem-vindo. Como posso ajudar?"
  );
  const [requireKeyword, setRequireKeyword] = useState(initial?.requireKeyword ?? false);
  const [keyword, setKeyword] = useState(initial?.keyword ?? "@hello");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    await saveBotConfig({ welcomeMessage, requireKeyword, keyword });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="max-w-lg space-y-6">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <div>
          <label className="text-white text-sm font-medium block mb-1">Mensagem de boas-vindas</label>
          <p className="text-gray-500 text-xs mb-2">
            Essa mensagem é enviada quando um cliente entra em contato (ou após a palavra-chave).
          </p>
          <textarea
            value={welcomeMessage}
            onChange={e => setWelcomeMessage(e.target.value)}
            rows={4}
            placeholder="Olá! Seja bem-vindo à nossa loja..."
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500 resize-none"
          />
        </div>

        <div className="border-t border-gray-800 pt-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <label className="text-white text-sm font-medium">Exigir palavra-chave</label>
              <p className="text-gray-500 text-xs">Bot só responde se a mensagem começar com a palavra-chave</p>
            </div>
            <button
              onClick={() => setRequireKeyword(!requireKeyword)}
              className={`relative w-11 h-6 rounded-full transition-colors ${requireKeyword ? "bg-green-600" : "bg-gray-700"}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${requireKeyword ? "translate-x-5" : "translate-x-0"}`}
              />
            </button>
          </div>

          {requireKeyword && (
            <div className="mt-3">
              <label className="text-gray-400 text-sm block mb-1">Palavra-chave</label>
              <input
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                placeholder="@hello"
                className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500 w-48"
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {saving ? "Salvando..." : "Salvar configurações"}
        </button>
        {saved && <span className="text-green-400 text-sm">Salvo ✓</span>}
      </div>
    </div>
  );
}
