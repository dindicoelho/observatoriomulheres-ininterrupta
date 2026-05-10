"use client";

import { useState } from "react";
import ScrollFloat from "./ScrollFloat";

export default function LeadSection() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

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
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <section className="bg-[var(--color-blue)] px-6 py-20">
      <div className="mx-auto max-w-3xl text-center">
        <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-white/60">
          [ Fique por dentro ]
        </p>
        <ScrollFloat
          as="h2"
          text="Inscreva-se."
          stagger={40}
          className="mt-4 block text-3xl font-black leading-[0.9] md:text-5xl text-white"
        />

        <p className="mt-6 text-base leading-relaxed text-white/80 md:text-lg">
          Receba as atualizações mais relevantes do observatório direto
          no seu email — novas votações, novos projetos regressivos,
          mudanças no ranking. Sem spam, só dados.
        </p>

        {status === "done" ? (
          <div className="mt-8 rounded-xl bg-white/10 p-6">
            <p className="text-lg font-bold text-white">
              Inscrição confirmada.
            </p>
            <p className="mt-1 text-sm text-white/70">
              Você vai receber atualizações por email.
            </p>
          </div>
        ) : (
          <div className="mt-8 mx-auto flex max-w-lg flex-col gap-3 sm:flex-row">
            <input
              type="text"
              placeholder="Seu nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="flex-1 rounded-lg bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/50 backdrop-blur-sm focus:bg-white/15 focus:outline-none"
            />
            <input
              type="email"
              placeholder="Seu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              className="flex-1 rounded-lg bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/50 backdrop-blur-sm focus:bg-white/15 focus:outline-none"
            />
            <button
              onClick={submit}
              disabled={!email.includes("@") || status === "loading"}
              className="rounded-lg bg-white px-6 py-3 font-mono-data text-xs font-bold uppercase tracking-wider text-[var(--color-blue)] transition-colors hover:bg-white/90 disabled:opacity-50"
            >
              {status === "loading" ? "..." : "Inscrever"}
            </button>
          </div>
        )}
        {status === "error" && (
          <p className="mt-3 text-xs text-white/70">
            Erro ao inscrever. Tente novamente.
          </p>
        )}

        <p className="mt-6 text-[10px] text-white/40">
          Projeto da Ininterrupta. Seus dados não serão compartilhados.
        </p>
      </div>
    </section>
  );
}
