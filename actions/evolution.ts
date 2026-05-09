"use server";

const EVO_URL = process.env.EVOLUTION_API_URL ?? "http://localhost:8080";
const EVO_KEY = process.env.EVOLUTION_API_KEY ?? "";

// ---------------------------------------------------------------------------
// createInstance
// ---------------------------------------------------------------------------
// Registra uma nova instância WhatsApp na Evolution API vinculada a uma loja.
//
// Comportamento especial:
//   - HTTP 403 com body contendo "already" → instância já existe, retorna ok.
//   - Qualquer outro erro HTTP → lança exceção com o body bruto para rastreio.
// ---------------------------------------------------------------------------
export async function createInstance(
  storeId: string,
  instanceName: string
): Promise<{ success: true; instanceName: string }> {
  const endpoint = `${EVO_URL}/instance/create`;

  console.log(`[EVO ACTION CREATE] → POST ${endpoint}`);
  console.log(`[EVO ACTION CREATE] payload: storeId=${storeId} instanceName=${instanceName}`);

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

  // Lê sempre como texto antes de tentar o parse — evita erros de JSON inválido
  const raw = await res.text();
  console.log(`[EVO ACTION CREATE] status=${res.status} body=${raw}`);

  if (!res.ok) {
    // 403 + body indicando que a instância já existe → não é um erro real
    if (res.status === 403 && raw.toLowerCase().includes("already")) {
      console.log(
        `[EVO ACTION CREATE] instância "${instanceName}" já existe — seguindo sem erro.`
      );
      return { success: true, instanceName };
    }

    console.error(
      `[EVO ACTION CREATE] falha ao criar instância "${instanceName}": status=${res.status} body=${raw}`
    );
    throw new Error(
      `Evolution API retornou ${res.status} ao criar instância "${instanceName}": ${raw}`
    );
  }

  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Resposta não é JSON — ainda assim a instância foi criada (2xx)
    console.log(`[EVO ACTION CREATE] resposta 2xx não-JSON, assumindo sucesso.`);
  }

  console.log(`[EVO ACTION CREATE] instância criada com sucesso:`, parsed);
  return { success: true, instanceName };
}

// ---------------------------------------------------------------------------
// getQrCode
// ---------------------------------------------------------------------------
// Solicita o QR Code de conexão de uma instância existente.
//
// A Evolution pode retornar o base64 dentro de diferentes chaves dependendo
// da versão; esta função normaliza todos os casos conhecidos e garante que o
// prefixo "data:image/png;base64," esteja presente para uso direto em <img>.
// ---------------------------------------------------------------------------
export async function getQrCode(
  instanceName: string
): Promise<{ qrcode: string }> {
  const endpoint = `${EVO_URL}/instance/connect/${encodeURIComponent(instanceName)}`;
  const MAX_ATTEMPTS = 6;
  const DELAY_MS = 2000;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    console.log(`[EVO ACTION CONNECT] tentativa ${attempt}/${MAX_ATTEMPTS} → GET ${endpoint}`);

    const res = await fetch(endpoint, {
      method: "GET",
      headers: { apikey: EVO_KEY },
      cache: "no-store",
    });

    const raw = await res.text();
    console.log(`[EVO ACTION CONNECT] status=${res.status} body=${raw}`);

    if (!res.ok) {
      console.error(`[EVO ACTION CONNECT] erro HTTP ${res.status} na tentativa ${attempt}: ${raw}`);
      throw new Error(
        `Evolution API retornou ${res.status} ao conectar instância "${instanceName}": ${raw}`
      );
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.error(`[EVO ACTION CONNECT] resposta não é JSON válido: ${raw}`);
      throw new Error(`Resposta inesperada da Evolution API (não-JSON): ${raw}`);
    }

    // Normaliza as chaves onde a Evolution pode devolver o base64
    const base64Candidates = [
      parsed?.qrcode,
      (parsed?.qrcode as Record<string, unknown>)?.base64,
      parsed?.base64,
      parsed?.code,
    ];

    const raw64 = base64Candidates.find(
      (v) => typeof v === "string" && v.length > 0
    ) as string | undefined;

    if (raw64) {
      const qrcode = raw64.startsWith("data:")
        ? raw64
        : `data:image/png;base64,${raw64}`;

      console.log(
        `[EVO ACTION CONNECT] QR Code obtido na tentativa ${attempt} para "${instanceName}" (${qrcode.length} chars).`
      );
      return { qrcode };
    }

    // QR ainda não disponível — instância inicializando
    console.log(
      `[EVO ACTION CONNECT] QR não disponível na tentativa ${attempt}, aguardando ${DELAY_MS}ms...`
    );

    if (attempt < MAX_ATTEMPTS) {
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    }
  }

  throw new Error(
    `QR Code não gerado após ${MAX_ATTEMPTS} tentativas para "${instanceName}". Tente novamente em alguns segundos.`
  );
}
