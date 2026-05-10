"use client";

import TrueFocus from "./TrueFocus";
import autoriaData from "../data/autoria.json";

const TOTAL_PLS = (autoriaData as { totalPls: number }).totalPls;
const TOTAL_DEPS = (autoriaData as { totalDeputados: number }).totalDeputados;
const TOTAL_REGR = (autoriaData as { deputados: Array<{ regressivos?: number }> }).deputados
  .reduce((sum, d) => sum + (d.regressivos ?? 0), 0);

export default function Hero() {
  return (
    <section className="dark-section relative flex min-h-screen flex-col overflow-hidden">
      {/* Top meta bar */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-6 pt-8 md:px-12">
        <span className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-white/50 md:text-xs">
          [ Ininterrupta ]
        </span>
        <span className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-white/50 md:text-xs">
          [ Atualizado via APIs públicas ]
        </span>
      </div>

      {/* Main content */}
      <div className="flex flex-1 items-center px-6 md:px-12">
        <div className="w-full max-w-6xl">
          <p className="font-mono-data text-xs uppercase tracking-[0.3em] text-[var(--color-neon)]">
            [ Observatório Político ]
          </p>

          <h1
            className="mt-8 text-[clamp(2.5rem,7vw,6.5rem)] font-medium leading-[1.05] tracking-tight text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Todo mundo já sabe que{" "}
            <TrueFocus
              words={["violência", "assédio", "feminicídio", "abuso"]}
              intervalMs={2200}
              className="inline"
            />{" "}
            contra mulher é crime e um problema social grave no Brasil.
          </h1>

          <h2
            className="mt-6 text-[clamp(2rem,5vw,4.5rem)] font-medium leading-[1.1] tracking-tight text-[var(--color-neon)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Quem está fazendo algo
            <br />
            pra mudar?
          </h2>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-white/10 px-6 py-8 md:px-12">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <p className="max-w-xl text-sm leading-relaxed text-white/60 md:text-base">
            Dados públicos da Câmara dos Deputados, atualizados
            automaticamente.{" "}
            <strong className="text-white">{TOTAL_PLS.toLocaleString("pt-BR")} proposições. {TOTAL_DEPS} deputados. {TOTAL_REGR} regressivas expostas.</strong>
          </p>
          <div className="flex items-center gap-3">
            <span className="font-mono-data text-xs uppercase tracking-widest text-white/50">
              [ scroll ]
            </span>
            <div className="h-8 w-px animate-pulse bg-white/40" />
          </div>
        </div>
      </div>
    </section>
  );
}
