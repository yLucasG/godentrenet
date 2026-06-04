import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "./DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  const [pendingOrders, store] = await Promise.all([
    session.user.storeId
      ? prisma.order.count({ where: { storeId: session.user.storeId, status: "pending" } })
      : Promise.resolve(0),
    session.user.storeId
      ? prisma.store.findUnique({ where: { id: session.user.storeId }, select: { type: true } })
      : Promise.resolve(null),
  ]);

  const storeType = store?.type ?? "GENERAL";

  return (
    <DashboardShell
      storeName={session.user.storeName ?? "Minha Loja"}
      email={session.user.email ?? ""}
      pendingOrders={pendingOrders}
      storeType={storeType}
    >
      {children}
    </DashboardShell>
  );
}
