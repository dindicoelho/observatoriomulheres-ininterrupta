"use client";

import AnimatedNumber from "./AnimatedNumber";

export default function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="max-w-3xl">
        <p className="mb-6 text-sm uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
          Brasil, 2023
        </p>

        <h1 className="text-[clamp(4rem,12vw,9rem)] font-black leading-[0.9] text-[var(--color-blood)]">
          <AnimatedNumber value={3903} />
        </h1>

        <p className="mt-6 text-xl font-medium leading-relaxed text-[var(--color-text)] md:text-2xl">
          mulheres foram assassinadas.
        </p>

        <p className="mt-4 text-lg leading-relaxed text-[var(--color-text-secondary)] md:text-xl">
          Uma a cada 2 horas e 15 minutos.
        </p>

        <div className="mx-auto mt-16 max-w-md">
          <p className="text-base leading-relaxed text-[var(--color-text-tertiary)]">
            Mas esse numero esconde uma historia
            <br />
            que quase ninguem conta.
          </p>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-12 flex flex-col items-center gap-2">
        <span className="text-xs tracking-widest uppercase text-[var(--color-text-tertiary)]">
          scroll
        </span>
        <div className="h-8 w-px animate-pulse bg-[var(--color-neutral)]" />
      </div>
    </section>
  );
}
