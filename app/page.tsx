"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";

/* ─── Icons (same SVGs kept) ────────────────────────────────────────────── */
const CheckIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
);
const WhatsAppIcon = ({ size = 5 }: { size?: number }) => (
  <svg className={`w-${size} h-${size}`} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);
const BotIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" />
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
const ChevronLeft = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
);
const ChevronRightIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
);

/* ─── Scroll Reveal ──────────────────────────────────────────────────────── */
function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("lp-visible"); }),
      { threshold: 0.07, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".lp-reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useScrollReveal();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const slides = [
    { src: "/ss-dashboard.png", label: "Início — Visão geral da loja" },
    { src: "/ss-loja.png", label: "Loja pública — Vitrine do cliente" },
    { src: "/ss-pedidos1.png", label: "Pedidos — Painel de pedidos" },
    { src: "/ss-pedidos2.png", label: "Pedidos — Quadro Kanban" },
    { src: "/ss-pdv.png", label: "PDV — Ponto de venda" },
  ];

  const nextSlide = useCallback(() => setActiveSlide((p) => (p + 1) % slides.length), [slides.length]);
  const prevSlide = useCallback(() => setActiveSlide((p) => (p - 1 + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    if (isPaused) return;
    const t = setTimeout(nextSlide, 4500);
    return () => clearTimeout(t);
  }, [activeSlide, isPaused, nextSlide]);

  const faqs = [
    { q: "Preciso trocar de número para usar o Entrenet?", a: "Não. Você usa exatamente o mesmo número que já tem no WhatsApp. Basta escanear o QR Code dentro da plataforma." },
    { q: "O bot funciona no WhatsApp Business também?", a: "Sim. O Entrenet funciona tanto no WhatsApp comum quanto no WhatsApp Business." },
    { q: "O plano tem limite de mensagens ou produtos?", a: "Não. Você pode cadastrar quantos produtos quiser e o bot responde mensagens sem limite — sem cobranças extras." },
    { q: "O que acontece se eu cancelar?", a: "Cancele quando quiser, sem taxa. Ao cancelar, seu bot é desativado e a conta fica pausada." },
    { q: "Como é o suporte?", a: "Via WhatsApp, de segunda a sábado. Respondemos em até 2 horas durante o horário comercial." },
  ];

  /* ── Inline styles helpers ── */
  const glass = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
  } as const;

  const amberGlow = { color: "#F59E0B" };

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

      <style>{`
        /* ── Root & Font ── */
        .lp { background: #0A0A0A; min-height: 100vh; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; color: #fff; overflow-x: hidden; }
        .lp * { box-sizing: border-box; }
        .lp h1,.lp h2,.lp h3 { font-family: 'Plus Jakarta Sans', sans-serif; letter-spacing: -0.03em; }

        /* ── Keyframes ── */
        @keyframes lp-float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
        @keyframes lp-fadeup { from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)} }
        @keyframes lp-amber  { 0%{background-position:0% 50%} 100%{background-position:100% 50%} }
        @keyframes lp-blink  { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes lp-slide  { from{opacity:0;transform:scale(0.985)} to{opacity:1;transform:scale(1)} }
        @keyframes lp-pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(245,158,11,0.4); }
          70% { box-shadow: 0 0 0 12px rgba(245,158,11,0); }
          100% { box-shadow: 0 0 0 0 rgba(245,158,11,0); }
        }

        /* ── Scroll reveal + stagger ── */
        .lp-reveal { opacity:0; transform:translateY(24px); transition:opacity .6s cubic-bezier(.16,1,.3,1),transform .6s cubic-bezier(.16,1,.3,1); }
        .lp-reveal.lp-visible { opacity:1; transform:translateY(0); }
        .s1{transition-delay:.05s} .s2{transition-delay:.10s} .s3{transition-delay:.16s}
        .s4{transition-delay:.22s} .s5{transition-delay:.28s} .s6{transition-delay:.34s}

        /* ── Hero animated items ── */
        .h1{animation:lp-fadeup .7s cubic-bezier(.16,1,.3,1) .08s both}
        .h2{animation:lp-fadeup .7s cubic-bezier(.16,1,.3,1) .20s both}
        .h3{animation:lp-fadeup .7s cubic-bezier(.16,1,.3,1) .32s both}
        .h4{animation:lp-fadeup .7s cubic-bezier(.16,1,.3,1) .44s both}
        .h5{animation:lp-fadeup .7s cubic-bezier(.16,1,.3,1) .56s both}
        .h6{animation:lp-fadeup .75s cubic-bezier(.16,1,.3,1) .38s both}

        /* ── Amber gradient text ── */
        .amber-text {
          background: linear-gradient(90deg,#F59E0B,#FCD34D,#F59E0B);
          background-size: 200% auto;
          -webkit-background-clip:text; -webkit-text-fill-color:transparent;
          background-clip:text;
          animation:lp-amber 3s linear infinite;
        }

        /* ── Glow blobs ── */
        .glow-blob {
          position:absolute; border-radius:50%; pointer-events:none;
          filter:blur(120px); mix-blend-mode:screen;
        }

        /* ── Nav ── */
        .lp-nav { position:fixed; top:0; left:0; right:0; z-index:100; transition:all .3s ease; padding:20px 0; }
        .lp-nav.lp-on { background:rgba(10,10,10,.97); backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px); border-bottom:1px solid rgba(255,255,255,.06); padding:12px 0; }

        /* ── CTA Button (amber pill) ── */
        .cta-amber {
          display:inline-flex; align-items:center; gap:8px;
          background:#F59E0B; color:#0A0A0A;
          font-weight:800; font-family:'Plus Jakarta Sans',sans-serif;
          border-radius:9999px; padding:15px 36px; font-size:.95rem;
          border:none; cursor:pointer; text-decoration:none;
          transition:box-shadow .3s ease,transform .2s ease,filter .2s ease;
          white-space:nowrap;
        }
        .cta-amber:hover { box-shadow:0 0 30px rgba(245,158,11,.55),0 0 60px rgba(245,158,11,.2); transform:translateY(-2px); filter:brightness(1.06); }
        .cta-amber-outline {
          display:inline-flex; align-items:center; gap:8px;
          border:1px solid rgba(245,158,11,.35); color:#F59E0B;
          border-radius:9999px; padding:14px 28px; font-size:.9rem; font-weight:600;
          cursor:pointer; text-decoration:none; transition:all .2s ease; white-space:nowrap;
        }
        .cta-amber-outline:hover { background:rgba(245,158,11,.08); border-color:rgba(245,158,11,.6); }

        /* ── Ghost button nav ── */
        .nav-cta {
          background:#F59E0B; color:#0A0A0A; font-weight:700; border-radius:9999px;
          padding:9px 20px; font-size:.82rem; border:none; cursor:pointer; text-decoration:none;
          transition:box-shadow .25s,filter .2s;
        }
        .nav-cta:hover { box-shadow:0 0 16px rgba(245,158,11,.5); filter:brightness(1.06); }

        /* ── Glass card (base) ── */
        .glass { background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); }

        /* ── Bento grid ── */
        .bento { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
        .b-wide { grid-column:span 2; }
        .b-tall { grid-row:span 2; }

        /* ── Bento card ── */
        .bc { background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); border-radius:24px; padding:28px; backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); transition:background .25s,border-color .25s,box-shadow .25s; cursor:default; }
        .bc:hover { background:rgba(255,255,255,.07); border-color:rgba(245,158,11,.25); box-shadow:0 0 40px rgba(245,158,11,.07); }

        /* ── Icon circle ── */
        .ic { width:48px; height:48px; border-radius:50%; background:rgba(245,158,11,.1); color:#F59E0B; display:flex; align-items:center; justify-content:center; margin-bottom:18px; transition:background .2s,box-shadow .2s; flex-shrink:0; }
        .bc:hover .ic { background:rgba(245,158,11,.18); box-shadow:0 0 16px rgba(245,158,11,.2); }

        /* ── Stats ── */
        .stat-card { background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.07); border-radius:18px; padding:24px 20px; text-align:center; transition:border-color .2s,background .2s; }
        .stat-card:hover { border-color:rgba(245,158,11,.2); background:rgba(255,255,255,.06); }

        /* ── Steps ── */
        .step-num { width:34px; height:34px; border-radius:50%; background:rgba(245,158,11,.1); border:1px solid rgba(245,158,11,.25); color:#F59E0B; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:.78rem; flex-shrink:0; }

        /* ── Section label ── */
        .sec-label { font-size:.7rem; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:#F59E0B; margin-bottom:12px; display:block; }

        /* ── Pricing ── */
        .pricing-card { background:rgba(245,158,11,.05); border:1px solid rgba(245,158,11,.2); border-radius:28px; position:relative; overflow:hidden; }
        .pricing-card::before { content:''; position:absolute; top:0; left:10%; right:10%; height:1px; background:linear-gradient(90deg,transparent,rgba(245,158,11,.7),transparent); }

        /* ── FAQ ── */
        .faq-item { border:1px solid rgba(255,255,255,.07); border-radius:14px; overflow:hidden; transition:border-color .2s; }
        .faq-item:hover { border-color:rgba(245,158,11,.2); }
        .faq-ans { overflow:hidden; transition:max-height .38s cubic-bezier(.16,1,.3,1),opacity .3s; }

        /* ── Carousel ── */
        .carousel-wrap { background:rgba(255,255,255,.025); border:1px solid rgba(255,255,255,.07); border-radius:20px; overflow:hidden; box-shadow:0 40px 90px rgba(0,0,0,.7); }
        .carousel-bar { background:rgba(255,255,255,.04); padding:14px 20px; display:flex; align-items:center; gap:8px; border-bottom:1px solid rgba(255,255,255,.05); }
        .c-btn { position:absolute; top:50%; transform:translateY(-50%); width:36px; height:36px; border-radius:50%; background:rgba(10,10,10,.8); border:1px solid rgba(255,255,255,.1); color:#9CA3AF; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background .2s,color .2s,border-color .2s; z-index:10; }
        .c-btn:hover { background:rgba(245,158,11,.2); color:#F59E0B; border-color:rgba(245,158,11,.4); }

        /* ── CTA section ── */
        .cta-section { background:linear-gradient(135deg,rgba(245,158,11,.08) 0%,rgba(251,191,36,.04) 100%); border:1px solid rgba(245,158,11,.14); border-radius:32px; position:relative; overflow:hidden; }
        .cta-section::before { content:''; position:absolute; top:0; left:10%; right:10%; height:1px; background:linear-gradient(90deg,transparent,rgba(245,158,11,.6),transparent); }

        /* ── Hero floating card ── */
        .hero-card { animation:lp-float 7s ease-in-out infinite; }
        .msg-bubble { border-radius:12px; padding:10px 14px; font-size:.82rem; line-height:1.5; max-width:220px; }
        .msg-in { background:rgba(255,255,255,.08); color:#E5E7EB; border-bottom-left-radius:4px; }
        .msg-out { background:rgba(245,158,11,.2); color:#FDE68A; border-bottom-right-radius:4px; margin-left:auto; }
        .status-dot { width:8px; height:8px; border-radius:50%; background:#22C55E; animation:lp-blink 2s ease-in-out infinite; display:inline-block; }

        /* ── Responsive ── */
        @media (max-width:1024px) {
          .bento { grid-template-columns:1fr 1fr; }
          .b-wide { grid-column:1/3; }
        }
        @media (max-width:768px) {
          .hero-split { flex-direction:column !important; }
          .hero-card-col { display:none !important; }
          .nav-links { display:none !important; }
          .lp-nav.lp-on { margin:0; border-radius:0; }
          .bento { grid-template-columns:1fr !important; }
          .b-wide,.b-tall { grid-column:auto !important; grid-row:auto !important; }
          .stats-grid { grid-template-columns:1fr 1fr !important; }
          .steps-grid { grid-template-columns:1fr !important; }
          .sec-pad { padding-top:64px !important; padding-bottom:64px !important; }
          .hero-pad { padding:100px 20px 60px !important; }
          .cta-inner { padding:40px 24px !important; }
          .footer-inner { flex-direction:column !important; text-align:center; gap:18px !important; }
          .footer-links { justify-content:center !important; }
          .hero-ctas { flex-direction:column !important; align-items:stretch !important; }
          .hero-ctas .cta-amber,.hero-ctas .cta-amber-outline { justify-content:center; width:100%; }
        }
        @media (max-width:480px) {
          .nav-login { display:none !important; }
          .stats-grid { gap:10px !important; }
        }
        @media (prefers-reduced-motion:reduce) {
          *,*::before,*::after { animation-duration:.01ms !important; transition-duration:.01ms !important; }
          .lp-reveal { opacity:1; transform:none; }
        }
      `}</style>

      <div className="lp">

        {/* ─────────────────── NAV ─────────────────────────────────── */}
        <header className={`lp-nav ${scrolled ? "lp-on" : ""}`}>
          <div style={{ maxWidth: 1152, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 800, fontSize: "1.2rem", letterSpacing: "-0.03em" }}>
              Entre<span className="amber-text">net</span>
            </span>
            <nav className="nav-links" style={{ display: "flex", gap: 32 }}>
              {[["Como funciona", "#como-funciona"], ["Funcionalidades", "#funcionalidades"], ["Preços", "#precos"]].map(([l, h]) => (
                <a key={l} href={h} style={{ color: "#6B7280", fontSize: ".875rem", fontWeight: 500, textDecoration: "none", transition: "color .2s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#6B7280")}>{l}</a>
              ))}
            </nav>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Link href="/login" className="nav-login" style={{ color: "#6B7280", fontSize: ".875rem", fontWeight: 500, textDecoration: "none", transition: "color .2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={e => (e.currentTarget.style.color = "#6B7280")}>Entrar</Link>
              <Link href="/cadastro" className="nav-cta">Começar grátis</Link>
            </div>
          </div>
        </header>

        {/* ─────────────────── HERO ────────────────────────────────── */}
        <section className="hero-pad" style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", padding: "120px 24px 80px", overflow: "hidden" }}>
          {/* Glow blobs */}
          <div className="glow-blob" style={{ width: 700, height: 700, background: "rgba(245,158,11,0.12)", top: -200, left: -200 }} />
          <div className="glow-blob" style={{ width: 500, height: 500, background: "rgba(251,191,36,0.07)", bottom: -100, right: -100 }} />

          <div className="hero-split" style={{ maxWidth: 1152, margin: "0 auto", width: "100%", display: "flex", alignItems: "center", gap: 64 }}>

            {/* LEFT — text */}
            <div style={{ flex: 1, maxWidth: 680 }}>
              {/* Badge */}
              <div className="h1" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 100, padding: "8px 18px", marginBottom: 28 }}>
                <span className="status-dot" />
                <span style={{ color: "#FCD34D", fontSize: ".7rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }}>sistema completo de gestão, vitrine e robô de whatsapp para comerciantes</span>
              </div>

              <h1 className="h2" style={{ fontSize: "clamp(2.6rem,6.5vw,5rem)", fontWeight: 800, lineHeight: 1.04, marginBottom: 24, color: "#fff" }}>
                Seu WhatsApp.<br />
                <span className="amber-text">Vendendo 24h.</span>
              </h1>

              <p className="h3" style={{ color: "#6B7280", fontSize: "clamp(1rem,2vw,1.15rem)", lineHeight: 1.7, maxWidth: 520, marginBottom: 40 }}>
                Plataforma completa com gestão de estoque, vitrine digital e robô de WhatsApp que atende seus clientes automaticamente — tudo em um só lugar.
              </p>

              <div className="h4 hero-ctas" style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 56 }}>
                <Link href="/cadastro" className="cta-amber">
                  Criar conta grátis <ArrowRight />
                </Link>
              </div>

              {/* Mini stats row */}
              <div className="h5" style={{ display: "flex", flexWrap: "wrap", gap: 28 }}>
                {[["24h", "Atendimento"], ["5 min", "Setup"], ["R$0", "Por mensagem"], ["∞", "Produtos"]].map(([v, l]) => (
                  <div key={v}>
                    <p style={{ fontSize: "1.4rem", fontWeight: 800, color: "#F59E0B", lineHeight: 1 }}>{v}</p>
                    <p style={{ fontSize: ".75rem", color: "#4B5563", marginTop: 3 }}>{l}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — floating glass chat card */}
            <div className="hero-card-col h6" style={{ flexShrink: 0, width: 300 }}>
              <div className="hero-card glass" style={{ borderRadius: 24, padding: 22, position: "relative" }}>
                {/* Glow accent */}
                <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, background: "rgba(245,158,11,0.12)", borderRadius: "50%", filter: "blur(60px)", pointerEvents: "none" }} />

                {/* WhatsApp header */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#25D366", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <WhatsAppIcon size={4} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: "#fff", fontSize: ".85rem", fontWeight: 700, marginBottom: 1 }}>Pizzaria do João</p>
                    <p style={{ fontSize: ".7rem", color: "#4ADE80", display: "flex", alignItems: "center", gap: 4 }}>
                      <span className="status-dot" style={{ width: 6, height: 6, flexShrink: 0 }} /> Bot ativo
                    </p>
                  </div>
                  <div style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 8, padding: "3px 8px", fontSize: ".65rem", color: "#F59E0B", fontWeight: 700 }}>AO VIVO</div>
                </div>

                {/* Chat messages */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                  <div>
                    <p style={{ fontSize: ".65rem", color: "#4B5563", marginBottom: 4 }}>Cliente</p>
                    <div className="msg-bubble msg-in">Oi! Quero ver o cardápio 🍕</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                    <p style={{ fontSize: ".65rem", color: "#4B5563", marginBottom: 4 }}>Bot</p>
                    <div className="msg-bubble msg-out">Olá! Veja nosso cardápio completo 👇</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                    <div style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 10, padding: "8px 14px", fontSize: ".78rem", color: "#FDE68A", fontWeight: 600 }}>
                      🔗 ver.loja/pizzaria-joao
                    </div>
                  </div>
                </div>

                {/* Stats strip */}
                <div style={{ display: "flex", gap: 8, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                  {[["247", "msgs hoje"], ["98%", "respondidas"], ["4.8", "avaliação"]].map(([v, l]) => (
                    <div key={v} style={{ flex: 1, textAlign: "center" }}>
                      <p style={{ fontSize: ".95rem", fontWeight: 800, color: "#F59E0B" }}>{v}</p>
                      <p style={{ fontSize: ".6rem", color: "#4B5563", marginTop: 1 }}>{l}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─────────────────── COMO FUNCIONA ───────────────────────── */}
        <section id="como-funciona" className="sec-pad" style={{ maxWidth: 1024, margin: "0 auto", padding: "96px 24px", position: "relative" }}>
          {/* Section glow */}
          <div className="glow-blob" style={{ width: 400, height: 400, background: "rgba(245,158,11,0.07)", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />

          <div className="lp-reveal" style={{ textAlign: "center", marginBottom: 56, position: "relative" }}>
            <span className="sec-label">Como funciona</span>
            <h2 style={{ fontSize: "clamp(1.9rem,4vw,2.8rem)", fontWeight: 800, color: "#fff", margin: "0 0 14px" }}>
              Três passos. <span className="amber-text">Pronto.</span>
            </h2>
            <p style={{ color: "#6B7280", maxWidth: 400, margin: "0 auto", lineHeight: 1.65, fontSize: ".95rem" }}>
              Configure em minutos e comece a vender automaticamente.
            </p>
          </div>

          <div className="steps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, position: "relative" }}>
            {[
              { n: "01", icon: <StoreIcon />, t: "Cadastre sua loja", d: "Crie sua conta e adicione o nome, produtos, preços e configure a mensagem do bot." },
              { n: "02", icon: <WhatsAppIcon />, t: "Conecte o WhatsApp", d: "Escaneie o QR Code. Seu número fica ativo sem qualquer troca ou configuração extra." },
              { n: "03", icon: <BotIcon />, t: "Bot atende sozinho", d: "O cliente envia uma mensagem e recebe o cardápio e o link da loja na hora." },
            ].map((step, i) => (
              <div key={i} className={`lp-reveal bc s${i + 1}`}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                  <div className="ic">{step.icon}</div>
                  <div className="step-num">{step.n}</div>
                </div>
                <h3 style={{ color: "#fff", fontSize: "1.05rem", fontWeight: 700, marginBottom: 8 }}>{step.t}</h3>
                <p style={{ color: "#6B7280", fontSize: ".87rem", lineHeight: 1.65 }}>{step.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─────────────────── BENTO FEATURES ─────────────────────── */}
        <section id="funcionalidades" className="sec-pad" style={{ maxWidth: 1100, margin: "0 auto", padding: "16px 24px 96px", position: "relative" }}>
          {/* Glow */}
          <div className="glow-blob" style={{ width: 500, height: 500, background: "rgba(245,158,11,0.08)", top: "30%", right: -100 }} />

          <div className="lp-reveal" style={{ textAlign: "center", marginBottom: 52, position: "relative" }}>
            <span className="sec-label">Funcionalidades</span>
            <h2 style={{ fontSize: "clamp(1.9rem,4vw,2.8rem)", fontWeight: 800, color: "#fff", margin: "0 0 14px" }}>
              Tudo que sua loja precisa
            </h2>
            <p style={{ color: "#6B7280", maxWidth: 420, margin: "0 auto", lineHeight: 1.65, fontSize: ".95rem" }}>
              Plataforma completa para automatizar vendas e atendimento no WhatsApp.
            </p>
          </div>

          {/*
            Bento layout (3 cols):
            Row 1: [Bot 24h - b-wide 2col + b-tall 2row] | [Catálogo 1col]
            Row 2:                                        | [Dashboard 1col]
            Row 3: [Loja 1col] | [Config 1col]           | [WhatsApp 1col]
          */}
          <div className="bento" style={{ position: "relative" }}>

            {/* Bot 24h — tall + wide hero card */}
            <div className="lp-reveal s1 bc b-tall" style={{ gridColumn: 1, gridRow: "1 / 3", display: "flex", flexDirection: "column" }}>
              <div className="ic" style={{ width: 56, height: 56, borderRadius: 16 }}><BotIcon /></div>
              <h3 style={{ color: "#fff", fontSize: "1.3rem", fontWeight: 800, marginBottom: 10 }}>Bot automático 24h</h3>
              <p style={{ color: "#6B7280", fontSize: ".9rem", lineHeight: 1.7, marginBottom: 20 }}>
                Seu WhatsApp responde sozinho a qualquer hora do dia. Nunca mais um cliente sem resposta.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: "auto" }}>
                {["Cardápio automático", "Link da loja", "Resposta instantânea", "Sem limite"].map((t) => (
                  <span key={t} style={{ fontSize: ".7rem", fontWeight: 600, color: "#F59E0B", background: "rgba(245,158,11,.1)", border: "1px solid rgba(245,158,11,.2)", borderRadius: 100, padding: "4px 12px" }}>{t}</span>
                ))}
              </div>
              {/* Mini chat preview inside card */}
              <div style={{ marginTop: 24, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 16, padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#25D366", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <WhatsAppIcon size={3} />
                  </div>
                  <span style={{ fontSize: ".78rem", color: "#E5E7EB", fontWeight: 600 }}>Bot respondendo…</span>
                  <span className="status-dot" style={{ marginLeft: "auto" }} />
                </div>
                <div style={{ background: "rgba(245,158,11,.12)", borderRadius: 10, padding: "8px 12px", fontSize: ".75rem", color: "#FDE68A" }}>
                  "Olá! Veja nosso cardápio 👉 loja.entrenet.tech/pizzaria"
                </div>
              </div>
            </div>

            {/* Catálogo */}
            <div className="lp-reveal s2 bc" style={{ gridColumn: "2 / 3", gridRow: 1 }}>
              <div className="ic"><GridIcon /></div>
              <h3 style={{ color: "#fff", fontSize: "1.05rem", fontWeight: 700, marginBottom: 8 }}>Catálogo digital</h3>
              <p style={{ color: "#6B7280", fontSize: ".87rem", lineHeight: 1.6 }}>Produtos ilimitados com nome, preço e imagem do produto. Organize por categorias.</p>
            </div>

            {/* Dashboard */}
            <div className="lp-reveal s3 bc" style={{ gridColumn: "3 / 4", gridRow: 1 }}>
              <div className="ic"><ChartIcon /></div>
              <h3 style={{ color: "#fff", fontSize: "1.05rem", fontWeight: 700, marginBottom: 8 }}>Dashboard completo</h3>
              <p style={{ color: "#6B7280", fontSize: ".87rem", lineHeight: 1.6 }}>Status do bot, conversas recentes e controle de estoque em tempo real.</p>
            </div>

            {/* Loja */}
            <div className="lp-reveal s4 bc" style={{ gridColumn: "2 / 3", gridRow: 2 }}>
              <div className="ic"><LinkIcon /></div>
              <h3 style={{ color: "#fff", fontSize: "1.05rem", fontWeight: 700, marginBottom: 8 }}>Loja pública</h3>
              <p style={{ color: "#6B7280", fontSize: ".87rem", lineHeight: 1.6 }}>URL única com seu catálogo para divulgar onde quiser.</p>
            </div>

            {/* Config */}
            <div className="lp-reveal s5 bc" style={{ gridColumn: "3 / 4", gridRow: 2 }}>
              <div className="ic"><GearIcon /></div>
              <h3 style={{ color: "#fff", fontSize: "1.05rem", fontWeight: 700, marginBottom: 8 }}>Configuração simples</h3>
              <p style={{ color: "#6B7280", fontSize: ".87rem", lineHeight: 1.6 }}>Mude mensagens, produtos e ajustes a qualquer momento.</p>
            </div>

            {/* WhatsApp — full width bottom */}
            <div className="lp-reveal s6 bc b-wide" style={{ gridColumn: "1 / 4", gridRow: 3 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                <div className="ic" style={{ marginBottom: 0, flexShrink: 0, background: "rgba(34,197,94,.12)", color: "#22C55E", borderRadius: 16, width: 52, height: 52 }}><WhatsAppIcon /></div>
                <div>
                  <h3 style={{ color: "#fff", fontSize: "1.05rem", fontWeight: 700, marginBottom: 6 }}>Seu número, sem mudar nada</h3>
                  <p style={{ color: "#6B7280", fontSize: ".87rem", lineHeight: 1.6, maxWidth: 500 }}>Use o mesmo número de WhatsApp que seus clientes já conhecem. Zero troca, zero burocracia.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─────────────────── CAROUSEL ─────────────────────────────── */}
        <section className="sec-pad" style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px 96px", position: "relative" }}>
          <div className="glow-blob" style={{ width: 400, height: 400, background: "rgba(245,158,11,0.06)", bottom: 0, left: "50%", transform: "translateX(-50%)" }} />

          <div className="lp-reveal" style={{ textAlign: "center", marginBottom: 44, position: "relative" }}>
            <span className="sec-label">Plataforma</span>
            <h2 style={{ fontSize: "clamp(1.9rem,4vw,2.8rem)", fontWeight: 800, color: "#fff", margin: "0 0 14px" }}>
              Controle tudo em um só lugar
            </h2>
            <p style={{ color: "#6B7280", maxWidth: 400, margin: "0 auto", lineHeight: 1.65, fontSize: ".95rem" }}>
              Dashboard intuitivo com PDV, pedidos, estoque e bot integrados.
            </p>
          </div>

          <div className="lp-reveal s1">
            <div className="carousel-wrap" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
              <div className="carousel-bar">
                <div style={{ width: 11, height: 11, borderRadius: "50%", background: "rgba(239,68,68,.7)" }} />
                <div style={{ width: 11, height: 11, borderRadius: "50%", background: "rgba(234,179,8,.7)" }} />
                <div style={{ width: 11, height: 11, borderRadius: "50%", background: "rgba(34,197,94,.7)" }} />
                <div style={{ flex: 1, marginLeft: 12, background: "rgba(255,255,255,.04)", borderRadius: 8, height: 24, maxWidth: 200 }} />
              </div>
              <div style={{ position: "relative", background: "#0B1121", overflow: "hidden" }}>
                <Image key={activeSlide} src={slides[activeSlide].src} alt={slides[activeSlide].label} width={960} height={540} style={{ display: "block", width: "100%", height: "auto", animation: "lp-slide .4s ease both" }} priority={activeSlide === 0} />
                <button className="c-btn" onClick={prevSlide} style={{ left: 12 }} aria-label="Anterior"><ChevronLeft /></button>
                <button className="c-btn" onClick={nextSlide} style={{ right: 12 }} aria-label="Próximo"><ChevronRightIcon /></button>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginTop: 16 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {slides.map((_, i) => (
                  <button key={i} onClick={() => setActiveSlide(i)} style={{ width: i === activeSlide ? 20 : 6, height: 6, borderRadius: i === activeSlide ? 3 : "50%", background: i === activeSlide ? "#F59E0B" : "rgba(245,158,11,.2)", border: "none", cursor: "pointer", transition: "all .3s ease", padding: 0 }} aria-label={`Slide ${i + 1}`} />
                ))}
              </div>
              <p style={{ fontSize: ".78rem", color: "#4B5563", fontWeight: 500 }}>{slides[activeSlide].label}</p>
            </div>
          </div>
        </section>

        {/* ─────────────────── PRICING ──────────────────────────────── */}
        <section id="precos" style={{ maxWidth: 500, margin: "0 auto", padding: "0 24px 96px", position: "relative" }}>
          <div className="glow-blob" style={{ width: 450, height: 450, background: "rgba(245,158,11,0.1)", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />

          <div className="lp-reveal" style={{ textAlign: "center", marginBottom: 44, position: "relative" }}>
            <span className="sec-label">Preços</span>
            <h2 style={{ fontSize: "clamp(1.9rem,4vw,2.8rem)", fontWeight: 800, color: "#fff", margin: "0 0 12px" }}>
              Plano único, sem surpresas
            </h2>
            <p style={{ color: "#6B7280", lineHeight: 1.6, fontSize: ".95rem" }}>Tudo incluso. Sem limite de mensagens. Sem contrato.</p>
          </div>

          <div className="lp-reveal s1 pricing-card" style={{ position: "relative" }}>
            <div style={{ padding: "40px 36px" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(245,158,11,.1)", border: "1px solid rgba(245,158,11,.2)", borderRadius: 100, padding: "6px 16px", marginBottom: 24 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#F59E0B", display: "inline-block" }} />
                <span style={{ color: "#FCD34D", fontSize: ".7rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase" }}>Plano Completo</span>
              </div>
              <div style={{ marginBottom: 6 }}>
                <span style={{ fontFamily: "'Plus Jakarta Sans'", fontSize: "clamp(2.8rem,8vw,3.8rem)", fontWeight: 800, color: "#F59E0B", lineHeight: 1 }}>R$25</span>
                <span style={{ color: "#6B7280", fontSize: "1.05rem", marginLeft: 4 }}>/mês</span>
              </div>
              <p style={{ color: "#4B5563", fontSize: ".85rem", marginBottom: 28 }}>ou r$300 anuais · cancele quando quiser</p>
              <div style={{ height: 1, background: "rgba(245,158,11,.12)", marginBottom: 28 }} />
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px", display: "flex", flexDirection: "column", gap: 14 }}>
                {["Bot automático no WhatsApp", "Produtos ilimitados no catálogo", "Dashboard com status em tempo real", "Loja pública com URL própria", "Gestão de estoque e validades", "Configuração de mensagens do bot", "Suporte via WhatsApp"].map((item) => (
                  <li key={item} style={{ display: "flex", alignItems: "center", gap: 12, color: "#D1D5DB", fontSize: ".9rem" }}>
                    <span style={{ color: "#F59E0B", flexShrink: 0 }}><CheckIcon /></span>{item}
                  </li>
                ))}
              </ul>
              <Link href="/cadastro" className="cta-amber" style={{ display: "flex", justifyContent: "center", width: "100%", fontSize: "1rem", padding: "16px 24px" }}>
                Criar conta grátis <ArrowRight />
              </Link>
              <p style={{ textAlign: "center", color: "#374151", fontSize: ".75rem", marginTop: 14 }}>Sem cartão de crédito para começar</p>
            </div>
          </div>
        </section>

        {/* ─────────────────── FAQ ──────────────────────────────────── */}
        <section style={{ maxWidth: 660, margin: "0 auto", padding: "0 24px 96px" }}>
          <div className="lp-reveal" style={{ textAlign: "center", marginBottom: 44 }}>
            <span className="sec-label">Dúvidas</span>
            <h2 style={{ fontSize: "clamp(1.8rem,4vw,2.4rem)", fontWeight: 800, color: "#fff", margin: 0 }}>Perguntas frequentes</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {faqs.map((faq, i) => (
              <div key={i} className={`lp-reveal s${Math.min(i + 1, 5)} faq-item`}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "20px 22px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                  aria-expanded={openFaq === i}>
                  <span style={{ color: "#E5E7EB", fontWeight: 600, fontSize: ".9rem", fontFamily: "'Plus Jakarta Sans'" }}>{faq.q}</span>
                  <span style={{ color: "#4B5563", flexShrink: 0 }}><ChevronDown open={openFaq === i} /></span>
                </button>
                <div className="faq-ans" style={{ maxHeight: openFaq === i ? "180px" : "0", opacity: openFaq === i ? 1 : 0 }}>
                  <p style={{ padding: "0 22px 20px", color: "#6B7280", fontSize: ".875rem", lineHeight: 1.7 }}>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─────────────────── FINAL CTA ────────────────────────────── */}
        <section style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px 96px" }}>
          <div className="lp-reveal cta-section">
            <div className="cta-inner" style={{ padding: "72px 60px", textAlign: "center", position: "relative" }}>
              {/* Glow */}
              <div style={{ position: "absolute", top: "-50px", left: "50%", transform: "translateX(-50%)", width: 400, height: 300, background: "radial-gradient(circle,rgba(245,158,11,0.2) 0%,transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />

              <h2 style={{ position: "relative", fontSize: "clamp(2rem,5vw,3.2rem)", fontWeight: 800, color: "#fff", lineHeight: 1.1, marginBottom: 16 }}>
                Comece agora.<br />
                <span className="amber-text">Venda mais hoje mesmo!</span>
              </h2>
              <p style={{ position: "relative", color: "#6B7280", maxWidth: 400, margin: "0 auto 40px", lineHeight: 1.65, fontSize: ".95rem" }}>
                Configure em 5 minutos. Seu bot já pode estar respondendo clientes ainda hoje.
              </p>
              <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
                <Link href="/cadastro" className="cta-amber" style={{ fontSize: "1rem", padding: "16px 40px" }}>
                  Criar conta grátis <ArrowRight />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ─────────────────── FOOTER ───────────────────────────────── */}
        <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "32px 24px" }}>
          <div className="footer-inner" style={{ maxWidth: 1152, margin: "0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
            <span style={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 800, fontSize: "1.1rem" }}>
              Entre<span className="amber-text">net</span>
            </span>
            <div className="footer-links" style={{ display: "flex", flexWrap: "wrap", gap: 22, alignItems: "center" }}>
              {[["Como funciona", "#como-funciona"], ["Funcionalidades", "#funcionalidades"], ["Preços", "#precos"]].map(([l, h]) => (
                <a key={l} href={h} style={{ color: "#374151", fontSize: ".82rem", textDecoration: "none", transition: "color .2s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#9CA3AF")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#374151")}>{l}</a>
              ))}
              <Link href="/login" style={{ color: "#374151", fontSize: ".82rem", textDecoration: "none", transition: "color .2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#9CA3AF")}
                onMouseLeave={e => (e.currentTarget.style.color = "#374151")}>Entrar</Link>
            </div>
            <p style={{ color: "#1F2937", fontSize: ".75rem" }}>© {new Date().getFullYear()} Entrenet. Todos os direitos reservados.</p>
          </div>
        </footer>

      </div>
    </>
  );
}
