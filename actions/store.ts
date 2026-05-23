"use server";

import { prisma } from "@/lib/prisma";
import { createInstance } from "@/actions/evolution";

export async function createStore(name: string): Promise<{
  success: true;
  storeId: string;
  instanceName: string;
}> {
  console.log(`[STORE ACTION] criando loja: name="${name}"`);

  // Deriva o nome da instância a partir do nome da loja (sem espaços, lowercase)
  const instanceName = name.trim().toLowerCase().replace(/\s+/g, "-");

  const store = await prisma.store.create({
    data: {
      name: name.trim(),
      evolutionInstanceName: instanceName,
      evolutionConnectionState: "DISCONNECTED",
    },
  });

  console.log(`[STORE ACTION] loja criada no banco: id=${store.id}`);

  await createInstance(store.id, instanceName);

  console.log(
    `[STORE ACTION] instância Evolution criada: instanceName="${instanceName}"`
  );

  return { success: true, storeId: store.id, instanceName };
}

export async function getStoreByInstanceName(instanceName: string) {
  return prisma.store.findFirst({
    where: { evolutionInstanceName: instanceName },
  });
}

export async function getStoreBySlug(slug: string) {
  return prisma.store.findFirst({
    where: { evolutionInstanceName: slug },
  });
}

export async function updateStore(storeId: string, data: { name: string; phoneNumber?: string; logoUrl?: string | null }) {
  await prisma.store.update({ where: { id: storeId }, data });
}

export async function getStoreQrCode(storeId: string): Promise<{ qr?: string; connected?: boolean }> {
  console.log(`[STORE ACTION] buscando instância para storeId=${storeId}`);

  const store = await prisma.store.findUnique({ where: { id: storeId } });

  if (!store) throw new Error(`Loja não encontrada: ${storeId}`);
  if (!store.evolutionInstanceName) throw new Error(`Loja ${storeId} sem instância configurada`);

  const instanceName = store.evolutionInstanceName;
  console.log(`[STORE ACTION] instanceName resolvido: "${instanceName}"`);

  // Use WAHA for instances that have a WAHA session mapping
  const { getWahaSession, getWahaQrCode } = await import("@/actions/waha");
  const wahaSession = await getWahaSession(instanceName);

  if (wahaSession) {
    try {
      const result = await getWahaQrCode(wahaSession);
      if (result.connected) {
        await prisma.store.update({ where: { id: storeId }, data: { evolutionConnectionState: "open" } });
      }
      return result;
    } catch (err) {
      console.error(`[STORE ACTION] WAHA QR falhou: ${(err as Error).message}`);
      throw err;
    }
  }

  // Fallback: Evolution API
  const { getQrCode } = await import("@/actions/evolution");
  try {
    const result = await getQrCode(instanceName);
    return { qr: result.qrcode };
  } catch (err) {
    if ((err as Error).message === "ALREADY_CONNECTED") {
      await prisma.store.update({ where: { id: storeId }, data: { evolutionConnectionState: "open" } });
      return { connected: true };
    }
    throw err;
  }
}
