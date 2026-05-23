"use server";

const WAHA_URL = process.env.WAHA_API_URL ?? "http://godentrenet-waha:3000";
const WAHA_KEY = process.env.WAHA_API_KEY ?? "";

// Maps evolutionInstanceName → WAHA session name
const WAHA_INSTANCE_MAP: Record<string, string> = { mapom: "default" };

export function getWahaSession(instanceName: string): string | null {
  return WAHA_INSTANCE_MAP[instanceName] ?? null;
}

async function wahaFetch(path: string, options?: RequestInit) {
  return fetch(`${WAHA_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(WAHA_KEY ? { "X-Api-Key": WAHA_KEY } : {}),
      ...(options?.headers ?? {}),
    },
  });
}

async function ensureSessionStarted(session: string): Promise<void> {
  const statusRes = await wahaFetch(`/api/sessions/${session}`);
  if (!statusRes.ok) return;
  const data = (await statusRes.json()) as { status?: string };
  if (data.status === "STOPPED" || data.status === "FAILED") {
    await wahaFetch(`/api/sessions/${session}/start`, { method: "POST" });
    // give it a moment to start
    await new Promise((r) => setTimeout(r, 8000));
  }
}

export async function getWahaQrCode(
  session: string
): Promise<{ qr?: string; connected?: boolean }> {
  await ensureSessionStarted(session);

  const statusRes = await wahaFetch(`/api/sessions/${session}`);
  if (!statusRes.ok) throw new Error("WAHA: erro ao verificar sessão");

  const status = (await statusRes.json()) as { status?: string; me?: unknown };

  if (status.status === "WORKING" && status.me) {
    return { connected: true };
  }

  if (status.status !== "SCAN_QR_CODE") {
    throw new Error(`WAHA: estado inesperado "${status.status}"`);
  }

  const qrRes = await wahaFetch(`/api/${session}/auth/qr?format=image`, {
    headers: { Accept: "image/png", ...(WAHA_KEY ? { "X-Api-Key": WAHA_KEY } : {}) },
  });

  if (!qrRes.ok) throw new Error(`WAHA: QR retornou ${qrRes.status}`);

  const buf = await qrRes.arrayBuffer();
  const base64 = Buffer.from(buf).toString("base64");
  return { qr: `data:image/png;base64,${base64}` };
}
