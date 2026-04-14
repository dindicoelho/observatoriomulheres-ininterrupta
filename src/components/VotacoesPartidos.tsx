"use client";

import { useState } from "react";
import votacoesData from "../data/votacoes.json";
import RevealText from "./RevealText";

type Votacao = {
  id: string;
  pl_ref: string;
  titulo: string;
  descricao_votacao: string;
  interpretacao_sim: string;
  interpretacao_nao: string;
  totalSim: number;
  totalNao: number;
  resultado: string;
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

  return (
    <section className="bg-[var(--color-bg-alt)] px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 offset-left">
          <p className="mb-4 font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
            Ato 06 · Como cada partido votou
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

        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-[var(--color-text-secondary)] md:text-xl">
          Entre as {DATA.votacoes.length > 0 ? DATA.votacoes.length : 0} votações
          nominais mais disputadas sobre o tema no plenário, a divergência entre
          partidos é clara. Nem sempre quem fala mais, vota melhor.
        </p>

        <div className="mt-12 space-y-4">
          {DATA.votacoes.map((v, idx) => {
            const isOpen = expanded === idx;
            const parties = Object.entries(v.partidos).filter(
              ([, p]) => p.total >= 3
            );
            return (
              <div
                key={v.id}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white"
              >
                {/* Header */}
                <button
                  onClick={() => setExpanded(isOpen ? null : idx)}
                  className="flex w-full items-start gap-4 p-6 text-left transition-colors hover:bg-[var(--color-bg-alt)]"
                >
                  <div className="flex-1">
                    <p className="font-mono-data text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      {v.pl_ref}
                    </p>
                    <h3
                      className="mt-1 text-xl font-bold text-[var(--color-text)] md:text-2xl"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {v.titulo}
                    </h3>
                    <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                      {v.descricao_votacao}
                    </p>

                    {/* Totais */}
                    <div className="mt-4 flex flex-wrap items-center gap-4">
                      <span className="flex items-center gap-2 text-sm">
                        <span className="h-3 w-3 rounded-sm bg-[var(--color-teal)]" />
                        <span className="font-mono-data font-bold text-[var(--color-teal)]">
                          {v.totalSim}
                        </span>
                        <span className="text-[var(--color-text-secondary)]">SIM</span>
                      </span>
                      <span className="flex items-center gap-2 text-sm">
                        <span className="h-3 w-3 rounded-sm bg-[var(--color-blood)]" />
                        <span className="font-mono-data font-bold text-[var(--color-blood)]">
                          {v.totalNao}
                        </span>
                        <span className="text-[var(--color-text-secondary)]">NÃO</span>
                      </span>
                      <span
                        className={`rounded-full px-3 py-0.5 font-mono-data text-[10px] font-bold uppercase tracking-widest ${
                          v.resultado === "aprovado"
                            ? "bg-[var(--color-teal)] text-white"
                            : "bg-[var(--color-blood)] text-white"
                        }`}
                      >
                        {v.resultado}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono-data text-sm text-[var(--color-text-tertiary)]">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>

                {/* Expanded */}
                {isOpen && (
                  <div className="border-t border-gray-100 p-6 bg-[var(--color-bg-alt)]">
                    <div className="mb-6 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg bg-white p-4">
                        <p className="font-mono-data text-[10px] uppercase tracking-wider text-[var(--color-teal)]">
                          Votar SIM significa:
                        </p>
                        <p className="mt-2 text-sm text-[var(--color-text)]">
                          {v.interpretacao_sim}
                        </p>
                      </div>
                      <div className="rounded-lg bg-white p-4">
                        <p className="font-mono-data text-[10px] uppercase tracking-wider text-[var(--color-blood)]">
                          Votar NÃO significa:
                        </p>
                        <p className="mt-2 text-sm text-[var(--color-text)]">
                          {v.interpretacao_nao}
                        </p>
                      </div>
                    </div>

                    <p className="mb-3 font-mono-data text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      Votos por partido (mínimo 3 votantes)
                    </p>
                    <div>
                      {parties.map(([party, data]) => (
                        <PartyRow key={party} party={party} data={data} />
                      ))}
                    </div>

                    <div className="mt-4 flex items-center justify-between text-[10px] text-[var(--color-text-tertiary)]">
                      <span>% = quanto do partido votou SIM</span>
                      <a
                        href={`https://www.camara.leg.br/evento-legislativo/votacoes/${v.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono-data hover:text-[var(--color-blood)]"
                      >
                        Ver na Câmara →
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-10 font-mono-data text-xs text-[var(--color-text-tertiary)]">
          Fonte: API de Dados Abertos da Câmara dos Deputados. Votações nominais
          contestadas (mais de 100 votantes) em plenário sobre proposições de
          violência contra a mulher entre 2023 e 2026.
        </p>
      </div>
    </section>
  );
}
