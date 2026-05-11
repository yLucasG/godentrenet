import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { getStoreByInstanceName } from "@/actions/store";

const WAHA_URL = process.env.WAHA_API_URL ?? "http://waha:3000";
const WAHA_KEY = process.env.WAHA_API_KEY ?? "";
const TYPEBOT_VIEWER_URL = process.env.TYPEBOT_VIEWER_URL ?? "http://typebot-viewer:3000";
const TYPEBOT_PUBLIC_ID = process.env.TYPEBOT_PUBLIC_ID ?? "";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://entrenet.tech";
const SESSION_TTL = 60 * 60 * 24;
const REQUIRE_KEYWORD_INSTANCES = (process.env.REQUIRE_KEYWORD_INSTANCES ?? "").split(",").map(s => s.trim()).filter(Boolean);

function extractTextFromRichText(richText: unknown[]): string {
  return richText
    .map((para: unknown) => {
      const p = para as { children?: { text?: string }[] };
      return (p.children ?? []).map((c) => c.text ?? "").join("");
    })
    .filter(Boolean)
    .join("\n");
}

async function sendWaha(session: string, chatId: string, text: string): Promise<boolean> {
  try {
    const res = await fetch(`${WAHA_URL}/api/sendText`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(WAHA_KEY ? { "X-Api-Key": WAHA_KEY } : {}),
      },
      body: JSON.stringify({ session, chatId, text }),
    });
    console.log(`[WAHA] Enviado para ${chatId} — status ${res.status}`);
    return res.ok || res.status === 201;
  } catch (err) {
    console.error(`[WAHA] Erro ao enviar para ${chatId}:`, err);
    return false;
  }
}

async function getFallbackMessage(instanceName: string): Promise<string> {
  try {
    const store = await getStoreByInstanceName(instanceName);
    if (store) {
      const storeUrl = `${BASE_URL}/store/${store.id}`;
      return `Ola! Seja bem-vindo a ${store.name}.\nAcesse nossa loja: ${storeUrl}`;
    }
  } catch {
    // se DB falhar, usa mensagem generica
  }
  return `Ola! Obrigado por entrar em contato. Em breve retornaremos.`;
}

async function processWithTypebot(
  phone: string,
  instanceName: string,
  chatId: string,
  textRaw: string,
  session: string
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
          if (text) await sendWaha(session, chatId, text);
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
        await sendWaha(session, chatId, text);
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
  }

  return sentAny;
}

async function handleMessage(body: Record<string, unknown>) {
  // WAHA webhook payload format:
  // { event: "message", session: "mapom", me: {...}, payload: { id, from, to, body, ... } }
  const session = (body?.session as string | undefined) ?? "";
  const payload = body?.payload as Record<string, unknown> | undefined;

  if (!payload) { console.log("[WAHA WEBHOOK] Sem payload, ignorando"); return; }

  const fromMe = (payload?.fromMe as boolean | undefined) ?? false;
  if (fromMe) { console.log("[WAHA WEBHOOK] fromMe=true, ignorando"); return; }

  const from = (payload?.from as string | undefined) ?? "";
  const textRaw = (payload?.body as string | undefined) ?? "";

  if (!textRaw.trim()) { console.log("[WAHA WEBHOOK] Mensagem vazia, ignorando"); return; }

  // Ignore groups
  if (from.endsWith("@g.us")) { console.log("[WAHA WEBHOOK] Grupo, ignorando"); return; }

  // Ignore broadcasts
  if (from.includes("@broadcast")) { console.log("[WAHA WEBHOOK] Broadcast, ignorando"); return; }

  if (!from) { console.log("[WAHA WEBHOOK] from vazio, ignorando"); return; }

  // @hello filter for personal instances
  if (REQUIRE_KEYWORD_INSTANCES.includes(session) && !textRaw.trim().toLowerCase().startsWith("@hello")) {
    console.log(`[WAHA WEBHOOK] Instancia ${session} requer @hello — ignorando`);
    return;
  }

  // WAHA resolves @lid natively — from is always the real phone JID like "5511999999999@c.us"
  // Normalize to @s.whatsapp.net for Evolution compatibility if needed
  const chatId = from;
  const phone = chatId.replace(/@.*$/, "");

  console.log(`[WAHA WEBHOOK] Mensagem de ${chatId} (sessao: ${session}): "${textRaw}"`);

  try {
    const typebotOk = await processWithTypebot(phone, session, chatId, textRaw, session);

    if (!typebotOk) {
      const fallback = await getFallbackMessage(session);
      console.log(`[WAHA WEBHOOK] Enviando fallback para ${chatId}`);
      await sendWaha(session, chatId, fallback);
    }
  } catch (err) {
    console.error("[WAHA WEBHOOK] Erro no processamento:", err);
    try {
      const fallback = await getFallbackMessage(session);
      await sendWaha(session, chatId, fallback);
    } catch (e2) {
      console.error("[WAHA WEBHOOK] Fallback tambem falhou:", e2);
    }
  }
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  console.log(`[WAHA WEBHOOK] Evento: ${body?.event} sessao: ${body?.session}`);

  if (body?.event !== "message") {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  handleMessage(body).catch((err) => console.error("[WAHA WEBHOOK] handleMessage error:", err));

  return NextResponse.json({ received: true }, { status: 200 });
}
