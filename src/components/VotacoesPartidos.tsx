"use client";

import { useState } from "react";
import votacoesData from "../data/votacoes.json";
import RevealText from "./RevealText";

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
  totalSim: number;
  totalNao: number;
  resultado_placar: string;
  partidos: Record<
    string,
    { sim: number; nao: number; outros: number; total: number; pctSim: number }
  >;
};

type VotacoesJSON = { votacoes: Votacao[] };

const DATA = votacoesData as VotacoesJSON;

function PartyRow({
  party,
  data,
}: {
  party: string;
  data: { sim: number; nao: number; outros: number; total: number; pctSim: number };
}) {
  const pctSim = data.pctSim;
  const pctNao = data.total > 0 ? (data.nao / data.total) * 100 : 0;

  return (
    <div className="flex items-center gap-3 py-2">
      <span className="w-20 flex-shrink-0 font-mono-data text-xs font-bold text-[var(--color-text)]">
        {party}
      </span>
      <div className="flex h-6 flex-1 overflow-hidden rounded border border-gray-100">
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
      <span className="w-12 flex-shrink-0 text-right font-mono-data text-xs text-[var(--color-text-tertiary)]">
        {pctSim.toFixed(0)}%
      </span>
    </div>
  );
}

export default function VotacoesPartidos() {
  const [expanded, setExpanded] = useState<number | null>(0);
  const [filter, setFilter] = useState<"all" | "mérito" | "procedural">("all");

  const filteredVotacoes =
    filter === "all"
      ? DATA.votacoes
      : DATA.votacoes.filter((v) => v.tipo === filter);

  const meritoCount = DATA.votacoes.filter((v) => v.tipo === "mérito").length;
  const procedCount = DATA.votacoes.filter((v) => v.tipo === "procedural").length;

  return (
    <section className="bg-[var(--color-bg-alt)] px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 offset-left">
          <p className="mb-4 font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
            [ ATO 05 / DISCURSO E VOTO ]
          </p>
          <RevealText
            as="h2"
            text="Discurso"
            stagger={50}
            className="block text-5xl font-black leading-[0.9] text-[var(--color-text)] md:text-7xl"
          />
          <RevealText
            as="h2"
            text="e voto."
            stagger={50}
            delay={400}
            className="block text-5xl font-black leading-[0.9] text-[var(--color-blood)] md:text-7xl"
          />
        </div>

        <div className="mt-8 max-w-2xl space-y-4 text-lg leading-relaxed text-[var(--color-text-secondary)] md:text-xl">
          <p>
            As {DATA.votacoes.length} votações mais disputadas da atual
            legislatura (2023-2026) sobre violência contra a mulher. Cada card
            explica em detalhe o que foi votado, o que significa cada lado e
            como cada partido se posicionou.
          </p>
          <p className="text-base">
            <strong className="text-[var(--color-text)]">Importante:</strong>{" "}
            nem toda votação é sobre o mérito da proposta. Muitas são votações
            procedurais (requerimentos, destaques) que dizem respeito ao{" "}
            <em>rito</em> da tramitação, não ao conteúdo em si. Use o filtro
            abaixo para separar.
          </p>
        </div>

        {/* Filter */}
        <div className="mt-8 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
              filter === "all"
                ? "bg-[var(--color-text)] text-white"
                : "bg-white text-[var(--color-text-secondary)] hover:bg-gray-100"
            }`}
          >
            Todas ({DATA.votacoes.length})
          </button>
          <button
            onClick={() => setFilter("mérito")}
            className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
              filter === "mérito"
                ? "bg-[var(--color-teal)] text-white"
                : "bg-white text-[var(--color-text-secondary)] hover:bg-gray-100"
            }`}
          >
            De mérito ({meritoCount})
          </button>
          <button
            onClick={() => setFilter("procedural")}
            className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
              filter === "procedural"
                ? "bg-[var(--color-neutral)] text-white"
                : "bg-white text-[var(--color-text-secondary)] hover:bg-gray-100"
            }`}
          >
            Procedurais ({procedCount})
          </button>
        </div>

        <div className="mt-8 space-y-4">
          {filteredVotacoes.map((v, idx) => {
            const isOpen = expanded === idx;
            const parties = Object.entries(v.partidos).filter(
              ([, p]) => p.total >= 3
            );
            const isMerito = v.tipo === "mérito";
            return (
              <div
                key={v.id}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white"
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : idx)}
                  className="flex w-full items-start gap-4 p-6 text-left transition-colors hover:bg-[var(--color-bg-alt)]"
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono-data text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
                        {v.pl_ref}
                      </span>
                      <span className="font-mono-data text-xs text-[var(--color-text-tertiary)]">
                        · {v.data}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 font-mono-data text-[9px] font-bold uppercase tracking-widest ${
                          isMerito
                            ? "bg-[var(--color-teal)] text-white"
                            : "bg-[var(--color-neutral)] text-white"
                        }`}
                      >
                        {isMerito ? "Mérito" : "Procedural"}
                      </span>
                    </div>
                    <h3
                      className="mt-2 text-xl font-bold leading-tight text-[var(--color-text)] md:text-2xl"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {v.o_que_foi_votado}
                    </h3>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
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
                  <span className="mt-1 font-mono-data text-sm text-[var(--color-text-tertiary)]">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>

                {isOpen && (
                  <div className="border-t border-gray-100 bg-[var(--color-bg-alt)] p-6">
                    {/* Sobre o projeto */}
                    <div className="mb-6 rounded-lg border border-gray-200 bg-white p-5">
                      <p className="font-mono-data text-[10px] uppercase tracking-wider text-[var(--color-blood)]">
                        Sobre o projeto de lei
                      </p>
                      <p className="mt-2 text-base leading-relaxed text-[var(--color-text)]">
                        {v.projeto_sobre}
                      </p>
                    </div>

                    {/* Resultado */}
                    <div className="mb-6 rounded-lg border border-gray-200 bg-white p-5">
                      <p className="font-mono-data text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                        Resultado
                      </p>
                      <p className="mt-2 text-base leading-relaxed text-[var(--color-text)]">
                        {v.resultado}
                      </p>
                    </div>

                    {/* Interpretações Sim/Não */}
                    <div className="mb-6 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg border-l-4 border-[var(--color-teal)] bg-white p-5">
                        <p className="font-mono-data text-[10px] uppercase tracking-wider text-[var(--color-teal)]">
                          Votar SIM significa
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-[var(--color-text)]">
                          {v.interpretacao_sim}
                        </p>
                      </div>
                      <div className="rounded-lg border-l-4 border-[var(--color-blood)] bg-white p-5">
                        <p className="font-mono-data text-[10px] uppercase tracking-wider text-[var(--color-blood)]">
                          Votar NÃO significa
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-[var(--color-text)]">
                          {v.interpretacao_nao}
                        </p>
                      </div>
                    </div>

                    {/* Votos por partido */}
                    <p className="mb-3 font-mono-data text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      Votos por partido (mínimo 3 votantes)
                    </p>
                    <div>
                      {parties.map(([party, data]) => (
                        <PartyRow key={party} party={party} data={data} />
                      ))}
                    </div>

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-[10px] text-[var(--color-text-tertiary)]">
                      <span className="font-mono-data">
                        % = quanto do partido votou SIM
                      </span>
                      <a
                        href={`https://www.camara.leg.br/propostas-legislativas/${v.pl_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono-data hover:text-[var(--color-blood)]"
                      >
                        Ver projeto na Câmara →
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-10 font-mono-data text-xs text-[var(--color-text-tertiary)]">
          Fonte: API de Dados Abertos da Câmara dos Deputados. Votações
          nominais em plenário entre 2023 e 2026 sobre proposições de
          violência contra a mulher com mais de 50 votos contestados.
        </p>
      </div>
    </section>
  );
}
