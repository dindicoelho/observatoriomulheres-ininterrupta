"use client";

import { useEffect, useState } from "react";
import MarqueeTicker from "./MarqueeTicker";

function DigitReveal({ digit, delay }: { digit: string; delay: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <span
      className="inline-block overflow-hidden"
      style={{ verticalAlign: "top" }}
    >
      <span
        className="inline-block transition-all duration-700"
        style={{
          transform: visible ? "translateY(0)" : "translateY(100%)",
          opacity: visible ? 1 : 0,
          transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {digit}
      </span>
    </span>
  );
}

export default function Hero() {
  const digits = "3.903".split("");

  return (
    <section className="dark-section relative flex min-h-screen flex-col overflow-hidden">
      {/* Top meta bar */}
      <div className="flex items-center justify-between px-6 pt-8 md:px-12">
        <span className="font-mono-data text-xs uppercase tracking-[0.2em] text-white/50">
          [ Brasil / 2023 ]
        </span>
        <span className="font-mono-data text-xs uppercase tracking-[0.2em] text-white/50">
          [ Fonte: Atlas da Violência ]
        </span>
      </div>

      {/* Number — asymmetric, massive */}
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-6xl">
          <div className="offset-left">
            <h1
              className="whitespace-nowrap leading-[0.85] text-[var(--color-blood)]"
              style={{
                fontFamily: "var(--font-display-condensed)",
                letterSpacing: "-0.05em",
                fontSize: "clamp(5rem, 24vw, 24rem)",
              }}
            >
              {digits.map((d, i) => (
                <DigitReveal key={i} digit={d} delay={300 + i * 120} />
              ))}
            </h1>
          </div>

          <div className="mt-8 max-w-2xl offset-right">
            <p
              className="text-2xl font-medium leading-tight text-white md:text-4xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              mulheres foram assassinadas.
            </p>
            <p
              className="mt-3 font-mono-data text-sm uppercase tracking-wider text-white/60"
            >
              [ uma a cada 2 horas e 15 minutos ]
            </p>
          </div>
        </div>
      </div>

      {/* Bottom marquee */}
      <div className="py-6">
        <MarqueeTicker
          dark
          duration={50}
          items={[
            <span key="1" className="text-white/40 font-mono-data text-sm uppercase tracking-wider">
              2023: 3.903 mulheres
            </span>,
            <span key="2" className="text-white/40 font-mono-data text-sm uppercase tracking-wider">
              2022: 3.806
            </span>,
            <span key="3" className="text-white/40 font-mono-data text-sm uppercase tracking-wider">
              2021: 3.858
            </span>,
            <span key="4" className="text-white/40 font-mono-data text-sm uppercase tracking-wider">
              2020: 3.913
            </span>,
            <span key="5" className="text-white/40 font-mono-data text-sm uppercase tracking-wider">
              2019: 3.739
            </span>,
            <span key="6" className="text-white/40 font-mono-data text-sm uppercase tracking-wider">
              2018: 4.074
            </span>,
          ]}
        />
      </div>

      {/* Prompt to scroll */}
      <div className="border-t border-white/10 px-6 py-6 md:px-12">
        <div className="flex items-center justify-end">
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
