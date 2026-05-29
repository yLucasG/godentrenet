import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "./DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  const pendingOrders = session.user.storeId
    ? await prisma.order.count({ where: { storeId: session.user.storeId, status: "pending" } })
    : 0;

  return (
    <DashboardShell
      storeName={session.user.storeName ?? "Minha Loja"}
      email={session.user.email ?? ""}
      pendingOrders={pendingOrders}
    >
      {children}
    </DashboardShell>
  );
}
