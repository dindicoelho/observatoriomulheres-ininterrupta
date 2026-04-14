"use client";

import { useEffect, useRef, useState } from "react";
import RevealText from "./RevealText";

const POP_NEGRAS = 56;
const POP_NAO_NEGRAS = 44;
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
      <p className="mb-4 font-mono-data text-xs uppercase tracking-[0.2em] text-white/50">
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
                    : "rgba(255,255,255,0.15)"
                  : "rgba(255,255,255,0.05)",
                transitionDelay: `${i * 10}ms`,
                transitionDuration: "400ms",
              }}
            />
          );
        })}
      </div>
      <div className="mt-5 flex items-center justify-between text-sm">
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
          <span className="text-white/60">negras</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-white/15" />
          <span
            className="font-bold text-white/80"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {naoNegras.toFixed(1)}%
          </span>
          <span className="text-white/60">não negras</span>
        </span>
      </div>
    </div>
  );
}

export default function RetratoRacial() {
  const gap = VITIMAS_NEGRAS - POP_NEGRAS;

  return (
    <section className="dark-section px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="offset-left">
          <p className="mb-4 font-mono-data text-xs uppercase tracking-[0.2em] text-white/50">
            [ ATO 02 / A DESPROPORÇÃO ]
          </p>
          <RevealText
            as="h2"
            text="A desproporção"
            stagger={40}
            className="text-5xl font-black leading-none text-white md:text-7xl"
          />
        </div>

        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70 md:text-xl offset-right">
          Mulheres negras são {POP_NEGRAS}% da população feminina brasileira,
          mas{" "}
          <strong className="text-[var(--color-blood)]">
            {VITIMAS_NEGRAS}%
          </strong>{" "}
          das mulheres assassinadas em 2023.
        </p>

        <div className="mt-16 grid gap-10 md:grid-cols-2 md:gap-16">
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

        {/* Gap — big asymmetric number */}
        <div className="mt-24 md:mt-32">
          <div className="border-t border-white/10 pt-12">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between md:gap-12">
              <div className="md:w-1/3">
                <p className="font-mono-data text-xs uppercase tracking-[0.2em] text-white/50">
                  A diferença
                </p>
                <p className="mt-4 max-w-sm text-base leading-relaxed text-white/70">
                  pontos percentuais a mais de vítimas negras do que a
                  proporção da população.
                </p>
              </div>
              <div className="mt-8 md:mt-0 md:w-2/3 offset-right">
                <p
                  className="leading-none text-[var(--color-blood)]"
                  style={{
                    fontFamily: "var(--font-display-condensed)",
                    letterSpacing: "-0.05em",
                    fontSize: "clamp(8rem, 20vw, 20rem)",
                  }}
                >
                  +{gap.toFixed(1)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-16 font-mono-data text-xs text-white/40">
          Fontes: Atlas da Violência (IPEA/FBSP) séries 142 e 143 · IBGE/PNAD 2023
        </p>
      </div>
    </section>
  );
}
