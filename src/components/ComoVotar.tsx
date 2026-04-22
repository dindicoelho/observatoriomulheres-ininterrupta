"use client";

import ScrollFloat from "./ScrollFloat";

const STEPS = [
  {
    numero: "01",
    titulo: "Encontre seu estado",
    texto:
      "No mapa acima, clique no seu estado e veja quem são os 3 deputados que mais atuam em políticas de proteção à mulher na sua região.",
    ancora: "#guia-estados",
    cta: "Ir pro mapa",
  },
  {
    numero: "02",
    titulo: "Confira quem propõe",
    texto:
      "No ranking do Ato 01, veja quem tem mais projetos estruturais — e clique pra ver se são protetivos, punitivistas ou regressivos.",
    ancora: "#ato-01",
    cta: "Ver ranking",
  },
  {
    numero: "03",
    titulo: "Veja como votam",
    texto:
      "No Ato 02, entenda as votações de mérito e veja o placar por partido. O voto nominal é público — confira o do seu deputado.",
    ancora: "#ato-02",
    cta: "Ver votações",
  },
  {
    numero: "04",
    titulo: "Saiba quem atua contra",
    texto:
      "No Ato 03, descubra os 62 parlamentares que assinam proposições regressivas — criminalização do aborto legal, armamentismo, sustação de resoluções protetivas.",
    ancora: "#ato-03",
    cta: "Ver regressivas",
  },
];

export default function ComoVotar() {
  return (
    <section className="bg-white px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="offset-left">
          <p className="mb-4 font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
            [ GUIA DE VOTO · OUTUBRO 2026 ]
          </p>
          <ScrollFloat
            as="h2"
            text="O que fazer"
            stagger={40}
            className="block text-3xl font-black leading-[0.9] md:text-5xl text-[var(--color-text)] lg:text-7xl"
          />
          <ScrollFloat
            as="h2"
            text="com essa informação."
            stagger={40}
            delay={400}
            className="block text-3xl font-black leading-[0.9] md:text-5xl text-[var(--color-blue)] lg:text-7xl"
          />
        </div>

        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-[var(--color-text-secondary)] md:text-xl">
          Este observatório existe pra você chegar na urna sabendo quem
          fez o quê. Não é sobre esquerda ou direita — é sobre quem
          propôs lei que protege e quem assinou lei que retira direitos.
          4 passos pra usar antes de votar:
        </p>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {STEPS.map((s) => (
            <a
              key={s.numero}
              href={s.ancora}
              className="group rounded-2xl border border-gray-200 bg-[var(--color-bg-alt)] p-6 transition-colors hover:border-[var(--color-blue)]/40 hover:bg-[var(--color-blue)]/5"
            >
              <div className="flex items-start gap-4">
                <span
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-blue)] font-mono-data text-sm font-bold text-white"
                >
                  {s.numero}
                </span>
                <div className="flex-1">
                  <h3
                    className="text-lg font-bold text-[var(--color-text)]"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {s.titulo}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                    {s.texto}
                  </p>
                  <p className="mt-3 font-mono-data text-[10px] uppercase tracking-wider text-[var(--color-blue)] group-hover:underline">
                    {s.cta} →
                  </p>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* TSE notice */}
        <div className="mt-10 rounded-xl border border-[var(--color-blue)]/20 bg-[var(--color-blue)]/5 p-5">
          <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--color-blue)]">
            [ Candidaturas 2026 ]
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
            Quando o TSE publicar a lista oficial de candidatos (previsto
            entre junho e agosto de 2026), o ranking e o mapa serão
            filtrados automaticamente para mostrar{" "}
            <strong className="text-[var(--color-text)]">
              apenas quem está concorrendo à reeleição
            </strong>
            . Assim você compara diretamente quem quer seu voto com o
            que essa pessoa fez nos últimos 4 anos.
          </p>
        </div>
      </div>
    </section>
  );
}
