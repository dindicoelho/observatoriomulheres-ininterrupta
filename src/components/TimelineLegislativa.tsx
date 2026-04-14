"use client";

import { useState } from "react";
import legislativoData from "../data/legislativo.json";

type Proposicao = {
  id: number;
  tipo: string;
  numero: number;
  ano: number;
  ementa: string;
  data: string;
  categoria: "simbólica" | "incremental" | "estrutural";
};

type LegislativoJSON = {
  total: number;
  resumo: { simbólica: number; incremental: number; estrutural: number };
  porAno: Record<string, { simbólica: number; incremental: number; estrutural: number }>;
  proposicoes: Proposicao[];
};

const DATA = legislativoData as LegislativoJSON;

const CATEGORY_COLORS = {
  simbólica: "var(--color-neutral)",
  incremental: "var(--color-blue)",
  estrutural: "var(--color-teal)",
};

const CATEGORY_LABELS = {
  simbólica: "Simbólicas",
  incremental: "Incrementais",
  estrutural: "Estruturais",
};

const CATEGORY_DESC = {
  simbólica: "Datas comemorativas, homenagens, campanhas de conscientização.",
  incremental: "Alterações pontuais em leis existentes, ajustes de pena, mudanças procedimentais.",
  estrutural: "Criação de programas nacionais, fundos, políticas de Estado, pensões.",
};

