"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError("Email ou senha incorretos.");
    } else {
      router.push("/dashboard");
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
          padding: 24px;
          position: relative;
          overflow: hidden;
        }
        .auth-blob-1 {
          position: absolute;
          width: 500px;
          height: 500px;
          background: rgba(245,158,11,0.1);
          border-radius: 50%;
          filter: blur(130px);
          top: -150px;
          right: -150px;
          pointer-events: none;
        }
        .auth-blob-2 {
          position: absolute;
          width: 350px;
          height: 350px;
          background: rgba(245,158,11,0.06);
          border-radius: 50%;
          filter: blur(110px);
          bottom: -100px;
          left: -100px;
          pointer-events: none;
        }
        .auth-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          backdrop-filter: blur(12px);
          padding: 36px 32px;
        }
        .auth-input {
          width: 100%;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          color: #fff;
          border-radius: 10px;
          padding: 11px 14px;
          font-size: 14px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }
        .auth-input::placeholder { color: rgba(255,255,255,0.25); }
        .auth-input:focus {
          border-color: #F59E0B;
          box-shadow: 0 0 0 3px rgba(245,158,11,0.12);
        }
        .auth-btn {
          width: 100%;
          background: #F59E0B;
          color: #0A0A0A;
          font-weight: 700;
          border-radius: 9999px;
          padding: 13px;
          font-size: 15px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          border: none;
          cursor: pointer;
          transition: box-shadow 0.25s, opacity 0.2s;
          letter-spacing: -0.01em;
        }
        .auth-btn:hover:not(:disabled) {
          box-shadow: 0 0 30px rgba(245,158,11,0.55), 0 0 60px rgba(245,158,11,0.2);
        }
        .auth-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .auth-brand-gradient {
          background: linear-gradient(135deg, #F59E0B, #FCD34D);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .auth-link {
          color: #F59E0B;
          text-decoration: none;
          transition: opacity 0.2s;
        }
        .auth-link:hover { opacity: 0.75; }
        .auth-error {
          color: #fca5a5;
          font-size: 13px;
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.18);
          border-radius: 10px;
          padding: 10px 14px;
        }
        .auth-divider {
          height: 1px;
          background: rgba(255,255,255,0.06);
          margin: 4px 0;
        }
      `}</style>

      <div className="auth-page">
        <div className="auth-blob-1" />
        <div className="auth-blob-2" />

        <div style={{ width: "100%", maxWidth: 400, position: "relative", zIndex: 1 }}>
          {/* Brand */}
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <Link href="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{
                width: 34, height: 34,
                background: "rgba(245,158,11,0.12)",
                border: "1px solid rgba(245,158,11,0.25)",
                borderRadius: 9,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M8.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3.5M15 3h6m0 0v6m0-6L10 14" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}>
                Entre<span className="auth-brand-gradient">net</span>
              </span>
            </Link>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, marginTop: 2 }}>
              Acesse sua conta
            </p>
          </div>

          {/* Card */}
          <form onSubmit={handleSubmit} className="auth-card">
            {error && (
              <div className="auth-error" style={{ marginBottom: 20 }}>{error}</div>
            )}

            <div style={{ marginBottom: 18 }}>
              <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, display: "block", marginBottom: 7, fontWeight: 500 }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
                className="auth-input"
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, display: "block", marginBottom: 7, fontWeight: 500 }}>
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="auth-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="auth-btn"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <p style={{ textAlign: "center", color: "rgba(255,255,255,0.35)", fontSize: 13, marginTop: 22 }}>
            Não tem conta?{" "}
            <Link href="/cadastro" className="auth-link">
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
