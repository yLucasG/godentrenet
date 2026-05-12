import { getBotConfig } from "@/actions/bot";
import { BotConfigClient } from "./BotConfigClient";

export default async function BotPage() {
  const config = await getBotConfig();
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-2">Configurar Bot</h1>
      <p className="text-gray-400 text-sm mb-6">Defina como o bot vai responder seus clientes.</p>
      <BotConfigClient initial={config} />
    </div>
  );
}
