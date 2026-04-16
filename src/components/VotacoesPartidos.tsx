"use client";

import { useState, useMemo } from "react";
import votacoesData from "../data/votacoes.json";
import ScrollFloat from "./ScrollFloat";
import ScrollReveal from "./ScrollReveal";

type Votacao = {
  id: string;
  data: string;
  pl_ref: string;
  pl_id: number;
  projeto_sobre: string;
  pl_ementa: string;
  pl_categoria: string;
  tipo: "mérito" | "procedural";
  o_que_foi_votado: string;
  resultado: string;
  interpretacao_sim: string;
  interpretacao_nao: string;
  descricao_camara: string;
  titulo_curto?: string;
  totalSim: number;
  totalNao: number;
  resultado_placar: string;
  partidos: Record<
    string,
    { sim: number; nao: number; outros: number; total: number; pctSim: number }
  >;
  genero?: {
    F: { sim: number; nao: number; outros: number; total: number; pctSim: number };
    M: { sim: number; nao: number; outros: number; total: number; pctSim: number };
  };
};

type VotacoesJSON = { votacoes: Votacao[] };

type GrupoPL = {
  pl_ref: string;
  pl_id: number;
  projeto_sobre: string;
  pl_ementa: string;
  principal: Votacao;
  outras: Votacao[];
  temMerito: boolean;
};

const DATA = votacoesData as VotacoesJSON;

function PartyRow({
  party,
  data,
  maxTotal,
}: {
  party: string;
  data: { sim: number; nao: number; outros: number; total: number; pctSim: number };
  maxTotal: number;
}) {
  const pctSim = data.pctSim;
  const pctNao = data.total > 0 ? (data.nao / data.total) * 100 : 0;
  // Width proportional to # voters vs largest party
  const barWidth = (data.total / maxTotal) * 100;

  return (
    <div className="flex items-center gap-3 py-2">
      <span className="w-20 flex-shrink-0 font-mono-data text-xs font-bold text-[var(--color-text)]">
        {party}
      </span>
      <div className="flex-1">
        <div
          className="flex h-6 overflow-hidden rounded border border-gray-100"
          style={{ width: `${barWidth}%`, minWidth: "48px" }}
        >
          {pctSim > 0 && (
            <div
              className="flex items-center justify-end bg-[var(--color-teal)] px-2 text-[10px] font-bold text-white"
              style={{ width: `${pctSim}%` }}
            >
              {pctSim > 15 ? `${data.sim}` : ""}
            </div>
          )}
          {pctNao > 0 && (
            <div
              className="flex items-center justify-start bg-[var(--color-blood)] px-2 text-[10px] font-bold text-white"
              style={{ width: `${pctNao}%` }}
            >
              {pctNao > 15 ? `${data.nao}` : ""}
            </div>
          )}
          {data.outros > 0 && (
            <div
              className="bg-gray-300"
              style={{ width: `${(data.outros / data.total) * 100}%` }}
            />
          )}
        </div>
        <p className="mt-1 font-mono-data text-[9px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
          {data.total} votantes
        </p>
      </div>
      <div className="w-14 flex-shrink-0 text-right">
        <span
          className="font-mono-data text-sm font-bold"
          style={{
            color:
              pctSim >= 66
                ? "var(--color-teal)"
                : pctSim >= 34
                ? "var(--color-text)"
                : "var(--color-blood)",
          }}
        >
          {pctSim.toFixed(0)}%
        </span>
        <p className="font-mono-data text-[9px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
          votou sim
        </p>
      </div>
    </div>
  );
}

