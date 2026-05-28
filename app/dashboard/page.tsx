import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { QrSection } from "./QrSection";
import { DisconnectButton } from "./DisconnectButton";

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
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Início</h1>
        <p className="text-sm text-gray-400 mt-1">Visão geral da sua loja</p>
      </div>

      {/* Bento grid — stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {/* WhatsApp status */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-[2rem] p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
          <p className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-4">WhatsApp</p>
          <div className="flex items-center gap-3">
            <span
              className={`w-3 h-3 rounded-full shrink-0 ${
                connected
                  ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]"
                  : "bg-amber-400"
              }`}
            />
            <span className={`text-lg font-extrabold tracking-tight ${connected ? "text-emerald-700" : "text-amber-700"}`}>
              {connected ? "Conectado" : "Desconectado"}
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="bg-sky-50 border border-sky-100 rounded-[2rem] p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
          <p className="text-sky-400 text-[10px] font-bold uppercase tracking-widest mb-3">Mensagens</p>
          <p className="text-5xl font-extrabold tracking-tight text-sky-900 leading-none">{totalMessages}</p>
          <p className="text-sky-400 text-xs font-medium mt-2">recebidas</p>
        </div>

        {/* Contacts */}
        <div className="bg-violet-50 border border-violet-100 rounded-[2rem] p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
          <p className="text-violet-400 text-[10px] font-bold uppercase tracking-widest mb-3">Contatos</p>
          <p className="text-5xl font-extrabold tracking-tight text-violet-900 leading-none">{uniqueContacts}</p>
          <p className="text-violet-400 text-xs font-medium mt-2">únicos</p>
        </div>
      </div>

      {/* QR connect card */}
      {!connected && (
        <div className="bg-white border border-gray-100 rounded-[2rem] p-7 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
          <h2 className="text-gray-900 font-extrabold text-lg tracking-tight mb-1">Conectar WhatsApp</h2>
          <p className="text-gray-400 text-sm mb-6">
            Escaneie o QR code abaixo com o WhatsApp do celular para ativar o bot.
          </p>
          <QrSection storeId={storeId} />
        </div>
      )}

      {/* Connected card */}
      {connected && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-[2rem] p-7 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-emerald-900 font-extrabold text-lg tracking-tight">WhatsApp ativo</h2>
              <p className="text-emerald-700 text-sm mt-1">
                Sua loja está online. O bot responde automaticamente às mensagens dos clientes.
              </p>
              <div className="flex flex-col gap-2 items-start mt-5">
                {session.user.instanceName && (
                  <a
                    href={`/${session.user.instanceName}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-emerald-600 text-sm font-semibold hover:text-emerald-800 transition-colors"
                  >
                    Ver página pública da loja →
                  </a>
                )}
                <DisconnectButton />
              </div>
            </div>
            <div className="text-5xl shrink-0 opacity-80">✅</div>
          </div>
        </div>
      )}
    </div>
  );
}
