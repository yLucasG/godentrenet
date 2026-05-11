import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { getStoreByInstanceName } from "@/actions/store";

const EVO_URL = process.env.EVOLUTION_API_URL ?? "http://localhost:8080";
const EVO_KEY = process.env.EVOLUTION_API_KEY ?? "";
const TYPEBOT_VIEWER_URL = process.env.TYPEBOT_VIEWER_URL ?? "http://typebot-viewer:3000";
const TYPEBOT_PUBLIC_ID = process.env.TYPEBOT_PUBLIC_ID ?? "";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://entrenet.tech";
const SESSION_TTL = 60 * 60 * 24; // 24 horas

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
  instanceName: string
): Promise<string | undefined> {
  if (!remoteJid.endsWith("@lid")) {
    return normalizeBrNumber(remoteJid);
  }

  if (senderPn) {
    const jid = senderPn.includes("@") ? senderPn : `${senderPn}@s.whatsapp.net`;
    console.log(`[WEBHOOK] @lid resolvido via senderPn: ${jid}`);
    return normalizeBrNumber(jid);
  }

  try {
    const where = encodeURIComponent(JSON.stringify({ id: remoteJid }));
    const res = await fetch(
      `${EVO_URL}/chat/findContacts/${encodeURIComponent(instanceName)}?where=${where}`,
      { headers: { apikey: EVO_KEY }, signal: AbortSignal.timeout(3000) }
    );
    if (res.ok) {
      const contacts = await res.json() as { id?: string; jid?: string }[];
      const contact = Array.isArray(contacts) ? contacts[0] : contacts;
      const realJid = contact?.id ?? contact?.jid;
      if (realJid && !realJid.endsWith("@lid")) {
        console.log(`[WEBHOOK] @lid resolvido via findContacts: ${realJid}`);
        return normalizeBrNumber(realJid);
      }
    }
  } catch {
    console.warn(`[WEBHOOK] findContacts timeout para ${remoteJid}`);
  }

  console.warn(`[WEBHOOK] Não foi possível resolver @lid ${remoteJid} — mensagem ignorada`);
  return undefined;
}

async function getFallbackMessage(instanceName: string): Promise<string> {
  try {
    const store = await getStoreByInstanceName(instanceName);
    if (store) {
      const storeUrl = `${BASE_URL}/store/${store.id}`;
      return `Olá! Seja bem-vindo à ${store.name}. 🛍️\nAcesse nossa loja: ${storeUrl}`;
    }
  } catch {
    // se DB falhar, usa mensagem genérica
  }
  return `Olá! Obrigado por entrar em contato. Em breve retornaremos. 😊`;
}

async function processWithTypebot(
  phone: string,
  instanceName: string,
  replyTo: string,
  textRaw: string
): Promise<boolean> {
  if (!TYPEBOT_PUBLIC_ID) {
    console.warn("[TYPEBOT] TYPEBOT_PUBLIC_ID não configurado — usando fallback");
    return false;
  }

  const sessionKey = `typebot:session:${phone}:${instanceName}`;
  let sessionId = await redis.get(sessionKey);

  if (!sessionId) {
    console.log(`[TYPEBOT] Sessão nova para ${phone}`);
    const startRes = await fetch(
      `${TYPEBOT_VIEWER_URL}/api/v1/typebots/${TYPEBOT_PUBLIC_ID}/startChat`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOnlyRegistering: false, sessionId: phone }),
        signal: AbortSignal.timeout(8000),
      }
    );

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

    await redis.setex(sessionKey, SESSION_TTL, sessionId);
  }

  const contRes = await fetch(
    `${TYPEBOT_VIEWER_URL}/api/v1/typebots/${TYPEBOT_PUBLIC_ID}/continueChat`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, message: textRaw }),
      signal: AbortSignal.timeout(8000),
    }
  );

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
    await redis.expire(sessionKey, SESSION_TTL);
    console.log(`[TYPEBOT] ${contData.messages.length} mensagens enviadas`);
  }

  return sentAny;
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  if (body?.event !== "messages.upsert") {
    return NextResponse.json({ received: true }, { status: 200 });
  }

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

  if (fromMe) return NextResponse.json({ received: true }, { status: 200 });

  const message = messagePayload?.message as Record<string, unknown> | undefined;
  const textRaw =
    (message?.conversation as string | undefined) ??
    ((message?.extendedTextMessage as Record<string, unknown> | undefined)?.text as string | undefined) ??
    "";

  if (!textRaw.trim()) return NextResponse.json({ received: true }, { status: 200 });

  const instanceName = (body?.instance as string | undefined) ?? "";
  const isGroup = remoteJid?.endsWith("@g.us") ?? false;

  if (isGroup) return NextResponse.json({ received: true }, { status: 200 });
  if (!remoteJid) return NextResponse.json({ received: true }, { status: 200 });

  const replyTo = await resolveReplyTo(remoteJid, senderPn, instanceName);
  if (!replyTo) return NextResponse.json({ received: true }, { status: 200 });

  const phone = replyTo.split("@")[0];
  console.log(`[WEBHOOK] Mensagem de ${replyTo} (instância: ${instanceName}): "${textRaw}"`);

  try {
    const typebotOk = await processWithTypebot(phone, instanceName, replyTo, textRaw);

    if (!typebotOk) {
      // Typebot falhou ou não está configurado → resposta padrão da loja
      const fallback = await getFallbackMessage(instanceName);
      console.log(`[WEBHOOK] Enviando fallback: "${fallback.slice(0, 60)}..."`);
      await sendEvolution(instanceName, replyTo, fallback);
    }
  } catch (err) {
    console.error("[WEBHOOK] Erro inesperado:", err);
    // Tentar fallback mesmo em caso de erro grave
    try {
      const fallback = await getFallbackMessage(instanceName);
      await sendEvolution(instanceName, replyTo, fallback);
    } catch {
      // Se até o fallback falhar, apenas loga
      console.error("[WEBHOOK] Fallback também falhou");
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
