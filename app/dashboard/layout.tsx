import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SignOutButton } from "./SignOutButton";
import { SidebarNav } from "./SidebarNav";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  const pendingOrders = session.user.storeId
    ? await prisma.order.count({ where: { storeId: session.user.storeId, status: "pending" } })
    : 0;

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* ── Sidebar ── */}
      <aside className="relative w-56 bg-[#0d0d14] border-r border-gray-800/60 flex flex-col shrink-0">
        {/* Brand */}
        <div className="px-4 py-5 border-b border-gray-800/60">
          <p className="text-[9px] text-gray-600 uppercase tracking-[0.2em] font-semibold">GODENTRENET</p>
          <p className="text-white font-bold mt-1 truncate text-sm">
            {session.user.storeName ?? "Minha Loja"}
          </p>
        </div>

        {/* Nav — client component com active state */}
        <SidebarNav pendingOrders={pendingOrders} />

        {/* Footer */}
        <div className="px-2 pb-4 pt-3 border-t border-gray-800/60">
          <p className="text-gray-600 text-[10px] px-3 mb-1.5 truncate">{session.user.email}</p>
          <SignOutButton />
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-auto bg-gray-950">{children}</main>
    </div>
  );
}
