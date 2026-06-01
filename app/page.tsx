"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";

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
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const ChevronRightIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

/* ─── Scroll Reveal ──────────────────────────────────────────────────────── */
function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("lp-visible"); }),
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".lp-reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

/* ─── Page Component ─────────────────────────────────────────────────────── */
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useScrollReveal();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />

      <style>{`
        .lp-root {
          background: #04070F;
          min-height: 100vh;
          font-family: 'DM Sans', system-ui, sans-serif;
          color: #F1F5F9;
          overflow-x: hidden;
        }
        .lp-root * { box-sizing: border-box; }
        .lp-root h1, .lp-root h2, .lp-root h3 {
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
        @keyframes lp-dot-blink {
          0%,100% { opacity: 1; } 50% { opacity: 0.3; }
        }
        @keyframes lp-slide-in {
          from { opacity: 0; transform: scale(0.98); }
          to   { opacity: 1; transform: scale(1); }
        }

        /* ── Scroll reveal ── */
        .lp-reveal {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1);
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
          background: radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%);
          top: -220px; left: -180px;
          animation: lp-orb1 14s ease-in-out infinite;
        }
        .lp-orb-2 {
          position: absolute; pointer-events: none;
          width: 560px; height: 560px; border-radius: 50%;
          background: radial-gradient(circle, rgba(52,211,153,0.1) 0%, transparent 70%);
          bottom: -120px; right: -120px;
          animation: lp-orb2 11s ease-in-out infinite;
        }
        .lp-dots {
          background-image: radial-gradient(circle, rgba(129,140,248,0.12) 1px, transparent 1px);
          background-size: 30px 30px;
        }

        /* ── Nav ── */
        .lp-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          transition: all 0.3s cubic-bezier(0.16,1,0.3,1);
          padding: 20px 0;
        }
        .lp-nav.lp-scrolled {
          margin: 12px 16px 0;
          border-radius: 18px;
          /* Fully opaque — content behind is completely hidden */
          background: rgba(4,7,15,0.98);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.06);
          box-shadow: 0 8px 40px rgba(0,0,0,0.6);
          padding: 12px 0;
        }

        /* ── Hero ── */
        .lp-hero-badge { animation: lp-fade-up 0.65s cubic-bezier(0.16,1,0.3,1) 0.05s both; }
        .lp-hero-h1    { animation: lp-fade-up 0.7s  cubic-bezier(0.16,1,0.3,1) 0.18s both; }
        .lp-hero-sub   { animation: lp-fade-up 0.7s  cubic-bezier(0.16,1,0.3,1) 0.32s both; }
        .lp-hero-ctas  { animation: lp-fade-up 0.7s  cubic-bezier(0.16,1,0.3,1) 0.44s both; }
        .lp-hero-stats { animation: lp-fade-up 0.7s  cubic-bezier(0.16,1,0.3,1) 0.56s both; }
        .lp-live-dot   { animation: lp-dot-blink 2s ease-in-out infinite; }

        /* ── Buttons ── */
        .lp-btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          background: linear-gradient(135deg, #5A5CF8, #818CF8);
          color: #fff; font-weight: 700;
          font-family: 'Space Grotesk', sans-serif;
          border-radius: 12px; padding: 14px 26px; font-size: 0.9rem;
          border: none; cursor: pointer; text-decoration: none;
          transition: transform 0.2s ease, filter 0.2s ease;
          animation: lp-cta-glow 3s ease-in-out infinite;
          white-space: nowrap;
        }
        .lp-btn-primary:hover {
          transform: translateY(-2px); filter: brightness(1.12);
          animation: none;
          box-shadow: 0 10px 40px rgba(99,102,241,0.55);
        }

        /* ── Feature cards ── */
        .lp-card {
          background: rgba(255,255,255,0.028);
          border: 1px solid rgba(129,140,248,0.1);
          border-radius: 18px; padding: 28px;
          transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
        }
        .lp-card:hover {
          transform: translateY(-4px);
          border-color: rgba(129,140,248,0.25);
          box-shadow: 0 12px 40px rgba(99,102,241,0.08);
        }
        .lp-icon {
          width: 48px; height: 48px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 20px;
          transition: transform 0.2s ease;
        }
        .lp-card:hover .lp-icon { transform: scale(1.08); }

        /* ── Bento grid ── */
        .lp-bento {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .lp-bento-wide { grid-column: 1 / 3; }
        .lp-bento-full { grid-column: 1 / 4; }

        /* ── Stats ── */
        .lp-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          max-width: 680px;
          width: 100%;
        }
        .lp-stat-card {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 18px; padding: 22px 16px; text-align: center;
        }

        /* ── Section label ── */
        .lp-label {
          font-size: 0.7rem; font-weight: 600;
          letter-spacing: 0.15em; text-transform: uppercase;
          color: #818CF8; margin-bottom: 12px; display: block;
        }

        /* ── Pricing ── */
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

        /* ── Screenshot carousel ── */
        .lp-carousel {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px; overflow: hidden;
          box-shadow: 0 40px 90px rgba(0,0,0,0.65);
        }
        .lp-carousel-bar {
          background: rgba(255,255,255,0.04);
          padding: 14px 20px;
          display: flex; align-items: center; gap: 8px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          flex-shrink: 0;
        }
        .lp-carousel-dot-win { width: 11px; height: 11px; border-radius: 50%; flex-shrink: 0; }
        .lp-carousel-img {
          display: block; width: 100%; height: auto;
          animation: lp-slide-in 0.4s ease both;
        }
        .lp-carousel-btn {
          position: absolute; top: 50%; transform: translateY(-50%);
          width: 36px; height: 36px; border-radius: 50%;
          background: rgba(4,7,15,0.8);
          border: 1px solid rgba(255,255,255,0.12);
          color: #94A3B8; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s, color 0.2s, border-color 0.2s;
          z-index: 10;
        }
        .lp-carousel-btn:hover { background: rgba(99,102,241,0.3); color: #fff; border-color: rgba(129,140,248,0.4); }
        .lp-carousel-indicator {
          width: 6px; height: 6px; border-radius: 50%;
          transition: all 0.3s ease; cursor: pointer;
          border: none; padding: 0;
        }
        .lp-carousel-label {
          font-size: 0.78rem; color: #475569; text-align: center;
          margin-top: 14px; font-weight: 500;
        }

        /* ── Step connector ── */
        .lp-connector {
          position: absolute; top: 34px;
          left: calc(16.67% + 20px); right: calc(16.67% + 20px); height: 1px;
          background: linear-gradient(90deg, rgba(99,102,241,0.35), rgba(52,211,153,0.25), transparent);
          pointer-events: none;
        }

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

        /* ── CTA section ── */
        .lp-cta-bg {
          background: linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(52,211,153,0.07) 100%);
          border: 1px solid rgba(129,140,248,0.18);
          border-radius: 32px; position: relative; overflow: hidden;
        }

        /* ── Tag pill ── */
        .lp-tag {
          font-size: 0.7rem; font-weight: 600;
          padding: 4px 12px; border-radius: 100px;
          border: 1px solid; display: inline-block;
        }

        /* ════════════════════════════════════════
           RESPONSIVE — TABLET (≤1024px)
        ════════════════════════════════════════ */
        @media (max-width: 1024px) {
          .lp-bento { grid-template-columns: 1fr 1fr; }
          .lp-bento-wide { grid-column: 1 / 3; }
          .lp-bento-full { grid-column: 1 / 3; }
        }

        /* ════════════════════════════════════════
           RESPONSIVE — MOBILE (≤768px)
        ════════════════════════════════════════ */
        @media (max-width: 768px) {
          /* Nav: logo + CTA only, no links */
          .lp-nav-links { display: none !important; }
          .lp-nav.lp-scrolled { margin: 8px 10px 0; }

          /* Hero: compact */
          .lp-hero { padding: 100px 20px 60px !important; }
          .lp-hero-badge { margin-bottom: 20px !important; }
          .lp-hero-ctas { flex-direction: column !important; align-items: stretch !important; }
          .lp-hero-ctas .lp-btn-primary { justify-content: center; width: 100%; }

          /* Stats: 2x2 */
          .lp-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }

          /* Steps: vertical */
          .lp-steps-grid { grid-template-columns: 1fr !important; }
          .lp-connector { display: none !important; }

          /* Features: 1 column */
          .lp-bento { grid-template-columns: 1fr !important; }
          .lp-bento-wide, .lp-bento-full { grid-column: 1 / 2 !important; }

          /* Carousel: smaller padding */
          .lp-carousel-bar { padding: 10px 14px !important; }

          /* Pricing: full width */
          .lp-pricing-wrap { padding: 0 !important; }

          /* Sections: less vertical padding */
          .lp-section { padding-top: 64px !important; padding-bottom: 64px !important; }
          .lp-section-sm { padding-top: 48px !important; padding-bottom: 48px !important; }

          /* CTA final: compact */
          .lp-cta-inner { padding: 40px 24px !important; }
          .lp-cta-inner h2 { font-size: clamp(1.8rem, 7vw, 2.4rem) !important; }
          .lp-cta-btns { flex-direction: column !important; align-items: stretch !important; }
          .lp-cta-btns .lp-btn-primary { justify-content: center; width: 100%; }

          /* Footer */
          .lp-footer-inner { flex-direction: column !important; text-align: center; gap: 20px !important; }
          .lp-footer-links { justify-content: center !important; }

          /* Orbs: smaller on mobile */
          .lp-orb-1 { width: 300px !important; height: 300px !important; top: -80px !important; left: -80px !important; }
          .lp-orb-2 { width: 250px !important; height: 250px !important; bottom: -60px !important; right: -60px !important; }
        }

        /* ════════════════════════════════════════
           RESPONSIVE — SMALL MOBILE (≤480px)
        ════════════════════════════════════════ */
        @media (max-width: 480px) {
          .lp-stats-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
          .lp-stat-card { padding: 16px 10px !important; }
          .lp-pricing-card-inner { padding: 28px 20px !important; }
          /* Hide "nav" login link too on very small */
          .lp-nav-login { display: none !important; }
        }

        @media (prefers-reduced-motion: reduce) {
          .lp-root *, .lp-reveal, .lp-btn-primary, .lp-orb-1, .lp-orb-2 {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
          .lp-reveal { opacity: 1; transform: none; }
        }
      `}</style>

      <div className="lp-root">

        {/* ── Navigation ─────────────────────────────────────────────── */}
        <header className={`lp-nav ${scrolled ? "lp-scrolled" : ""}`}>
          <div style={{ maxWidth: 1152, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "1.2rem", letterSpacing: "-0.02em" }}>
              Entre<span className="lp-gt">net</span>
            </span>
            <nav className="lp-nav-links" style={{ display: "flex", gap: 32 }}>
              {[["Como funciona", "#como-funciona"], ["Funcionalidades", "#funcionalidades"], ["Preços", "#precos"]].map(([l, h]) => (
                <a key={l} href={h} style={{ color: "#94A3B8", fontSize: "0.875rem", fontWeight: 500, textDecoration: "none", transition: "color 0.2s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#F1F5F9")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#94A3B8")}>{l}</a>
              ))}
            </nav>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Link href="/login" className="lp-nav-login" style={{ color: "#94A3B8", fontSize: "0.875rem", fontWeight: 500, textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#F1F5F9")}
                onMouseLeave={e => (e.currentTarget.style.color = "#94A3B8")}>Entrar</Link>
              <Link href="/cadastro" className="lp-btn-primary" style={{ padding: "10px 20px", fontSize: "0.82rem", animation: "none" }}>
                Começar grátis
              </Link>
            </div>
          </div>
        </header>

        {/* ── Hero ───────────────────────────────────────────────────── */}
        <section className="lp-hero lp-dots" style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "120px 24px 80px", overflow: "hidden", textAlign: "center" }}>
          <div className="lp-orb-1" />
          <div className="lp-orb-2" />

          <div className="lp-hero-badge" style={{ marginBottom: 28 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: 100, padding: "8px 18px" }}>
              <span className="lp-live-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: "#34D399", display: "inline-block" }} />
              <span style={{ color: "#6EE7B7", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>Bot WhatsApp para lojistas brasileiros</span>
            </div>
          </div>

          <h1 className="lp-hero-h1" style={{ margin: "0 0 24px", fontWeight: 800, lineHeight: 1.08, maxWidth: 820, fontSize: "clamp(2.4rem, 6.5vw, 4.6rem)", color: "#F8FAFC" }}>
            Transforme seu WhatsApp em uma{" "}
            <span className="lp-gt">máquina de vendas</span>
          </h1>

          <p className="lp-hero-sub" style={{ color: "#64748B", marginBottom: 44, maxWidth: 580, fontSize: "clamp(0.95rem, 2vw, 1.1rem)", lineHeight: 1.7 }}>
            Bot inteligente que atende seus clientes 24h, envia cardápio, responde dúvidas e gerencia seu negócio — enquanto você faz o que realmente importa.
          </p>

          <div className="lp-hero-ctas" style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center", marginBottom: 64 }}>
            <Link href="/cadastro" className="lp-btn-primary" style={{ fontSize: "0.95rem", padding: "15px 30px" }}>
              Começar agora — é grátis <ArrowRight />
            </Link>
          </div>

          <div className="lp-hero-stats lp-stats-grid">
            {[
              { val: "24h", label: "Atendimento sem parar" },
              { val: "5 min", label: "Para configurar" },
              { val: "R$0", label: "Por mensagem enviada" },
              { val: "∞", label: "Produtos no catálogo" },
            ].map((s, i) => (
              <div key={i} className="lp-stat-card">
                <p className="lp-gt" style={{ fontSize: "clamp(1.5rem, 3.5vw, 2rem)", fontWeight: 800, marginBottom: 4, backgroundSize: "200%", animationDelay: `${i * 0.4}s` }}>{s.val}</p>
                <p style={{ color: "#475569", fontSize: "0.76rem", fontWeight: 500 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Como funciona ───────────────────────────────────────────── */}
        <section id="como-funciona" className="lp-section" style={{ maxWidth: 1024, margin: "0 auto", padding: "96px 24px" }}>
          <div className="lp-reveal" style={{ textAlign: "center", marginBottom: 52 }}>
            <span className="lp-label">Como funciona</span>
            <h2 style={{ fontSize: "clamp(1.9rem, 4vw, 2.7rem)", fontWeight: 800, color: "#F8FAFC", margin: "0 0 14px" }}>
              Três passos. <span className="lp-gt">Pronto.</span>
            </h2>
            <p style={{ color: "#64748B", maxWidth: 420, margin: "0 auto", lineHeight: 1.65, fontSize: "0.95rem" }}>
              Configure em minutos. O bot começa a trabalhar imediatamente.
            </p>
          </div>

          <div className="lp-steps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, position: "relative" }}>
            <div className="lp-connector" />
            {[
              { n: "01", icon: <StoreIcon />, title: "Cadastre sua loja", desc: "Crie sua conta em segundos. Adicione o nome, os produtos, os preços e configure a mensagem do bot.", color: "#818CF8", bg: "rgba(99,102,241,0.12)" },
              { n: "02", icon: <WhatsAppIcon />, title: "Conecte o WhatsApp", desc: "Escaneie o QR Code dentro da plataforma. Seu número fica ativo sem nenhuma troca ou configuração extra.", color: "#34D399", bg: "rgba(52,211,153,0.1)" },
              { n: "03", icon: <BotIcon />, title: "Bot atende sozinho", desc: "Seu cliente envia uma mensagem e recebe o cardápio e o link da loja automaticamente, na hora.", color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
            ].map((step, i) => (
              <div key={i} className={`lp-reveal lp-card lp-d${i + 1}`}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                  <div className="lp-icon" style={{ background: step.bg, color: step.color }}>{step.icon}</div>
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.75rem", fontWeight: 700, color: "#334155", letterSpacing: "0.05em" }}>{step.n}</span>
                </div>
                <h3 style={{ color: "#F1F5F9", fontSize: "1.05rem", fontWeight: 700, marginBottom: 8 }}>{step.title}</h3>
                <p style={{ color: "#64748B", fontSize: "0.87rem", lineHeight: 1.65 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features Bento ──────────────────────────────────────────── */}
        <section id="funcionalidades" className="lp-section" style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 24px 96px" }}>
          <div className="lp-reveal" style={{ textAlign: "center", marginBottom: 52 }}>
            <span className="lp-label">Funcionalidades</span>
            <h2 style={{ fontSize: "clamp(1.9rem, 4vw, 2.7rem)", fontWeight: 800, color: "#F8FAFC", margin: "0 0 14px" }}>
              Tudo que sua loja precisa
            </h2>
            <p style={{ color: "#64748B", maxWidth: 440, margin: "0 auto", lineHeight: 1.65, fontSize: "0.95rem" }}>
              Plataforma completa para automatizar vendas e atendimento no WhatsApp.
            </p>
          </div>

          {/* Grid: Bot(2) + Catálogo / Dashboard + Loja + Config / WhatsApp(full) */}
          <div className="lp-bento">
            {/* Row 1 */}
            <div className="lp-reveal lp-d1 lp-card lp-bento-wide">
              <div className="lp-icon" style={{ background: "rgba(99,102,241,0.15)", color: "#818CF8" }}><BotIcon /></div>
              <h3 style={{ color: "#F1F5F9", fontSize: "1.25rem", fontWeight: 800, marginBottom: 10 }}>Bot automático 24h</h3>
              <p style={{ color: "#64748B", fontSize: "0.9rem", lineHeight: 1.7, maxWidth: 420 }}>
                Seu WhatsApp responde sozinho a qualquer hora. Nunca mais um cliente sem resposta — mesmo quando você está descansando.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
                {["Cardápio automático", "Link da loja", "Resposta instantânea", "Sem limite de msgs"].map((t) => (
                  <span key={t} className="lp-tag" style={{ color: "#818CF8", borderColor: "rgba(129,140,248,0.25)", background: "rgba(99,102,241,0.08)", fontSize: "0.7rem" }}>{t}</span>
                ))}
              </div>
            </div>

            <div className="lp-reveal lp-d2 lp-card">
              <div className="lp-icon" style={{ background: "rgba(52,211,153,0.12)", color: "#34D399" }}><GridIcon /></div>
              <h3 style={{ color: "#F1F5F9", fontSize: "1.05rem", fontWeight: 700, marginBottom: 8 }}>Catálogo digital</h3>
              <p style={{ color: "#64748B", fontSize: "0.87rem", lineHeight: 1.6 }}>Produtos ilimitados com nome, preço, emoji e descrição. Organize por categorias.</p>
            </div>

            {/* Row 2 — 3 cards, fills 3 cols cleanly */}
            <div className="lp-reveal lp-d3 lp-card">
              <div className="lp-icon" style={{ background: "rgba(139,92,246,0.14)", color: "#A78BFA" }}><ChartIcon /></div>
              <h3 style={{ color: "#F1F5F9", fontSize: "1.05rem", fontWeight: 700, marginBottom: 8 }}>Dashboard completo</h3>
              <p style={{ color: "#64748B", fontSize: "0.87rem", lineHeight: 1.6 }}>Status do bot em tempo real, conversas recentes e controle de estoque.</p>
            </div>

            <div className="lp-reveal lp-d4 lp-card">
              <div className="lp-icon" style={{ background: "rgba(6,182,212,0.12)", color: "#22D3EE" }}><LinkIcon /></div>
              <h3 style={{ color: "#F1F5F9", fontSize: "1.05rem", fontWeight: 700, marginBottom: 8 }}>Loja pública</h3>
              <p style={{ color: "#64748B", fontSize: "0.87rem", lineHeight: 1.6 }}>URL única com seu catálogo. Divulgue no Instagram, TikTok ou onde quiser.</p>
            </div>

            <div className="lp-reveal lp-d5 lp-card">
              <div className="lp-icon" style={{ background: "rgba(245,158,11,0.12)", color: "#FCD34D" }}><GearIcon /></div>
              <h3 style={{ color: "#F1F5F9", fontSize: "1.05rem", fontWeight: 700, marginBottom: 8 }}>Configuração simples</h3>
              <p style={{ color: "#64748B", fontSize: "0.87rem", lineHeight: 1.6 }}>Mude a mensagem do bot, os produtos e as configurações a qualquer momento.</p>
            </div>

            {/* Row 3 — WhatsApp full width */}
            <div className="lp-reveal lp-d6 lp-card lp-bento-full">
              <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
                <div className="lp-icon" style={{ background: "rgba(52,211,153,0.12)", color: "#34D399", flexShrink: 0, marginBottom: 0 }}><WhatsAppIcon /></div>
                <div>
                  <h3 style={{ color: "#F1F5F9", fontSize: "1.05rem", fontWeight: 700, marginBottom: 6 }}>Seu número, sem mudar nada</h3>
                  <p style={{ color: "#64748B", fontSize: "0.87rem", lineHeight: 1.6, maxWidth: 500 }}>Use o mesmo número de WhatsApp que seus clientes já conhecem. Zero troca, zero burocracia, zero migrações.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Screenshot Carousel ─────────────────────────────────────── */}
        <section className="lp-section" style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px 96px" }}>
          <div className="lp-reveal" style={{ textAlign: "center", marginBottom: 48 }}>
            <span className="lp-label">Plataforma</span>
            <h2 style={{ fontSize: "clamp(1.9rem, 4vw, 2.7rem)", fontWeight: 800, color: "#F8FAFC", margin: "0 0 14px" }}>
              Controle tudo em um só lugar
            </h2>
            <p style={{ color: "#64748B", maxWidth: 420, margin: "0 auto", lineHeight: 1.65, fontSize: "0.95rem" }}>
              Dashboard intuitivo para gerenciar produtos, pedidos, estoque e acompanhar o bot.
            </p>
          </div>

          <div className="lp-reveal lp-d1">
            <div
              className="lp-carousel"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {/* Browser bar */}
              <div className="lp-carousel-bar">
                <div className="lp-carousel-dot-win" style={{ background: "rgba(239,68,68,0.7)" }} />
                <div className="lp-carousel-dot-win" style={{ background: "rgba(234,179,8,0.7)" }} />
                <div className="lp-carousel-dot-win" style={{ background: "rgba(34,197,94,0.7)" }} />
                <div style={{ flex: 1, marginLeft: 12, background: "rgba(255,255,255,0.04)", borderRadius: 8, height: 24, maxWidth: 200 }} />
              </div>

              {/* Image */}
              <div style={{ position: "relative", overflow: "hidden", background: "#0B1121" }}>
                <Image
                  key={activeSlide}
                  src={slides[activeSlide].src}
                  alt={slides[activeSlide].label}
                  width={960}
                  height={540}
                  className="lp-carousel-img"
                  style={{ objectFit: "cover", display: "block" }}
                  priority={activeSlide === 0}
                />

                {/* Arrow buttons */}
                <button className="lp-carousel-btn" onClick={prevSlide} style={{ left: 12 }} aria-label="Anterior">
                  <ChevronLeft />
                </button>
                <button className="lp-carousel-btn" onClick={nextSlide} style={{ right: 12 }} aria-label="Próximo">
                  <ChevronRightIcon />
                </button>
              </div>
            </div>

            {/* Dots + label */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginTop: 16 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {slides.map((_, i) => (
                  <button
                    key={i}
                    className="lp-carousel-indicator"
                    onClick={() => setActiveSlide(i)}
                    style={{
                      width: i === activeSlide ? 20 : 6,
                      height: 6,
                      borderRadius: i === activeSlide ? 3 : "50%",
                      background: i === activeSlide ? "#818CF8" : "rgba(129,140,248,0.25)",
                      cursor: "pointer",
                    }}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>
              <p className="lp-carousel-label">{slides[activeSlide].label}</p>
            </div>
          </div>
        </section>

        {/* ── Pricing ─────────────────────────────────────────────────── */}
        <section id="precos" className="lp-pricing-wrap" style={{ maxWidth: 500, margin: "0 auto", padding: "0 24px 96px" }}>
          <div className="lp-reveal" style={{ textAlign: "center", marginBottom: 44 }}>
            <span className="lp-label">Preços</span>
            <h2 style={{ fontSize: "clamp(1.9rem, 4vw, 2.7rem)", fontWeight: 800, color: "#F8FAFC", margin: "0 0 12px" }}>
              Plano único, sem surpresas
            </h2>
            <p style={{ color: "#64748B", lineHeight: 1.6, fontSize: "0.95rem" }}>Tudo incluso. Sem limite de mensagens. Sem contrato.</p>
          </div>

          <div className="lp-reveal lp-d1 lp-pricing">
            <div className="lp-pricing-card-inner" style={{ padding: "40px 36px" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(129,140,248,0.2)", borderRadius: 100, padding: "6px 16px", marginBottom: 24 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#818CF8", display: "inline-block" }} />
                <span style={{ color: "#A5B4FC", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>Plano Completo</span>
              </div>
              <div style={{ marginBottom: 6 }}>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(2.8rem, 8vw, 3.8rem)", fontWeight: 800, color: "#F8FAFC", lineHeight: 1 }}>R$25</span>
                <span style={{ color: "#64748B", fontSize: "1.05rem", marginLeft: 4 }}>/mês</span>
              </div>
              <p style={{ color: "#475569", fontSize: "0.85rem", marginBottom: 28 }}>ou r$300 anuais · cancele quando quiser</p>
              <div style={{ height: 1, background: "rgba(129,140,248,0.1)", marginBottom: 28 }} />
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px", display: "flex", flexDirection: "column", gap: 15 }}>
                {["Bot automático no WhatsApp", "Produtos ilimitados no catálogo", "Dashboard com status em tempo real", "Loja pública com URL própria", "Gestão de estoque e validades", "Configuração de mensagens do bot", "Suporte via WhatsApp"].map((item) => (
                  <li key={item} style={{ display: "flex", alignItems: "center", gap: 12, color: "#CBD5E1", fontSize: "0.9rem" }}>
                    <span style={{ color: "#34D399", flexShrink: 0 }}><CheckIcon /></span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/cadastro" className="lp-btn-primary" style={{ display: "flex", justifyContent: "center", width: "100%", fontSize: "1rem", padding: "16px 24px" }}>
                Criar conta grátis <ArrowRight />
              </Link>
              <p style={{ textAlign: "center", color: "#334155", fontSize: "0.75rem", marginTop: 14 }}>Sem cartão de crédito para começar</p>
            </div>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────────── */}
        <section className="lp-section-sm" style={{ maxWidth: 660, margin: "0 auto", padding: "0 24px 96px" }}>
          <div className="lp-reveal" style={{ textAlign: "center", marginBottom: 44 }}>
            <span className="lp-label">Dúvidas</span>
            <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.4rem)", fontWeight: 800, color: "#F8FAFC", margin: 0 }}>Perguntas frequentes</h2>
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
        <section style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px 96px" }}>
          <div className="lp-reveal lp-cta-bg">
            <div className="lp-cta-inner" style={{ padding: "72px 60px", textAlign: "center" }}>
              <div style={{ position: "absolute", top: "-60px", left: "50%", transform: "translateX(-50%)", width: 380, height: 280, background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
              <h2 style={{ position: "relative", fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 800, color: "#F8FAFC", lineHeight: 1.1, marginBottom: 16 }}>
                Comece hoje.<br />
                <span className="lp-gt">Venda mais amanhã.</span>
              </h2>
              <p style={{ position: "relative", color: "#64748B", maxWidth: 420, margin: "0 auto 40px", lineHeight: 1.65, fontSize: "0.95rem" }}>
                Configure em 5 minutos. Seu bot já pode estar respondendo clientes ainda hoje.
              </p>
              <div className="lp-cta-btns" style={{ position: "relative", display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center" }}>
                <Link href="/cadastro" className="lp-btn-primary" style={{ fontSize: "0.95rem", padding: "15px 32px" }}>
                  Criar conta grátis <ArrowRight />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "32px 24px" }}>
          <div className="lp-footer-inner" style={{ maxWidth: 1152, margin: "0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "1.05rem" }}>
              Entre<span className="lp-gt">net</span>
            </span>
            <div className="lp-footer-links" style={{ display: "flex", flexWrap: "wrap", gap: 22, alignItems: "center" }}>
              {[["Como funciona", "#como-funciona"], ["Funcionalidades", "#funcionalidades"], ["Preços", "#precos"]].map(([l, h]) => (
                <a key={l} href={h} style={{ color: "#475569", fontSize: "0.82rem", textDecoration: "none", transition: "color 0.2s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#94A3B8")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#475569")}>{l}</a>
              ))}
              <Link href="/login" style={{ color: "#475569", fontSize: "0.82rem", textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#94A3B8")}
                onMouseLeave={e => (e.currentTarget.style.color = "#475569")}>Entrar</Link>
            </div>
            <p style={{ color: "#1E293B", fontSize: "0.75rem" }}>© {new Date().getFullYear()} Entrenet. Todos os direitos reservados.</p>
          </div>
        </footer>

      </div>
    </>
  );
}
