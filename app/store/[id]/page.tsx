"use client";

import { use, useState } from "react";
import { getStoreQrCode } from "@/actions/store";

type QrState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; qr: string }
  | { status: "error"; message: string };

export default function StorePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Next.js 15 — params é uma Promise em Client Components
  const { id } = use(params);

  const [qrState, setQrState] = useState<QrState>({ status: "idle" });

  async function handleConnect() {
    console.log("[STORE PAGE] solicitando QR Code para storeId:", id);
    setQrState({ status: "loading" });

    try {
      const result = await getStoreQrCode(id);

      if (!result.qr) throw new Error("QR Code não disponível.");

      setQrState({ status: "ready", qr: result.qr });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao gerar QR Code.";
      console.error("[STORE PAGE] erro ao obter QR Code:", message);
      setQrState({ status: "error", message });
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">

        {/* Cabeçalho */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Conectar WhatsApp</h1>
          <p className="text-gray-500 text-xs mt-1 font-mono">ID: {id}</p>
        </div>

        {/* Área do QR Code */}
        <div className="w-full flex flex-col items-center gap-4">
          {qrState.status === "idle" && (
            <div className="w-64 h-64 rounded-2xl border-2 border-dashed border-gray-700 flex items-center justify-center">
              <p className="text-gray-600 text-sm text-center px-4">
                Clique no botão abaixo para gerar o QR Code
              </p>
            </div>
          )}

          {qrState.status === "loading" && (
            <div className="w-64 h-64 rounded-2xl border-2 border-gray-800 bg-gray-900 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
              <p className="text-gray-400 text-sm">Gerando...</p>
            </div>
          )}

          {qrState.status === "ready" && (
            <div className="flex flex-col items-center gap-3">
              <img
                src={qrState.qr}
                alt="QR Code WhatsApp"
                width={256}
                height={256}
                className="rounded-2xl border-4 border-green-600 shadow-lg shadow-green-900/30"
              />
              <p className="text-green-400 text-xs text-center">
                Escaneie com o WhatsApp &rarr; Aparelhos conectados
              </p>
            </div>
          )}

          {qrState.status === "error" && (
            <div className="w-64 rounded-2xl border border-red-800 bg-red-900/30 p-4 text-center">
              <p className="text-red-400 text-sm">{qrState.message}</p>
            </div>
          )}
        </div>

        {/* Botão principal */}
        <button
          onClick={handleConnect}
          disabled={qrState.status === "loading"}
          className="w-full rounded-2xl bg-green-600 hover:bg-green-500 active:scale-95 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold text-lg py-5 transition-all shadow-lg shadow-green-900/40"
        >
          {qrState.status === "loading"
            ? "Gerando..."
            : qrState.status === "ready"
            ? "Gerar Novo QR Code"
            : "Conectar WhatsApp"}
        </button>
      </div>
    </main>
  );
}
