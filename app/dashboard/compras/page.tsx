import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ComprasClient } from "./ComprasClient";

export default async function ComprasPage() {
  const session = await auth();
  if (!session?.user?.storeId) redirect("/login");

  const purchases = await prisma.purchase.findMany({
    where: { storeId: session.user.storeId },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      supplier: { select: { name: true } },
      _count: { select: { items: true } },
    },
  });

  return (
    <ComprasClient
      initialPurchases={purchases.map((p) => ({
        id: p.id,
        invoiceNumber: p.invoiceNumber,
        supplierName: p.supplier?.name ?? null,
        totalAmount: p.totalAmount,
        issueDate: p.issueDate?.toISOString() ?? null,
        createdAt: p.createdAt.toISOString(),
        itemCount: p._count.items,
      }))}
    />
  );
}
