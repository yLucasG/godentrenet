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

export async function updateStore(
  storeId: string,
  data: { name: string; phoneNumber?: string; logoUrl?: string | null; theme?: string }
) {
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

export async function checkStoreConnection(storeId: string): Promise<boolean> {
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store?.evolutionInstanceName) return false;

  const instanceName = store.evolutionInstanceName;

  const { getWahaSession } = await import("@/actions/waha");
  const wahaSession = await getWahaSession(instanceName);

  if (wahaSession) {
    try {
      const WAHA_URL = process.env.WAHA_API_URL ?? "http://godentrenet-waha:3000";
      const WAHA_KEY = process.env.WAHA_API_KEY ?? "";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (WAHA_KEY) headers["X-Api-Key"] = WAHA_KEY;

      const statusRes = await fetch(`${WAHA_URL}/api/sessions/${wahaSession}`, {
        headers,
        cache: "no-store",
        signal: AbortSignal.timeout(4000),
      });
      if (!statusRes.ok) return false;
      const data = (await statusRes.json()) as { status?: string; me?: unknown };

      if (data.status === "WORKING" && data.me) return true;

      // Session is STOPPED but was previously authenticated — start it and wait briefly
      if (data.status === "STOPPED" && store.evolutionConnectionState === "open") {
        await fetch(`${WAHA_URL}/api/sessions/${wahaSession}/start`, {
          method: "POST",
          headers,
          signal: AbortSignal.timeout(3000),
        }).catch(() => {});
        // Wait for session to restore credentials (usually fast when credentials exist)
        await new Promise((r) => setTimeout(r, 4000));
        const recheckRes = await fetch(`${WAHA_URL}/api/sessions/${wahaSession}`, {
          headers,
          cache: "no-store",
          signal: AbortSignal.timeout(4000),
        }).catch(() => null);
        if (recheckRes?.ok) {
          const recheckData = (await recheckRes.json()) as { status?: string; me?: unknown };
          if (recheckData.status === "WORKING" && recheckData.me) return true;
        }
      }

      return false;
    } catch {
      return store.evolutionConnectionState === "open";
    }
  }

  const { checkInstanceConnection } = await import("@/actions/evolution");
  return checkInstanceConnection(instanceName, store.evolutionConnectionState === "open");
}

export async function disconnectWhatsApp(): Promise<{ success: boolean }> {
  const { auth } = await import("@/auth");
  const session = await auth();
  if (!session?.user?.storeId) throw new Error("Unauthorized");
  const storeId = session.user.storeId;
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store || !store.evolutionInstanceName) return { success: false };

  const { logoutInstance } = await import("@/actions/evolution");
  await logoutInstance(store.evolutionInstanceName);

  await prisma.store.update({
    where: { id: storeId },
    data: { evolutionConnectionState: "close" },
  });

  const { revalidatePath } = await import("next/cache");
  revalidatePath("/dashboard");
  return { success: true };
}
