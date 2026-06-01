import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: "Entrenet — Gestão de loja e robô WhatsApp",
  description: "Plataforma completa com gestão de estoque, vitrine digital e robô de WhatsApp para comerciantes.",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-950 text-white antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
