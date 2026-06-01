"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

/* ─── SVG Icons ─────────────────────────────────────────────────────────── */
const CheckIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const WhatsAppIcon = ({ size = 5 }: { size?: number }) => (
  <svg className={`w-${size} h-${size}`} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const BotIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2" />
    <circle cx="12" cy="5" r="2" />
    <path d="M12 7v4M8 15v2M16 15v2" />
  </svg>
);

const GridIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const ChartIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" />
  </svg>
);

const StoreIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l1-6h16l1 6" />
    <path d="M3 9a2 2 0 002 2 2 2 0 002-2 2 2 0 002 2 2 2 0 002-2 2 2 0 002 2 2 2 0 002-2" />
    <path d="M5 20h14V11M9 20v-6h6v6" />
  </svg>
);

const GearIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);

const LinkIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
  </svg>
);

const ArrowRight = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

const ChevronDown = ({ open }: { open: boolean }) => (
  <svg className={`w-5 h-5 transition-transform duration-300 ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

/* ─── Dashboard Mockup SVG ─────────────────────────────────────────────── */
const DashboardMockup = () => (
  <svg viewBox="0 0 900 520" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
    {/* Background */}
    <rect width="900" height="520" rx="12" fill="#0B1121" />
    {/* Sidebar */}
    <rect width="200" height="520" rx="12" fill="#0D1525" />
    <rect x="16" y="20" width="168" height="36" rx="8" fill="#1a2540" />
    <text x="32" y="44" fill="#818CF8" fontSize="14" fontWeight="700" fontFamily="system-ui">Entrenet</text>
    {["Dashboard","Produtos","Estoque","Pedidos","Configurações"].map((label, i) => (
      <g key={i}>
        <rect x="16" y={78 + i * 44} width="168" height="36" rx="8" fill={i === 0 ? "rgba(99,102,241,0.15)" : "transparent"} />
        <circle cx="36" cy={96 + i * 44} r="6" fill={i === 0 ? "#818CF8" : "#2a3550"} />
        <text x="52" y={101 + i * 44} fill={i === 0 ? "#E2E8F0" : "#64748B"} fontSize="12" fontFamily="system-ui">{label}</text>
      </g>
    ))}
    {/* Main content area */}
    <text x="224" y="44" fill="#F1F5F9" fontSize="16" fontWeight="600" fontFamily="system-ui">Visão Geral</text>
    {/* Stat cards */}
    {[
      { label: "Msgs hoje", value: "247", color: "#818CF8", x: 224 },
      { label: "Produtos", value: "18", color: "#34D399", x: 424 },
      { label: "Conversas", value: "34", color: "#F59E0B", x: 624 },
    ].map(({ label, value, color, x }) => (
      <g key={label}>
        <rect x={x} y={60} width="176" height="90" rx="10" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        <text x={x + 16} y={90} fill="#64748B" fontSize="11" fontFamily="system-ui">{label}</text>
        <text x={x + 16} y={120} fill={color} fontSize="26" fontWeight="700" fontFamily="system-ui">{value}</text>
        <circle cx={x + 155} cy={80} r="14" fill={`${color}20`} />
        <text x={x + 147} y={85} fill={color} fontSize="12" fontFamily="system-ui">↑</text>
      </g>
    ))}
    {/* Chart area */}
    <rect x="224" y="168" width="376" height="200" rx="10" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
    <text x="244" y="194" fill="#94A3B8" fontSize="12" fontFamily="system-ui">Mensagens por dia</text>
    {/* Chart bars */}
    {[60,90,45,120,80,140,100,160,130,110,170,145].map((h, i) => (
      <rect key={i} x={254 + i * 28} y={340 - h} width="16" height={h} rx="4" fill={`rgba(99,102,241,${0.3 + (h / 170) * 0.5})`} />
    ))}
    {/* Chart line */}
    <polyline points="262,280 290,250 318,295 346,230 374,260 402,210 430,240 458,200 486,220 514,235 542,195 570,215" stroke="#34D399" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
    {/* Right panel - WhatsApp status */}
    <rect x="616" y="168" width="260" height="200" rx="10" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
    <text x="636" y="194" fill="#94A3B8" fontSize="12" fontFamily="system-ui">Status WhatsApp</text>
    <circle cx="648" cy="218" r="6" fill="#34D399" />
    <text x="664" y="223" fill="#34D399" fontSize="12" fontFamily="system-ui" fontWeight="600">Conectado</text>
    {/* Messages list */}
    {["Maria Silva","João Costa","Ana Lima"].map((name, i) => (
      <g key={i}>
        <circle cx="648" cy={252 + i * 44} r="14" fill={`rgba(99,102,241,${0.2 + i * 0.1})`} />
        <text x="644" y={257 + i * 44} fill="#818CF8" fontSize="11" fontFamily="system-ui">{name[0]}</text>
        <text x="672" y={250 + i * 44} fill="#CBD5E1" fontSize="11" fontFamily="system-ui">{name}</text>
        <text x="672" y={264 + i * 44} fill="#475569" fontSize="10" fontFamily="system-ui">Cardápio enviado</text>
        <text x="820" y={250 + i * 44} fill="#475569" fontSize="10" fontFamily="system-ui">{`${i + 1}m`}</text>
      </g>
    ))}
    {/* Bottom section */}
    <rect x="224" y="384" width="652" height="112" rx="10" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
    <text x="244" y="410" fill="#94A3B8" fontSize="12" fontFamily="system-ui">Produtos em destaque</text>
    {["X-Burguer", "Coca-Cola", "Fritas P", "Milk Shake", "X-Bacon"].map((p, i) => (
      <g key={i}>
        <rect x={244 + i * 124} y={420} width="112" height="60" rx="8" fill="rgba(129,140,248,0.06)" stroke="rgba(129,140,248,0.1)" strokeWidth="1" />
        <text x={252 + i * 124} y={448} fill="#E2E8F0" fontSize="11" fontFamily="system-ui">{p}</text>
        <text x={252 + i * 124} y={465} fill="#34D399" fontSize="12" fontWeight="600" fontFamily="system-ui">R$18</text>
      </g>
    ))}
  </svg>
);

/* ─── Scroll Reveal Hook ─────────────────────────────────────────────────── */
function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("lp-visible");
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".lp-reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useScrollReveal();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const faqs = [
    {
      q: "Preciso trocar de número para usar o Entrenet?",
      a: "Não. Você usa exatamente o mesmo número que já tem no WhatsApp. Basta escanear o QR Code dentro da plataforma.",
    },
    {
      q: "O bot funciona no WhatsApp Business também?",
      a: "Sim. O Entrenet funciona tanto no WhatsApp comum quanto no WhatsApp Business.",
    },
    {
      q: "O plano tem limite de mensagens ou produtos?",
      a: "Não. Você pode cadastrar quantos produtos quiser e o bot responde mensagens sem limite — sem cobranças extras.",
    },
    {
      q: "O que acontece se eu cancelar?",
      a: "Cancele quando quiser, sem taxa. Ao cancelar, seu bot é desativado e a conta fica pausada.",
    },
    {
      q: "Como é o suporte?",
      a: "Via WhatsApp, de segunda a sábado. Respondemos em até 2 horas durante o horário comercial.",
    },
  ];

  return (
    <>
      {/* ── Fonts + Keyframes ─────────────────────────────────────────── */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap"
        rel="stylesheet"
      />

      <style>{`
        .lp-root {
          background: #04070F;
          min-height: 100vh;
          font-family: 'DM Sans', system-ui, sans-serif;
          color: #F1F5F9;
          overflow-x: hidden;
        }
        .lp-root * { box-sizing: border-box; }
        .lp-root h1, .lp-root h2, .lp-root h3, .lp-root h4 {
          font-family: 'Space Grotesk', system-ui, sans-serif;
          letter-spacing: -0.02em;
        }

        /* ── Keyframes ── */
        @keyframes lp-orb1 {
          0%,100% { transform: translate(0,0) scale(1); }
          40% { transform: translate(50px,-40px) scale(1.06); }
          70% { transform: translate(-30px,30px) scale(0.96); }
        }
        @keyframes lp-orb2 {
          0%,100% { transform: translate(0,0) scale(1); }
          35% { transform: translate(-40px,50px) scale(1.04); }
          65% { transform: translate(30px,-25px) scale(0.97); }
        }
        @keyframes lp-gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes lp-fade-up {
          from { opacity: 0; transform: translateY(36px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lp-cta-glow {
          0%,100% { box-shadow: 0 0 20px rgba(99,102,241,0.2), 0 4px 24px rgba(0,0,0,0.5); }
          50%      { box-shadow: 0 0 40px rgba(99,102,241,0.45), 0 4px 24px rgba(0,0,0,0.5); }
        }
        @keyframes lp-badge-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(52,211,153,0); }
          60%      { box-shadow: 0 0 0 6px rgba(52,211,153,0); }
        }
        @keyframes lp-dot-blink {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.3; }
        }
        @keyframes lp-shimmer-bar {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }

        /* ── Scroll reveal ── */
        .lp-reveal {
          opacity: 0;
          transform: translateY(32px);
          transition: opacity 0.7s cubic-bezier(0.16,1,0.3,1),
                      transform 0.7s cubic-bezier(0.16,1,0.3,1);
        }
        .lp-reveal.lp-visible { opacity: 1; transform: translateY(0); }
        .lp-d1 { transition-delay: 0.07s; }
        .lp-d2 { transition-delay: 0.14s; }
        .lp-d3 { transition-delay: 0.21s; }
        .lp-d4 { transition-delay: 0.28s; }
        .lp-d5 { transition-delay: 0.35s; }
        .lp-d6 { transition-delay: 0.42s; }

        /* ── Gradient text ── */
        .lp-gt {
          background: linear-gradient(135deg, #818CF8 0%, #34D399 45%, #818CF8 100%);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: lp-gradient 5s ease infinite;
        }

        /* ── Orbs ── */
        .lp-orb-1 {
          position: absolute; pointer-events: none;
          width: 700px; height: 700px; border-radius: 50%;
          background: radial-gradient(circle, rgba(99,102,241,0.16) 0%, transparent 70%);
          top: -220px; left: -180px;
          animation: lp-orb1 14s ease-in-out infinite;
        }
        .lp-orb-2 {
          position: absolute; pointer-events: none;
          width: 560px; height: 560px; border-radius: 50%;
          background: radial-gradient(circle, rgba(52,211,153,0.12) 0%, transparent 70%);
          bottom: -120px; right: -120px;
          animation: lp-orb2 11s ease-in-out infinite;
        }
        .lp-orb-mid {
          position: absolute; pointer-events: none;
          width: 400px; height: 400px; border-radius: 50%;
          background: radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%);
          top: 50%; left: 50%; transform: translate(-50%,-50%);
        }

        /* ── Dot grid ── */
        .lp-dots {
          background-image: radial-gradient(circle, rgba(129,140,248,0.13) 1px, transparent 1px);
          background-size: 30px 30px;
        }

        /* ── Nav ── */
        .lp-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 50;
          transition: all 0.35s cubic-bezier(0.16,1,0.3,1);
          padding: 20px 0;
        }
        .lp-nav.lp-scrolled {
          margin: 12px 16px 0;
          border-radius: 18px;
          background: rgba(11,17,37,0.88);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.06);
          box-shadow: 0 8px 40px rgba(0,0,0,0.45);
          padding: 12px 0;
        }

        /* ── Hero badge ── */
        .lp-hero-badge { animation: lp-fade-up 0.65s cubic-bezier(0.16,1,0.3,1) 0.05s both; }
        .lp-hero-h1    { animation: lp-fade-up 0.7s  cubic-bezier(0.16,1,0.3,1) 0.18s both; }
        .lp-hero-sub   { animation: lp-fade-up 0.7s  cubic-bezier(0.16,1,0.3,1) 0.32s both; }
        .lp-hero-ctas  { animation: lp-fade-up 0.7s  cubic-bezier(0.16,1,0.3,1) 0.44s both; }
        .lp-hero-stats { animation: lp-fade-up 0.7s  cubic-bezier(0.16,1,0.3,1) 0.56s both; }

        /* ── CTA primary button ── */
        .lp-btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          background: linear-gradient(135deg, #5A5CF8, #818CF8);
          color: #fff; font-weight: 700; font-family: 'Space Grotesk', sans-serif;
          border-radius: 12px; padding: 14px 26px; font-size: 0.9rem;
          border: none; cursor: pointer; text-decoration: none;
          transition: transform 0.2s ease, filter 0.2s ease;
          animation: lp-cta-glow 3s ease-in-out infinite;
          white-space: nowrap;
        }
        .lp-btn-primary:hover {
          transform: translateY(-2px);
          filter: brightness(1.12);
          animation: none;
          box-shadow: 0 10px 40px rgba(99,102,241,0.55);
        }
        .lp-btn-secondary {
          display: inline-flex; align-items: center; gap: 8px;
          border: 1px solid rgba(255,255,255,0.1);
          color: #CBD5E1; border-radius: 12px; padding: 14px 26px;
          font-size: 0.9rem; font-weight: 600;
          cursor: pointer; text-decoration: none;
          transition: border-color 0.2s, color 0.2s, background 0.2s;
          white-space: nowrap;
        }
        .lp-btn-secondary:hover {
          border-color: rgba(255,255,255,0.2);
          color: #fff;
          background: rgba(255,255,255,0.04);
        }

        /* ── Feature cards ── */
        .lp-card {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(129,140,248,0.1);
          border-radius: 18px; padding: 28px;
          transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
        }
        .lp-card:hover {
          transform: translateY(-5px);
          border-color: rgba(129,140,248,0.28);
          box-shadow: 0 16px 48px rgba(99,102,241,0.1);
        }

        /* ── Icon box ── */
        .lp-icon {
          width: 48px; height: 48px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 20px; transition: transform 0.2s ease;
        }
        .lp-card:hover .lp-icon { transform: scale(1.08); }

        /* ── Pricing card ── */
        .lp-pricing {
          background: rgba(99,102,241,0.05);
          border: 1px solid rgba(129,140,248,0.22);
          border-radius: 28px;
          position: relative; overflow: hidden;
          box-shadow: 0 0 80px rgba(99,102,241,0.1);
        }
        .lp-pricing::before {
          content: ''; position: absolute; top: 0; left: 10%; right: 10%; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(129,140,248,0.7), transparent);
        }

        /* ── Mockup ── */
        .lp-mockup {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px; overflow: hidden;
          box-shadow: 0 40px 90px rgba(0,0,0,0.65);
        }
        .lp-mockup-bar {
          background: rgba(255,255,255,0.04);
          padding: 14px 20px;
          display: flex; align-items: center; gap: 8px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .lp-mockup-dot { width: 11px; height: 11px; border-radius: 50%; }

        /* ── FAQ ── */
        .lp-faq-item {
          border: 1px solid rgba(129,140,248,0.09);
          border-radius: 14px; overflow: hidden;
          transition: border-color 0.2s ease;
        }
        .lp-faq-item:hover { border-color: rgba(129,140,248,0.22); }
        .lp-faq-answer {
          overflow: hidden;
          transition: max-height 0.38s cubic-bezier(0.16,1,0.3,1), opacity 0.3s ease;
        }

        /* ── Section label ── */
        .lp-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.7rem; font-weight: 600;
          letter-spacing: 0.15em; text-transform: uppercase;
          color: #818CF8; margin-bottom: 12px;
          display: block;
        }

        /* ── Step number ── */
        .lp-step-num {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.75rem; font-weight: 700; color: #334155;
          letter-spacing: 0.05em;
        }

        /* ── Stats bar ── */
        .lp-stat-card {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 18px; padding: 22px 16px; text-align: center;
        }

        /* ── Shimmer line ── */
        .lp-shimmer-line {
          position: relative; overflow: hidden;
          background: rgba(129,140,248,0.12); height: 1px;
        }
        .lp-shimmer-line::after {
          content: ''; position: absolute; top: 0; left: 0;
          width: 25%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(129,140,248,0.8), transparent);
          animation: lp-shimmer-bar 3s ease-in-out infinite;
        }

        /* ── Live dot ── */
        .lp-live-dot { animation: lp-dot-blink 2s ease-in-out infinite; }

        /* ── Trust bar logos (text-based) ── */
        .lp-trust-item {
          color: #334155; font-weight: 700; font-size: 0.85rem;
          letter-spacing: 0.04em; transition: color 0.2s;
        }
        .lp-trust-item:hover { color: #64748B; }

        /* ── CTA section gradient bg ── */
        .lp-cta-bg {
          background: linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(52,211,153,0.07) 100%);
          border: 1px solid rgba(129,140,248,0.18);
          border-radius: 32px; position: relative; overflow: hidden;
        }

        /* ── Pill tag ── */
        .lp-tag {
          font-size: 0.7rem; font-weight: 600;
          padding: 4px 12px; border-radius: 100px;
          border: 1px solid; display: inline-block;
        }

        /* ── How it works connector ── */
        .lp-connector {
          position: absolute; top: 34px;
          left: calc(16.67% + 20px); right: calc(16.67% + 20px);
          height: 1px;
          background: linear-gradient(90deg, rgba(99,102,241,0.4), rgba(52,211,153,0.3), transparent);
          pointer-events: none;
        }

        /* ── Responsive grids ── */
        .lp-stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }
        .lp-bento-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-template-rows: auto auto;
          gap: 20px;
        }
        .lp-bento-wide-left  { grid-column: 1 / 3; }
        .lp-bento-wide-right { grid-column: 2 / 4; }

        @media (min-width: 680px) {
          .lp-stats-grid { grid-template-columns: repeat(4, 1fr); }
        }
        @media (max-width: 900px) {
          .lp-bento-grid { grid-template-columns: 1fr 1fr; }
          .lp-bento-wide-left { grid-column: 1 / 3; }
          .lp-bento-wide-right { grid-column: 1 / 3; }
        }
        @media (max-width: 560px) {
          .lp-bento-grid { grid-template-columns: 1fr; }
          .lp-bento-wide-left, .lp-bento-wide-right { grid-column: 1 / 2; }
        }

        @media (prefers-reduced-motion: reduce) {
          .lp-root *, .lp-reveal, .lp-btn-primary, .lp-orb-1, .lp-orb-2 {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
          .lp-reveal { opacity: 1; transform: none; }
        }

        @media (max-width: 768px) {
          .lp-nav.lp-scrolled { margin: 8px 12px 0; }
          .lp-connector { display: none; }
        }
      `}</style>

      <div className="lp-root">

        {/* ── Navigation ─────────────────────────────────────────────── */}
        <header className={`lp-nav ${scrolled ? "lp-scrolled" : ""}`}>
          <div style={{ maxWidth: 1152, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "1.2rem", letterSpacing: "-0.02em" }}>
              Entre<span className="lp-gt">net</span>
            </span>

            <nav className="hidden md:flex" style={{ gap: 32 }}>
              {[["Como funciona", "#como-funciona"], ["Funcionalidades", "#funcionalidades"], ["Preços", "#precos"]].map(([label, href]) => (
                <a key={label} href={href} style={{ color: "#94A3B8", fontSize: "0.875rem", fontWeight: 500, textDecoration: "none", transition: "color 0.2s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#F1F5F9")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#94A3B8")}>
                  {label}
                </a>
              ))}
            </nav>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Link href="/login" style={{ color: "#94A3B8", fontSize: "0.875rem", fontWeight: 500, textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#F1F5F9")}
                onMouseLeave={e => (e.currentTarget.style.color = "#94A3B8")}>
                Entrar
              </Link>
              <Link href="/cadastro" className="lp-btn-primary" style={{ padding: "10px 20px", fontSize: "0.82rem", animation: "none" }}>
                Começar grátis
              </Link>
            </div>
          </div>
        </header>

        {/* ── Hero ───────────────────────────────────────────────────── */}
        <section className="lp-dots" style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "120px 24px 80px", overflow: "hidden", textAlign: "center" }}>
          <div className="lp-orb-1" />
          <div className="lp-orb-2" />

          {/* Live badge */}
          <div className="lp-hero-badge" style={{ marginBottom: 28 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: 100, padding: "8px 18px" }}>
              <span className="lp-live-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: "#34D399", display: "inline-block" }} />
              <span style={{ color: "#6EE7B7", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                Bot WhatsApp para lojistas brasileiros
              </span>
            </div>
          </div>

          {/* Headline */}
          <h1 className="lp-hero-h1" style={{ margin: "0 0 24px", fontWeight: 800, lineHeight: 1.08, maxWidth: 820, fontSize: "clamp(2.6rem, 6.5vw, 4.8rem)", color: "#F8FAFC" }}>
            Transforme seu WhatsApp em uma{" "}
            <span className="lp-gt">máquina de vendas</span>
          </h1>

          {/* Subheadline */}
          <p className="lp-hero-sub" style={{ color: "#64748B", marginBottom: 44, maxWidth: 580, fontSize: "clamp(1rem, 2vw, 1.125rem)", lineHeight: 1.7 }}>
            Bot inteligente que atende seus clientes 24h, envia cardápio,
            responde dúvidas e gerencia seu negócio —
            enquanto você faz o que realmente importa.
          </p>

          {/* CTAs */}
          <div className="lp-hero-ctas" style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center", marginBottom: 64 }}>
            <Link href="/cadastro" className="lp-btn-primary" style={{ fontSize: "0.95rem", padding: "15px 30px" }}>
              Começar agora — é grátis <ArrowRight />
            </Link>
            <a
              href="https://wa.me/558788444564?text=Quero+saber+mais+sobre+o+Entrenet"
              target="_blank" rel="noopener noreferrer"
              className="lp-btn-secondary"
              style={{ fontSize: "0.95rem", padding: "15px 30px" }}
            >
              <WhatsAppIcon /> Falar com a equipe
            </a>
          </div>

          {/* Stats */}
          <div className="lp-hero-stats lp-stats-grid" style={{ maxWidth: 680, width: "100%" }}>
            {[
              { val: "24h", label: "Atendimento sem parar" },
              { val: "5 min", label: "Para configurar" },
              { val: "R$0", label: "Por mensagem enviada" },
              { val: "∞", label: "Produtos no catálogo" },
            ].map((s, i) => (
              <div key={i} className="lp-stat-card" style={{ animationDelay: `${i * 0.1}s` }}>
                <p className="lp-gt" style={{ fontSize: "clamp(1.6rem, 4vw, 2.2rem)", fontWeight: 800, marginBottom: 4, backgroundSize: "200%", animationDelay: `${i * 0.4}s` }}>{s.val}</p>
                <p style={{ color: "#475569", fontSize: "0.78rem", fontWeight: 500 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Shimmer divider ─────────────────────────────────────────── */}
        <div style={{ maxWidth: 1152, margin: "0 auto", padding: "0 24px" }}>
          <div className="lp-shimmer-line" />
        </div>

        {/* ── Como funciona ───────────────────────────────────────────── */}
        <section id="como-funciona" style={{ maxWidth: 1024, margin: "0 auto", padding: "100px 24px" }}>
          <div className="lp-reveal" style={{ textAlign: "center", marginBottom: 56 }}>
            <span className="lp-label">Como funciona</span>
            <h2 style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)", fontWeight: 800, color: "#F8FAFC", margin: "0 0 16px" }}>
              Três passos. <span className="lp-gt">Pronto.</span>
            </h2>
            <p style={{ color: "#64748B", maxWidth: 440, margin: "0 auto", lineHeight: 1.65 }}>
              Configure em minutos. O bot começa a trabalhar imediatamente.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24, position: "relative" }}>
            <div className="lp-connector hidden md:block" />
            {[
              { n: "01", icon: <StoreIcon />, title: "Cadastre sua loja", desc: "Crie sua conta em segundos. Adicione o nome, os produtos, os preços e configure a mensagem do bot.", color: "#818CF8", bg: "rgba(99,102,241,0.12)" },
              { n: "02", icon: <WhatsAppIcon />, title: "Conecte o WhatsApp", desc: "Escaneie o QR Code dentro da plataforma. Seu número fica ativo sem nenhuma troca ou configuração extra.", color: "#34D399", bg: "rgba(52,211,153,0.1)" },
              { n: "03", icon: <BotIcon />, title: "Bot atende sozinho", desc: "Seu cliente envia uma mensagem e recebe o cardápio e o link da loja automaticamente, na hora.", color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
            ].map((step, i) => (
              <div key={i} className={`lp-reveal lp-card lp-d${i + 1}`}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                  <div className="lp-icon" style={{ background: step.bg, color: step.color }}>
                    {step.icon}
                  </div>
                  <span className="lp-step-num">{step.n}</span>
                </div>
                <h3 style={{ color: "#F1F5F9", fontSize: "1.05rem", fontWeight: 700, marginBottom: 10 }}>{step.title}</h3>
                <p style={{ color: "#64748B", fontSize: "0.88rem", lineHeight: 1.65 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features Bento ──────────────────────────────────────────── */}
        <section id="funcionalidades" style={{ maxWidth: 1152, margin: "0 auto", padding: "20px 24px 100px" }}>
          <div className="lp-reveal" style={{ textAlign: "center", marginBottom: 56 }}>
            <span className="lp-label">Funcionalidades</span>
            <h2 style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)", fontWeight: 800, color: "#F8FAFC", margin: "0 0 16px" }}>
              Tudo que sua loja precisa
            </h2>
            <p style={{ color: "#64748B", maxWidth: 460, margin: "0 auto", lineHeight: 1.65 }}>
              Uma plataforma completa para automatizar o atendimento e crescer suas vendas pelo WhatsApp.
            </p>
          </div>

          <div className="lp-bento-grid">
            {/* Large hero card */}
            <div className="lp-reveal lp-d1 lp-card lp-bento-wide-left" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(52,211,153,0.05) 100%)", borderColor: "rgba(129,140,248,0.18)" }}>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
                <div>
                  <div className="lp-icon" style={{ background: "rgba(99,102,241,0.18)", color: "#818CF8" }}>
                    <BotIcon />
                  </div>
                  <h3 style={{ color: "#F1F5F9", fontSize: "1.3rem", fontWeight: 800, marginBottom: 10 }}>Bot automático 24h</h3>
                  <p style={{ color: "#64748B", fontSize: "0.9rem", lineHeight: 1.7, maxWidth: 440 }}>
                    Seu WhatsApp responde sozinho a qualquer hora do dia.
                    Nunca mais um cliente sem resposta — mesmo quando você está descansando ou fora do trabalho.
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 18 }}>
                    {["Cardápio automático", "Link da loja", "Resposta instantânea", "Sem limite de msgs"].map((t) => (
                      <span key={t} className="lp-tag" style={{ color: "#818CF8", borderColor: "rgba(129,140,248,0.25)", background: "rgba(99,102,241,0.08)", fontSize: "0.7rem" }}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Catálogo */}
            <div className="lp-reveal lp-d2 lp-card">
              <div className="lp-icon" style={{ background: "rgba(52,211,153,0.12)", color: "#34D399" }}><GridIcon /></div>
              <h3 style={{ color: "#F1F5F9", fontSize: "1.05rem", fontWeight: 700, marginBottom: 8 }}>Catálogo digital</h3>
              <p style={{ color: "#64748B", fontSize: "0.87rem", lineHeight: 1.6 }}>Produtos ilimitados com nome, preço, emoji e descrição. Organize como quiser.</p>
            </div>

            {/* Dashboard */}
            <div className="lp-reveal lp-d3 lp-card">
              <div className="lp-icon" style={{ background: "rgba(139,92,246,0.15)", color: "#A78BFA" }}><ChartIcon /></div>
              <h3 style={{ color: "#F1F5F9", fontSize: "1.05rem", fontWeight: 700, marginBottom: 8 }}>Dashboard completo</h3>
              <p style={{ color: "#64748B", fontSize: "0.87rem", lineHeight: 1.6 }}>Status do bot em tempo real, conversas recentes e controle de estoque.</p>
            </div>

            {/* Loja pública */}
            <div className="lp-reveal lp-d4 lp-card">
              <div className="lp-icon" style={{ background: "rgba(6,182,212,0.12)", color: "#22D3EE" }}><LinkIcon /></div>
              <h3 style={{ color: "#F1F5F9", fontSize: "1.05rem", fontWeight: 700, marginBottom: 8 }}>Loja pública</h3>
              <p style={{ color: "#64748B", fontSize: "0.87rem", lineHeight: 1.6 }}>Uma URL bonita com seu catálogo. Divulgue no Instagram, TikTok ou onde quiser.</p>
            </div>

            {/* WhatsApp próprio - wide */}
            <div className="lp-reveal lp-d5 lp-card lp-bento-wide-right" style={{ background: "linear-gradient(135deg, rgba(52,211,153,0.07) 0%, rgba(99,102,241,0.05) 100%)" }}>
              <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
                <div className="lp-icon" style={{ background: "rgba(52,211,153,0.14)", color: "#34D399", flexShrink: 0 }}><WhatsAppIcon /></div>
                <div>
                  <h3 style={{ color: "#F1F5F9", fontSize: "1.05rem", fontWeight: 700, marginBottom: 8 }}>Seu número, sem mudar nada</h3>
                  <p style={{ color: "#64748B", fontSize: "0.87rem", lineHeight: 1.65, maxWidth: 360 }}>Use o mesmo número de WhatsApp que seus clientes já conhecem. Zero troca, zero burocracia.</p>
                </div>
              </div>
            </div>

            {/* Config */}
            <div className="lp-reveal lp-d6 lp-card">
              <div className="lp-icon" style={{ background: "rgba(245,158,11,0.12)", color: "#FCD34D" }}><GearIcon /></div>
              <h3 style={{ color: "#F1F5F9", fontSize: "1.05rem", fontWeight: 700, marginBottom: 8 }}>Configuração simples</h3>
              <p style={{ color: "#64748B", fontSize: "0.87rem", lineHeight: 1.6 }}>Mude a mensagem do bot, os produtos e as configurações a qualquer momento.</p>
            </div>
          </div>
        </section>

        {/* ── Dashboard Preview ───────────────────────────────────────── */}
        <section style={{ maxWidth: 1000, margin: "0 auto", padding: "0 24px 100px" }}>
          <div className="lp-reveal" style={{ textAlign: "center", marginBottom: 48 }}>
            <span className="lp-label">Plataforma</span>
            <h2 style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)", fontWeight: 800, color: "#F8FAFC", margin: "0 0 16px" }}>
              Controle tudo em um só lugar
            </h2>
            <p style={{ color: "#64748B", maxWidth: 440, margin: "0 auto", lineHeight: 1.65 }}>
              Dashboard intuitivo para gerenciar produtos, acompanhar conversas e monitorar o bot.
            </p>
          </div>

          <div className="lp-reveal lp-d1 lp-mockup">
            <div className="lp-mockup-bar">
              <div className="lp-mockup-dot" style={{ background: "rgba(239,68,68,0.7)" }} />
              <div className="lp-mockup-dot" style={{ background: "rgba(234,179,8,0.7)" }} />
              <div className="lp-mockup-dot" style={{ background: "rgba(34,197,94,0.7)" }} />
              <div style={{ flex: 1, marginLeft: 12, background: "rgba(255,255,255,0.04)", borderRadius: 8, height: 24, maxWidth: 220 }} />
            </div>
            <div style={{ padding: "4px 4px 4px" }}>
              <DashboardMockup />
            </div>
          </div>
        </section>

        {/* ── Pricing ─────────────────────────────────────────────────── */}
        <section id="precos" style={{ maxWidth: 520, margin: "0 auto", padding: "0 24px 100px" }}>
          <div className="lp-reveal" style={{ textAlign: "center", marginBottom: 48 }}>
            <span className="lp-label">Preços</span>
            <h2 style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)", fontWeight: 800, color: "#F8FAFC", margin: "0 0 12px" }}>
              Plano único, sem surpresas
            </h2>
            <p style={{ color: "#64748B", lineHeight: 1.6 }}>Tudo incluso. Sem limite de mensagens. Sem contrato.</p>
          </div>

          <div className="lp-reveal lp-d1 lp-pricing" style={{ padding: "40px 36px" }}>
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(129,140,248,0.2)", borderRadius: 100, padding: "6px 16px", marginBottom: 24 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#818CF8", display: "inline-block" }} />
                <span style={{ color: "#A5B4FC", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>Plano Completo</span>
              </div>

              <div style={{ marginBottom: 6 }}>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(3rem, 8vw, 4rem)", fontWeight: 800, color: "#F8FAFC", lineHeight: 1 }}>R$25</span>
                <span style={{ color: "#64748B", fontSize: "1.1rem", marginLeft: 4 }}>/mês</span>
              </div>
              <p style={{ color: "#475569", fontSize: "0.85rem" }}>ou r$300 anuais · cancele quando quiser</p>
            </div>

            <div style={{ height: 1, background: "rgba(129,140,248,0.1)", margin: "24px 0" }} />

            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px", display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                "Bot automático no WhatsApp",
                "Produtos ilimitados no catálogo",
                "Dashboard com status em tempo real",
                "Loja pública com URL própria",
                "Gestão de estoque e validades",
                "Configuração de mensagens do bot",
                "Suporte via WhatsApp",
              ].map((item) => (
                <li key={item} style={{ display: "flex", alignItems: "center", gap: 12, color: "#CBD5E1", fontSize: "0.9rem" }}>
                  <span style={{ color: "#34D399", flexShrink: 0 }}><CheckIcon /></span>
                  {item}
                </li>
              ))}
            </ul>

            <Link href="/cadastro" className="lp-btn-primary" style={{ display: "flex", justifyContent: "center", width: "100%", fontSize: "1rem", padding: "16px 24px" }}>
              Criar conta grátis <ArrowRight />
            </Link>
            <p style={{ textAlign: "center", color: "#334155", fontSize: "0.75rem", marginTop: 14 }}>
              Sem cartão de crédito para começar
            </p>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────────── */}
        <section style={{ maxWidth: 680, margin: "0 auto", padding: "0 24px 100px" }}>
          <div className="lp-reveal" style={{ textAlign: "center", marginBottom: 48 }}>
            <span className="lp-label">Dúvidas</span>
            <h2 style={{ fontSize: "clamp(2rem, 4vw, 2.5rem)", fontWeight: 800, color: "#F8FAFC", margin: 0 }}>
              Perguntas frequentes
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {faqs.map((faq, i) => (
              <div key={i} className={`lp-reveal lp-d${Math.min(i + 1, 5)} lp-faq-item`}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "20px 22px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                  aria-expanded={openFaq === i}
                >
                  <span style={{ color: "#E2E8F0", fontWeight: 600, fontSize: "0.9rem", fontFamily: "'Space Grotesk', sans-serif" }}>{faq.q}</span>
                  <span style={{ color: "#64748B", flexShrink: 0 }}><ChevronDown open={openFaq === i} /></span>
                </button>
                <div className="lp-faq-answer" style={{ maxHeight: openFaq === i ? "180px" : "0", opacity: openFaq === i ? 1 : 0 }}>
                  <p style={{ padding: "0 22px 20px", color: "#64748B", fontSize: "0.875rem", lineHeight: 1.7 }}>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Final CTA ───────────────────────────────────────────────── */}
        <section style={{ maxWidth: 1000, margin: "0 auto", padding: "0 24px 100px" }}>
          <div className="lp-reveal lp-cta-bg" style={{ padding: "clamp(48px, 8vw, 80px) clamp(24px, 6vw, 80px)", textAlign: "center" }}>
            {/* Glow orb */}
            <div style={{ position: "absolute", top: "-60px", left: "50%", transform: "translateX(-50%)", width: 380, height: 280, background: "radial-gradient(circle, rgba(99,102,241,0.22) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />

            <h2 style={{ position: "relative", fontSize: "clamp(2rem, 5vw, 3.4rem)", fontWeight: 800, color: "#F8FAFC", lineHeight: 1.1, marginBottom: 16 }}>
              Comece hoje.<br />
              <span className="lp-gt">Venda mais amanhã.</span>
            </h2>
            <p style={{ position: "relative", color: "#64748B", marginBottom: 40, maxWidth: 440, margin: "0 auto 40px", lineHeight: 1.65 }}>
              Configure em 5 minutos. Seu bot já pode estar respondendo
              clientes ainda hoje — sem nenhuma troca de número.
            </p>
            <div style={{ position: "relative", display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center" }}>
              <Link href="/cadastro" className="lp-btn-primary" style={{ fontSize: "0.95rem", padding: "15px 32px" }}>
                Criar conta grátis <ArrowRight />
              </Link>
              <a
                href="https://wa.me/558788444564?text=Quero+saber+mais+sobre+o+Entrenet"
                target="_blank" rel="noopener noreferrer"
                className="lp-btn-secondary"
                style={{ fontSize: "0.95rem", padding: "15px 32px" }}
              >
                <WhatsAppIcon /> Falar com a equipe
              </a>
            </div>
          </div>
        </section>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "36px 24px" }}>
          <div style={{ maxWidth: 1152, margin: "0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "1.05rem" }}>
              Entre<span className="lp-gt">net</span>
            </span>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "center" }}>
              {[["Como funciona", "#como-funciona"], ["Funcionalidades", "#funcionalidades"], ["Preços", "#precos"]].map(([label, href]) => (
                <a key={label} href={href} style={{ color: "#475569", fontSize: "0.82rem", textDecoration: "none", transition: "color 0.2s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#94A3B8")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#475569")}>
                  {label}
                </a>
              ))}
              <Link href="/login" style={{ color: "#475569", fontSize: "0.82rem", textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#94A3B8")}
                onMouseLeave={e => (e.currentTarget.style.color = "#475569")}>
                Entrar
              </Link>
            </div>

            <p style={{ color: "#1E293B", fontSize: "0.75rem" }}>© {new Date().getFullYear()} Entrenet. Todos os direitos reservados.</p>
          </div>
        </footer>

      </div>
    </>
  );
}
