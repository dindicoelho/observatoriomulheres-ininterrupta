"use client";

import { useMemo } from "react";
import redeData from "../data/rede_protecao.json";
import RevealText from "./RevealText";

type EstadoRede = {
  taxa: number;
  deams: number;
  abrigos: number;
  crams: number;
  pop_fem: number;
  deams_per_100k: number;
  abrigos_per_100k: number;
  crams_per_100k: number;
  total_per_100k: number;
};

type RedeJSON = {
  ano: number;
  estados: Record<string, EstadoRede>;
};

const DATA = redeData as RedeJSON;

const UF_NAMES: Record<string, string> = {
  AC: "Acre", AL: "Alagoas", AM: "Amazonas", AP: "Amapá",
  BA: "Bahia", CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo",
  GO: "Goiás", MA: "Maranhão", MG: "Minas Gerais", MS: "Mato Grosso do Sul",
  MT: "Mato Grosso", PA: "Pará", PB: "Paraíba", PE: "Pernambuco",
  PI: "Piauí", PR: "Paraná", RJ: "Rio de Janeiro", RN: "Rio Grande do Norte",
  RO: "Rondônia", RR: "Roraima", RS: "Rio Grande do Sul", SC: "Santa Catarina",
  SE: "Sergipe", SP: "São Paulo", TO: "Tocantins",
};

