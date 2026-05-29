import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { QrSection } from "./QrSection";
import { DisconnectButton } from "./DisconnectButton";

// Força re-render a cada navegação — evita cache stale do status do WhatsApp
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user.storeId) return null;

  const storeId = session.user.storeId;

  const [totalMessages, uniqueContacts, store] = await Promise.all([
    prisma.botMessage.count({ where: { storeId, direction: "in" } }),
    prisma.botMessage.groupBy({ by: ["fromPhone"], where: { storeId } }).then(r => r.length),
    prisma.store.findUnique({ where: { id: storeId } }),
  ]);

  let connected = store?.evolutionConnectionState === "open";
  if (store?.evolutionInstanceName) {
    const { checkInstanceConnection } = await import("@/actions/evolution");
    const realConnected = await checkInstanceConnection(store.evolutionInstanceName, connected);
    if (realConnected !== connected) {
      connected = realConnected;
      await prisma.store.update({
        where: { id: storeId },
        data: { evolutionConnectionState: realConnected ? "open" : "close" },
      });
    }
  }

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
        <div className="bg-gray-900 border border-gray-800/80 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-500/60 to-emerald-500/0" />
          <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest mb-4">WhatsApp</p>
          <div className="flex items-center gap-3">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              connected
                ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                : "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"
            }`} />
            <span className={`text-lg font-extrabold tracking-tight ${connected ? "text-emerald-400" : "text-amber-400"}`}>
              {connected ? "Conectado" : "Desconectado"}
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="bg-gray-900 border border-gray-800/80 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-sky-500/0 via-sky-500/60 to-sky-500/0" />
          <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest mb-3">Mensagens</p>
          <p className="text-5xl font-extrabold tracking-tight text-sky-400 leading-none">{totalMessages}</p>
          <p className="text-gray-600 text-xs font-medium mt-2">recebidas</p>
        </div>

        {/* Contacts */}
        <div className="bg-gray-900 border border-gray-800/80 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-violet-500/0 via-violet-500/60 to-violet-500/0" />
          <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest mb-3">Contatos</p>
          <p className="text-5xl font-extrabold tracking-tight text-violet-400 leading-none">{uniqueContacts}</p>
          <p className="text-gray-600 text-xs font-medium mt-2">únicos</p>
        </div>
      </div>

      {/* QR connect card */}
      {!connected && (
        <div className="bg-gray-900 border border-gray-800/80 rounded-2xl p-7">
          <h2 className="text-white font-extrabold text-lg tracking-tight mb-1">Conectar WhatsApp</h2>
          <p className="text-gray-500 text-sm mb-6">
            Escaneie o QR code abaixo com o WhatsApp do celular para ativar o bot.
          </p>
          <QrSection storeId={storeId} />
        </div>
      )}

      {/* Connected card */}
      {connected && (
        <div className="bg-gray-900 border border-emerald-800/30 rounded-2xl p-7 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-500/50 to-emerald-500/0" />
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-white font-extrabold text-lg tracking-tight">WhatsApp ativo</h2>
              <p className="text-gray-400 text-sm mt-1">
                Sua loja está online. O bot responde automaticamente às mensagens dos clientes.
              </p>
              <div className="flex flex-col gap-2 items-start mt-5">
                {session.user.instanceName && (
                  <a
                    href={`/${session.user.instanceName}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-emerald-400 text-sm font-semibold hover:text-emerald-300 transition-colors"
                  >
                    Ver página pública da loja →
                  </a>
                )}
                <DisconnectButton />
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-2xl shrink-0">
              ✅
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
