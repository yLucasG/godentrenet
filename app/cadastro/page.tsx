"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerUser } from "@/actions/auth";
import type { StoreType } from "@prisma/client";

const STORE_TYPES: { value: StoreType; label: string; icon: string; desc: string }[] = [
  { value: "FOOD",      label: "Alimentação",           icon: "🍔", desc: "Restaurante, lanchonete, padaria" },
  { value: "RETAIL",    label: "Varejo / Roupas",        icon: "🛍️", desc: "Loja de roupas, calçados, acessórios" },
  { value: "SERVICES",  label: "Serviços / Agendamentos",icon: "📅", desc: "Salão, barbearia, estética" },
  { value: "GAS_WATER", label: "Água e Gás",             icon: "💧", desc: "Distribuidora de água e gás" },
  { value: "GENERAL",   label: "Outros",                 icon: "🏪", desc: "Outro tipo de negócio" },
];

export default function CadastroPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [storeType, setStoreType] = useState<StoreType>("GENERAL");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("Senha deve ter pelo menos 6 caracteres."); return; }
    setLoading(true);
    try {
      await registerUser(name, email, password, storeType);
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        setError("Conta criada, mas erro ao entrar. Tente fazer login.");
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
        .auth-page {
          background: #0A0A0A;
          min-height: 100vh;
          font-family: 'Plus Jakarta Sans', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 24px;
          position: relative;
          overflow: hidden;
        }
        .auth-blob-1 {
          position: absolute; width: 500px; height: 500px;
          background: rgba(245,158,11,0.1); border-radius: 50%;
          filter: blur(130px); top: -150px; right: -150px; pointer-events: none;
        }
        .auth-blob-2 {
          position: absolute; width: 350px; height: 350px;
          background: rgba(245,158,11,0.06); border-radius: 50%;
          filter: blur(110px); bottom: -100px; left: -100px; pointer-events: none;
        }
        .auth-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px; backdrop-filter: blur(12px); padding: 36px 32px;
        }
        .auth-input {
          width: 100%; background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1); color: #fff;
          border-radius: 10px; padding: 11px 14px; font-size: 14px;
          font-family: 'Plus Jakarta Sans', sans-serif; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s; box-sizing: border-box;
        }
        .auth-input::placeholder { color: rgba(255,255,255,0.25); }
        .auth-input:focus { border-color: #F59E0B; box-shadow: 0 0 0 3px rgba(245,158,11,0.12); }
        .auth-btn {
          width: 100%; background: #F59E0B; color: #0A0A0A; font-weight: 700;
          border-radius: 9999px; padding: 13px; font-size: 15px;
          font-family: 'Plus Jakarta Sans', sans-serif; border: none; cursor: pointer;
          transition: box-shadow 0.25s, opacity 0.2s; letter-spacing: -0.01em;
        }
        .auth-btn:hover:not(:disabled) { box-shadow: 0 0 30px rgba(245,158,11,0.55), 0 0 60px rgba(245,158,11,0.2); }
        .auth-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .auth-brand-gradient {
          background: linear-gradient(135deg, #F59E0B, #FCD34D);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .auth-link { color: #F59E0B; text-decoration: none; transition: opacity 0.2s; }
        .auth-link:hover { opacity: 0.75; }
        .auth-error {
          color: #fca5a5; font-size: 13px; background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.18); border-radius: 10px; padding: 10px 14px;
        }
        .type-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .type-option {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 12px 14px; border-radius: 14px; cursor: pointer;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          transition: border-color 0.2s, background 0.2s;
        }
        .type-option:hover { border-color: rgba(245,158,11,0.3); background: rgba(245,158,11,0.04); }
        .type-option.selected { border-color: rgba(245,158,11,0.5); background: rgba(245,158,11,0.08); }
        .type-option input[type="radio"] { display: none; }
        .type-icon { font-size: 20px; line-height: 1; margin-top: 2px; flex-shrink: 0; }
        .type-label { font-size: 13px; font-weight: 600; color: #fff; line-height: 1.3; }
        .type-desc { font-size: 11px; color: rgba(255,255,255,0.35); margin-top: 2px; }
        .type-radio-dot {
          width: 14px; height: 14px; border-radius: 50%; flex-shrink: 0; margin-top: 3px;
          border: 2px solid rgba(255,255,255,0.2); transition: border-color 0.2s, background 0.2s;
        }
        .type-option.selected .type-radio-dot { border-color: #F59E0B; background: #F59E0B; }
      `}</style>

      <div className="auth-page">
        <div className="auth-blob-1" />
        <div className="auth-blob-2" />

        <div style={{ width: "100%", maxWidth: 460, position: "relative", zIndex: 1 }}>
          {/* Brand */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{
                width: 34, height: 34, background: "rgba(245,158,11,0.12)",
                border: "1px solid rgba(245,158,11,0.25)", borderRadius: 9,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M8.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3.5M15 3h6m0 0v6m0-6L10 14" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}>
                Entre<span className="auth-brand-gradient">net</span>
              </span>
            </div>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, marginTop: 2 }}>
              Crie sua conta e comece a usar
            </p>
          </div>

          {/* Card */}
          <form onSubmit={handleSubmit} className="auth-card">
            {error && <div className="auth-error" style={{ marginBottom: 20 }}>{error}</div>}

            <div style={{ marginBottom: 16 }}>
              <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, display: "block", marginBottom: 7, fontWeight: 500 }}>
                Nome da loja
              </label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required
                placeholder="Ex: Padaria do João" className="auth-input" />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, display: "block", marginBottom: 7, fontWeight: 500 }}>
                Email
              </label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="seu@email.com" className="auth-input" />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, display: "block", marginBottom: 7, fontWeight: 500 }}>
                Senha
              </label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="Mínimo 6 caracteres" className="auth-input" />
            </div>

            {/* Store type */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, display: "block", marginBottom: 10, fontWeight: 500 }}>
                Tipo de negócio
              </label>
              <div className="type-grid">
                {STORE_TYPES.map(opt => (
                  <label
                    key={opt.value}
                    className={`type-option${storeType === opt.value ? " selected" : ""}`}
                    onClick={() => setStoreType(opt.value)}
                  >
                    <input type="radio" name="storeType" value={opt.value} checked={storeType === opt.value} onChange={() => setStoreType(opt.value)} />
                    <span className="type-icon">{opt.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div className="type-label">{opt.label}</div>
                      <div className="type-desc">{opt.desc}</div>
                    </div>
                    <span className="type-radio-dot" />
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading || !name || !email || !password} className="auth-btn">
              {loading ? "Criando conta..." : "Criar conta"}
            </button>
          </form>

          <p style={{ textAlign: "center", color: "rgba(255,255,255,0.35)", fontSize: 13, marginTop: 22 }}>
            Já tem conta?{" "}
            <Link href="/login" className="auth-link">Entrar</Link>
          </p>
        </div>
      </div>
    </>
  );
}