function Scatter() {
  const entries = Object.entries(DATA.estados).map(([uf, d]) => ({
    uf,
    ...d,
  }));

  const maxRate = Math.max(...entries.map((e) => e.taxa));
  const maxDeams = Math.max(...entries.map((e) => e.total_per_100k));

  const width = 600;
  const height = 360;
  const padding = { top: 30, right: 40, bottom: 50, left: 50 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const xScale = (v: number) => (v / maxDeams) * innerW;
  const yScale = (v: number) => innerH - (v / maxRate) * innerH;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
      <g transform={`translate(${padding.left},${padding.top})`}>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={`hy-${f}`}
            x1={0}
            x2={innerW}
            y1={innerH - f * innerH}
            y2={innerH - f * innerH}
            stroke="#eee"
            strokeDasharray="2,4"
          />
        ))}

        {/* Axes */}
        <line x1={0} x2={innerW} y1={innerH} y2={innerH} stroke="#ccc" />
        <line x1={0} x2={0} y1={0} y2={innerH} stroke="#ccc" />

        {/* Axis labels Y */}
        {[0, 2.5, 5, 7.5, 10].map((v) => (
          <text
            key={`ylabel-${v}`}
            x={-8}
            y={yScale(v)}
            dy="0.35em"
            textAnchor="end"
            fontSize="10"
            fill="var(--color-text-tertiary)"
            fontFamily="var(--font-mono)"
          >
            {v}
          </text>
        ))}

        {/* X labels */}
        {[0, 0.3, 0.6, 0.9, 1.2, 1.5].map((v) => {
          const x = xScale(v);
          if (x > innerW) return null;
          return (
            <text
              key={`xlabel-${v}`}
              x={x}
              y={innerH + 16}
              textAnchor="middle"
              fontSize="10"
              fill="var(--color-text-tertiary)"
              fontFamily="var(--font-mono)"
            >
              {v.toFixed(1)}
            </text>
          );
        })}

        {/* Axis titles */}
        <text
          x={innerW / 2}
          y={innerH + 40}
          textAnchor="middle"
          fontSize="11"
          fill="var(--color-text-secondary)"
        >
          Equipamentos de proteção por 100 mil mulheres →
        </text>
        <text
          transform={`translate(${-35},${innerH / 2}) rotate(-90)`}
          textAnchor="middle"
          fontSize="11"
          fill="var(--color-text-secondary)"
        >
          ← Taxa de homicídio de mulheres
        </text>

        {/* Dots */}
        {entries.map((e) => {
          const x = xScale(e.total_per_100k);
          const y = yScale(e.taxa);
          const isTop = e.taxa > 5 || e.total_per_100k > 0.9 || ["SP", "RR", "MG", "RJ", "CE", "AC"].includes(e.uf);
          return (
            <g key={e.uf}>
              <circle
                cx={x}
                cy={y}
                r={6}
                fill={
                  e.taxa > 5
                    ? "var(--color-blood)"
                    : e.taxa < 3
                    ? "var(--color-teal)"
                    : "var(--color-neutral)"
                }
                opacity="0.85"
              />
              {isTop && (
                <text
                  x={x + 9}
                  y={y}
                  dy="0.35em"
                  fontSize="11"
                  fill="var(--color-text)"
                  fontFamily="var(--font-mono)"
                  fontWeight="700"
                >
                  {e.uf}
                </text>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}

export default function RedeProtecao() {
  const entries = useMemo(
    () =>
      Object.entries(DATA.estados)
        .map(([uf, d]) => ({ uf, name: UF_NAMES[uf], ...d }))
        .sort((a, b) => b.total_per_100k - a.total_per_100k),
    []
  );

  const top3 = entries.slice(0, 3);
  const bottom3 = entries.slice(-3);

  const top3AvgTaxa = top3.reduce((s, e) => s + e.taxa, 0) / top3.length;
  const bottom3AvgTaxa = bottom3.reduce((s, e) => s + e.taxa, 0) / bottom3.length;

  return (
    <section className="bg-[var(--color-bg-alt)] px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 offset-left">
          <p className="mb-4 font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
            Ato 04 · O que funciona
          </p>
          <RevealText
            as="h2"
            text="Rede"
            stagger={50}
            className="block text-5xl font-black leading-[0.9] text-[var(--color-text)] md:text-7xl"
          />
          <RevealText
            as="h2"
            text="de proteção."
            stagger={50}
            delay={400}
            className="block text-5xl font-black leading-[0.9] text-[var(--color-teal)] md:text-7xl"
          />
        </div>

        <div className="max-w-2xl space-y-5 text-lg leading-relaxed text-[var(--color-text-secondary)] md:text-xl">
          <p>
            A pergunta óbvia é: <em>por que uns estados matam muito mais mulheres que outros?</em>
          </p>
          <p>
            Investigamos investimento em educação, IDEB, PIB per capita,
            gasto em segurança pública. Nenhum desses fatores, sozinho,
            correlaciona bem com a taxa de homicídios de mulheres.
          </p>
          <p className="text-[var(--color-text)]">
            <strong>O que correlaciona é a presença de rede institucional
            específica para mulheres:</strong> Delegacias Especializadas
            (DEAMs), Centros de Referência (CRAMs) e Casas-Abrigo. Quanto
            mais estrutura dedicada ao problema, menor a taxa.
          </p>
        </div>

        {/* Scatter plot */}
        <div className="mt-16 rounded-2xl border border-gray-200 bg-white p-6">
          <p className="mb-4 font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
            Equipamentos de proteção por 100 mil mulheres × taxa de homicídio
          </p>
          <Scatter />
          <div className="mt-4 flex flex-wrap justify-between gap-3 text-xs text-[var(--color-text-tertiary)]">
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[var(--color-blood)]" />
              Taxa alta (&gt; 5 por 100 mil)
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[var(--color-neutral)]" />
              Taxa média
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[var(--color-teal)]" />
              Taxa baixa (&lt; 3 por 100 mil)
            </span>
          </div>
        </div>

        {/* Extremos — big comparison */}
        <div className="mt-16 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-[var(--color-teal)]/20 bg-[var(--color-teal)]/5 p-8">
            <p className="font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-teal)]">
              Top 3 em rede de proteção
            </p>
            <p
              className="mt-4 text-5xl font-black text-[var(--color-teal)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {top3AvgTaxa.toFixed(2)}
            </p>
            <p className="mt-1 font-mono-data text-xs text-[var(--color-text-tertiary)]">
              taxa média de homicídio (por 100 mil mulheres)
            </p>
            <ul className="mt-6 space-y-2">
              {top3.map((e) => (
                <li
                  key={e.uf}
                  className="flex items-center justify-between border-b border-gray-100 py-2 text-sm last:border-0"
                >
                  <span className="font-medium">{e.name}</span>
                  <span className="font-mono-data text-xs text-[var(--color-text-secondary)]">
                    {e.deams} DEAMs · {e.crams} CRAMs · {e.abrigos} abrigos
                  </span>
                  <span
                    className="font-mono-data font-bold text-[var(--color-teal)]"
                  >
                    {e.taxa}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-[var(--color-blood)]/20 bg-[var(--color-blood)]/5 p-8">
            <p className="font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-blood)]">
              Bottom 3 em rede de proteção
            </p>
            <p
              className="mt-4 text-5xl font-black text-[var(--color-blood)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {bottom3AvgTaxa.toFixed(2)}
            </p>
            <p className="mt-1 font-mono-data text-xs text-[var(--color-text-tertiary)]">
              taxa média de homicídio (por 100 mil mulheres)
            </p>
            <ul className="mt-6 space-y-2">
              {bottom3.map((e) => (
                <li
                  key={e.uf}
                  className="flex items-center justify-between border-b border-gray-100 py-2 text-sm last:border-0"
                >
                  <span className="font-medium">{e.name}</span>
                  <span className="font-mono-data text-xs text-[var(--color-text-secondary)]">
                    {e.deams} DEAMs · {e.crams} CRAMs · {e.abrigos} abrigos
                  </span>
                  <span
                    className="font-mono-data font-bold text-[var(--color-blood)]"
                  >
                    {e.taxa}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Big stat */}
        <div className="mt-16 border-y border-gray-200 py-12 text-center">
          <p className="font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
            Entre os estados com mais e menos rede de proteção
          </p>
          <p
            className="mt-4 text-7xl font-black text-[var(--color-text)] md:text-8xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {(bottom3AvgTaxa / top3AvgTaxa).toFixed(1)}×
          </p>
          <p className="mt-3 text-lg text-[var(--color-text-secondary)]">
            mais homicídios nos estados com rede de proteção frágil.
          </p>
        </div>

        {/* O que compõe a rede */}
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          <div className="rounded-xl bg-white p-6">
            <p className="font-mono-data text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
              DEAMs
            </p>
            <p
              className="mt-2 text-3xl font-bold text-[var(--color-text)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Delegacias Especializadas
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              Delegacias de Atendimento à Mulher — unidades policiais
              dedicadas exclusivamente a crimes de violência doméstica e
              feminicídio. São {Object.values(DATA.estados).reduce((s, e) => s + e.deams, 0)} no Brasil todo.
              Brasília é a única capital onde qualquer delegacia atende
              casos; nos outros estados, a especialização concentra
              capacitação e protocolo.
            </p>
          </div>
          <div className="rounded-xl bg-white p-6">
            <p className="font-mono-data text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
              CRAMs
            </p>
            <p
              className="mt-2 text-3xl font-bold text-[var(--color-text)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Centros de Referência
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              Centros de Referência de Atendimento à Mulher — oferecem
              acolhimento psicológico, orientação jurídica e
              encaminhamento multidisciplinar. São {Object.values(DATA.estados).reduce((s, e) => s + e.crams, 0)} no Brasil.
              É o serviço que faz a ponte entre a denúncia policial e o
              resto da rede.
            </p>
          </div>
          <div className="rounded-xl bg-white p-6">
            <p className="font-mono-data text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
              Casas-Abrigo
            </p>
            <p
              className="mt-2 text-3xl font-bold text-[var(--color-text)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Proteção emergencial
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              Abrigos sigilosos para mulheres em risco iminente de morte —
              normalmente quando a vítima precisa sair de casa com os
              filhos. São {Object.values(DATA.estados).reduce((s, e) => s + e.abrigos, 0)} no Brasil. A escassez aqui costuma ser o
              ponto mais crítico da rede.
            </p>
          </div>
        </div>

        {/* Nota final */}
        <div className="mt-16 max-w-3xl">
          <p className="text-base leading-relaxed text-[var(--color-text-secondary)] md:text-lg">
            A correlação não é absoluta — existem exceções importantes.{" "}
            <strong className="text-[var(--color-text)]">Ceará</strong>, por
            exemplo, tem rede de proteção maior que vários estados com taxas
            baixas, mas sua taxa permanece alta por conta da disputa
            territorial entre facções criminosas. O fator &ldquo;rede&rdquo;
            não anula outros fatores estruturais (tráfico, desigualdade,
            fronteiras). Mas, entre os que dependem de política pública,
            <strong className="text-[var(--color-text)]"> é o que mais
            aparece nos dados.</strong> Investir em rede institucional de
            proteção é uma decisão que cabe a gestores — e que se mede.
          </p>
        </div>

        <p className="mt-12 font-mono-data text-xs text-[var(--color-text-tertiary)]">
          Fontes: 18º Anuário Brasileiro de Segurança Pública (FBSP, 2024),
          Ministério das Mulheres, Atlas da Violência (IPEA/FBSP).
          Dados de 2023 para equipamentos, 2022 para taxa de homicídio.
        </p>
      </div>
    </section>
  );
}
