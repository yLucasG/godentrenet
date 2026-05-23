"use client";

import { useState, useTransition } from "react";
import { disconnectWhatsApp } from "@/actions/store";

export function DisconnectButton() {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function handleDisconnect() {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 5000); // Reseta após 5 segundos
      return;
    }

    startTransition(async () => {
      try {
        const res = await disconnectWhatsApp();
        if (res.success) {
          window.location.reload();
        } else {
          alert("Não foi possível desconectar a instância. Tente novamente.");
        }
      } catch (err) {
        console.error(err);
        alert("Ocorreu um erro ao desconectar o WhatsApp.");
      }
    });
  }

  return (
    <button
      onClick={handleDisconnect}
      disabled={isPending}
      className={`inline-block mt-4 px-4 py-2 rounded-xl text-xs font-semibold border transition-all duration-300 ${
        confirming
          ? "bg-red-600 hover:bg-red-700 text-white border-red-600 animate-pulse scale-105"
          : "bg-transparent border-red-500/20 text-red-400 hover:bg-red-950/20 hover:border-red-500/50"
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {isPending
        ? "Desconectando..."
        : confirming
        ? "Tem certeza? Clique novamente para confirmar"
        : "Desconectar WhatsApp"}
    </button>
  );
}
