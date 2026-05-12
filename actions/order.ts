"use server";

import { prisma } from "@/lib/prisma";

const EVO_URL = process.env.EVOLUTION_API_URL ?? "http://localhost:8080";
const EVO_KEY = process.env.EVOLUTION_API_KEY ?? "";

interface OrderItem {
  name: string;
  emoji: string;
  price: number;
  qty: number;
}

interface CreateOrderInput {
  storeId: string;
  instanceName: string;
  storeName: string;
  customerPhone: string;
  customerName?: string;
  address: string;
  items: OrderItem[];
  total: number;
  paymentMethod: "dinheiro" | "pix";
  needChange: boolean;
  changeFor?: number;
}

function formatPhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

function buildConfirmationMessage(input: CreateOrderInput): string {
  const itemLines = input.items
    .map((i) => `• ${i.emoji} ${i.name} x${i.qty} — R$ ${(i.price * i.qty).toFixed(2).replace(".", ",")}`)
    .join("\n");

  const payment =
    input.paymentMethod === "pix"
      ? "PIX (na entrega)"
      : input.needChange && input.changeFor
      ? `Dinheiro — troco para R$ ${input.changeFor.toFixed(2).replace(".", ",")}`
      : "Dinheiro";

  return (
    `✅ *Pedido confirmado!*\n\n` +
    `🏪 *${input.storeName}*\n\n` +
    `📦 *Itens:*\n${itemLines}\n\n` +
    `💰 *Total:* R$ ${input.total.toFixed(2).replace(".", ",")}\n\n` +
    `📍 *Endereço:* ${input.address}\n\n` +
    `💳 *Pagamento:* ${payment}\n\n` +
    `Em breve nosso entregador estará aí! 🛵`
  );
}

async function sendWhatsApp(instanceName: string, phone: string, text: string) {
  try {
    const res = await fetch(
      `${EVO_URL}/message/sendText/${encodeURIComponent(instanceName)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: EVO_KEY },
        body: JSON.stringify({ number: phone, text }),
      }
    );
    console.log(`[ORDER] WhatsApp enviado para ${phone} — status ${res.status}`);
    return res.ok || res.status === 201;
  } catch (err) {
    console.error("[ORDER] Erro ao enviar WhatsApp:", err);
    return false;
  }
}

export async function createOrder(input: CreateOrderInput): Promise<{ orderId: string }> {
  const order = await prisma.order.create({
    data: {
      storeId: input.storeId,
      customerPhone: formatPhone(input.customerPhone),
      customerName: input.customerName,
      address: input.address,
      items: input.items as unknown as import("@prisma/client").Prisma.JsonArray,
      total: input.total,
      paymentMethod: input.paymentMethod,
      needChange: input.needChange,
      changeFor: input.changeFor,
      status: "pending",
    },
  });

  const phone = formatPhone(input.customerPhone);
  const message = buildConfirmationMessage(input);
  await sendWhatsApp(input.instanceName, phone, message);

  return { orderId: order.id };
}
