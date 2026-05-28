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
  { href: "/dashboard/estoque",        label: "Estoque",       icon: "📦" },
  { href: "/dashboard/compras",        label: "Compras",       icon: "🧾" },
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
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="px-5 py-5 border-b border-gray-800">
          <p className="text-xs text-gray-500 uppercase tracking-widest">GODENTRENET</p>
          <p className="text-white font-semibold mt-1 truncate">{session.user.storeName ?? "Minha Loja"}</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white text-sm transition-colors"
            >
              <span>{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.href === "/dashboard/pedidos" && pendingOrders > 0 && (
                <span className="bg-orange-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                  {pendingOrders}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="px-3 pb-4 border-t border-gray-800 pt-4">
          <p className="text-gray-500 text-xs px-3 mb-2 truncate">{session.user.email}</p>
          <SignOutButton />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
