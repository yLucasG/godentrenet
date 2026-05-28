import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SignOutButton } from "./SignOutButton";
import { prisma } from "@/lib/prisma";

const navItems = [
  { href: "/dashboard",               label: "Início",        icon: "🏠" },
  { href: "/dashboard/pdv",           label: "PDV",           icon: "🖥️" },
  { href: "/dashboard/pedidos",       label: "Pedidos",       icon: "🧾" },
  { href: "/dashboard/produtos",      label: "Produtos",      icon: "📦" },
  { href: "/dashboard/categorias",    label: "Categorias",    icon: "🏷️" },
  { href: "/dashboard/estoque",       label: "Estoque",       icon: "📦" },
  { href: "/dashboard/compras",       label: "Compras",       icon: "🧾" },
  { href: "/dashboard/fiscal",        label: "Fiscal",        icon: "🧾" },
  { href: "/dashboard/bot",           label: "Bot",           icon: "🤖" },
  { href: "/dashboard/config",        label: "Configurações", icon: "⚙️" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  const pendingOrders = session.user.storeId
    ? await prisma.order.count({ where: { storeId: session.user.storeId, status: "pending" } })
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col shadow-sm shrink-0">
        <div className="px-5 py-5 border-b border-gray-100">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">GODENTRENET</p>
          <p className="text-gray-900 font-bold mt-1 truncate text-sm">{session.user.storeName ?? "Minha Loja"}</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:bg-indigo-50 hover:text-indigo-700 text-sm transition-colors font-medium"
            >
              <span className="text-base">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.href === "/dashboard/pedidos" && pendingOrders > 0 && (
                <span className="bg-orange-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                  {pendingOrders}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="px-3 pb-4 border-t border-gray-100 pt-3">
          <p className="text-gray-400 text-xs px-3 mb-2 truncate">{session.user.email}</p>
          <SignOutButton />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
