import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // Apenas faz o log para monitoramento. 
  // O Typebot assumirá o envio de mensagens agora.
  if (body?.event === "messages.upsert") {
    console.log("[WEBHOOK] Mensagem recebida, processamento delegado ao Typebot.");
  }

  return NextResponse.json({ received: true }, { status: 200 });
}