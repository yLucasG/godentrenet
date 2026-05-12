import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { prisma } from "@/lib/prisma";

const EVO_URL = process.env.EVOLUTION_API_URL ?? "http://localhost:8080";
const EVO_KEY = process.env.EVOLUTION_API_KEY ?? "";
const TYPEBOT_VIEWER_URL = process.env.TYPEBOT_VIEWER_URL ?? "http://typebot-viewer:3000";
const TYPEBOT_PUBLIC_ID = process.env.TYPEBOT_PUBLIC_ID ?? "";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://entrenet.tech";
const SESSION_TTL = 60 * 60 * 24;
// Fallback env-var keyword filter for instances without BotConfig in DB
const REQUIRE_KEYWORD_INSTANCES = (process.env.REQUIRE_KEYWORD_INSTANCES ?? "").split(",").map(s => s.trim()).filter(Boolean);

type StoreWithConfig = {
  id: string;
  name: string;
  evolutionInstanceName: string | null;
  botConfig: {
    requireKeyword: boolean;
    keyword: string;
    welcomeMessage: string;
  } | null;
};


function normalizeBrNumber(jid: string): string {
  const match = jid.match(/^(\d+)(@.+)$/);
  if (!match) return jid;
  const [, num, suffix] = match;
  if (/^55\d{2}\d{8}$/.test(num)) {
    return `55${num.slice(2, 4)}9${num.slice(4)}${suffix}`;
  }
  return jid;
}

function extractTextFromRichText(richText: unknown[]): string {
  return richText
    .map((para: unknown) => {
      const p = para as { children?: { text?: string }[] };
      return (p.children ?? []).map((c) => c.text ?? "").join("");
    })
    .filter(Boolean)
    .join("\n");
}

async function getStoreWithConfig(instanceName: string): Promise<StoreWithConfig | null> {
  const row = await prisma.store.findFirst({
    where: { evolutionInstanceName: instanceName },
    select: {
      id: true,
      name: true,
      evolutionInstanceName: true,
      botConfig: {
        select: { requireKeyword: true, keyword: true, welcomeMessage: true },
      },
    },
  });
  return row as StoreWithConfig | null;
}

async function saveMessage(storeId: string, fromPhone: string, text: string, direction: "in" | "out") {
  try {
    await prisma.botMessage.create({ data: { storeId, fromPhone, text, direction } });
  } catch {
    // non-critical — don't break the flow
  }
}

