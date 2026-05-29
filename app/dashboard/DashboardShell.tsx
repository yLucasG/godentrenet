"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, ChevronLeft } from "lucide-react";
import { navItems } from "./SidebarNav";
import { SignOutButton } from "./SignOutButton";

interface Props {
  storeName: string;
  email: string;
  pendingOrders: number;
  children: React.ReactNode;
}

export function DashboardShell({ storeName, email, pendingOrders, children }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Fecha ao navegar para outra página
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">

      {/* ── Sidebar overlay ───────────────────────────────────────────────── */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/60"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-[61] w-56 bg-[#0d0d14] border-r border-gray-800/60 flex flex-col shadow-2xl">
            <div className="px-4 py-5 border-b border-gray-800/60 flex items-center justify-between">
              <div>
                <p className="text-[9px] text-gray-600 uppercase tracking-[0.2em] font-semibold">GODENTRENET</p>
                <p className="text-white font-bold mt-0.5 text-sm truncate">{storeName}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
            </div>

            <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
              {navItems.map(item => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
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

            <div className="px-2 pb-4 pt-3 border-t border-gray-800/60">
              <p className="text-gray-600 text-[10px] px-3 mb-1.5 truncate">{email}</p>
              <SignOutButton />
            </div>
          </div>
        </>
      )}

      {/* ── Barra superior com hambúrguer ──────────────────────────────────── */}
      <div className="h-10 bg-[#0d0d14] border-b border-gray-800/60 flex items-center px-3 gap-3 shrink-0 sticky top-0 z-30">
        <button
          onClick={() => setOpen(true)}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          aria-label="Abrir menu"
        >
          <Menu size={16} />
        </button>
        <div className="w-px h-4 bg-gray-800" />
        <span className="text-[9px] text-gray-600 uppercase tracking-[0.2em] font-semibold">GODENTRENET</span>
        <span className="text-gray-700 text-xs">·</span>
        <span className="text-gray-400 text-xs font-medium truncate">{storeName}</span>
      </div>

      {/* ── Conteúdo ───────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto bg-gray-950">
        {children}
      </main>
    </div>
  );
}
