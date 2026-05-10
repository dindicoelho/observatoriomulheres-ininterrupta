"use client";

import { useState, useEffect } from "react";

export default function LeadPopup() {
  const [show, setShow] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  useEffect(() => {
    // Mostrar só se nunca fechou/inscreveu
    const dismissed = localStorage.getItem("lead_popup_dismissed");
    if (!dismissed) {
      const timer = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem("lead_popup_dismissed", "true");
  };

  const submit = async () => {
    if (!email.includes("@")) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email }),
      });
      if (res.ok) {
        setStatus("done");
        localStorage.setItem("lead_popup_dismissed", "true");
        setTimeout(() => setShow(false), 2500);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--color-blue)]">
              [ Ininterrupta ]
            </p>
            <h3
              className="mt-3 text-2xl font-bold text-[var(--color-text)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Acompanhe de perto.
            </h3>
          </div>
          <button
            onClick={dismiss}
            className="flex-shrink-0 rounded-full bg-[var(--color-bg-alt)] p-2 hover:bg-gray-200"
            aria-label="Fechar"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">
          Inscreva-se pra receber a <strong>newsletter quinzenal
          da Ininterrupta</strong> — inteligência cultural, dados e
          análise política — e atualizações deste observatório antes
          da eleição de outubro.
        </p>

        {status === "done" ? (
          <div className="mt-6 rounded-xl bg-[var(--color-blue)]/5 p-4 text-center">
            <p className="text-sm font-bold text-[var(--color-blue)]">
              Inscrição confirmada.
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
              Você vai receber atualizações por email.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            <input
              type="text"
              placeholder="Seu nome (opcional)"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-[var(--color-bg-alt)] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-blue)] focus:outline-none"
            />
            <input
              type="email"
              placeholder="Seu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              className="w-full rounded-lg border border-gray-200 bg-[var(--color-bg-alt)] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-blue)] focus:outline-none"
            />
            <button
              onClick={submit}
              disabled={!email.includes("@") || status === "loading"}
              className="w-full rounded-lg bg-[var(--color-blue)] px-4 py-3 font-mono-data text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[var(--color-blue)]/90 disabled:opacity-50"
            >
              {status === "loading" ? "Inscrevendo..." : "Quero acompanhar"}
            </button>
            {status === "error" && (
              <p className="text-center text-xs text-red-600">
                Erro ao inscrever. Tente novamente.
              </p>
            )}
          </div>
        )}

        <p className="mt-4 text-center text-[10px] text-[var(--color-text-tertiary)]">
          Ao se inscrever, você recebe a newsletter quinzenal da{" "}
          <a
            href="https://instagram.com/ininterrupta.sys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-blue)] hover:underline"
          >
            Ininterrupta
          </a>{" "}
          + atualizações deste observatório. Cancele quando quiser.
        </p>
      </div>
    </div>
  );
}