async function sendEvolution(instanceName: string, number: string, text: string): Promise<boolean> {
  try {
    const res = await fetch(`${EVO_URL}/message/sendText/${encodeURIComponent(instanceName)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: EVO_KEY },
      body: JSON.stringify({ number, text }),
    });
    console.log(`[EVOLUTION] Enviado para ${number} — status ${res.status}`);
    return res.ok || res.status === 201;
  } catch (err) {
    console.error(`[EVOLUTION] Erro ao enviar para ${number}:`, err);
    return false;
  }
}

async function resolveReplyTo(
  remoteJid: string,
  senderPn: string | undefined,
  _instanceName: string
): Promise<string | undefined> {
  if (!remoteJid.endsWith("@lid")) {
    return normalizeBrNumber(remoteJid);
  }

  if (senderPn) {
    const jid = senderPn.includes("@") ? senderPn : `${senderPn}@s.whatsapp.net`;
    console.log(`[WEBHOOK] @lid resolvido via senderPn: ${jid}`);
    return normalizeBrNumber(jid);
  }

  console.log(`[WEBHOOK] @lid ${remoteJid} usado diretamente (Evolution patched)`);
  return remoteJid;
}

function buildFallbackText(store: StoreWithConfig): string {
  if (store.botConfig?.welcomeMessage) {
    return store.botConfig.welcomeMessage;
  }
  const storeUrl = `${BASE_URL}/${store.evolutionInstanceName}`;
  return `Ola! Seja bem-vindo a ${store.name}.\nAcesse nossa loja: ${storeUrl}`;
}

async function processWithTypebot(
  phone: string,
  instanceName: string,
  replyTo: string,
  textRaw: string
): Promise<boolean> {
  if (!TYPEBOT_PUBLIC_ID) {
    console.log("[TYPEBOT] TYPEBOT_PUBLIC_ID nao configurado — usando fallback");
    return false;
  }

  const sessionKey = `typebot:session:${phone}:${instanceName}`;
  let sessionId: string | null = null;

  try {
    sessionId = await redis.get(sessionKey);
  } catch (err) {
    console.error("[TYPEBOT] Redis erro:", err);
    return false;
  }

  if (!sessionId) {
    console.log(`[TYPEBOT] Sessao nova para ${phone}`);
    let startRes: Response;
    try {
      startRes = await fetch(
        `${TYPEBOT_VIEWER_URL}/api/v1/typebots/${TYPEBOT_PUBLIC_ID}/startChat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isOnlyRegistering: false, sessionId: phone }),
          signal: AbortSignal.timeout(8000),
        }
      );
    } catch (err) {
      console.warn("[TYPEBOT] startChat falhou:", String(err));
      return false;
    }

    if (!startRes.ok) {
      console.warn(`[TYPEBOT] startChat retornou ${startRes.status} — usando fallback`);
      return false;
    }

    const startData = await startRes.json() as { sessionId?: string; messages?: unknown[] };
    sessionId = startData.sessionId ?? phone;

    if (Array.isArray(startData.messages) && startData.messages.length > 0) {
      for (const msg of startData.messages) {
        const m = msg as { type?: string; content?: { richText?: unknown[] } };
        if (m.type === "text" && Array.isArray(m.content?.richText)) {
          const text = extractTextFromRichText(m.content!.richText!);
          if (text) await sendEvolution(instanceName, replyTo, text);
        }
      }
    }

    try {
      await redis.setex(sessionKey, SESSION_TTL, sessionId);
    } catch {
      // redis falhou mas continua
    }
  }

  let contRes: Response;
  try {
    contRes = await fetch(
      `${TYPEBOT_VIEWER_URL}/api/v1/typebots/${TYPEBOT_PUBLIC_ID}/continueChat`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: textRaw }),
        signal: AbortSignal.timeout(8000),
      }
    );
  } catch (err) {
    console.warn("[TYPEBOT] continueChat falhou:", String(err));
    return false;
  }

  if (!contRes.ok) {
    console.warn(`[TYPEBOT] continueChat retornou ${contRes.status} — usando fallback`);
    return false;
  }

  const contData = await contRes.json() as { messages?: unknown[] };

  if (!Array.isArray(contData.messages) || contData.messages.length === 0) {
    console.warn("[TYPEBOT] Nenhuma mensagem de resposta — usando fallback");
    return false;
  }

  let sentAny = false;
  for (const msg of contData.messages) {
    const m = msg as { type?: string; content?: { richText?: unknown[] } };
    if (m.type === "text" && Array.isArray(m.content?.richText)) {
      const text = extractTextFromRichText(m.content!.richText!);
      if (text) {
        await sendEvolution(instanceName, replyTo, text);
        sentAny = true;
      }
    }
  }

  if (sentAny) {
    try {
      await redis.expire(sessionKey, SESSION_TTL);
    } catch {
      // redis falhou mas nao importa
    }
    console.log(`[TYPEBOT] ${contData.messages.length} mensagens enviadas`);
  }

  return sentAny;
}

