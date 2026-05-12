import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ConfigClient } from "./ConfigClient";

export default async function ConfigPage() {
  const session = await auth();
  if (!session?.user.storeId) return null;
  const store = await prisma.store.findUnique({ where: { id: session.user.storeId } });
  if (!store) return null;
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-2">Configurações</h1>
      <p className="text-gray-400 text-sm mb-6">Informações gerais da sua loja.</p>
      <ConfigClient store={store} />
    </div>
  );
}
