"use client";

export default function Hero() {
  return (
    <section className="dark-section relative flex min-h-screen flex-col overflow-hidden">
      {/* Top meta bar */}
      <div className="flex items-center justify-between px-6 pt-8 md:px-12">
        <span className="font-mono-data text-xs uppercase tracking-[0.2em] text-white/50">
          [ Ininterrupta ]
        </span>
        <span className="font-mono-data text-xs uppercase tracking-[0.2em] text-white/50">
          [ Atualizado via APIs públicas ]
        </span>
      </div>

      {/* Main content */}
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-4xl">
          <p className="font-mono-data text-xs uppercase tracking-[0.3em] text-[var(--color-neon)]">
            [ Observatório Político ]
          </p>

          <h1
            className="mt-6 text-3xl font-medium leading-[1.1] text-white md:text-5xl lg:text-6xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Todo mundo já sabe que violência contra mulher é um problema
            grave no Brasil.{" "}
            <span className="text-[var(--color-neon)]">
              A pergunta é: quem está fazendo algo pra mudar?
            </span>
          </h1>

          <p className="mt-8 max-w-2xl text-base leading-relaxed text-white/70 md:text-lg">
            Este observatório rastreia automaticamente o que a Câmara dos
            Deputados produz sobre o tema — quem propõe, quem vota, que
            tipo de política sai. Tudo com dados públicos, atualizáveis,
            verificáveis. O objetivo é te dar o que precisa{" "}
            <strong className="text-white">antes de votar em outubro</strong>.
          </p>

          {/* 3 quick actions */}
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            <a
              href="#ato-01"
              className="group rounded-lg border border-white/10 bg-white/[0.03] p-5 transition-all hover:border-[var(--color-neon)]/50 hover:bg-white/[0.06]"
            >
              <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--color-neon)]">
                [ 01 ]
              </p>
              <p className="mt-2 text-base font-medium text-white">
                Descubra quem propõe o quê
              </p>
              <p className="mt-1 text-sm text-white/50">
                Ranking dos deputados que mais legislam sobre o tema.
              </p>
            </a>

            <a
              href="#ato-02"
              className="group rounded-lg border border-white/10 bg-white/[0.03] p-5 transition-all hover:border-[var(--color-neon)]/50 hover:bg-white/[0.06]"
            >
              <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--color-neon)]">
                [ 02 ]
              </p>
              <p className="mt-2 text-base font-medium text-white">
                Veja como cada partido vota
              </p>
              <p className="mt-1 text-sm text-white/50">
                Votações reais com posição de cada parlamentar.
              </p>
            </a>

            <a
              href="#guia"
              className="group rounded-lg border border-white/10 bg-white/[0.03] p-5 transition-all hover:border-[var(--color-neon)]/50 hover:bg-white/[0.06]"
            >
              <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--color-neon)]">
                [ Guia ]
              </p>
              <p className="mt-2 text-base font-medium text-white">
                Saiba quem votou contra
              </p>
              <p className="mt-1 text-sm text-white/50">
                Lista de deputados que rejeitaram proteção.
              </p>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-white/10 px-6 py-5 md:px-12">
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-white/40">
          <p className="font-mono-data uppercase tracking-wider">
            Dados: Câmara dos Deputados · Atlas da Violência · IBGE
          </p>
          <div className="flex items-center gap-3">
            <span className="font-mono-data uppercase tracking-widest">
              [ scroll ]
            </span>
            <div className="h-6 w-px animate-pulse bg-white/40" />
          </div>
        </div>
      </div>
    </section>
  );
}
