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
        <p className="text-amber-400 font-medium">WhatsApp conectado com sucesso ✅</p>
        <p className="text-gray-400 text-sm">Recarregue a página para atualizar o status.</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-1 text-amber-500 text-sm hover:underline w-fit"
        >
          Recarregar
        </button>
      </div>
    );
  }

  if (qr) {
    return (
      <div className="flex flex-col items-start gap-3">
        <div className="border-2 border-amber-500 rounded-xl overflow-hidden inline-block shadow-lg"
          style={{ boxShadow: "0 0 20px rgba(245,158,11,0.2)" }}
        >
          <Image src={qr} alt="QR Code WhatsApp" width={220} height={220} />
        </div>
        <p className="text-gray-400 text-xs">QR expira em 60 segundos. Após escanear, recarregue a página.</p>
        <button
          onClick={loadQr}
          className="text-amber-500 text-sm hover:underline"
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
        className="disabled:opacity-50 text-gray-950 font-bold px-5 py-2.5 rounded-full text-sm transition-all w-fit"
        style={{ background: "#F59E0B" }}
        onMouseEnter={e => !loading && ((e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 20px rgba(245,158,11,0.5)")}
        onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.boxShadow = "none")}
      >
        {loading ? "Verificando..." : "Gerar QR Code"}
      </button>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}