export default function VotacoesPartidos() {
  const [expanded, setExpanded] = useState<number | null>(null);

  // Group votações by PL
  const grupos = useMemo<GrupoPL[]>(() => {
    const map = new Map<string, Votacao[]>();
    DATA.votacoes.forEach((v) => {
      const arr = map.get(v.pl_ref) ?? [];
      arr.push(v);
      map.set(v.pl_ref, arr);
    });

    const groups: GrupoPL[] = [];
    map.forEach((vots, pl_ref) => {
      // Primary: prefer mérito. Within each type, most recent.
      const sorted = [...vots].sort((a, b) => {
        // mérito first
        if (a.tipo === "mérito" && b.tipo !== "mérito") return -1;
        if (b.tipo === "mérito" && a.tipo !== "mérito") return 1;
        // then by date desc
        return b.data.localeCompare(a.data);
      });
      const principal = sorted[0];
      const outras = sorted.slice(1);
      groups.push({
        pl_ref,
        pl_id: principal.pl_id,
        projeto_sobre: principal.projeto_sobre,
        pl_ementa: principal.pl_ementa,
        principal,
        outras,
        temMerito: vots.some((v) => v.tipo === "mérito"),
      });
    });

    // Sort groups: mérito first, then by principal date desc
    return groups.sort((a, b) => {
      if (a.temMerito && !b.temMerito) return -1;
      if (b.temMerito && !a.temMerito) return 1;
      return b.principal.data.localeCompare(a.principal.data);
    });
  }, []);

  const totalVotacoes = DATA.votacoes.length;

  return (
    <section className="bg-[var(--color-bg-alt)] px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 offset-left">
          <p className="mb-4 font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
            [ ATO 02 / DISCURSO E VOTO ]
          </p>
          <ScrollFloat
            as="h2"
            text="Discurso"
            stagger={50}
            className="block text-3xl font-black leading-[0.9] md:text-5xl text-[var(--color-text)] lg:text-7xl"
          />
          <ScrollFloat
            as="h2"
            text="e voto."
            stagger={50}
            delay={400}
            className="block text-3xl font-black leading-[0.9] md:text-5xl text-[var(--color-blue)] lg:text-7xl"
          />
        </div>

        <div className="mt-8 max-w-2xl space-y-4 text-lg leading-relaxed text-[var(--color-text-secondary)] md:text-xl">
          <ScrollReveal
            as="p"
            text={`Na atual legislatura (2023-2026), ${grupos.length} proposições sobre violência contra a mulher foram a votação nominal no plenário da Câmara, totalizando ${totalVotacoes} votações entre decisões de mérito e procedurais (requerimentos, destaques, recursos).`}
          />
          <p className="text-base text-[var(--color-text-tertiary)]">
            Cada card consolida o projeto, a votação principal e os
            procedimentos relacionados. Clique para expandir.
          </p>
        </div>

        <div className="mt-10 space-y-4">
          {grupos.map((grupo, idx) => {
            const isOpen = expanded === idx;
            const v = grupo.principal;
            const parties = Object.entries(v.partidos)
              .filter(([, p]) => p.total >= 3)
              .sort((a, b) => b[1].total - a[1].total);
            const maxPartyTotal = parties[0]?.[1].total ?? 1;
            return (
              <div
                key={grupo.pl_ref}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white"
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : idx)}
                  className="flex w-full items-start gap-4 p-6 text-left transition-colors hover:bg-[var(--color-bg-alt)]"
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono-data text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
                        {grupo.pl_ref}
                      </span>
                      {grupo.temMerito && (
                        <span className="rounded-full bg-[var(--color-teal)] px-2 py-0.5 font-mono-data text-[9px] font-bold uppercase tracking-widest text-white">
                          Votação de mérito
                        </span>
                      )}
                      {grupo.outras.length > 0 && (
                        <span className="rounded-full border border-[var(--color-text-tertiary)]/30 px-2 py-0.5 font-mono-data text-[9px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)]">
                          +{grupo.outras.length} procedurais
                        </span>
                      )}
                    </div>

                    <h3
                      className="mt-3 text-xl font-bold leading-tight text-[var(--color-text)] md:text-2xl"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {v.titulo_curto || grupo.pl_ref}
                    </h3>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <span className="font-mono-data text-xs text-[var(--color-text-tertiary)]">
                        {v.data}
                      </span>
                      <span className="flex items-center gap-1.5 text-sm">
                        <span className="h-3 w-3 rounded-sm bg-[var(--color-teal)]" />
                        <span className="font-mono-data font-bold text-[var(--color-teal)]">
                          {v.totalSim}
                        </span>
                        <span className="text-[var(--color-text-secondary)]">SIM</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-sm">
                        <span className="h-3 w-3 rounded-sm bg-[var(--color-blood)]" />
                        <span className="font-mono-data font-bold text-[var(--color-blood)]">
                          {v.totalNao}
                        </span>
                        <span className="text-[var(--color-text-secondary)]">NÃO</span>
                      </span>
                    </div>
                  </div>
                  <span
                    className="mt-1 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-[var(--color-text)]/10 font-mono-data text-sm text-[var(--color-text)] transition-all duration-300"
                    style={{
                      transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                    }}
                    aria-hidden="true"
                  >
                    +
                  </span>
                </button>

                <div
                  className="grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  style={{
                    gridTemplateRows: isOpen ? "1fr" : "0fr",
                  }}
                >
                  <div className="overflow-hidden">
                    <div
                      className="border-t border-gray-100 bg-[var(--color-bg-alt)] p-6 transition-opacity duration-300"
                      style={{ opacity: isOpen ? 1 : 0 }}
                    >
                      {/* 1. O QUE É O PROJETO — em destaque */}
                      <div className="mb-4 rounded-xl border-l-4 border-[var(--color-blue)] bg-white p-6">
                        <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--color-blue)]">
                          [ 01 · O que é o projeto ]
                        </p>
                        <h4
                          className="mt-3 text-lg font-bold leading-tight text-[var(--color-text)] md:text-xl"
                          style={{ fontFamily: "var(--font-display)" }}
                        >
                          {v.titulo_curto || grupo.pl_ref}
                        </h4>
                        <p className="mt-2 text-base leading-relaxed text-[var(--color-text-secondary)]">
                          {grupo.projeto_sobre}
                        </p>
                      </div>

                      {/* 2. O QUE FOI VOTADO — nesta sessão */}
                      <div className="mb-4 rounded-xl border-l-4 border-[var(--color-text)] bg-white p-6">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--color-text)]">
                            [ 02 · O que foi votado · {v.data} ]
                          </p>
                          <span className="font-mono-data text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                            {v.tipo === "mérito" ? "Mérito" : "Procedural"}
                          </span>
                        </div>
                        <p className="mt-3 text-base font-bold leading-tight text-[var(--color-text)]">
                          {v.o_que_foi_votado}
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                          {v.resultado}
                        </p>

                        {/* Interpretações Sim/Não */}
                        <p className="mt-5 font-mono-data text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                          [ Significado neutro de cada voto ]
                        </p>
                        <div className="mt-2 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-lg border-l-2 border-[var(--color-teal)] bg-[var(--color-bg-alt)] p-4">
                            <p className="font-mono-data text-[10px] uppercase tracking-wider text-[var(--color-teal)]">
                              Quem votou SIM
                            </p>
                            <p className="mt-2 text-sm leading-relaxed text-[var(--color-text)]">
                              {v.interpretacao_sim}
                            </p>
                          </div>
                          <div className="rounded-lg border-l-2 border-[var(--color-blood)] bg-[var(--color-bg-alt)] p-4">
                            <p className="font-mono-data text-[10px] uppercase tracking-wider text-[var(--color-blood)]">
                              Quem votou NÃO
                            </p>
                            <p className="mt-2 text-sm leading-relaxed text-[var(--color-text)]">
                              {v.interpretacao_nao}
                            </p>
                          </div>
                        </div>
                        <p className="mt-3 text-xs italic leading-relaxed text-[var(--color-text-tertiary)]">
                          O voto não equivale diretamente a ser a favor
                          ou contra mulheres. Pode refletir disputa sobre
                          a forma do texto, emendas, estratégia política
                          ou autoria. Leia o contexto antes de concluir.
                        </p>

                        {/* Gender breakdown */}
                        {v.genero && v.genero.F.total > 0 && v.genero.M.total > 0 && (() => {
                          const f = v.genero.F;
                          const m = v.genero.M;
                          const gap = Math.abs(f.pctSim - m.pctSim);
                          return (
                            <div className="mt-6 rounded-lg border border-[var(--color-blood)]/20 bg-[var(--color-blood-light)] p-5">
                              <p className="font-mono-data text-[10px] uppercase tracking-wider text-[var(--color-blood)]">
                                [ Mulheres × Homens ]
                              </p>
                              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                <div>
                                  <div className="flex items-baseline justify-between">
                                    <span className="text-sm font-bold text-[var(--color-text)]">
                                      Deputadas
                                    </span>
                                    <span className="font-mono-data text-xs text-[var(--color-text-secondary)]">
                                      {f.total} votos
                                    </span>
                                  </div>
                                  <div className="mt-1 flex h-7 overflow-hidden rounded">
                                    {f.sim > 0 && (
                                      <div
                                        className="flex items-center justify-end bg-[var(--color-teal)] px-2 text-xs font-bold text-white"
                                        style={{ width: `${f.pctSim}%` }}
                                      >
                                        {f.pctSim >= 20 ? `${f.sim}` : ""}
                                      </div>
                                    )}
                                    {f.nao > 0 && (
                                      <div
                                        className="flex items-center justify-start bg-[var(--color-blood)] px-2 text-xs font-bold text-white"
                                        style={{ width: `${(f.nao / f.total) * 100}%` }}
                                      >
                                        {(f.nao / f.total) * 100 >= 20 ? `${f.nao}` : ""}
                                      </div>
                                    )}
                                  </div>
                                  <p className="mt-1 font-mono-data text-xs text-[var(--color-text-secondary)]">
                                    <strong className="text-[var(--color-teal)]">{f.pctSim}%</strong> votaram SIM
                                  </p>
                                </div>
                                <div>
                                  <div className="flex items-baseline justify-between">
                                    <span className="text-sm font-bold text-[var(--color-text)]">
                                      Deputados homens
                                    </span>
                                    <span className="font-mono-data text-xs text-[var(--color-text-secondary)]">
                                      {m.total} votos
                                    </span>
                                  </div>
                                  <div className="mt-1 flex h-7 overflow-hidden rounded">
                                    {m.sim > 0 && (
                                      <div
                                        className="flex items-center justify-end bg-[var(--color-teal)] px-2 text-xs font-bold text-white"
                                        style={{ width: `${m.pctSim}%` }}
                                      >
                                        {m.pctSim >= 20 ? `${m.sim}` : ""}
                                      </div>
                                    )}
                                    {m.nao > 0 && (
                                      <div
                                        className="flex items-center justify-start bg-[var(--color-blood)] px-2 text-xs font-bold text-white"
                                        style={{ width: `${(m.nao / m.total) * 100}%` }}
                                      >
                                        {(m.nao / m.total) * 100 >= 20 ? `${m.nao}` : ""}
                                      </div>
                                    )}
                                  </div>
                                  <p className="mt-1 font-mono-data text-xs text-[var(--color-text-secondary)]">
                                    <strong className="text-[var(--color-teal)]">{m.pctSim}%</strong> votaram SIM
                                  </p>
                                </div>
                              </div>
                              {gap >= 5 && (
                                <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                                  Diferença de <strong className="text-[var(--color-blood)]">
                                  {gap.toFixed(1)} pontos percentuais</strong> entre o apoio
                                  de deputadas e deputados.
                                </p>
                              )}
                            </div>
                          );
                        })()}

                        {/* Partidos */}
                        <p className="mb-1 mt-6 font-mono-data text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
                          [ Votos por partido ]
                        </p>
                        <p className="mb-3 font-mono-data text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                          largura da barra proporcional ao tamanho do partido
                        </p>
                        <div>
                          {parties.map(([party, data]) => (
                            <PartyRow key={party} party={party} data={data} maxTotal={maxPartyTotal} />
                          ))}
                        </div>

                      </div>

                      {/* Outras votações (procedurais) */}
                      {grupo.outras.length > 0 && (
                        <div className="rounded-lg border border-gray-200 bg-white p-5">
                          <p className="font-mono-data text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                            [ Outras votações desta proposição · {grupo.outras.length} ]
                          </p>
                          <ul className="mt-3 space-y-3">
                            {grupo.outras.map((o) => (
                              <li
                                key={o.id}
                                className="border-l-2 border-gray-200 pl-4 text-sm"
                              >
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-mono-data text-xs text-[var(--color-text-tertiary)]">
                                    {o.data}
                                  </span>
                                  <span className="rounded bg-[var(--color-bg-alt)] px-2 py-0.5 font-mono-data text-[9px] uppercase tracking-wider text-[var(--color-text-secondary)]">
                                    {o.tipo === "mérito" ? "Mérito" : "Procedural"}
                                  </span>
                                  <span className="font-mono-data text-xs">
                                    <span className="text-[var(--color-teal)] font-bold">{o.totalSim}</span>
                                    <span className="text-[var(--color-text-tertiary)]">×</span>
                                    <span className="text-[var(--color-blood)] font-bold">{o.totalNao}</span>
                                  </span>
                                </div>
                                <p className="mt-1 leading-relaxed text-[var(--color-text-secondary)]">
                                  {o.o_que_foi_votado}
                                </p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="mt-6 text-right">
                        <a
                          href={`https://www.camara.leg.br/propostas-legislativas/${grupo.pl_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono-data text-xs text-[var(--color-blood)] hover:underline"
                        >
                          Ver projeto completo na Câmara →
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-10 font-mono-data text-xs text-[var(--color-text-tertiary)]">
          Fonte: API de Dados Abertos da Câmara dos Deputados. Votações
          nominais em plenário entre 2023 e 2026 sobre proposições de
          violência contra a mulher com mais de 50 votos contestados.
          Agrupadas por proposição — votações procedurais de cada PL
          estão listadas dentro do card.
        </p>
      </div>
    </section>
  );
}
