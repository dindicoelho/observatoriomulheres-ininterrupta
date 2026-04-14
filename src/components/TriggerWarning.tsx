"use client";

import { useState } from "react";

export default function TriggerWarning() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-6 backdrop-blur-sm">
      <div className="max-w-md border border-white/10 bg-[var(--color-dark)] p-10 text-left shadow-2xl">
        <p className="font-mono-data text-xs uppercase tracking-[0.3em] text-white/50">
          Aviso de conteúdo
        </p>

        <h2
          className="mt-6 text-3xl font-black leading-tight text-white"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Os números
          <br />
          <span className="text-[var(--color-blood)]">são reais.</span>
        </h2>

        <p className="mt-6 text-base leading-relaxed text-white/70">
          Este site apresenta dados sobre{" "}
          <strong className="text-white">feminicídio e violência contra a mulher</strong> no
          Brasil. O conteúdo pode ser impactante.
        </p>

        <p className="mt-4 text-sm text-white/60">
          Se você está em situação de violência, ligue{" "}
          <strong className="font-mono-data text-white">180</strong> (Central de
          Atendimento à Mulher).
        </p>

        <button
          onClick={() => setDismissed(true)}
          className="mt-8 w-full border border-white bg-white px-8 py-3 font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-dark)] transition-colors hover:bg-transparent hover:text-white"
        >
          Entendi, quero continuar
        </button>
      </div>
    </div>
  );
}
