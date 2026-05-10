"use server";

const EVO_URL = process.env.EVOLUTION_API_URL ?? "http://localhost:8080";
const EVO_KEY = process.env.EVOLUTION_API_KEY ?? "";

// ---------------------------------------------------------------------------
// createInstance
// ---------------------------------------------------------------------------
// Registra uma nova instância WhatsApp na Evolution API vinculada a uma loja.
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

  const raw = await res.text();
  console.log(`[EVO ACTION CREATE] status=${res.status} body=${raw}`);

  if (!res.ok) {
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
    console.log(`[EVO ACTION CREATE] resposta 2xx não-JSON, assumindo sucesso.`);
  }

  console.log(`[EVO ACTION CREATE] instância criada com sucesso:`, parsed);

  // Mantemos o webhook ativo para você receber logs ou salvar conversas no futuro
  await configureWebhook(instanceName);

  // NOVA AÇÃO: Configura automaticamente a instância recém-criada no Typebot!
  await configureTypebot(instanceName);

  return { success: true, instanceName };
}

// ---------------------------------------------------------------------------
// configureWebhook
// ---------------------------------------------------------------------------
export async function configureWebhook(instanceName: string): Promise<void> {
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const webhookUrl = `${BASE_URL}/api/webhook/evolution`;
  const endpoint = `${EVO_URL}/webhook/set/${encodeURIComponent(instanceName)}`;

  console.log(`[EVO ACTION WEBHOOK] configurando webhook: ${webhookUrl}`);

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: EVO_KEY },
    body: JSON.stringify({
      webhook: {
        enabled: true,
        url: webhookUrl,
        webhookByEvents: false,
        webhookBase64: false,
        events: ["MESSAGES_UPSERT"],
      },
    }),
  });

  const raw = await res.text();
  console.log(`[EVO ACTION WEBHOOK] status=${res.status} body=${raw}`);

  if (!res.ok) {
    console.error(`[EVO ACTION WEBHOOK] falha ao configurar webhook: ${raw}`);
  }
}

// ---------------------------------------------------------------------------
// configureTypebot (NOVO)
// ---------------------------------------------------------------------------
// Diz para a Evolution interceptar as mensagens desta instância e buscar as
// respostas no fluxo visual do Typebot, evitando o Next.js como intermediário.
// ---------------------------------------------------------------------------
export async function configureTypebot(instanceName: string): Promise<void> {
  const endpoint = `${EVO_URL}/typebot/set/${encodeURIComponent(instanceName)}`;
  console.log(`[EVO ACTION TYPEBOT] configurando: ${endpoint}`);

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: EVO_KEY },
    body: JSON.stringify({
      enabled: true,
      url: "http://typebot-viewer:3000", // Nome do container do viewer no Docker
      typebot: "fluxo-padaria", // Este deve ser o Public ID do fluxo que você publicará no Typebot
      expire: 20,
      keywordFinish: "#SAIR",
      delayMessage: 1000,
      unknownMessage: "Mensagem não reconhecida",
      listeningFromMe: false
    }),
  });

  const raw = await res.text();
  console.log(`[EVO ACTION TYPEBOT] status=${res.status} body=${raw}`);

  if (!res.ok) {
    console.error(`[EVO ACTION TYPEBOT] falha ao configurar typebot: ${raw}`);
  }
}

// ---------------------------------------------------------------------------
// getQrCode
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