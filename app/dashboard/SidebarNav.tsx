"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ShoppingCart, ClipboardList, Package, Boxes,
  Tag, Settings, Bot, FileText, ShoppingBag, Users, Truck,
  CalendarDays, Briefcase, UserCheck, Grid3x3, ChefHat,
  BookOpen, UtensilsCrossed,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  pendingBadge?: boolean;
};

// ─── Nav items per niche ──────────────────────────────────────────────────────

export function getNavItems(storeType: string): NavItem[] {
  switch (storeType) {
    case "FOOD":
      return [
        { href: "/dashboard",               label: "Início",         icon: LayoutDashboard },
        { href: "/dashboard/pdv",           label: "PDV",            icon: ShoppingCart },
        { href: "/dashboard/pedidos",       label: "Pedidos",        icon: ClipboardList,  pendingBadge: true },
        { href: "/dashboard/mesas",         label: "Mesas",          icon: Grid3x3 },
        { href: "/dashboard/kds",           label: "Cozinha (KDS)",  icon: ChefHat },
        { href: "/dashboard/produtos",      label: "Cardápio",       icon: UtensilsCrossed },
        { href: "/dashboard/categorias",    label: "Categorias",     icon: Tag },
        { href: "/dashboard/bot",           label: "Bot",            icon: Bot },
        { href: "/dashboard/config",        label: "Configurações",  icon: Settings },
      ];

    case "GAS_WATER":
      return [
        { href: "/dashboard",               label: "Início",         icon: LayoutDashboard },
        { href: "/dashboard/pdv",           label: "PDV (Balcão)",   icon: ShoppingCart },
        { href: "/dashboard/pedidos",       label: "Entregas",       icon: Truck,          pendingBadge: true },
        { href: "/dashboard/estoque",       label: "Estoque",        icon: Boxes },
        { href: "/dashboard/produtos",      label: "Catálogo",       icon: BookOpen },
        { href: "/dashboard/clientes",      label: "Clientes",       icon: Users },
        { href: "/dashboard/bot",           label: "Bot",            icon: Bot },
        { href: "/dashboard/config",        label: "Configurações",  icon: Settings },
      ];

    case "SERVICES":
      return [
        { href: "/dashboard",               label: "Início",         icon: LayoutDashboard },
        { href: "/dashboard/agendamentos",  label: "Agendamentos",   icon: CalendarDays },
        { href: "/dashboard/pdv",           label: "PDV",            icon: ShoppingCart },
        { href: "/dashboard/produtos",      label: "Serviços",       icon: Briefcase },
        { href: "/dashboard/profissionais", label: "Profissionais",  icon: UserCheck },
        { href: "/dashboard/bot",           label: "Bot",            icon: Bot },
        { href: "/dashboard/config",        label: "Configurações",  icon: Settings },
      ];

    case "RETAIL":
    case "GENERAL":
    default:
      return [
        { href: "/dashboard",               label: "Início",         icon: LayoutDashboard },
        { href: "/dashboard/pdv",           label: "PDV",            icon: ShoppingCart },
        { href: "/dashboard/pedidos",       label: "Pedidos",        icon: ClipboardList,  pendingBadge: true },
        { href: "/dashboard/produtos",      label: "Produtos",       icon: Package },
        { href: "/dashboard/categorias",    label: "Categorias",     icon: Tag },
        { href: "/dashboard/estoque",       label: "Estoque",        icon: Boxes },
        { href: "/dashboard/compras",       label: "Compras",        icon: ShoppingBag },
        { href: "/dashboard/fiscal",        label: "Fiscal",         icon: FileText },
        { href: "/dashboard/bot",           label: "Bot",            icon: Bot },
        { href: "/dashboard/config",        label: "Configurações",  icon: Settings },
      ];
  }
}

// ─── Niche badge config ───────────────────────────────────────────────────────

const NICHE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  FOOD:      { label: "Restaurante", color: "#F97316", bg: "rgba(249,115,22,0.1)",  border: "rgba(249,115,22,0.25)" },
  GAS_WATER: { label: "Água e Gás",  color: "#38BDF8", bg: "rgba(56,189,248,0.1)",  border: "rgba(56,189,248,0.25)" },
  SERVICES:  { label: "Serviços",    color: "#A78BFA", bg: "rgba(167,139,250,0.1)", border: "rgba(167,139,250,0.25)" },
  RETAIL:    { label: "Varejo",      color: "#34D399", bg: "rgba(52,211,153,0.1)",  border: "rgba(52,211,153,0.25)" },
  GENERAL:   { label: "Geral",       color: "#94A3B8", bg: "rgba(148,163,184,0.1)", border: "rgba(148,163,184,0.2)" },
};

export function NicheBadge({ storeType }: { storeType: string }) {
  const cfg = NICHE_CONFIG[storeType] ?? NICHE_CONFIG.GENERAL;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 8px", borderRadius: 9999,
      fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
    }}>
      {cfg.label}
    </span>
  );
}

// ─── SidebarNav (client — renders inside DashboardShell overlay) ──────────────

export function SidebarNav({
  pendingOrders,
  storeType = "GENERAL",
}: {
  pendingOrders: number;
  storeType?: string;
}) {
  const pathname = usePathname();
  const items = getNavItems(storeType);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
      {items.map(item => {
        const active = isActive(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              active
                ? "bg-amber-500/10 text-amber-400"
                : "text-gray-500 hover:text-gray-200 hover:bg-white/5"
            }`}
          >
            {active && (
              <span className="absolute left-0 w-0.5 h-6 bg-amber-500 rounded-r-full" />
            )}
            <Icon size={16} className="shrink-0" />
            <span className="flex-1 truncate">{item.label}</span>
            {item.pendingBadge && pendingOrders > 0 && (
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

// Keep backward-compat array export (used by PdvClient hamburger menu)
export const navItems = getNavItems("GENERAL");
