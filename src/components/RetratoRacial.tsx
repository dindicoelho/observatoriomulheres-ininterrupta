"use client";

import { useEffect, useRef, useState } from "react";

// População feminina do Brasil por raça (IBGE, estimativas 2023)
// 56% negras (pretas + pardas), 44% não negras
const POP_NEGRAS = 56;
const POP_NAO_NEGRAS = 44;

// Vítimas de homicídio de mulheres 2023
const VITIMAS_NEGRAS = 68.2;
const VITIMAS_NAO_NEGRAS = 31.8;

function WaffleGrid({
  label,
  negras,
  naoNegras,
  totalDots = 100,
  delay = 0,
}: {
  label: string;
  negras: number;
  naoNegras: number;
  totalDots?: number;
  delay?: number;
}) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), delay);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [delay]);

  const negrasCount = Math.round((negras / 100) * totalDots);
  const dots = Array.from({ length: totalDots }, (_, i) => i);

  return (
    <div ref={ref} className="flex-1">
      <p className="mb-3 text-sm uppercase tracking-wider text-[var(--color-text-tertiary)]">
        {label}
      </p>
      <div className="grid grid-cols-10 gap-[3px]">
        {dots.map((i) => {
          const isNegra = i < negrasCount;
          return (
            <div
              key={i}
              className="aspect-square rounded-[2px] transition-all"
              style={{
                backgroundColor: visible
                  ? isNegra
                    ? "var(--color-blood)"
                    : "var(--color-neutral)"
                  : "#f0f0f0",
                transitionDelay: `${i * 8}ms`,
                transitionDuration: "300ms",
              }}
            />
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="flex items-center gap-2">
          <span
            className="h-3 w-3 rounded-sm"
            style={{ backgroundColor: "var(--color-blood)" }}
          />
          <span
            className="font-bold text-[var(--color-blood)]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {negras.toFixed(1)}%
          </span>
          <span className="text-[var(--color-text-secondary)]">negras</span>
        </span>
        <span className="flex items-center gap-2">
          <span
            className="h-3 w-3 rounded-sm"
            style={{ backgroundColor: "var(--color-neutral)" }}
          />
          <span
            className="font-bold text-[var(--color-text-secondary)]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {naoNegras.toFixed(1)}%
          </span>
          <span className="text-[var(--color-text-secondary)]">não negras</span>
        </span>
      </div>
    </div>
  );
}

export default function RetratoRacial() {
  const gap = VITIMAS_NEGRAS - POP_NEGRAS;

  return (
    <section className="bg-[var(--color-bg-alt)] px-6 py-24">
      <div className="mx-auto max-w-4xl">
        <h2
          className="text-center text-3xl font-bold leading-tight text-[var(--color-text)] md:text-4xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          A desproporção
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-lg text-[var(--color-text-secondary)]">
          Mulheres negras são {POP_NEGRAS}% da população feminina brasileira,
          mas{" "}
          <strong className="text-[var(--color-blood)]">
            {VITIMAS_NEGRAS}%
          </strong>{" "}
          das mulheres assassinadas em 2023.
        </p>

        <div className="mt-12 grid gap-10 md:grid-cols-2 md:gap-16">
          <WaffleGrid
            label="População feminina brasileira"
            negras={POP_NEGRAS}
            naoNegras={POP_NAO_NEGRAS}
            delay={0}
          />
          <WaffleGrid
            label="Mulheres assassinadas em 2023"
            negras={VITIMAS_NEGRAS}
            naoNegras={VITIMAS_NAO_NEGRAS}
            delay={400}
          />
        </div>

        {/* Gap indicator */}
        <div className="mx-auto mt-16 max-w-lg rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="text-sm uppercase tracking-wider text-[var(--color-text-tertiary)]">
            A diferença
          </p>
          <p
            className="mt-2 text-6xl font-black text-[var(--color-blood)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            +{gap.toFixed(1)}
          </p>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            pontos percentuais a mais de vítimas negras
            <br />
            do que a proporção da população.
          </p>
        </div>

        <p className="mt-10 text-center text-xs text-[var(--color-text-tertiary)]">
          Fontes: Atlas da Violência (IPEA/FBSP) séries 142 e 143 para vítimas;
          IBGE (PNAD 2023) para composição racial da população feminina.
        </p>
      </div>
    </section>
  );
}
