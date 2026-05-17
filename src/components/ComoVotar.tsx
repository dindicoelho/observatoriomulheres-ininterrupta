"use client";

import ScrollFloat from "./ScrollFloat";

const STEPS = [
  {
    numero: "01",
    titulo: "Quem propõe as leis",
    texto:
      "Ranking dos deputados que mais apresentam projetos sobre direitos das mulheres — separando o que é proteção real do que é punitivismo ou retrocesso.",
    ancora: "#ato-01",
    cta: "Ir pro ranking ↓",
  },
  {
    numero: "02",
    titulo: "Quem representa seu estado",
    texto:
      "Mapa do Brasil com os 3 deputados que mais se destacam em cada estado. 5 UFs não elegeram nenhuma mulher pra Câmara nesta legislatura.",
    ancora: "#guia-estados",
    cta: "Ir pro mapa ↓",
  },
  {
    numero: "03",
    titulo: "O tipo de lei que é feita",
    texto:
      "Das mais de mil proposições, quantas viram lei? 76% estão paradas em comissão. Veja o funil legislativo e as curiosidades.",
    ancora: "#ato-02",
    cta: "Ver o funil ↓",
  },
  {
    numero: "04",
    titulo: "Como cada partido vota",
    texto:
      "As votações de mérito no plenário: o que foi decidido, qual foi o placar por partido, e o que significa cada voto. Tudo em linguagem acessível.",
    ancora: "#ato-03",
    cta: "Ir pras votações ↓",
  },
  {
    numero: "05",
    titulo: "Quem atua contra",
    texto:
      "Os parlamentares que assinam proposições regressivas — criminalização do aborto legal, armamentismo como resposta, sustação de resoluções que protegem crianças.",
    ancora: "#ato-04",
    cta: "Ver regressivas ↓",
  },
];

export default function ComoVotar() {
  return (
    <section className="bg-white px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="offset-left">
          <p className="mb-4 font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
            [ COMO USAR ESTE SITE ]
          </p>
          <ScrollFloat
            as="h2"
            text="Antes de"
            stagger={40}
            className="block text-3xl font-black leading-[0.9] md:text-5xl text-[var(--color-text)] lg:text-7xl"
          />
          <ScrollFloat
            as="h2"
            text="continuar."
            stagger={40}
            delay={400}
            className="block text-3xl font-black leading-[0.9] md:text-5xl text-[var(--color-blue)] lg:text-7xl"
          />
        </div>

        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-[var(--color-text-secondary)] md:text-xl">
          Abaixo você vai encontrar dados reais sobre quem propõe leis
          de proteção à mulher, como cada partido vota, quem atua contra
          e quem representa o seu estado. Tudo extraído direto da API da
          Câmara dos Deputados. Aqui está um guia rápido do que você vai
          ver:
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
            entre junho e agosto de 2026), os deputados candidatos à
            reeleição receberão um{" "}
            <span className="inline-block rounded-full bg-[var(--color-blue)] px-2 py-0.5 font-mono-data text-[8px] font-bold uppercase tracking-wider text-white">
              2026
            </span>{" "}
            no ranking. No mapa por estado, o top 3
            será filtrado pra mostrar{" "}
            <strong className="text-[var(--color-text)]">
              só quem pode ser votado
            </strong>
            . Assim você compara diretamente quem quer seu voto com o
            que essa pessoa fez nos últimos 4 anos.
          </p>
        </div>
      </div>
    </section>
  );
}
