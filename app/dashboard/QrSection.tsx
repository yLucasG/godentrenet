"use client";

import { useState } from "react";
import { getStoreQrCode } from "@/actions/store";
import Image from "next/image";

export function QrSection({ storeId }: { storeId: string }) {
  const [qr, setQr] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadQr() {
    setLoading(true);
    setError("");
    try {
      const result = await getStoreQrCode(storeId);
      if (result.connected) {
        setConnected(true);
      } else if (result.qr) {
        setQr(result.qr);
      } else {
        setError("Não foi possível gerar o QR. Tente novamente.");
      }
    } catch {
      setError("Erro ao gerar QR code.");
    } finally {
      setLoading(false);
    }
  }

  if (connected) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-green-400 font-medium">WhatsApp conectado com sucesso ✅</p>
        <p className="text-gray-400 text-sm">Recarregue a página para atualizar o status.</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-1 text-green-500 text-sm hover:underline w-fit"
        >
          Recarregar
        </button>
      </div>
    );
  }

  if (qr) {
    return (
      <div className="flex flex-col items-start gap-3">
        <div className="border-4 border-green-500 rounded-xl overflow-hidden inline-block shadow-lg shadow-green-900/30">
          <Image src={qr} alt="QR Code WhatsApp" width={220} height={220} />
        </div>
        <p className="text-gray-400 text-xs">QR expira em 60 segundos. Após escanear, recarregue a página.</p>
        <button
          onClick={loadQr}
          className="text-green-500 text-sm hover:underline"
        >
          Gerar novo QR
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={loadQr}
        disabled={loading}
        className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors w-fit"
      >
        {loading ? "Verificando..." : "Gerar QR Code"}
      </button>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}
