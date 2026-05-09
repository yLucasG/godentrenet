"use client";

import { useState } from "react";
import { createStore } from "@/actions/store";

type Toast = { type: "success" | "error"; message: string };

export default function AdminPage() {
  const [storeName, setStoreName] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  function showToast(type: Toast["type"], message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!storeName.trim()) return;

    console.log("[ADMIN PAGE] submetendo formulário, storeName:", storeName);
    setLoading(true);
    setToast(null);

    try {
      const result = await createStore(storeName);

      console.log("[ADMIN PAGE] loja criada com sucesso:", result);

      showToast(
        "success",
        `Loja "${storeName}" criada! Acesse /store/${result.storeId} para conectar o WhatsApp.`
      );
      setStoreName("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido.";
      console.error("[ADMIN PAGE] erro ao criar loja:", message);
      showToast("error", message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-gray-900 rounded-2xl p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-white mb-1">Painel Admin</h1>
        <p className="text-gray-400 text-sm mb-8">
          Crie uma loja e registre a instância WhatsApp na Evolution.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="storeName" className="text-sm text-gray-300">
              Nome da Loja
            </label>
            <input
              id="storeName"
              type="text"
              placeholder="Ex: Loja do João"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              disabled={loading}
              className="rounded-lg bg-gray-800 border border-gray-700 text-white px-4 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !storeName.trim()}
            className="mt-2 rounded-lg bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-2.5 text-sm transition-colors"
          >
            {loading ? "Criando..." : "Criar Loja e Instância"}
          </button>
        </form>

        {toast && (
          <div
            className={`mt-6 rounded-lg px-4 py-3 text-sm font-medium ${
              toast.type === "success"
                ? "bg-green-900/60 text-green-300 border border-green-700"
                : "bg-red-900/60 text-red-300 border border-red-700"
            }`}
          >
            {toast.message}
          </div>
        )}
      </div>
    </main>
  );
}
