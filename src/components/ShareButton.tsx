"use client";

import { useState } from "react";

export default function ShareButton({
  path,
  title,
  dark = false,
}: {
  path: string;
  title: string;
  dark?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}${path}`
        : `https://mapa-violencia-mulher.vercel.app${path}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // cancelled
      }
    }

    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        return;
      } catch {
        // no permission
      }
    }

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
      window.prompt("Copie o link:", url);
    }
  };

  return (
    <button
      onClick={handleShare}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono-data text-[10px] uppercase tracking-wider transition-colors ${
        dark
          ? copied
            ? "bg-[var(--color-neon)] text-[var(--color-dark)]"
            : "border border-white/20 text-white/60 hover:border-white/40 hover:text-white"
          : copied
            ? "bg-[var(--color-blue)] text-white"
            : "border border-[var(--color-text-tertiary)]/30 text-[var(--color-text-tertiary)] hover:border-[var(--color-blue)]/40 hover:text-[var(--color-blue)]"
      }`}
      title={`Compartilhar: ${title}`}
    >
      {copied ? (
        "Link copiado ✓"
      ) : (
        <>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          Compartilhar
        </>
      )}
    </button>
  );
}
