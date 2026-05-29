"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const navItems = [
  { href: "/dashboard",              label: "Início",        icon: "🏠" },
  { href: "/dashboard/pdv",          label: "PDV",           icon: "🖥️" },
  { href: "/dashboard/pedidos",      label: "Pedidos",       icon: "🧾" },
  { href: "/dashboard/produtos",     label: "Produtos",      icon: "📦" },
  { href: "/dashboard/categorias",   label: "Categorias",    icon: "🏷️" },
  { href: "/dashboard/estoque",      label: "Estoque",       icon: "📦" },
  { href: "/dashboard/compras",      label: "Compras",       icon: "🧾" },
  { href: "/dashboard/fiscal",       label: "Fiscal",        icon: "📋" },
  { href: "/dashboard/bot",          label: "Bot",           icon: "🤖" },
  { href: "/dashboard/config",       label: "Configurações", icon: "⚙️" },
];

export function SidebarNav({ pendingOrders }: { pendingOrders: number }) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
      {navItems.map(item => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              active
                ? "bg-emerald-500/10 text-emerald-400"
                : "text-gray-500 hover:text-gray-200 hover:bg-white/5"
            }`}
          >
            {active && (
              <span className="absolute left-0 w-0.5 h-6 bg-emerald-500 rounded-r-full" />
            )}
            <span className="text-base shrink-0">{item.icon}</span>
            <span className="flex-1 truncate">{item.label}</span>
            {item.href === "/dashboard/pedidos" && pendingOrders > 0 && (
              <span className="bg-orange-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center shrink-0">
                {pendingOrders}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

// Versão inline para uso no PDV (hamburguer)
export { navItems };
