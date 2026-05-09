import { NextRequest, NextResponse } from "next/server";

const EVO_URL = process.env.EVOLUTION_API_URL ?? "http://localhost:8080";
const EVO_KEY = process.env.EVOLUTION_API_KEY ?? "";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;

  try {
    body = await req.json();
  } catch {
    // Body inválido — loga e retorna 200 para a Evolution não reprovar o endpoint
    console.error("[WEBHOOK EVOLUTION] body não é JSON válido.");
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // Log bruto — deve ser a primeira coisa após o parse para não perder nada
  console.log("[WEBHOOK RECEBIDO]", JSON.stringify(body, null, 2));

  // ------------------------------------------------------------------
  // Filtra apenas o evento messages.upsert
  // ------------------------------------------------------------------
  const event = body?.event as string | undefined;

  if (event !== "messages.upsert") {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // ------------------------------------------------------------------
  // Extrai os dados da mensagem
  // A Evolution envia o payload dentro de body.data.messages[] ou
  // body.data diretamente, dependendo da versão. Tratamos os dois casos.
  // ------------------------------------------------------------------
  const data = body?.data as Record<string, unknown> | undefined;

  const messagePayload = (() => {
    // Formato array: data.messages[0]
    const messages = data?.messages as unknown[] | undefined;
    if (Array.isArray(messages) && messages.length > 0) {
      return messages[0] as Record<string, unknown>;
    }
    // Formato direto: data (a própria mensagem)
    return data;
  })();

  const key = messagePayload?.key as Record<string, unknown> | undefined;
  const fromMe = key?.fromMe as boolean | undefined;

  // Ignora mensagens enviadas pela própria instância
  if (fromMe === true) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // ------------------------------------------------------------------
  // Extrai o texto da mensagem (suporta conversation e extendedTextMessage)
  // ------------------------------------------------------------------
  const message = messagePayload?.message as Record<string, unknown> | undefined;

  const textRaw =
    (message?.conversation as string | undefined) ??
    ((message?.extendedTextMessage as Record<string, unknown> | undefined)
      ?.text as string | undefined) ??
    "";

  const instanceName = (body?.instance as string | undefined) ?? "";

  console.log(
    `[WEBHOOK EVOLUTION] evento=messages.upsert instance="${instanceName}" fromMe=${fromMe} texto="${textRaw}"`
  );

  // ------------------------------------------------------------------
  // Responde ao comando @hello (case insensitive, trim para segurança)
  // ------------------------------------------------------------------
  if (textRaw.trim().toLowerCase() === "@hello") {
    const remoteJid = key?.remoteJid as string | undefined;

    if (!remoteJid || !instanceName) {
      console.error(
        "[WEBHOOK EVOLUTION] @hello recebido mas remoteJid ou instanceName ausente — não é possível responder."
      );
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const sendEndpoint = `${EVO_URL}/message/sendText/${encodeURIComponent(instanceName)}`;

    console.log(
      `[WEBHOOK EVOLUTION] @hello detectado — enviando resposta para ${remoteJid} via ${sendEndpoint}`
    );

    try {
      const sendRes = await fetch(sendEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: EVO_KEY,
        },
        body: JSON.stringify({
          number: remoteJid,
          text: "Glória a Deus conseguimos GODENTRENET",
        }),
      });

      const sendRaw = await sendRes.text();
      console.log(
        `[WEBHOOK EVOLUTION] resposta do sendText: status=${sendRes.status} body=${sendRaw}`
      );
    } catch (err) {
      // Loga o erro mas não deixa estourar — a Evolution precisa receber 200
      console.error("[WEBHOOK EVOLUTION] erro ao chamar sendText:", err);
    }
  }

  // Sempre 200 — a Evolution marca o webhook como inativo se receber outro status
  return NextResponse.json({ received: true }, { status: 200 });
}
