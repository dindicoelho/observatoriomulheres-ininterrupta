"use client";

import Link from "next/link";
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

        <div className="mt-10 rounded-2xl bg-[var(--color-dark)] p-8 text-white md:p-10">
          <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--color-neon)]">
            [ Carta da autora · Sobre este projeto ]
          </p>

          <div className="mt-6 max-w-2xl text-base leading-relaxed text-white/90 md:text-lg">
            <p>
              Esse site é o que eu consegui fazer com o que sei. Sou
              comunicadora e creative technologist, entendo muito
              mais de comunicação do que de política — e o que sei
              fazer é usar IA pra cruzar
              21 mil proposições e traduzir o juridiquês em algo
              que cabe no celular antes de você entrar na cabine.{" "}
              <strong className="text-white">
                Não substitui o trabalho de coletivos, ONGs e
                organizações que atuam diretamente com a pauta — é
                mais um meio de informação.
              </strong>{" "}
              E honestamente: tem muita gente que acha que eu nem
              deveria ter feito isso, por não ser especialista
              política nem organização constituída.
            </p>

            <details className="group mt-5">
              <summary className="flex cursor-pointer list-none items-center gap-2 font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--color-neon)] hover:underline [&::-webkit-details-marker]:hidden">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--color-neon)] text-sm font-bold leading-none transition-transform group-open:rotate-45">
                  +
                </span>
                <span className="group-open:hidden">Ler carta completa</span>
                <span className="hidden group-open:inline">Fechar</span>
              </summary>
              <div className="mt-4 space-y-4">
                <p>
                  Eu falo aqui do lugar de cidadã, dentro de um
                  ecossistema complexo da política brasileira — mulher
                  LGBTQIAP+ ocupando um espaço que normalmente pede
                  credencial pra entrar. Porque{" "}
                  <strong className="text-white">
                    o medo de fazer as coisas &ldquo;do jeito errado&rdquo;
                    é o que mais trava a gente de fazer as coisas que
                    importam.
                  </strong>{" "}
                  Esperar a permissão certa, o título certo, o instituto
                  certo, é uma forma educada de não fazer nada.
                </p>
                <p>
                  <strong className="text-white">
                    Esse projeto não tem fins lucrativos e não precisa
                    ficar do jeito que está.
                  </strong>{" "}
                  Está à disposição da sociedade para evoluir para
                  caminhos mais potentes — e acredito de verdade que
                  mais gente disposta a pesquisar política e
                  compartilhar é um desses caminhos. Se você
                  compartilhar, vira coisa de mais gente. E mais gente
                  votando informada é o único jeito que eu conheço de
                  fazer um Congresso melhor.
                </p>
              </div>
            </details>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
            <p className="font-mono-data text-[11px] uppercase tracking-[0.15em] text-white/60">
              — Dindi ·{" "}
              <a
                href="https://instagram.com/ininterrupta.sys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-neon)] hover:underline"
              >
                @ininterrupta.sys
              </a>
            </p>
            <Link
              href="/metodologia"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-neon)] px-5 py-2.5 font-mono-data text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-dark)] transition-transform hover:scale-105"
            >
              Ler metodologia →
            </Link>
          </div>
        </div>

        <p className="mt-12 max-w-2xl text-lg leading-relaxed text-[var(--color-text-secondary)] md:text-xl">
          Abaixo você vai encontrar dados reais sobre quem propõe leis
          de proteção à mulher, como cada partido vota, quem atua contra
          e quem representa o seu estado. Tudo extraído direto da API da
          Câmara dos Deputados. Aqui está um guia rápido do que você vai
          ver:
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
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
      </div>
    </section>
  );
}
