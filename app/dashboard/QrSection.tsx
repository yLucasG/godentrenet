"use client";

import { useState } from "react";
import { getStoreQrCode } from "@/actions/store";
import Image from "next/image";

export function QrSection({ storeId }: { storeId: string }) {
  const [qr, setQr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadQr() {
    setLoading(true);
    setError("");
    try {
      const result = await getStoreQrCode(storeId);
      if (result.qr) {
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
    <button
      onClick={loadQr}
      disabled={loading}
      className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
    >
      {loading ? "Gerando QR..." : "Gerar QR Code"}
    </button>
  );
}
