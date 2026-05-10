import { NextRequest, NextResponse } from "next/server";
import { getStoreByInstanceName } from "@/actions/store";

const EVO_URL = process.env.EVOLUTION_API_URL ?? "http://localhost:8080";
const EVO_KEY = process.env.EVOLUTION_API_KEY ?? "";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;

  try {
    body = await req.json();
  } catch {
    console.error("[WEBHOOK EVOLUTION] body não é JSON válido.");
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // Log bruto — primeira coisa após o parse
  console.log("[WEBHOOK RECEBIDO]", JSON.stringify(body, null, 2));

  const event = body?.event as string | undefined;
  if (event !== "messages.upsert") {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // Extrai payload da mensagem (formato array ou direto)
  const data = body?.data as Record<string, unknown> | undefined;
  const messagePayload = (() => {
    const messages = data?.messages as unknown[] | undefined;
    if (Array.isArray(messages) && messages.length > 0) {
      return messages[0] as Record<string, unknown>;
    }
    return data;
  })();

  const key = messagePayload?.key as Record<string, unknown> | undefined;
  const fromMe = key?.fromMe as boolean | undefined;

  // Extrai texto (conversation ou extendedTextMessage)
  const message = messagePayload?.message as Record<string, unknown> | undefined;
  const textRaw =
    (message?.conversation as string | undefined) ??
    ((message?.extendedTextMessage as Record<string, unknown> | undefined)
      ?.text as string | undefined) ??
    "";

  const instanceName = (body?.instance as string | undefined) ?? "";
  const remoteJidRaw = key?.remoteJid as string | undefined;
  const sender = body?.sender as string | undefined;

  // Detecta se é mensagem de grupo (@g.us)
  const isGroup = remoteJidRaw?.endsWith("@g.us") ?? false;

  // Normaliza número BR de 8 dígitos adicionando o 9 (ex: 5587XXXXXXXX → 55879XXXXXXXX)
  function normalizeBrNumber(jid: string): string {
    const match = jid.match(/^(\d+)(@.+)$/);
    if (!match) return jid;
    const [, num, suffix] = match;
    // BR com DDD: 55 + 2 dígitos DDD + 8 dígitos → insere 9
    if (/^55\d{2}\d{8}$/.test(num)) {
      return `55${num.slice(2, 4)}9${num.slice(4)}${suffix}`;
    }
    return jid;
  }

  // Em grupos responde no grupo (remoteJid); em privado resolve @lid → sender
  const rawReplyTo = isGroup
    ? remoteJidRaw
    : remoteJidRaw?.endsWith("@lid")
    ? sender
    : remoteJidRaw;

  const replyTo = rawReplyTo ? normalizeBrNumber(rawReplyTo) : rawReplyTo;

  console.log(
    `[WEBHOOK EVOLUTION] instance="${instanceName}" isGroup=${isGroup} fromMe=${fromMe} texto="${textRaw}" replyTo="${replyTo}"`
  );

  if (textRaw.trim().toLowerCase() === "@hello") {
    if (!replyTo || !instanceName) {
      console.error("[WEBHOOK EVOLUTION] @hello sem destinatário — ignorando.");
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
