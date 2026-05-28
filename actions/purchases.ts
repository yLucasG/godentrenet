"use server";

import { XMLParser } from "fast-xml-parser";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function getStoreId() {
  const session = await auth();
  if (!session?.user?.storeId) throw new Error("Não autenticado.");
  return session.user.storeId;
}

// ─── Types ────────────────────────────────────────────────────────────────────
export type ParsedItem = {
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  unit: string;
  existingItemId: string | null;
  existingItemName: string | null;
  existingStock: number | null;
  existingCost: number | null;
};

export type ParsedBill = {
  number: string;
  dueDate: string;
  amount: number;
};

export type ParsedNFe = {
  supplierName: string;
  supplierCnpj: string;
  invoiceNumber: string;
  issueDate: string;
  totalAmount: number;
  items: ParsedItem[];
  bills: ParsedBill[];
};

// ─── Unit normalisation ───────────────────────────────────────────────────────
const UNIT_MAP: Record<string, string> = {
  KGS: "KG", KG: "KG",
  G: "G", GR: "G", GRS: "G", GRM: "G",
  LT: "L", LTS: "L", L: "L", LITRO: "L", LITROS: "L",
  ML: "ML",
  UN: "UN", UNID: "UN", UNIDADE: "UN", UNIDADES: "UN", PC: "PC", PCS: "PC",
  CX: "CX", CAIXA: "CX", CAIXAS: "CX",
  DZ: "DZ", DUZIA: "DZ",
};

function normalizeUnit(raw: string): string {
  const upper = (raw ?? "UN").toUpperCase().trim();
  return UNIT_MAP[upper] ?? upper.slice(0, 4);
}

// ─── Safe number cast ─────────────────────────────────────────────────────────
function toFloat(v: unknown): number {
  if (typeof v === "number") return v;
  const n = parseFloat(String(v ?? "0").replace(",", "."));
  return isNaN(n) ? 0 : n;
}

// ─── Parse NF-e XML + match against existing inventory ───────────────────────
export async function parseNFe(xml: string): Promise<ParsedNFe> {
  const storeId = await getStoreId();

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    isArray: (name) => ["det", "dup"].includes(name),
    parseTagValue: true,
    trimValues: true,
  });

  const doc = parser.parse(xml);

  // Handle both nfeProc wrapper and bare NFe
  const root: Record<string, unknown> =
    (doc?.nfeProc?.NFe?.infNFe as Record<string, unknown>) ??
    (doc?.NFe?.infNFe as Record<string, unknown>) ??
    {};

  if (!root || Object.keys(root).length === 0) {
    throw new Error("XML inválido ou não é uma NF-e.");
  }

  // Supplier (emitente)
  const emit = (root.emit ?? {}) as Record<string, unknown>;
  const supplierName = String(emit.xNome ?? emit.xFant ?? "Fornecedor desconhecido");
  const supplierCnpj = String(emit.CNPJ ?? emit.CPF ?? "");

  // Invoice header
  const ide = (root.ide ?? {}) as Record<string, unknown>;
  const invoiceNumber = String(ide.nNF ?? "");
  const issueDateRaw = String(ide.dhEmi ?? ide.dEmi ?? "");
  const issueDate = issueDateRaw ? issueDateRaw.split("T")[0] : "";

  // Items (det)
  const detList = (root.det as unknown[]) ?? [];
  const rawItems = detList.map((d) => {
    const det = d as Record<string, unknown>;
    const prod = (det.prod ?? {}) as Record<string, unknown>;
    return {
      name: String(prod.xProd ?? ""),
      sku: String(prod.cProd ?? ""),
      quantity: toFloat(prod.qCom),
      unitPrice: toFloat(prod.vUnCom),
      totalPrice: toFloat(prod.vProd),
      unit: normalizeUnit(String(prod.uCom ?? "UN")),
    };
  });

  // Total
  const total = (root.total ?? {}) as Record<string, unknown>;
  const icmsTot = (total.ICMSTot ?? {}) as Record<string, unknown>;
  const totalAmount = toFloat(icmsTot.vNF) || rawItems.reduce((s, i) => s + i.totalPrice, 0);

  // Bills (cobr/dup)
  const cobr = (root.cobr ?? {}) as Record<string, unknown>;
  const dupList = (cobr.dup as unknown[]) ?? [];
  const bills: ParsedBill[] = dupList.map((d) => {
    const dup = d as Record<string, unknown>;
    return {
      number: String(dup.nDup ?? ""),
      dueDate: String(dup.dVenc ?? ""),
      amount: toFloat(dup.vDup),
    };
  });

  // Match each item against existing InventoryItems (by SKU first, then name)
  const existingItems = await prisma.inventoryItem.findMany({
    where: { storeId },
    select: { id: true, name: true, sku: true, currentStock: true, costPrice: true },
  });

  const items: ParsedItem[] = rawItems.map((raw) => {
    const bySku = raw.sku
      ? existingItems.find((e) => e.sku?.toLowerCase() === raw.sku.toLowerCase())
      : null;
    const byName = existingItems.find(
      (e) => e.name.toLowerCase() === raw.name.toLowerCase()
    );
    const match = bySku ?? byName ?? null;

    return {
      ...raw,
      existingItemId: match?.id ?? null,
      existingItemName: match?.name ?? null,
      existingStock: match?.currentStock ?? null,
      existingCost: match?.costPrice ?? null,
    };
  });

  return { supplierName, supplierCnpj, invoiceNumber, issueDate, totalAmount, items, bills };
}

