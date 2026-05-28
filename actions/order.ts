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

type DeliveryMethod = "DELIVERY" | "PICKUP" | "LOCAL";

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
  deliveryMethod: DeliveryMethod;
  localIdentifier?: string;
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  // Prepend 55 (Brazil) if not already present
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  return "55" + digits;
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

  const locationLine =
    input.deliveryMethod === "DELIVERY"
      ? `📍 *Endereço:* ${input.address}\n\n`
      : input.deliveryMethod === "PICKUP"
      ? `🏪 *Retirada no local*\n\n`
      : `📍 *Local:* ${input.localIdentifier || "No local"}\n\n`;

  const closing =
    input.deliveryMethod === "DELIVERY"
      ? `Em breve nosso entregador estará aí! 🛵`
      : input.deliveryMethod === "PICKUP"
      ? `Seu pedido estará pronto em breve! 🏪`
      : `Seu pedido já está sendo preparado! ✨`;

  return (
    `✅ *Pedido confirmado!*\n\n` +
    `🏪 *${input.storeName}*\n\n` +
    `📦 *Itens:*\n${itemLines}\n\n` +
    `💰 *Total:* R$ ${input.total.toFixed(2).replace(".", ",")}\n\n` +
    locationLine +
    `💳 *Pagamento:* ${payment}\n\n` +
    closing
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
      deliveryMethod: input.deliveryMethod,
      localIdentifier: input.localIdentifier,
      status: "pending",
    },
  });

  const phone = formatPhone(input.customerPhone);
  const message = buildConfirmationMessage(input);
  await sendWhatsApp(input.instanceName, phone, message);

  return { orderId: order.id };
}