export default function TimelineLegislativa() {
  const [filter, setFilter] = useState<
    "all" | "simbólica" | "incremental" | "estrutural"
  >("all");

  const years = Object.keys(DATA.porAno)
    .map(Number)
    .sort();

  const maxYearTotal = Math.max(
    ...years.map((y) => {
      const d = DATA.porAno[String(y)];
      return d.simbólica + d.incremental + d.estrutural;
    })
  );

  const percentSimbolica = (DATA.resumo.simbólica / DATA.total) * 100;
  const percentIncremental = (DATA.resumo.incremental / DATA.total) * 100;
  const percentEstrutural = (DATA.resumo.estrutural / DATA.total) * 100;

  // Highlight recent estruturais as examples
  const estruturaisRecentes = DATA.proposicoes
    .filter((p) => p.categoria === "estrutural")
    .slice(0, 3);

  const filteredProps = (filter === "all"
    ? DATA.proposicoes
    : DATA.proposicoes.filter((p) => p.categoria === filter)
  ).slice(0, 6);

  return (
    <section className="bg-white px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <h2
          className="text-center text-3xl font-bold leading-tight text-[var(--color-text)] md:text-4xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          O que o Congresso está fazendo
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-lg text-[var(--color-text-secondary)]">
          Em 7 anos, foram <strong>{DATA.total.toLocaleString("pt-BR")}</strong> proposições
          sobre violência contra a mulher no Congresso Nacional.
        </p>

        {/* Big stat */}
        <div className="mx-auto mt-12 max-w-3xl">
          <p className="mb-4 text-center text-sm uppercase tracking-wider text-[var(--color-text-tertiary)]">
            Classificação por tipo
          </p>
          {/* Big bar */}
          <div className="flex h-16 w-full overflow-hidden rounded-xl">
            <div
              className="flex items-center justify-center text-sm font-bold text-white"
              style={{
                width: `${percentIncremental}%`,
                backgroundColor: CATEGORY_COLORS.incremental,
              }}
            >
              {percentIncremental.toFixed(1)}%
            </div>
            <div
              className="flex items-center justify-center text-xs font-bold text-white"
              style={{
                width: `${percentEstrutural}%`,
                backgroundColor: CATEGORY_COLORS.estrutural,
              }}
            >
              {percentEstrutural.toFixed(1)}%
            </div>
            <div
              className="flex items-center justify-center text-xs font-bold text-white"
              style={{
                width: `${percentSimbolica}%`,
                backgroundColor: CATEGORY_COLORS.simbólica,
              }}
            >
              {percentSimbolica > 2 ? `${percentSimbolica.toFixed(1)}%` : ""}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            {(["incremental", "estrutural", "simbólica"] as const).map(
              (cat) => (
                <div
                  key={cat}
                  className="rounded-lg bg-[var(--color-bg-alt)] p-4"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-sm"
                      style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                    />
                    <span className="font-bold">{CATEGORY_LABELS[cat]}</span>
                    <span
                      className="ml-auto font-bold"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {DATA.resumo[cat]}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                    {CATEGORY_DESC[cat]}
                  </p>
                </div>
              )
            )}
          </div>
        </div>

        {/* Insight */}
        <div className="mx-auto mt-10 max-w-2xl text-center">
          <p className="text-xl font-medium leading-relaxed text-[var(--color-text)]">
            <strong className="text-[var(--color-blue)]">
              {percentIncremental.toFixed(0)}%
            </strong>{" "}
            são alterações pontuais em leis que já existem.
            <br />
            Apenas{" "}
            <strong className="text-[var(--color-teal)]">
              {percentEstrutural.toFixed(0)}%
            </strong>{" "}
            criam programas, fundos ou políticas novas.
          </p>
        </div>

        {/* Timeline by year */}
        <div className="mt-16">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">
            Proposições por ano
          </h3>
          <div className="space-y-3">
            {years.map((year) => {
              const d = DATA.porAno[String(year)];
              const total = d.simbólica + d.incremental + d.estrutural;
              const widthPercent = (total / maxYearTotal) * 100;
              return (
                <div key={year} className="flex items-center gap-3">
                  <span
                    className="w-12 flex-shrink-0 text-sm text-[var(--color-text-tertiary)]"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {year}
                  </span>
                  <div className="flex-1">
                    <div
                      className="flex h-6 overflow-hidden rounded"
                      style={{ width: `${widthPercent}%`, minWidth: "40px" }}
                    >
                      <div
                        style={{
                          width: `${(d.incremental / total) * 100}%`,
                          backgroundColor: CATEGORY_COLORS.incremental,
                        }}
                      />
                      <div
                        style={{
                          width: `${(d.estrutural / total) * 100}%`,
                          backgroundColor: CATEGORY_COLORS.estrutural,
                        }}
                      />
                      <div
                        style={{
                          width: `${(d.simbólica / total) * 100}%`,
                          backgroundColor: CATEGORY_COLORS.simbólica,
                        }}
                      />
                    </div>
                  </div>
                  <span
                    className="w-10 text-right text-sm font-bold"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {total}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Proposal list */}
        <div className="mt-16">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">
              Exemplos recentes
            </h3>
            <div className="flex flex-wrap gap-2">
              {(["all", "simbólica", "incremental", "estrutural"] as const).map(
                (f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`rounded-full px-3 py-1 text-xs transition-colors ${
                      filter === f
                        ? "bg-[var(--color-text)] text-white"
                        : "bg-[var(--color-bg-alt)] text-[var(--color-text-secondary)] hover:bg-gray-200"
                    }`}
                  >
                    {f === "all" ? "Todas" : CATEGORY_LABELS[f]}
                  </button>
                )
              )}
            </div>
          </div>

          <ul className="space-y-3">
            {filteredProps.map((p) => (
              <li
                key={p.id}
                className="rounded-lg border border-gray-100 bg-white p-4 transition-colors hover:bg-[var(--color-bg-alt)]"
              >
                <div className="flex items-start gap-3">
                  <span
                    className="flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-bold text-white"
                    style={{
                      backgroundColor: CATEGORY_COLORS[p.categoria],
                    }}
                  >
                    {CATEGORY_LABELS[p.categoria].slice(0, -1)}
                  </span>
                  <div className="flex-1">
                    <p
                      className="text-sm font-bold"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {p.tipo} {p.numero}/{p.ano}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                      {p.ementa.length > 220
                        ? p.ementa.slice(0, 220) + "…"
                        : p.ementa}
                    </p>
                    <a
                      href={`https://www.camara.leg.br/propostas-legislativas/${p.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-xs text-[var(--color-blue)] hover:underline"
                    >
                      Ver na Câmara →
                    </a>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-10 text-center text-xs text-[var(--color-text-tertiary)]">
          Fonte: API de Dados Abertos da Câmara dos Deputados.
          Busca por &ldquo;feminicídio&rdquo;, &ldquo;Maria da Penha&rdquo;,
          &ldquo;violência contra mulher&rdquo; e &ldquo;violência doméstica&rdquo;
          entre 2019 e 2026. Classificação automática por análise de ementa.
        </p>
      </div>
    </section>
  );
}
