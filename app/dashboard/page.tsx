import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getWhatsAppConnectionStatus } from "@/lib/whatsapp-status";
import { QrSection } from "./QrSection";
import { DisconnectButton } from "./DisconnectButton";

// Força re-render a cada navegação — evita cache stale do status do WhatsApp
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user.storeId) return null;

  const storeId = session.user.storeId;

  const [totalMessages, uniqueContacts] = await Promise.all([
    prisma.botMessage.count({ where: { storeId, direction: "in" } }),
    prisma.botMessage.groupBy({ by: ["fromPhone"], where: { storeId } }).then(r => r.length),
  ]);

  const connected = await getWhatsAppConnectionStatus(storeId);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-white">Início</h1>
        <p className="text-gray-500 text-sm mt-1">Visão geral da sua loja</p>
      </div>

      {/* Bento stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {/* WhatsApp status */}
        <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: "linear-gradient(to right, rgba(245,158,11,0), rgba(245,158,11,0.5), rgba(245,158,11,0))" }} />
          <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.3)" }}>WhatsApp</p>
          <div className="flex items-center gap-3">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              connected
                ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                : "bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]"
            }`} />
            <span className={`text-lg font-extrabold tracking-tight ${connected ? "text-emerald-400" : "text-amber-400"}`}>
              {connected ? "Conectado" : "Desconectado"}
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: "linear-gradient(to right, rgba(245,158,11,0), rgba(245,158,11,0.35), rgba(245,158,11,0))" }} />
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>Mensagens</p>
          <p className="text-5xl font-extrabold tracking-tight text-amber-400 leading-none">{totalMessages}</p>
          <p className="text-xs font-medium mt-2" style={{ color: "rgba(255,255,255,0.3)" }}>recebidas</p>
        </div>

        {/* Contacts */}
        <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: "linear-gradient(to right, rgba(245,158,11,0), rgba(245,158,11,0.2), rgba(245,158,11,0))" }} />
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>Contatos</p>
          <p className="text-5xl font-extrabold tracking-tight text-white leading-none">{uniqueContacts}</p>
          <p className="text-xs font-medium mt-2" style={{ color: "rgba(255,255,255,0.3)" }}>únicos</p>
        </div>
      </div>

      {/* QR connect card */}
      {!connected && (
        <div className="rounded-2xl p-7" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <h2 className="text-white font-extrabold text-lg tracking-tight mb-1">Conectar WhatsApp</h2>
          <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>
            Escaneie o QR code abaixo com o WhatsApp do celular para ativar o bot.
          </p>
          <QrSection storeId={storeId} />
        </div>
      )}

      {/* Connected card */}
      {connected && (
        <div className="rounded-2xl p-7 relative overflow-hidden" style={{ background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.15)" }}>
          <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: "linear-gradient(to right, rgba(245,158,11,0), rgba(245,158,11,0.5), rgba(245,158,11,0))" }} />
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-white font-extrabold text-lg tracking-tight">WhatsApp ativo</h2>
              <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
                Sua loja está online. O bot responde automaticamente às mensagens dos clientes.
              </p>
              <div className="flex flex-col gap-2 items-start mt-5">
                {session.user.instanceName && (
                  <a
                    href={`/${session.user.instanceName}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-amber-400 text-sm font-semibold hover:text-amber-300 transition-colors"
                  >
                    Ver página pública da loja →
                  </a>
                )}
                <DisconnectButton />
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
              ✅
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
