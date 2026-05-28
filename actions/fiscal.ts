"use server";

import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function getStoreId() {
  const session = await auth();
  if (!session?.user?.storeId) throw new Error("Não autenticado.");
  return session.user.storeId;
}

// ─── Types ────────────────────────────────────────────────────────────────────
export type TaxSuggestion = {
  ncm: string;
  cfop: string;
  cest: string | null;
  icmsRate: number | null;
};

export type FiscalSettings = {
  cnpj: string;
  stateRegistration: string;
  taxRegime: string;
};

export type NfceItem = {
  name: string;
  qty: number;
  price: number;
  ncm?: string | null;
  cfop?: string | null;
};

export type NfcePayload = {
  natureza_operacao: string;
  data_emissao: string;
  tipo_documento: number;
  finalidade_emissao: number;
  consumidor_final: number;
  presenca_comprador: number;
  modalidade_frete: number;
  cnpj_emitente: string;
  regime_tributario: number;
  items: {
    numero_item: number;
    codigo_produto: string;
    descricao: string;
    cfop: string;
    unidade_comercial: string;
    quantidade_comercial: number;
    valor_unitario_comercial: number;
    valor_bruto: number;
    codigo_ncm: string;
    icms_origem: number;
    icms_modalidade: string;
  }[];
  formas_pagamento: {
    forma_pagamento: string;
    valor_pagamento: number;
  }[];
  valor_total: number;
};

// ─── Tax regime → Focus NFe code ─────────────────────────────────────────────
const TAX_REGIME_CODE: Record<string, number> = {
  "Simples Nacional": 1,
  "Simples Nacional - Excesso": 2,
  "Lucro Presumido": 3,
  "Lucro Real": 3,
  "MEI": 1,
};

// ─── Payment method → Focus NFe code ─────────────────────────────────────────
const PAYMENT_CODE: Record<string, string> = {
  dinheiro: "01",
  pix: "17",
  credito: "03",
  debito: "04",
};

// ─── AI Tax Classification ────────────────────────────────────────────────────
export async function suggestTaxClassificationWithAI(
  productName: string
): Promise<TaxSuggestion> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY não configurada. Adicione a variável de ambiente no painel do Coolify."
    );
  }

  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content:
          `Sou lojista no Brasil. Qual o NCM e CFOP corretos (venda a consumidor dentro do estado, Simples Nacional) para: "${productName}"?\n` +
          `Responda SOMENTE com JSON válido, sem markdown, sem texto extra:\n` +
          `{"ncm":"00000000","cfop":"5102","cest":null,"icmsRate":null}\n` +
          `Regras: ncm = 8 dígitos, cfop = 4 dígitos (geralmente 5102 ou 5405), cest = 7 dígitos ou null, icmsRate = número ou null.`,
      },
    ],
  });

  const raw =
    message.content[0].type === "text" ? message.content[0].text.trim() : "";

  // Extract JSON even if model added some text around it
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("IA retornou resposta inesperada. Tente novamente.");

  const json = JSON.parse(match[0]);
  return {
    ncm: String(json.ncm ?? "").replace(/\D/g, "").slice(0, 8),
    cfop: String(json.cfop ?? "5102").replace(/\D/g, "").slice(0, 4),
    cest: json.cest ? String(json.cest).replace(/\D/g, "").slice(0, 7) : null,
    icmsRate: typeof json.icmsRate === "number" ? json.icmsRate : null,
  };
}

// ─── NFC-e Payload Generator ─────────────────────────────────────────────────
export async function generateNFCePayload(
  items: NfceItem[],
  paymentMethod: string,
  total: number
): Promise<NfcePayload> {
  const storeId = await getStoreId();
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { cnpj: true, taxRegime: true },
  });

  const cnpj = store?.cnpj?.replace(/\D/g, "") ?? "00000000000000";
  const regimeCode = TAX_REGIME_CODE[store?.taxRegime ?? "Simples Nacional"] ?? 1;
  const now = new Date().toISOString().slice(0, 19) + "-03:00";

  const mappedItems = items.map((item, idx) => ({
    numero_item: idx + 1,
    codigo_produto: String(idx + 1).padStart(3, "0"),
    descricao: item.name,
    cfop: item.cfop?.replace(/\D/g, "").slice(0, 4) ?? "5102",
    unidade_comercial: "UN",
    quantidade_comercial: item.qty,
    valor_unitario_comercial: Math.round(item.price * 100) / 100,
    valor_bruto: Math.round(item.price * item.qty * 100) / 100,
    codigo_ncm: item.ncm?.replace(/\D/g, "").slice(0, 8) ?? "00000000",
    icms_origem: 0,
    icms_modalidade: regimeCode === 1 ? "400" : "102",
  }));

  return {
    natureza_operacao: "Venda ao Consumidor",
    data_emissao: now,
    tipo_documento: 1,
    finalidade_emissao: 1,
    consumidor_final: 1,
    presenca_comprador: 1,
    modalidade_frete: 3,
    cnpj_emitente: cnpj,
    regime_tributario: regimeCode,
    items: mappedItems,
    formas_pagamento: [
      {
        forma_pagamento: PAYMENT_CODE[paymentMethod] ?? "01",
        valor_pagamento: Math.round(total * 100) / 100,
      },
    ],
    valor_total: Math.round(total * 100) / 100,
  };
}

// ─── Fiscal Settings CRUD ─────────────────────────────────────────────────────
export async function getStoreFiscal(): Promise<FiscalSettings & { name: string }> {
  const storeId = await getStoreId();
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { name: true, cnpj: true, stateRegistration: true, taxRegime: true },
  });
  return {
    name: store?.name ?? "",
    cnpj: store?.cnpj ?? "",
    stateRegistration: store?.stateRegistration ?? "",
    taxRegime: store?.taxRegime ?? "Simples Nacional",
  };
}

export async function updateStoreFiscal(data: FiscalSettings) {
  const storeId = await getStoreId();
  await prisma.store.update({
    where: { id: storeId },
    data: {
      cnpj: data.cnpj.trim() || null,
      stateRegistration: data.stateRegistration.trim() || null,
      taxRegime: data.taxRegime,
    },
  });
  revalidatePath("/dashboard/fiscal");
}
