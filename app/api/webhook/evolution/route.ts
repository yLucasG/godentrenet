import { NextRequest, NextResponse } from "next/server";
import { getStoreByInstanceName } from "@/actions/store";

const EVO_URL = process.env.EVOLUTION_API_URL ?? "http://localhost:8080";
const EVO_KEY = process.env.EVOLUTION_API_KEY ?? "";

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

  console.log("[WEBHOOK RECEBIDO]", JSON.stringify(body, null, 2));

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
  const participant = key?.participant as string | undefined;

  const message = messagePayload?.message as Record<string, unknown> | undefined;
  const textRaw =
    (message?.conversation as string | undefined) ??
    ((message?.extendedTextMessage as Record<string, unknown> | undefined)?.text as string | undefined) ??
    "";

  const instanceName = (body?.instance as string | undefined) ?? "";
  const isGroup = remoteJid?.endsWith("@g.us") ?? false;

  // grupo → privado para quem enviou (key.participant)
  // privado @s.whatsapp.net → remoteJid direto
  // privado @lid → tenta resolver via contacts API com timeout de 3s
  let replyJid: string | undefined;

  if (isGroup) {
    replyJid = participant;
  } else if (remoteJid?.endsWith("@lid")) {
    try {
      const res = await fetch(
        `${EVO_URL}/chat/findContacts/${encodeURIComponent(instanceName)}?where=${encodeURIComponent(JSON.stringify({ id: remoteJid }))}`,
        { headers: { apikey: EVO_KEY }, signal: AbortSignal.timeout(3000) }
      );
      if (res.ok) {
        const contacts = await res.json() as Record<string, unknown>[];
        const found = Array.isArray(contacts) ? contacts[0] : null;
        const phoneJid = (found?.remoteJid ?? found?.phoneNumber) as string | undefined;
        if (phoneJid && !phoneJid.endsWith("@lid")) {
          replyJid = phoneJid;
        }
      }
    } catch { /* timeout ou erro — ignora */ }

    if (!replyJid) {
      console.warn(`[WEBHOOK EVOLUTION] @lid não resolvido: ${remoteJid} — ignorando @hello`);
    }
  } else {
    replyJid = remoteJid;
  }

  const replyTo = replyJid ? normalizeBrNumber(replyJid) : undefined;

  console.log(
    `[WEBHOOK EVOLUTION] instance="${instanceName}" isGroup=${isGroup} fromMe=${fromMe} texto="${textRaw}" replyTo="${replyTo}"`
  );

  if (textRaw.trim().toLowerCase() === "@hello") {
    if (!replyTo || !instanceName) {
      console.error("[WEBHOOK EVOLUTION] @hello sem destinatário válido — ignorando.");
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const store = await getStoreByInstanceName(instanceName);
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://entrenet.tech";
    const storeUrl = store ? `${BASE_URL}/${store.evolutionInstanceName}` : BASE_URL;
    const replyText = `Acesse a loja -> ${storeUrl}`;

    console.log(`[WEBHOOK EVOLUTION] @hello → respondendo para ${replyTo} com: ${replyText}`);

    try {
      const sendRes = await fetch(
        `${EVO_URL}/message/sendText/${encodeURIComponent(instanceName)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: EVO_KEY },
          body: JSON.stringify({ number: replyTo, text: replyText }),
        }
      );
      const sendRaw = await sendRes.text();
      console.log(`[WEBHOOK EVOLUTION] sendText status=${sendRes.status} body=${sendRaw}`);
    } catch (err) {
      console.error("[WEBHOOK EVOLUTION] erro ao chamar sendText:", err);
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
