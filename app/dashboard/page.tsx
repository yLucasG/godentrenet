import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { QrSection } from "./QrSection";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user.storeId) return null;

  const storeId = session.user.storeId;

  const [totalMessages, uniqueContacts, store] = await Promise.all([
    prisma.botMessage.count({ where: { storeId, direction: "in" } }),
    prisma.botMessage.groupBy({ by: ["fromPhone"], where: { storeId } }).then(r => r.length),
    prisma.store.findUnique({ where: { id: storeId } }),
  ]);

  const connected = store?.evolutionConnectionState === "open";

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-6">Início</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm mb-1">Status WhatsApp</p>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${connected ? "bg-green-500" : "bg-yellow-500"}`} />
            <span className={`font-semibold ${connected ? "text-green-400" : "text-yellow-400"}`}>
              {connected ? "Conectado" : "Desconectado"}
            </span>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm mb-1">Mensagens recebidas</p>
          <p className="text-3xl font-bold text-white">{totalMessages}</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm mb-1">Contatos únicos</p>
          <p className="text-3xl font-bold text-white">{uniqueContacts}</p>
        </div>
      </div>

      {!connected && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-2">Conectar WhatsApp</h2>
          <p className="text-gray-400 text-sm mb-4">
            Escaneie o QR code abaixo com o WhatsApp do celular para ativar o bot.
          </p>
          <QrSection storeId={storeId} />
        </div>
      )}

      {connected && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-1">WhatsApp conectado ✅</h2>
          <p className="text-gray-400 text-sm">
            Sua loja está online. O bot responde automaticamente às mensagens dos clientes.
          </p>
          {session.user.instanceName && (
            <a
              href={`/${session.user.instanceName}`}
              target="_blank"
              className="inline-block mt-3 text-green-500 text-sm hover:underline"
            >
              Ver página pública da loja →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
