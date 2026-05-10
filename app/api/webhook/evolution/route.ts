import { NextRequest, NextResponse } from "next/server";
import { getStoreByInstanceName } from "@/actions/store";

const EVO_URL = process.env.EVOLUTION_API_URL ?? "http://localhost:8080";
const EVO_KEY = process.env.EVOLUTION_API_KEY ?? "";
const TYPEBOT_VIEWER_URL = "http://typebot-viewer:3000"; // URL interna do docker
const TYPEBOT_PUBLIC_ID = "fluxo-padaria"; // O ID do seu fluxo

function normalizeBrNumber(jid: string): string {
  const match = jid.match(/^(\d+)(@.+)$/);
  if (!match) return jid;
  const [, num, suffix] = match;
  if (/^55\d{2}\d{8}$/.test(num)) {
    return `55${num.slice(2, 4)}9${num.slice(4)}${suffix}`;
  }
  return jid;
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

  // Ignorar mensagens enviadas pelo próprio bot
  if (fromMe) return NextResponse.json({ received: true }, { status: 200 });

  const message = messagePayload?.message as Record<string, unknown> | undefined;
  const textRaw =
    (message?.conversation as string | undefined) ??
    ((message?.extendedTextMessage as Record<string, unknown> | undefined)?.text as string | undefined) ??
    "";

  if (!textRaw.trim()) return NextResponse.json({ received: true }, { status: 200 });

  const instanceName = (body?.instance as string | undefined) ?? "";
  const isGroup = remoteJid?.endsWith("@g.us") ?? false;

  // Se for grupo, ignoramos para não dar spam
  if (isGroup) return NextResponse.json({ received: true }, { status: 200 });

  let rawReplyTo = remoteJid;

  if (remoteJid?.endsWith("@lid")) {
    if (senderPn) {
      rawReplyTo = senderPn.includes("@") ? senderPn : `${senderPn}@s.whatsapp.net`;
    }
  }

  const replyTo = rawReplyTo ? normalizeBrNumber(rawReplyTo) : undefined;

  if (!replyTo) return NextResponse.json({ received: true }, { status: 200 });

  try {
    // 1. Chamar o Typebot
    // Utilizamos o número de telefone como 'sessionId' para que o Typebot lembre da conversa
    const typebotSessionId = replyTo.split('@')[0];

    console.log(`[WEBHOOK] Enviando mensagem "${textRaw}" para o Typebot...`);

    const typebotRes = await fetch(`${TYPEBOT_VIEWER_URL}/api/v1/typebots/${TYPEBOT_PUBLIC_ID}/startChat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isOnlyRegistering: false,
        message: textRaw,
        sessionId: typebotSessionId
      })
    });

    const typebotData = await typebotRes.json();

    // 2. Extrair a resposta do Typebot (se existir)
    if (typebotData?.messages && typebotData.messages.length > 0) {
      for (const msg of typebotData.messages) {
        if (msg.type === "text" && msg.content?.richText) {
          // Simplificação: extrair o texto limpo
          const replyText = msg.content.richText[0]?.children[0]?.text;

          if (replyText) {
            console.log(`[WEBHOOK] Resposta recebida do Typebot. Enviando para Evolution...`);
            // 3. Enviar a resposta via Evolution API
            await fetch(
              `${EVO_URL}/message/sendText/${encodeURIComponent(instanceName)}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json", apikey: EVO_KEY },
                body: JSON.stringify({ number: replyTo, text: replyText }),
              }
            );
          }
        }
      }
    }
  } catch (err) {
    console.error("[WEBHOOK] Erro ao processar mensagem com Typebot:", err);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}