import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

const EVO_URL = process.env.EVOLUTION_API_URL ?? "http://localhost:8080";
const EVO_KEY = process.env.EVOLUTION_API_KEY ?? "";
const TYPEBOT_VIEWER_URL = "http://typebot-viewer:3000";
const TYPEBOT_PUBLIC_ID = "fluxo-padaria";
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

async function sendEvolution(instanceName: string, number: string, text: string) {
  const res = await fetch(`${EVO_URL}/message/sendText/${encodeURIComponent(instanceName)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: EVO_KEY },
    body: JSON.stringify({ number, text }),
  });
  console.log(`[EVOLUTION] Enviado para ${number} — status ${res.status}`);
}

async function resolveReplyTo(
  remoteJid: string,
  senderPn: string | undefined,
  instanceName: string
): Promise<string | undefined> {
  // Caso normal: JID com número de telefone real
  if (!remoteJid.endsWith("@lid")) {
    return normalizeBrNumber(remoteJid);
  }

  // Fallback 1: senderPn fornecido pela Evolution
  if (senderPn) {
    const jid = senderPn.includes("@") ? senderPn : `${senderPn}@s.whatsapp.net`;
    console.log(`[WEBHOOK] @lid resolvido via senderPn: ${jid}`);
    return normalizeBrNumber(jid);
  }

  // Fallback 2: consultar Evolution findContacts (timeout 3s)
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
    console.warn(`[WEBHOOK] findContacts timeout ou erro para ${remoteJid}`);
  }

  console.warn(`[WEBHOOK] Não foi possível resolver @lid ${remoteJid} — mensagem ignorada`);
  return undefined;
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

  // Ignorar mensagens enviadas pelo próprio bot (evita loop)
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
  console.log(`[WEBHOOK] Nova mensagem de ${replyTo}: "${textRaw}"`);

  try {
    const sessionKey = `typebot:session:${phone}:${instanceName}`;
    let sessionId = await redis.get(sessionKey);

    if (!sessionId) {
      // Sessão nova: iniciar fluxo e capturar sessionId
      console.log(`[TYPEBOT] Sessão nova — iniciando fluxo para ${phone}`);
      const startRes = await fetch(
        `${TYPEBOT_VIEWER_URL}/api/v1/typebots/${TYPEBOT_PUBLIC_ID}/startChat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isOnlyRegistering: false, sessionId: phone }),
        }
      );
      const startData = await startRes.json() as {
        sessionId?: string;
        messages?: unknown[];
      };

      sessionId = startData.sessionId ?? phone;

      // Enviar mensagens iniciais do bot (boas-vindas, etc.)
      if (Array.isArray(startData.messages) && startData.messages.length > 0) {
        for (const msg of startData.messages) {
          const m = msg as { type?: string; content?: { richText?: unknown[] } };
          if (m.type === "text" && Array.isArray(m.content?.richText)) {
            const text = extractTextFromRichText(m.content!.richText!);
            if (text) await sendEvolution(instanceName, replyTo, text);
          }
        }
        console.log(`[TYPEBOT] Mensagens iniciais enviadas: ${startData.messages.length}`);
      }

      await redis.setex(sessionKey, SESSION_TTL, sessionId);
    }

    // Processar a mensagem do usuário
    console.log(`[TYPEBOT] Processando mensagem do usuário com sessão ${sessionId}`);
    const contRes = await fetch(
      `${TYPEBOT_VIEWER_URL}/api/v1/typebots/${TYPEBOT_PUBLIC_ID}/continueChat`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: textRaw }),
      }
    );
    const contData = await contRes.json() as { messages?: unknown[] };

    if (Array.isArray(contData.messages) && contData.messages.length > 0) {
      for (const msg of contData.messages) {
        const m = msg as { type?: string; content?: { richText?: unknown[] } };
        if (m.type === "text" && Array.isArray(m.content?.richText)) {
          const text = extractTextFromRichText(m.content!.richText!);
          if (text) await sendEvolution(instanceName, replyTo, text);
        }
      }
      console.log(`[TYPEBOT] Resposta ao usuário: ${contData.messages.length} mensagens`);
      // Renovar TTL da sessão
      await redis.expire(sessionKey, SESSION_TTL);
    } else {
      console.warn("[TYPEBOT] Nenhuma mensagem de resposta recebida");
    }
  } catch (err) {
    console.error("[WEBHOOK] Erro ao processar com Typebot:", err);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
