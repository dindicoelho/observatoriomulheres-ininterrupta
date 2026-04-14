"use client";

import { useState } from "react";
import autoriaData from "../data/autoria.json";
import RevealText from "./RevealText";

type Deputado = {
  id: number;
  nome: string;
  partido: string;
  uf: string;
  foto: string;
  situacao: string;
  total: number;
  simbolicas: number;
  incrementais: number;
  estruturais: number;
  pls: Array<{
    id: number;
    tipo: string;
    numero: number;
    ano: number;
    categoria: string;
  }>;
};

type AutoriaJSON = {
  deputados: Deputado[];
  partidos: Record<
    string,
    { total: number; simbolicas: number; incrementais: number; estruturais: number; deputados: number }
  >;
  totalPls: number;
  totalDeputados: number;
};

const DATA = autoriaData as AutoriaJSON;

const CATEGORY_COLORS = {
  simbolica: "#6B6B64",
  incremental: "#3B82D4",
  estrutural: "#1DB389",
};

export default function RankingDeputados() {
  const [sortBy, setSortBy] = useState<"total" | "estruturais" | "pct_estrutural">("total");
  const [minPls, setMinPls] = useState(5);

  const filtered = DATA.deputados.filter((d) => d.total >= minPls);

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "total") return b.total - a.total;
    if (sortBy === "estruturais") return b.estruturais - a.estruturais;
    // pct_estrutural
    const pa = a.total > 0 ? a.estruturais / a.total : 0;
    const pb = b.total > 0 ? b.estruturais / b.total : 0;
    return pb - pa;
  });

  const top = sorted.slice(0, 20);

  const maxTotal = Math.max(...top.map((d) => d.total));

  return (
    <section className="bg-white px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 offset-left">
          <p className="mb-4 font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
            Ato 05 · Eleições 2026
          </p>
          <RevealText
            as="h2"
            text="Quem propõe"
            stagger={40}
            className="block text-5xl font-black leading-[0.9] text-[var(--color-text)] md:text-7xl"
          />
          <RevealText
            as="h2"
            text="o quê?"
            stagger={40}
            delay={400}
            className="block text-5xl font-black leading-[0.9] text-[var(--color-blood)] md:text-7xl"
          />
        </div>

        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-[var(--color-text-secondary)] md:text-xl">
          Dos {DATA.totalDeputados} deputados que propuseram proposições sobre
          violência contra a mulher desde 2019, alguns se repetem muito. Mas{" "}
          <strong>quantidade não é qualidade</strong>. Nem todo projeto é
          estrutural.
        </p>

        {/* Sort controls */}
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <span className="font-mono-data text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
            Ordenar por:
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSortBy("total")}
              className={`rounded-full px-3 py-1 text-xs transition-colors ${
                sortBy === "total"
                  ? "bg-[var(--color-text)] text-white"
                  : "bg-[var(--color-bg-alt)] text-[var(--color-text-secondary)] hover:bg-gray-200"
              }`}
            >
              Quantidade total
            </button>
            <button
              onClick={() => setSortBy("estruturais")}
              className={`rounded-full px-3 py-1 text-xs transition-colors ${
                sortBy === "estruturais"
                  ? "bg-[var(--color-teal)] text-white"
                  : "bg-[var(--color-bg-alt)] text-[var(--color-text-secondary)] hover:bg-gray-200"
              }`}
            >
              Nº de estruturais
            </button>
            <button
              onClick={() => setSortBy("pct_estrutural")}
              className={`rounded-full px-3 py-1 text-xs transition-colors ${
                sortBy === "pct_estrutural"
                  ? "bg-[var(--color-teal)] text-white"
                  : "bg-[var(--color-bg-alt)] text-[var(--color-text-secondary)] hover:bg-gray-200"
              }`}
            >
              % estruturais
            </button>
          </div>
        </div>

        {/* Ranking */}
        <div className="mt-10 space-y-2">
          {top.map((d, i) => {
            const pct = (d.total / maxTotal) * 100;
            const pctEstr = d.total > 0 ? (d.estruturais / d.total) * 100 : 0;
            return (
              <div
                key={d.id}
                className="rounded-lg border border-gray-100 bg-white p-4 transition-colors hover:bg-[var(--color-bg-alt)]"
              >
                <div className="flex items-start gap-4">
                  {/* Rank */}
                  <span
                    className="w-8 flex-shrink-0 pt-1 font-mono-data text-sm text-[var(--color-text-tertiary)]"
                  >
                    {i + 1}
                  </span>

                  {/* Foto */}
                  {d.foto && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={d.foto}
                      alt=""
                      loading="lazy"
                      className="h-12 w-12 flex-shrink-0 rounded-full object-cover"
                    />
                  )}

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-3">
                      <span className="font-bold text-[var(--color-text)]">
                        {d.nome}
                      </span>
                      <span className="font-mono-data text-xs text-[var(--color-text-tertiary)]">
                        {d.partido}·{d.uf}
                      </span>
                      {d.situacao !== "Exercício" && (
                        <span className="font-mono-data text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                          {d.situacao}
                        </span>
                      )}
                    </div>

                    {/* Stacked bar */}
                    <div className="mt-2 flex h-3 overflow-hidden rounded" style={{ width: `${pct}%`, minWidth: "80px" }}>
                      {d.incrementais > 0 && (
                        <div
                          style={{
                            width: `${(d.incrementais / d.total) * 100}%`,
                            backgroundColor: CATEGORY_COLORS.incremental,
                          }}
                          title={`${d.incrementais} incrementais`}
                        />
                      )}
                      {d.estruturais > 0 && (
                        <div
                          style={{
                            width: `${(d.estruturais / d.total) * 100}%`,
                            backgroundColor: CATEGORY_COLORS.estrutural,
                          }}
                          title={`${d.estruturais} estruturais`}
                        />
                      )}
                      {d.simbolicas > 0 && (
                        <div
                          style={{
                            width: `${(d.simbolicas / d.total) * 100}%`,
                            backgroundColor: CATEGORY_COLORS.simbolica,
                          }}
                          title={`${d.simbolicas} simbólicas`}
                        />
                      )}
                    </div>

                    {/* Stats */}
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono-data text-xs text-[var(--color-text-secondary)]">
                      <span>
                        <span className="font-bold text-[var(--color-text)]">
                          {d.total}
                        </span>{" "}
                        total
                      </span>
                      <span>
                        <span
                          className="font-bold"
                          style={{ color: CATEGORY_COLORS.estrutural }}
                        >
                          {d.estruturais}
                        </span>{" "}
                        estruturais
                      </span>
                      <span>
                        <span
                          className="font-bold"
                          style={{ color: CATEGORY_COLORS.incremental }}
                        >
                          {d.incrementais}
                        </span>{" "}
                        incrementais
                      </span>
                      {d.simbolicas > 0 && (
                        <span>
                          <span
                            className="font-bold"
                            style={{ color: CATEGORY_COLORS.simbolica }}
                          >
                            {d.simbolicas}
                          </span>{" "}
                          simbólicas
                        </span>
                      )}
                      <span className="text-[var(--color-text-tertiary)]">
                        · {pctEstr.toFixed(0)}% estruturais
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Context */}
        <div className="mx-auto mt-16 max-w-2xl rounded-xl bg-[var(--color-bg-alt)] p-6">
          <p className="leading-relaxed text-[var(--color-text-secondary)]">
            <strong className="text-[var(--color-text)]">Como interpretar:</strong>{" "}
            um deputado com muitas PLs simbólicas ou incrementais está
            produzindo barulho, não política estrutural. A barra verde mede o
            que <em>muda a estrutura</em> — criação de programas, fundos,
            serviços novos. Use esse ranking como uma referência, não como um
            veredito. O contexto de cada PL importa.
          </p>
        </div>

        <p className="mt-8 font-mono-data text-xs text-[var(--color-text-tertiary)]">
          Fonte: API de Dados Abertos da Câmara dos Deputados. Autoria
          principal (proponente nº 1) de cada proposição. Deputados com {minPls}+
          PLs sobre o tema entre 2019 e 2026.
        </p>
      </div>
    </section>
  );
}