// ─── Confirm and persist purchase ────────────────────────────────────────────
export async function confirmPurchase(data: ParsedNFe): Promise<{ purchaseId: string }> {
  const storeId = await getStoreId();

  // 1. Upsert supplier by CNPJ
  let supplierId: string | null = null;
  if (data.supplierCnpj || data.supplierName) {
    const existing = data.supplierCnpj
      ? await prisma.supplier.findFirst({ where: { storeId, cnpj: data.supplierCnpj } })
      : await prisma.supplier.findFirst({
          where: { storeId, name: { equals: data.supplierName, mode: "insensitive" } },
        });
    const supplier = existing
      ? await prisma.supplier.update({ where: { id: existing.id }, data: { name: data.supplierName } })
      : await prisma.supplier.create({ data: { storeId, name: data.supplierName, cnpj: data.supplierCnpj || null } });
    supplierId = supplier.id;
  }

  // 2. Create purchase header
  const purchase = await prisma.purchase.create({
    data: {
      storeId,
      supplierId,
      invoiceNumber: data.invoiceNumber || null,
      issueDate: data.issueDate ? new Date(data.issueDate) : null,
      totalAmount: data.totalAmount,
    },
  });

  // 3. Process items — update or create InventoryItem, then create PurchaseItem
  for (const item of data.items) {
    let inventoryItemId: string | null = null;

    if (item.existingItemId) {
      // Weighted average cost
      const inv = await prisma.inventoryItem.findUnique({ where: { id: item.existingItemId } });
      if (inv) {
        const newQty = inv.currentStock + item.quantity;
        const weightedCost =
          newQty > 0
            ? (inv.currentStock * inv.costPrice + item.quantity * item.unitPrice) / newQty
            : item.unitPrice;
        await prisma.inventoryItem.update({
          where: { id: item.existingItemId },
          data: { currentStock: newQty, costPrice: Math.round(weightedCost * 10000) / 10000 },
        });
        inventoryItemId = item.existingItemId;
      }
    } else {
      const created = await prisma.inventoryItem.create({
        data: {
          storeId,
          name: item.name,
          sku: item.sku || null,
          unit: item.unit,
          currentStock: item.quantity,
          minStock: 0,
          costPrice: item.unitPrice,
        },
      });
      inventoryItemId = created.id;
    }

    await prisma.purchaseItem.create({
      data: {
        purchaseId: purchase.id,
        inventoryItemId,
        name: item.name,
        sku: item.sku || null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      },
    });
  }

  // 4. Create financial transactions for each bill
  for (const bill of data.bills) {
    if (!bill.dueDate) continue;
    await prisma.financialTransaction.create({
      data: {
        storeId,
        type: "EXPENSE",
        status: "PENDING",
        description: `NF ${data.invoiceNumber || "s/n"} — ${data.supplierName}${bill.number ? ` — Dup ${bill.number}` : ""}`,
        amount: bill.amount,
        dueDate: new Date(bill.dueDate),
        purchaseId: purchase.id,
      },
    });
  }

  revalidatePath("/dashboard/compras");
  revalidatePath("/dashboard/estoque");
  return { purchaseId: purchase.id };
}

// ─── List purchases ───────────────────────────────────────────────────────────
export async function getPurchases() {
  const storeId = await getStoreId();
  return prisma.purchase.findMany({
    where: { storeId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      supplier: { select: { name: true } },
      _count: { select: { items: true } },
    },
  });
}
