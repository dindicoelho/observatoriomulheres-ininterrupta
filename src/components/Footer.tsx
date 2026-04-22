"use client";

import Link from "next/link";
import { useState } from "react";

export default function Footer() {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = typeof window !== "undefined"
      ? window.location.origin
      : "https://mapa-violencia-mulher.vercel.app";
    const title = "Observatório Político da Violência contra a Mulher";

    // 1. Tentar Web Share API (mobile + navegadores que suportam)
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // Usuário cancelou ou falhou — segue pro fallback
      }
    }

    // 2. Tentar clipboard
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        return;
      } catch {
        // Sem permissão — segue pro fallback
      }
    }

    // 3. Fallback: execCommand (funciona em mais contextos)
    try {
      const input = document.createElement("input");
      input.value = url;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Último recurso: abrir prompt
      window.prompt("Copie o link:", url);
    }
  };

  return (
    <footer className="bg-[var(--color-dark)] px-6 py-24 text-white">
      <div className="mx-auto max-w-3xl">
        {/* CTA */}
        <div className="mb-10 offset-left">
          <p className="mb-4 font-mono-data text-xs uppercase tracking-[0.2em] text-white/50">
            [ ENCERRAMENTO ]
          </p>
          <h2
            className="text-3xl font-medium leading-[1.1] md:text-5xl lg:text-6xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Agora você sabe.
            <br />
            <span className="text-[var(--color-neon)]">
              O que vai fazer com isso?
            </span>
          </h2>
        </div>

        <p className="mt-8 max-w-2xl text-base leading-relaxed text-white/70 md:text-lg">
          Este site é atualizado automaticamente toda vez que a Câmara
          publica algo novo. Salve nos favoritos — e mande pra quem
          precisa ver antes de outubro.
        </p>

        {/* Actions */}
        <div className="mt-10 flex flex-wrap gap-3">
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-neon)] px-6 py-3 font-mono-data text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-dark)] transition-transform hover:scale-105"
          >
            {copied ? "Link copiado ✓" : "Compartilhar site"}
          </button>
          <Link
            href="/metodologia"
            className="inline-block rounded-full border border-white/20 px-6 py-3 font-mono-data text-xs uppercase tracking-[0.2em] text-white/70 transition-colors hover:border-white hover:text-white"
          >
            Ler metodologia →
          </Link>
        </div>

        {/* Divider */}
        <hr className="my-16 border-white/10" />

        {/* Denúncia — discreta */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
          <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-white/40">
            [ Em situação de violência ]
          </p>
          <div className="mt-3 flex flex-wrap items-baseline gap-x-6 gap-y-2 text-sm">
            <span>
              <strong className="font-mono-data text-lg text-[var(--color-neon)]">
                180
              </strong>{" "}
              <span className="text-white/70">
                Central de Atendimento à Mulher · gratuito · 24h
              </span>
            </span>
            <span>
              <strong className="font-mono-data text-lg text-[var(--color-neon)]">
                190
              </strong>{" "}
              <span className="text-white/70">
                Polícia Militar · risco imediato
              </span>
            </span>
          </div>
        </div>

        {/* Credits */}
        <div className="mt-12 text-center text-xs text-white/30">
          <p>
            Dados extraídos das APIs públicas da Câmara dos Deputados e
            do Atlas da Violência (IPEA/FBSP). Atualização automática.
          </p>
          <p className="mt-1">
            Observatório independente, sem fins lucrativos e sem
            financiamento. Publicado pela Ininterrupta.
          </p>
        </div>
      </div>
    </footer>
  );
}
