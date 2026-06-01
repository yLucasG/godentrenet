"use server";

const WAHA_URL = process.env.WAHA_API_URL ?? "http://godentrenet-waha:3000";
const WAHA_KEY = process.env.WAHA_API_KEY ?? "";

// Maps evolutionInstanceName → WAHA session name
const WAHA_INSTANCE_MAP: Record<string, string> = { mapom: "default" };

export async function getWahaSession(instanceName: string): Promise<string | null> {
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

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Garante que a sessão está em estado iniciável.
 * FAILED → stop + start (o /start sozinho retorna 422 "already started")
 * STOPPED → start direto
 */
async function ensureSessionStarted(session: string): Promise<void> {
  const statusRes = await wahaFetch(`/api/sessions/${session}`);

  if (!statusRes.ok) {
    // Sessão pode não existir — tenta criar e iniciar
    if (statusRes.status === 404) {
      await wahaFetch("/api/sessions", {
        method: "POST",
        body: JSON.stringify({ name: session }),
      });
      await sleep(2000);
      await wahaFetch(`/api/sessions/${session}/start`, { method: "POST" });
      await sleep(6000);
    }
    return;
  }

  const data = (await statusRes.json()) as { status?: string };
  console.log(`[WAHA] ensureSessionStarted: session=${session} status=${data.status}`);

  if (data.status === "FAILED") {
    // FAILED precisa de stop antes do start
    console.log(`[WAHA] FAILED detectado — executando stop + start`);
    await wahaFetch(`/api/sessions/${session}/stop`, { method: "POST" });
    await sleep(2000);
    await wahaFetch(`/api/sessions/${session}/start`, { method: "POST" });
    await sleep(6000);
    return;
  }

  if (data.status === "STOPPED") {
    console.log(`[WAHA] STOPPED — iniciando sessão`);
    await wahaFetch(`/api/sessions/${session}/start`, { method: "POST" });
    await sleep(8000);
    return;
  }

  // STARTING, SCAN_QR_CODE, WORKING → nada a fazer
}

export async function getWahaQrCode(
  session: string
): Promise<{ qr?: string; connected?: boolean }> {
  await ensureSessionStarted(session);

  // Tenta obter estado estável com até 3 tentativas
  for (let attempt = 0; attempt < 3; attempt++) {
    const statusRes = await wahaFetch(`/api/sessions/${session}`);
    if (!statusRes.ok) throw new Error("WAHA: erro ao verificar sessão");

    const status = (await statusRes.json()) as { status?: string; me?: unknown };
    console.log(`[WAHA] getWahaQrCode attempt=${attempt} status=${status.status}`);

    if (status.status === "WORKING" && status.me) {
      return { connected: true };
    }

    if (status.status === "SCAN_QR_CODE") {
      const qrRes = await wahaFetch(`/api/${session}/auth/qr?format=image`, {
        headers: {
          Accept: "image/png",
          ...(WAHA_KEY ? { "X-Api-Key": WAHA_KEY } : {}),
        },
      });
      if (!qrRes.ok) throw new Error(`WAHA: QR retornou ${qrRes.status}`);
      const buf = await qrRes.arrayBuffer();
      const base64 = Buffer.from(buf).toString("base64");
      return { qr: `data:image/png;base64,${base64}` };
    }

    if (status.status === "FAILED") {
      // Sessão voltou a falhar — tenta stop + start novamente
      console.log(`[WAHA] FAILED no attempt=${attempt} — retry stop+start`);
      await wahaFetch(`/api/sessions/${session}/stop`, { method: "POST" });
      await sleep(2000);
      await wahaFetch(`/api/sessions/${session}/start`, { method: "POST" });
      await sleep(6000);
      continue;
    }

    // STARTING ou outro estado transitório — aguarda
    if (attempt < 2) {
      await sleep(4000);
    }
  }

  throw new Error("WAHA: não foi possível iniciar a sessão após múltiplas tentativas");
}
