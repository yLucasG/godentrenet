"use server";

const EVO_URL = process.env.EVOLUTION_API_URL ?? "http://localhost:8080";
const EVO_KEY = process.env.EVOLUTION_API_KEY ?? "";

export async function createInstance(
  _storeId: string,
  instanceName: string
): Promise<{ success: true; instanceName: string }> {
  const endpoint = `${EVO_URL}/instance/create`;

  console.log(`[EVO ACTION CREATE] → POST ${endpoint}`);

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: EVO_KEY,
    },
    body: JSON.stringify({
      instanceName,
      qrcode: true,
      integration: "WHATSAPP-BAILEYS",
    }),
  });

  const raw = await res.text();

  if (!res.ok) {
    if (res.status === 403 && raw.toLowerCase().includes("already")) {
      return { success: true, instanceName };
    }
    throw new Error(`Evolution API retornou erro: ${raw}`);
  }

  await configureWebhook(instanceName);

  return { success: true, instanceName };
}

export async function configureWebhook(instanceName: string): Promise<void> {
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const webhookUrl = `${BASE_URL}/api/webhook/evolution`;
  const endpoint = `${EVO_URL}/webhook/set/${encodeURIComponent(instanceName)}`;

  await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: EVO_KEY },
    body: JSON.stringify({
      webhook: {
        enabled: true,
        url: webhookUrl,
        webhookByEvents: false,
        webhookBase64: false,
        events: ["MESSAGES_UPSERT", "CONNECTION_UPDATE"],
      },
    }),
  });
}

export async function getQrCode(
  instanceName: string
): Promise<{ qrcode: string }> {
  const connectEndpoint = `${EVO_URL}/instance/connect/${encodeURIComponent(instanceName)}`;
  const MAX_ATTEMPTS = 8;
  const DELAY_MS = 2500;

  // Check if already connected before restarting
  const stateRes = await fetch(connectEndpoint, {
    method: "GET",
    headers: { apikey: EVO_KEY },
    cache: "no-store",
  }).catch(() => null);
  if (stateRes?.ok) {
    const stateRaw = await stateRes.text().catch(() => "");
    try {
      const stateJson = JSON.parse(stateRaw) as Record<string, unknown>;
      const instanceState = (stateJson?.instance as Record<string, unknown>)?.state ?? stateJson?.state;
      if (instanceState === "open") {
        throw new Error("ALREADY_CONNECTED");
      }
    } catch (e) {
      if ((e as Error).message === "ALREADY_CONNECTED") throw e;
    }
  }

  // Restart to force new QR generation only when disconnected
  await fetch(`${EVO_URL}/instance/restart/${encodeURIComponent(instanceName)}`, {
    method: "PUT",
    headers: { apikey: EVO_KEY },
  }).catch(() => {});

  await new Promise((r) => setTimeout(r, 3000));

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    console.log(`[EVO QR] tentativa ${attempt}/${MAX_ATTEMPTS} para ${instanceName}`);

    const res = await fetch(connectEndpoint, {
      method: "GET",
      headers: { apikey: EVO_KEY },
      cache: "no-store",
    });

    const raw = await res.text();
    console.log(`[EVO QR] resposta (${res.status}): ${raw.slice(0, 200)}`);

    if (!res.ok) throw new Error(`Erro: ${raw}`);

    let parsed: Record<string, unknown>;
    try { parsed = JSON.parse(raw); } catch { throw new Error(`Não-JSON: ${raw}`); }

    const base64Candidates = [
      parsed?.qrcode,
      (parsed?.qrcode as Record<string, unknown>)?.base64,
      parsed?.base64,
      parsed?.code,
      (parsed?.data as Record<string, unknown>)?.qrcode,
      (parsed?.data as Record<string, unknown>)?.base64,
    ];

    const raw64 = base64Candidates.find(
      (v) => typeof v === "string" && (v as string).length > 100
    ) as string | undefined;

    if (raw64) {
      const qrcode = raw64.startsWith("data:")
        ? raw64
        : `data:image/png;base64,${raw64}`;
      return { qrcode };
    }

    if (attempt < MAX_ATTEMPTS) await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
  }

  throw new Error(`QR Code não gerado.`);
}

export async function checkInstanceConnection(
  instanceName: string,
  fallbackState: boolean = false
): Promise<boolean> {
  const endpoint = `${EVO_URL}/instance/connect/${encodeURIComponent(instanceName)}`;
  try {
    const res = await fetch(endpoint, {
      method: "GET",
      headers: { apikey: EVO_KEY },
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as Record<string, unknown>;
    const state = (data?.instance as Record<string, unknown>)?.state ?? data?.state;
    return state === "open";
  } catch (err) {
    console.error(`[EVO CHECK CONNECTION] erro para ${instanceName}:`, err);
    return fallbackState;
  }
}

export async function logoutInstance(instanceName: string): Promise<boolean> {
  const endpoint = `${EVO_URL}/instance/logout/${encodeURIComponent(instanceName)}`;
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: EVO_KEY,
      },
    });
    console.log(`[EVO LOGOUT] status ${res.status} para ${instanceName}`);
    return res.ok;
  } catch (err) {
    console.error(`[EVO LOGOUT] erro para ${instanceName}:`, err);
    return false;
  }
}