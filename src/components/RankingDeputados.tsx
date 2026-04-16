"use client";

import { useState, useEffect } from "react";
import autoriaData from "../data/autoria.json";
import coerenciaData from "../data/coerencia.json";
import relatoriaData from "../data/relatoria.json";
import RevealText from "./RevealText";

type PL = {
  id: number;
  tipo: string;
  numero: number;
  ano: number;
  ementa: string;
  data: string;
  categoria: "simbólica" | "incremental" | "estrutural";
};

type Deputado = {
  id: number;
  nome: string;
  partido: string;
  uf: string;
  foto: string;
  situacao: string;
  sexo?: "F" | "M" | null;
  total: number;
  simbolicas: number;
  incrementais: number;
  estruturais: number;
  pls: PL[];
};

type CoerenciaDeputado = {
  id: number;
  nome: string;
  partido: string;
  uf: string;
  foto: string;
  sexo?: string | null;
  sim: number;
  nao: number;
  ausencias: number;
  participacoes: number;
  score: number;
  votes_by_id: Record<string, string>;
};

type CoerenciaJSON = {
  merito_vote_ids: string[];
  deputados: CoerenciaDeputado[];
};

const COERENCIA = coerenciaData as CoerenciaJSON;

type RelatoriaJSON = {
  total_designacoes: number;
  por_sexo: Record<string, number>;
  pls_tipo_relatoria: Record<string, number>;
  top_relatores: Array<{ nome: string; designacoes: number; sexo: string | null }>;
};
const RELATORIA = relatoriaData as RelatoriaJSON;
const COERENCIA_MAP = new Map(COERENCIA.deputados.map((d) => [d.id, d]));

// PL labels for the 4 mérito votes (human-readable)
const MERITO_LABELS: Record<string, string> = {
  "2462009-79": "PL 3880/2024 — Violência vicária",
  "2596663-47": "PL 6415/2025 — Assistência jurídica",
  "2593881-57": "PL 2942/2024 — Monitoramento eletrônico",
  "2413257-126": "PL 6020/2023 — Substitutivo",
};

// Get the actual vote ids used
const MERITO_IDS = COERENCIA.merito_vote_ids;

type AutoriaJSON = {
  deputados: Deputado[];
  partidos: Record<
    string,
    { total: number; simbolicas: number; incrementais: number; estruturais: number; deputados: number }
  >;
  totalPls: number;
  totalDeputados: number;
  gender_stats?: {
    F: { total: number; estruturais: number; incrementais: number; simbolicas: number; deputados: number };
    M: { total: number; estruturais: number; incrementais: number; simbolicas: number; deputados: number };
  };
};

const DATA = autoriaData as AutoriaJSON;

const CATEGORY_COLORS = {
  simbólica: "#6B6B64",
  incremental: "#3B82D4",
  estrutural: "#1DB389",
};

const CATEGORY_LABELS = {
  simbólica: "Simbólica",
  incremental: "Incremental",
  estrutural: "Estrutural",
};

