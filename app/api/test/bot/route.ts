import { NextRequest, NextResponse } from "next/server";

// Endpoint de teste: simula uma mensagem chegando pelo WhatsApp sem precisar de segundo celular
// POST /api/test/bot
// Body: { "phone": "5587988444564", "message": "oi", "instance": "nome-da-instancia" }
export async function POST(req: NextRequest) {
  let body: { phone?: string; message?: string; instance?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { phone, message, instance } = body;

  if (!phone || !message) {
    return NextResponse.json(
      { error: "Campos obrigatórios: phone, message" },
      { status: 400 }
    );
  }

  // Monta payload idêntico ao que a Evolution envia
  const fakeWebhookPayload = {
    event: "messages.upsert",
    instance: instance ?? "test-instance",
    data: {
      messages: [
        {
          key: {
            remoteJid: `${phone}@s.whatsapp.net`,
            fromMe: false,
            id: `TEST_${Date.now()}`,
          },
          message: {
            conversation: message,
          },
          pushName: "Teste",
          messageTimestamp: Math.floor(Date.now() / 1000),
        },
      ],
    },
  };

  // Chama o próprio webhook
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const webhookUrl = `${baseUrl}/api/webhook/evolution`;

  console.log(`[TEST] Simulando mensagem de ${phone}: "${message}"`);

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fakeWebhookPayload),
    });

    return NextResponse.json({
      ok: true,
      status: res.status,
      message: `Mensagem simulada de ${phone}: "${message}"`,
      instance: instance ?? "test-instance",
      note: "Verifique os logs do container para acompanhar o fluxo: docker logs godentrenet_web -f",
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    usage: "POST /api/test/bot",
    body: {
      phone: "5587988444564 (número de telefone sem + ou espaços)",
      message: "oi (mensagem de teste)",
      instance: "nome-da-instancia (opcional, default: test-instance)",
    },
    example: {
      phone: "5587988444564",
      message: "oi",
      instance: "lg100",
    },
  });
}
