"use client";

import { useState } from "react";
import legislativoData from "../data/legislativo.json";
import RevealText from "./RevealText";

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
  destino_stats?: {
    total: number;
    por_categoria: {
      aprovada: number;
      no_senado: number;
      pronta: number;
      sem_relator: number;
      tramitando: number;
      arquivada: number;
    };
    categorias_labels: Record<string, string>;
  };
};

const DATA = legislativoData as LegislativoJSON;

const CATEGORY_COLORS = {
  simbólica: "#6B6B64",
  incremental: "#3B82D4",
  estrutural: "#1DB389",
};

const CATEGORY_LABELS = {
  simbólica: "Simbólicas",
  incremental: "Incrementais",
  estrutural: "Estruturais",
};

const CATEGORY_LABEL_SINGULAR = {
  simbólica: "Simbólica",
  incremental: "Incremental",
  estrutural: "Estrutural",
};

const CATEGORY_DESC = {
  simbólica: "Datas comemorativas, homenagens, campanhas de conscientização.",
  incremental: "Alterações pontuais em leis existentes, ajustes de pena, mudanças procedimentais.",
  estrutural: "Criação de programas nacionais, fundos, políticas de Estado, pensões.",
};

export default function TimelineLegislativa() {
  const [filter, setFilter] = useState<"all" | "simbólica" | "incremental" | "estrutural">("all");

  const years = Object.keys(DATA.porAno).map(Number).sort();
  const maxYearTotal = Math.max(
    ...years.map((y) => {
      const d = DATA.porAno[String(y)];
      return d.simbólica + d.incremental + d.estrutural;
    })
  );

  const percentSimbolica = (DATA.resumo.simbólica / DATA.total) * 100;
  const percentIncremental = (DATA.resumo.incremental / DATA.total) * 100;
  const percentEstrutural = (DATA.resumo.estrutural / DATA.total) * 100;

  const filteredProps = (filter === "all"
    ? DATA.proposicoes
    : DATA.proposicoes.filter((p) => p.categoria === filter)
  ).slice(0, 20);

  return (
    <section className="dark-section px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="offset-left">
          <p className="mb-4 font-mono-data text-xs uppercase tracking-[0.2em] text-white/50">
            [ ATO 03 / O TIPO DE LEI ]
          </p>
          <RevealText
            as="h2"
            text="O Congresso"
            stagger={50}
            className="block text-5xl font-black leading-[0.9] text-white md:text-7xl"
          />
          <RevealText
            as="h2"
            text="está agindo?"
            stagger={50}
            delay={500}
            className="block text-5xl font-black leading-[0.9] text-[var(--color-blood)] md:text-7xl"
          />
        </div>

        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-white/70 md:text-xl">
          Em 7 anos, <strong className="text-white">{DATA.total.toLocaleString("pt-BR")}</strong> proposições
          sobre violência contra a mulher chegaram ao Congresso Nacional.
          Mas o que elas realmente propõem?
        </p>

        {/* Big bar of all */}
        <div className="mt-16">
          <p className="mb-4 font-mono-data text-xs uppercase tracking-[0.2em] text-white/50">
            Classificação de {DATA.total.toLocaleString("pt-BR")} proposições
          </p>
          <div className="flex h-20 w-full overflow-hidden rounded-sm">
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
          <div className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
            {(["incremental", "estrutural", "simbólica"] as const).map((cat) => (
              <div
                key={cat}
                className="rounded border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-sm"
                    style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                  />
                  <span className="font-bold text-white">{CATEGORY_LABELS[cat]}</span>
                  <span
                    className="ml-auto font-bold text-white"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {DATA.resumo[cat]}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-white/60">
                  {CATEGORY_DESC[cat]}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Insight — brutalist huge statement */}
        <div className="mt-24 border-y border-white/10 py-16">
          <div className="offset-right">
            <p
              className="leading-none"
              style={{
                fontFamily: "var(--font-display-condensed)",
                letterSpacing: "-0.05em",
                fontSize: "clamp(5rem, 16vw, 16rem)",
                color: CATEGORY_COLORS.incremental,
              }}
            >
              {percentIncremental.toFixed(0)}%
            </p>
          </div>
          <p className="mt-6 max-w-2xl text-xl font-medium leading-relaxed text-white md:text-2xl">
            são alterações pontuais em leis que já existem.
          </p>
          <p className="mt-4 max-w-2xl text-lg text-white/60">
            Apenas{" "}
            <strong style={{ color: CATEGORY_COLORS.estrutural }}>
              {percentEstrutural.toFixed(0)}%
            </strong>{" "}
            criam programas, fundos ou políticas novas.
          </p>
        </div>

        {/* Destino das propostas */}
        {DATA.destino_stats && (() => {
          const d = DATA.destino_stats.por_categoria;
          const total = DATA.destino_stats.total;
          const aprovadas = d.aprovada;
          const pctAprovadas = (aprovadas / total) * 100;
          const pctSemRelator = (d.sem_relator / total) * 100;
          const destinos = [
            { key: "aprovada", label: "Viraram lei", count: d.aprovada, color: "#1DB389" },
            { key: "no_senado", label: "Aprovadas na Câmara, tramitando no Senado", count: d.no_senado, color: "#5FBDAA" },
            { key: "pronta", label: "Prontas para pauta, ainda sem votação", count: d.pronta, color: "#D4A960" },
            { key: "tramitando", label: "Em tramitação nas comissões", count: d.tramitando, color: "#6B6B64" },
            { key: "sem_relator", label: "Aguardando relator, nunca saíram do zero", count: d.sem_relator, color: "#B8252F" },
            { key: "arquivada", label: "Arquivadas, retiradas ou devolvidas", count: d.arquivada, color: "#4a2020" },
          ];
          return (
            <div className="mt-24 border-t border-white/10 pt-16">
              <p className="mb-4 font-mono-data text-xs uppercase tracking-[0.2em] text-white/50">
                [ Destino das {total} proposições ]
              </p>
              <h3
                className="max-w-2xl text-3xl font-bold leading-tight text-white md:text-4xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Muita proposição, pouca lei.
              </h3>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/70">
                Em 3 anos de legislatura, apenas{" "}
                <strong
                  className="text-[#1DB389]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {aprovadas}
                </strong>{" "}
                (
                <strong
                  className="text-[#1DB389]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {pctAprovadas.toFixed(1)}%
                </strong>
                ) das proposições se transformaram em lei. Outras{" "}
                <strong
                  className="text-[var(--color-blood)]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {d.sem_relator} ({pctSemRelator.toFixed(1)}%)
                </strong>{" "}
                nunca saíram do zero — ainda aguardam a designação de um relator.
              </p>

              {/* Stacked bar */}
              <div className="mt-10 flex h-16 w-full overflow-hidden rounded-sm">
                {destinos.map((dest) => {
                  const pct = (dest.count / total) * 100;
                  if (pct < 0.3) return null;
                  return (
                    <div
                      key={dest.key}
                      className="flex items-center justify-center text-[10px] font-bold text-white"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: dest.color,
                      }}
                      title={`${dest.label}: ${dest.count}`}
                    >
                      {pct > 6 ? `${pct.toFixed(1)}%` : ""}
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {destinos.map((dest) => (
                  <div
                    key={dest.key}
                    className="flex items-start gap-3 rounded border border-white/10 bg-white/[0.03] p-3"
                  >
                    <span
                      className="mt-1 inline-block h-3 w-3 flex-shrink-0 rounded-sm"
                      style={{ backgroundColor: dest.color }}
                    />
                    <div className="flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm text-white">{dest.label}</span>
                        <span
                          className="font-bold text-white"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          {dest.count}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-6 font-mono-data text-xs leading-relaxed text-white/50">
                Fonte: API da Câmara dos Deputados, endpoint /proposicoes/&#123;id&#125;.
                Dados de {new Date().toLocaleDateString("pt-BR")}.
              </p>
            </div>
          );
        })()}

        {/* Timeline by year */}
        <div className="mt-20">
          <p className="mb-6 font-mono-data text-xs uppercase tracking-[0.2em] text-white/50">
            Proposições por ano
          </p>
          <div className="space-y-3">
            {years.map((year) => {
              const d = DATA.porAno[String(year)];
              const total = d.simbólica + d.incremental + d.estrutural;
              const widthPercent = (total / maxYearTotal) * 100;
              return (
                <div key={year} className="flex items-center gap-3">
                  <span
                    className="w-12 flex-shrink-0 font-mono-data text-sm text-white/50"
                  >
                    {year}
                  </span>
                  <div className="flex-1">
                    <div
                      className="flex h-7 overflow-hidden"
                      style={{ width: `${widthPercent}%`, minWidth: "60px" }}
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
                  <span className="w-10 text-right font-mono-data text-sm font-bold text-white">
                    {total}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Proposal list */}
        <div className="mt-20">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono-data text-xs uppercase tracking-[0.2em] text-white/50">
              20 proposições mais recentes
            </p>
            <div className="flex flex-wrap gap-2">
              {(["all", "simbólica", "incremental", "estrutural"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-full px-3 py-1 text-xs transition-colors ${
                    filter === f
                      ? "bg-white text-[var(--color-dark)]"
                      : "bg-white/5 text-white/60 hover:bg-white/10"
                  }`}
                >
                  {f === "all" ? "Todas" : CATEGORY_LABELS[f]}
                </button>
              ))}
            </div>
          </div>

          <ul className="space-y-2">
            {filteredProps.map((p) => (
              <li
                key={p.id}
                className="rounded border border-white/10 bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.05]"
              >
                <div className="flex items-start gap-3">
                  <span
                    className="flex-shrink-0 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                    style={{
                      backgroundColor: CATEGORY_COLORS[p.categoria],
                    }}
                  >
                    {CATEGORY_LABEL_SINGULAR[p.categoria]}
                  </span>
                  <div className="flex-1">
                    <p className="font-mono-data text-sm font-bold text-white">
                      {p.tipo} {p.numero}/{p.ano}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-white/70">
                      {p.ementa.length > 220 ? p.ementa.slice(0, 220) + "…" : p.ementa}
                    </p>
                    <a
                      href={`https://www.camara.leg.br/propostas-legislativas/${p.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block font-mono-data text-xs text-white/50 hover:text-white"
                    >
                      Ver na Câmara →
                    </a>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-12 font-mono-data text-xs text-white/40">
          Fonte: API de Dados Abertos da Câmara dos Deputados. Busca por
          &ldquo;feminicídio&rdquo;, &ldquo;Maria da Penha&rdquo;,
          &ldquo;violência contra mulher&rdquo; e &ldquo;violência doméstica&rdquo;
          entre 2019 e 2026. Classificação automática por análise de ementa.
        </p>
      </div>
    </section>
  );
}