function DeputadoModal({
  deputado,
  onClose,
}: {
  deputado: Deputado;
  onClose: () => void;
}) {
  const [filter, setFilter] = useState<"all" | "simbólica" | "incremental" | "estrutural">("all");

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const filteredPLs =
    filter === "all"
      ? deputado.pls
      : deputado.pls.filter((p) => p.categoria === filter);

  const pctEstr =
    deputado.total > 0
      ? (deputado.estruturais / deputado.total) * 100
      : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/70 backdrop-blur-sm md:items-center md:px-4"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl md:h-auto md:max-h-[90vh] md:max-w-2xl md:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-4 border-b border-gray-100 p-6">
          {deputado.foto && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={deputado.foto}
              alt=""
              className="h-16 w-16 flex-shrink-0 rounded-full object-cover"
            />
          )}
          <div className="flex-1">
            <h3
              className="text-2xl font-bold text-[var(--color-text)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {deputado.nome}
            </h3>
            <p className="font-mono-data text-sm text-[var(--color-text-tertiary)]">
              {deputado.partido} · {deputado.uf}
              {deputado.situacao !== "Exercício" && ` · ${deputado.situacao}`}
            </p>

            {/* Stats */}
            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              <span>
                <strong
                  className="font-mono-data"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {deputado.total}
                </strong>{" "}
                <span className="text-[var(--color-text-secondary)]">
                  proposições
                </span>
              </span>
              <span>
                <strong
                  className="font-mono-data"
                  style={{ color: CATEGORY_COLORS.estrutural }}
                >
                  {deputado.estruturais}
                </strong>{" "}
                <span className="text-[var(--color-text-secondary)]">
                  estruturais ({pctEstr.toFixed(0)}%)
                </span>
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 rounded-full bg-[var(--color-bg-alt)] p-2 transition-colors hover:bg-gray-200"
            aria-label="Fechar"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Coerência nas votações de mérito */}
        {(() => {
          const coer = COERENCIA_MAP.get(deputado.id);
          if (!coer) return null;
          return (
            <div className="border-b border-gray-100 bg-[var(--color-bg-alt)] px-6 py-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
                  [ Como votou nas 4 PLs-chave ]
                </p>
                <span
                  className="font-mono-data text-sm font-bold"
                  style={{
                    color:
                      coer.score >= 75
                        ? "var(--color-teal)"
                        : coer.score >= 50
                        ? "var(--color-text)"
                        : "var(--color-blood)",
                  }}
                >
                  {coer.score.toFixed(0)}% pró-proteção
                </span>
              </div>
              <ul className="mt-3 space-y-1.5">
                {MERITO_IDS.map((vid) => {
                  const voto = coer.votes_by_id[vid] || "Ausente";
                  const label = MERITO_LABELS[vid] || vid;
                  const isSim = voto === "Sim";
                  const isNao = voto === "Não";
                  return (
                    <li key={vid} className="flex items-center gap-3 text-xs">
                      <span
                        className={`inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full font-mono-data text-[10px] font-bold ${
                          isSim
                            ? "bg-[var(--color-teal)] text-white"
                            : isNao
                            ? "bg-[var(--color-blood)] text-white"
                            : "bg-gray-200 text-[var(--color-text-tertiary)]"
                        }`}
                      >
                        {isSim ? "✓" : isNao ? "✗" : "—"}
                      </span>
                      <span className="flex-1 text-[var(--color-text-secondary)]">
                        {label}
                      </span>
                      <span className="font-mono-data text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                        {voto}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })()}

        {/* Filter */}
        <div className="flex flex-wrap gap-2 border-b border-gray-100 bg-[var(--color-bg-alt)] px-6 py-3">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-full px-3 py-1 text-xs transition-colors ${
              filter === "all"
                ? "bg-[var(--color-text)] text-white"
                : "bg-white text-[var(--color-text-secondary)] hover:bg-gray-100"
            }`}
          >
            Todas ({deputado.total})
          </button>
          {(["estrutural", "incremental", "simbólica"] as const).map((cat) => {
            const count =
              cat === "estrutural"
                ? deputado.estruturais
                : cat === "incremental"
                ? deputado.incrementais
                : deputado.simbolicas;
            if (count === 0) return null;
            return (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  filter === cat ? "text-white" : "bg-white hover:bg-gray-100"
                }`}
                style={
                  filter === cat
                    ? { backgroundColor: CATEGORY_COLORS[cat] }
                    : { color: CATEGORY_COLORS[cat] }
                }
              >
                {CATEGORY_LABELS[cat]}s ({count})
              </button>
            );
          })}
        </div>

        {/* PLs list */}
        <div className="flex-1 overflow-y-auto">
          <ul className="divide-y divide-gray-100">
            {filteredPLs.map((pl) => (
              <li key={pl.id} className="p-5 hover:bg-[var(--color-bg-alt)]">
                <div className="flex items-start gap-3">
                  <span
                    className="flex-shrink-0 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                    style={{ backgroundColor: CATEGORY_COLORS[pl.categoria] }}
                  >
                    {CATEGORY_LABELS[pl.categoria]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-3">
                      <span className="font-mono-data text-sm font-bold text-[var(--color-text)]">
                        {pl.tipo} {pl.numero}/{pl.ano}
                      </span>
                      <span className="font-mono-data text-xs text-[var(--color-text-tertiary)]">
                        {pl.data}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                      {pl.ementa.length > 280
                        ? pl.ementa.slice(0, 280) + "…"
                        : pl.ementa}
                    </p>
                    <a
                      href={`https://www.camara.leg.br/propostas-legislativas/${pl.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block font-mono-data text-xs text-[var(--color-blue)] hover:underline"
                    >
                      Ver completo na Câmara →
                    </a>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 bg-[var(--color-bg-alt)] p-4 text-center">
          <a
            href={`https://www.camara.leg.br/deputados/${deputado.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono-data text-xs uppercase tracking-widest text-[var(--color-blood)] hover:underline"
          >
            Perfil completo do deputado na Câmara →
          </a>
        </div>
      </div>
    </div>
  );
}

export default function RankingDeputados() {
  const [sortBy, setSortBy] = useState<"total" | "estruturais" | "pct_estrutural">("estruturais");
  const [selected, setSelected] = useState<Deputado | null>(null);
  const minPls = 5;

  const filtered = DATA.deputados.filter((d) => d.total >= minPls);

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "total") return b.total - a.total;
    if (sortBy === "estruturais") return b.estruturais - a.estruturais;
    const pa = a.total > 0 ? a.estruturais / a.total : 0;
    const pb = b.total > 0 ? b.estruturais / b.total : 0;
    return pb - pa;
  });

  const top = sorted.slice(0, 20);
  const maxTotal = Math.max(...top.map((d) => d.total));

  return (
    <>
      <section className="bg-white px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 offset-left">
            <p className="mb-4 font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
              [ ATO 01 / QUEM FAZ AS LEIS ]
            </p>
            <RevealText
              as="h2"
              text="Quem propõe"
              stagger={40}
              className="block text-3xl font-black leading-[0.9] md:text-5xl text-[var(--color-text)] lg:text-7xl"
            />
            <RevealText
              as="h2"
              text="o quê?"
              stagger={40}
              delay={400}
              className="block text-3xl font-black leading-[0.9] md:text-5xl text-[var(--color-blue)] lg:text-7xl"
            />
          </div>

          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-[var(--color-text-secondary)] md:text-xl">
            Na atual legislatura (2023-2026), <strong>{DATA.totalDeputados} deputados</strong>{" "}
            propuseram {DATA.totalPls} proposições sobre violência contra a mulher.
            Quem são?
          </p>

          {/* Contexto pra leigo */}
          <div className="mt-8 rounded-xl border border-[var(--color-blue)]/20 bg-[var(--color-blue-light)] p-6">
            <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--color-blue)]">
              [ Como funciona o processo legislativo ]
            </p>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              <p>
                <strong className="text-[var(--color-text)]">Proposição (PL)</strong>{" "}
                é qualquer projeto de lei apresentado por um deputado.
                Pode ser uma ideia de 2 linhas ou uma proposta estrutural
                complexa. O número bruto de PLs não diz muito — o que
                importa é se a proposta muda a estrutura ou só faz
                barulho.
              </p>
              <p>
                <strong className="text-[var(--color-text)]">Relatoria</strong>{" "}
                é quando um deputado é designado para analisar a proposta
                e emitir parecer. É o trabalho pesado — sem relator, a
                PL morre na gaveta. Quem relata decide o destino.
              </p>
              <p>
                Nós classificamos cada proposição em três tipos:{" "}
                <strong style={{ color: "#7A7A7A" }}>simbólicas</strong>{" "}
                (datas, homenagens),{" "}
                <strong style={{ color: "#005FFF" }}>incrementais</strong>{" "}
                (ajustes em leis existentes) e{" "}
                <strong style={{ color: "#DCFF00", backgroundColor: "#0A0A0A", padding: "0 4px", borderRadius: 2 }}>
                  estruturais
                </strong>{" "}
                (criam programas, fundos ou políticas novas).
              </p>
            </div>
          </div>

          {/* Gender gap block — destacado */}
          {DATA.gender_stats && (() => {
            const f = DATA.gender_stats.F;
            const m = DATA.gender_stats.M;
            const fDepPct = f.deputados / (f.deputados + m.deputados) * 100;
            const fPlPct = f.total / (f.total + m.total) * 100;
            const fPerDep = f.total / f.deputados;
            const mPerDep = m.total / m.deputados;
            const CAMARA_F_PCT = 17; // Mulheres na Câmara 2023-2026
            // Sobrerepresentação: quanto % acima do esperado
            const sobreAutoria = (fPlPct / CAMARA_F_PCT - 1) * 100;
            const pctFRelatoria = (RELATORIA.por_sexo.F || 0) / RELATORIA.total_designacoes * 100;
            const top20F = sorted.slice(0, 20).filter((d) => d.sexo === "F").length;

            return (
              <div className="mt-12 rounded-2xl bg-[var(--color-blue)] p-8 text-white">
                <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--color-neon)]">
                  [ Quem carrega o trabalho ]
                </p>
                <h3
                  className="mt-4 text-3xl font-bold leading-tight text-white md:text-4xl"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Mulheres são <span className="text-white/60">17% da Câmara</span>, mas fazem <span className="text-[var(--color-neon)]">quase todo o trabalho</span> sobre violência contra mulher.
                </h3>

                {/* 4 grandes stats */}
                <div className="mt-10 grid gap-6 md:grid-cols-4">
                  <div>
                    <p
                      className="leading-none text-[var(--color-neon)]"
                      style={{
                        fontFamily: "var(--font-display-condensed)",
                        fontSize: "clamp(3rem, 6vw, 5rem)",
                        letterSpacing: "-0.03em",
                      }}
                    >
                      {fPlPct.toFixed(0)}%
                    </p>
                    <p className="mt-2 text-sm leading-snug text-white">
                      <strong>das PLs</strong> sobre o tema são propostas por mulheres
                    </p>
                    <p className="mt-1 font-mono-data text-[10px] uppercase tracking-wider text-white/60">
                      {sobreAutoria > 0 ? `+${sobreAutoria.toFixed(0)}%` : `${sobreAutoria.toFixed(0)}%`} acima do esperado pela representação (17%)
                    </p>
                  </div>

                  <div>
                    <p
                      className="leading-none text-[var(--color-neon)]"
                      style={{
                        fontFamily: "var(--font-display-condensed)",
                        fontSize: "clamp(3rem, 6vw, 5rem)",
                        letterSpacing: "-0.03em",
                      }}
                    >
                      {pctFRelatoria.toFixed(0)}%
                    </p>
                    <p className="mt-2 text-sm leading-snug text-white">
                      <strong>das relatorias</strong> dessas PLs são atribuídas a mulheres
                    </p>
                    <p className="mt-1 font-mono-data text-[10px] uppercase tracking-wider text-white/60">
                      {RELATORIA.pls_tipo_relatoria["só mulher"]} PLs só com relatoras mulheres, {RELATORIA.pls_tipo_relatoria["só homem"]} só com homens
                    </p>
                  </div>

                  <div>
                    <p
                      className="leading-none text-[var(--color-neon)]"
                      style={{
                        fontFamily: "var(--font-display-condensed)",
                        fontSize: "clamp(3rem, 6vw, 5rem)",
                        letterSpacing: "-0.03em",
                      }}
                    >
                      {(fPerDep / mPerDep).toFixed(1)}×
                    </p>
                    <p className="mt-2 text-sm leading-snug text-white">
                      <strong>mais PLs por pessoa</strong> nas deputadas que nos deputados
                    </p>
                    <p className="mt-1 font-mono-data text-[10px] uppercase tracking-wider text-white/60">
                      {fPerDep.toFixed(1)} PLs por mulher · {mPerDep.toFixed(1)} por homem
                    </p>
                  </div>

                  <div>
                    <p
                      className="leading-none text-[var(--color-neon)]"
                      style={{
                        fontFamily: "var(--font-display-condensed)",
                        fontSize: "clamp(3rem, 6vw, 5rem)",
                        letterSpacing: "-0.03em",
                      }}
                    >
                      {top20F}/20
                    </p>
                    <p className="mt-2 text-sm leading-snug text-white">
                      <strong>do top 20</strong> em produção legislativa sobre o tema são mulheres
                    </p>
                    <p className="mt-1 font-mono-data text-[10px] uppercase tracking-wider text-white/60">
                      {((top20F / 20) * 100).toFixed(0)}% do ranking abaixo
                    </p>
                  </div>
                </div>

                <p className="mt-8 max-w-3xl text-sm leading-relaxed text-white/80">
                  Se a produção legislativa fosse proporcional à composição da
                  Câmara, esperaríamos 17% de autoria feminina. Na prática,
                  mulheres propõem <strong className="text-white">{fPlPct.toFixed(0)}%</strong> das
                  PLs sobre o tema e relatam <strong className="text-white">{pctFRelatoria.toFixed(0)}%</strong>
                  delas. A política de enfrentamento à violência contra a
                  mulher é sustentada, em larga medida,{" "}
                  <strong className="text-[var(--color-neon)]">
                    pelas próprias mulheres do parlamento
                  </strong>
                  .
                </p>
              </div>
            );
          })()}

          {/* How to interpret */}
          <div className="mt-10 max-w-2xl rounded-xl bg-[var(--color-bg-alt)] p-6">
            <p className="leading-relaxed text-[var(--color-text-secondary)]">
              <strong className="text-[var(--color-text)]">
                Como interpretar o ranking abaixo:
              </strong>{" "}
              um deputado com muitas PLs simbólicas ou incrementais está
              produzindo barulho, não política estrutural. A barra{" "}
              <strong style={{ color: "#DCFF00", backgroundColor: "#0A0A0A", padding: "0 4px", borderRadius: 2 }}>verde</strong>{" "}
              mede o que <em>muda a estrutura</em> — criação de programas,
              fundos, serviços novos. Use esse ranking como referência,
              não veredito. O contexto de cada PL importa.
            </p>
          </div>

          {/* Sort controls */}
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <span className="font-mono-data text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
              Ordenar por:
            </span>
            <div className="flex flex-wrap gap-2">
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
            </div>
          </div>

          {/* Ranking */}
          <div className="mt-10 space-y-2">
            {top.map((d, i) => {
              const pct = (d.total / maxTotal) * 100;
              const pctEstr = d.total > 0 ? (d.estruturais / d.total) * 100 : 0;
              return (
                <button
                  key={d.id}
                  onClick={() => setSelected(d)}
                  className="w-full rounded-lg border border-gray-100 bg-white p-4 text-left transition-all hover:border-[var(--color-blood)] hover:shadow-md"
                >
                  <div className="flex items-start gap-4">
                    <span className="w-8 flex-shrink-0 pt-1 font-mono-data text-sm text-[var(--color-text-tertiary)]">
                      {i + 1}
                    </span>

                    {d.foto && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={d.foto}
                        alt=""
                        loading="lazy"
                        className="h-12 w-12 flex-shrink-0 rounded-full object-cover"
                      />
                    )}

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

                      <div
                        className="mt-2 flex h-3 overflow-hidden rounded"
                        style={{ width: `${pct}%`, minWidth: "80px" }}
                      >
                        {d.incrementais > 0 && (
                          <div
                            style={{
                              width: `${(d.incrementais / d.total) * 100}%`,
                              backgroundColor: CATEGORY_COLORS.incremental,
                            }}
                          />
                        )}
                        {d.estruturais > 0 && (
                          <div
                            style={{
                              width: `${(d.estruturais / d.total) * 100}%`,
                              backgroundColor: CATEGORY_COLORS.estrutural,
                            }}
                          />
                        )}
                        {d.simbolicas > 0 && (
                          <div
                            style={{
                              width: `${(d.simbolicas / d.total) * 100}%`,
                              backgroundColor: CATEGORY_COLORS.simbólica,
                            }}
                          />
                        )}
                      </div>

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
                              style={{ color: CATEGORY_COLORS.simbólica }}
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

                    <span className="self-center font-mono-data text-xs text-[var(--color-text-tertiary)]">
                      ver ↗
                    </span>
                  </div>
                </button>
              );
            })}
          </div>


          <p className="mt-8 font-mono-data text-xs text-[var(--color-text-tertiary)]">
            Fonte: API de Dados Abertos da Câmara dos Deputados. Autoria
            principal de cada proposição. 57ª legislatura: janeiro de 2023
            a dezembro de 2026. Deputados com 5+ PLs sobre o tema.
          </p>
        </div>
      </section>

      {selected && (
        <DeputadoModal deputado={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
