"use client";

import { useState } from "react";

export default function TriggerWarning() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6 backdrop-blur-sm">
      <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
        <p className="text-sm uppercase tracking-wider text-[var(--color-text-tertiary)]">
          Aviso de conteúdo
        </p>
        <p className="mt-4 text-base leading-relaxed text-[var(--color-text)]">
          Este site apresenta dados sobre{" "}
          <strong>feminicídio e violência contra a mulher</strong> no Brasil.
          Os números são reais. O conteúdo pode ser impactante.
        </p>
        <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
          Se você está em situação de violência, ligue{" "}
          <strong>180</strong> (Central de Atendimento a Mulher).
        </p>
        <button
          onClick={() => setDismissed(true)}
          className="mt-6 rounded-full bg-[var(--color-text)] px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--color-text)]/80"
        >
          Entendi, quero continuar
        </button>
      </div>
    </div>
  );
}