async function handleMessage(body: Record<string, unknown>) {
  const data = body?.data as Record<string, unknown> | undefined;
  const messagePayload = (() => {
    const messages = data?.messages as unknown[] | undefined;
    if (Array.isArray(messages) && messages.length > 0) return messages[0] as Record<string, unknown>;
    return data;
  })();

  const key = messagePayload?.key as Record<string, unknown> | undefined;
  const fromMe = key?.fromMe as boolean | undefined;
  const remoteJid = key?.remoteJid as string | undefined;
  const senderPn = key?.senderPn as string | undefined;

  if (fromMe) { console.log("[WEBHOOK] fromMe=true, ignorando"); return; }

  const message = messagePayload?.message as Record<string, unknown> | undefined;
  const textRaw =
    (message?.conversation as string | undefined) ??
    ((message?.extendedTextMessage as Record<string, unknown> | undefined)?.text as string | undefined) ??
    "";

  if (!textRaw.trim()) { console.log("[WEBHOOK] Mensagem vazia, ignorando"); return; }

  const instanceName = (body?.instance as string | undefined) ?? "";
  const isGroup = remoteJid?.endsWith("@g.us") ?? false;

  if (isGroup) { console.log("[WEBHOOK] Grupo, ignorando"); return; }
  if (!remoteJid) { console.log("[WEBHOOK] remoteJid vazio, ignorando"); return; }

  // Fetch store + botConfig from DB
  const store = await getStoreWithConfig(instanceName);

  // Apply keyword filter: DB config takes priority, env var as fallback
  const requireKeyword = store?.botConfig?.requireKeyword ?? REQUIRE_KEYWORD_INSTANCES.includes(instanceName);
  const keyword = store?.botConfig?.keyword ?? "@hello";

  if (requireKeyword && !textRaw.trim().toLowerCase().startsWith(keyword.toLowerCase())) {
    console.log(`[WEBHOOK] Instancia ${instanceName} requer "${keyword}" — ignorando`);
    return;
  }

  const replyTo = await resolveReplyTo(remoteJid, senderPn, instanceName);
  if (!replyTo) return;

  const phone = replyTo.split("@")[0];
  console.log(`[WEBHOOK] Mensagem de ${replyTo} (instancia: ${instanceName}): "${textRaw}"`);

  // Save incoming message
  if (store) {
    await saveMessage(store.id, phone, textRaw, "in");
  }

  try {
    const typebotOk = await processWithTypebot(phone, instanceName, replyTo, textRaw);

    if (!typebotOk) {
      const fallbackText = store
        ? buildFallbackText(store)
        : `Ola! Obrigado por entrar em contato. Em breve retornaremos.`;
      console.log(`[WEBHOOK] Enviando fallback para ${replyTo}`);
      const sent = await sendEvolution(instanceName, replyTo, fallbackText);
      if (sent && store) await saveMessage(store.id, phone, fallbackText, "out");
    }
  } catch (err) {
    console.error("[WEBHOOK] Erro no processamento:", err);
    try {
      const fallbackText = store
        ? buildFallbackText(store)
        : `Ola! Obrigado por entrar em contato. Em breve retornaremos.`;
      const sent = await sendEvolution(instanceName, replyTo, fallbackText);
      if (sent && store) await saveMessage(store.id, phone, fallbackText, "out");
    } catch (e2) {
      console.error("[WEBHOOK] Fallback tambem falhou:", e2);
    }
  }
}

async function handleConnectionUpdate(body: Record<string, unknown>) {
  const instanceName = (body?.instance as string | undefined) ?? "";
  const data = body?.data as Record<string, unknown> | undefined;
  const state = (data?.state as string | undefined) ?? "";

  if (!instanceName || !state) return;

  console.log(`[WEBHOOK] CONNECTION_UPDATE: ${instanceName} → ${state}`);

  try {
    await prisma.store.updateMany({
      where: { evolutionInstanceName: instanceName },
      data: { evolutionConnectionState: state },
    });
  } catch (err) {
    console.error("[WEBHOOK] Erro ao atualizar connectionState:", err);
  }
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const event = body?.event as string | undefined;
  console.log(`[WEBHOOK] Recebido evento: ${event}`);

  if (event === "connection.update") {
    handleConnectionUpdate(body).catch((err) => console.error("[WEBHOOK] connectionUpdate error:", err));
    return NextResponse.json({ received: true }, { status: 200 });
  }

  if (event !== "messages.upsert") {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  handleMessage(body).catch((err) => console.error("[WEBHOOK] handleMessage error:", err));

  return NextResponse.json({ received: true }, { status: 200 });
}
