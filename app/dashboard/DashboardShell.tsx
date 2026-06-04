"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, ChevronLeft } from "lucide-react";
import { getNavItems, NicheBadge } from "./SidebarNav";
import { SignOutButton } from "./SignOutButton";

interface Props {
  storeName: string;
  email: string;
  pendingOrders: number;
  storeType: string;
  children: React.ReactNode;
}

export function DashboardShell({ storeName, email, pendingOrders, storeType, children }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(href + "/");
  }

  const navItems = getNavItems(storeType);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0A0A0A" }}>

      {/* ── Sidebar overlay ──────────────────────────────────────────────── */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/70"
            onClick={() => setOpen(false)}
          />
          <div
            className="fixed inset-y-0 left-0 z-[61] w-60 flex flex-col shadow-2xl"
            style={{ background: "#0D0D0D", borderRight: "1px solid rgba(255,255,255,0.06)" }}
          >
            {/* Sidebar header */}
            <div
              className="px-4 py-4 flex items-center justify-between"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div style={{
                  width: 28, height: 28, flexShrink: 0,
                  background: "rgba(245,158,11,0.12)",
                  border: "1px solid rgba(245,158,11,0.25)",
                  borderRadius: 7,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <path d="M8.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3.5M15 3h6m0 0v6m0-6L10 14"
                      stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="min-w-0">
                  <p style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: "0.18em", fontWeight: 700, textTransform: "uppercase" }}>
                    ENTRENET
                  </p>
                  <p style={{ color: "#fff", fontWeight: 700, fontSize: 13 }} className="truncate">
                    {storeName}
                  </p>
                  <div className="mt-1">
                    <NicheBadge storeType={storeType} />
                  </div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }}
                className="hover:text-white transition-colors ml-2"
              >
                <ChevronLeft size={18} />
              </button>
            </div>

            {/* Nav items */}
            <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
              {navItems.map(item => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
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

            {/* Footer */}
            <div className="px-2 pb-4 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 10 }} className="px-3 mb-1.5 truncate">
                {email}
              </p>
              <SignOutButton />
            </div>
          </div>
        </>
      )}

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div
        className="h-10 flex items-center px-3 gap-3 shrink-0 sticky top-0 z-30"
        style={{ background: "#0D0D0D", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <button
          onClick={() => setOpen(true)}
          className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
          style={{ color: "rgba(255,255,255,0.4)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
          aria-label="Abrir menu"
        >
          <Menu size={16} />
        </button>
        <div className="w-px h-4" style={{ background: "rgba(255,255,255,0.08)" }} />
        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.18em", fontWeight: 700, textTransform: "uppercase" }}>
          ENTRENET
        </span>
        <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>·</span>
        <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, fontWeight: 500 }} className="truncate">
          {storeName}
        </span>
        {/* Niche badge no topbar */}
        <NicheBadge storeType={storeType} />
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto" style={{ background: "#0A0A0A" }}>
        {children}
      </main>
    </div>
  );
}
