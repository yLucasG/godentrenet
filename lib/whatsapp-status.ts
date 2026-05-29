import { prisma } from "@/lib/prisma";

const WAHA_INSTANCE_MAP: Record<string, string> = { mapom: "default" };

export async function getWhatsAppConnectionStatus(storeId: string): Promise<boolean> {
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store || !store.evolutionInstanceName) return false;

  const dbConnected = store.evolutionConnectionState === "open";
  const instanceName = store.evolutionInstanceName;
  const wahaSession = WAHA_INSTANCE_MAP[instanceName] ?? null;

  if (wahaSession) {
    const WAHA_URL = process.env.WAHA_API_URL ?? "http://waha:3000";
    const WAHA_KEY = process.env.WAHA_API_KEY ?? "";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (WAHA_KEY) headers["X-Api-Key"] = WAHA_KEY;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      let statusRes: Response;
      try {
        statusRes = await fetch(`${WAHA_URL}/api/sessions/${wahaSession}`, {
          headers,
          cache: "no-store",
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }

      if (!statusRes.ok) {
        console.log(`[WA STATUS] WAHA ${wahaSession} HTTP ${statusRes.status} → DB: ${dbConnected}`);
        return dbConnected;
      }

      const data = (await statusRes.json()) as { status?: string; me?: unknown };
      console.log(`[WA STATUS] WAHA session=${wahaSession} status=${data.status} me=${!!data.me}`);

      if (data.status === "WORKING" && data.me) {
        if (!dbConnected) {
          await prisma.store.update({ where: { id: storeId }, data: { evolutionConnectionState: "open" } });
        }
        return true;
      }

      if (data.status === "STOPPED" && dbConnected) {
        fetch(`${WAHA_URL}/api/sessions/${wahaSession}/start`, { method: "POST", headers }).catch(() => {});
        return true;
      }

      if (dbConnected) {
        await prisma.store.update({ where: { id: storeId }, data: { evolutionConnectionState: "close" } });
      }
      return false;
    } catch (err) {
      console.log(`[WA STATUS] fetch error: ${(err as Error).message} → DB: ${dbConnected}`);
      return dbConnected;
    }
  }

  // Evolution path
  const EVO_URL = process.env.EVOLUTION_API_URL ?? "http://evolution:8080";
  const EVO_KEY = process.env.EVOLUTION_API_KEY ?? "";
  try {
    const res = await fetch(`${EVO_URL}/instance/connect/${encodeURIComponent(instanceName)}`, {
      method: "GET",
      headers: { apikey: EVO_KEY },
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return dbConnected;
    const data = (await res.json()) as Record<string, unknown>;
    const state = (data?.instance as Record<string, unknown>)?.state ?? data?.state;
    return state === "open";
  } catch {
    return dbConnected;
  }
}
