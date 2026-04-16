"use client";

import { useState, useEffect } from "react";
import coerenciaData from "../data/coerencia.json";
import votacoesData from "../data/votacoes.json";
import ScrollFloat from "./ScrollFloat";

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

type VotacoesJSON = {
  votacoes: Array<{
    id: string;
    pl_ref: string;
    pl_id: number;
    projeto_sobre: string;
    o_que_foi_votado: string;
    interpretacao_sim: string;
    interpretacao_nao: string;
    tipo: string;
  }>;
};

const DATA = coerenciaData as CoerenciaJSON;
const VOT_DATA = votacoesData as VotacoesJSON;

// Build vote_id -> info for the mérito votes
const VOTE_INFO = new Map<string, typeof VOT_DATA.votacoes[0]>();
VOT_DATA.votacoes.forEach((v) => {
  if (DATA.merito_vote_ids.includes(v.id)) {
    VOTE_INFO.set(v.id, v);
  }
});

const WITH_SAMPLE = DATA.deputados.filter((d) => d.participacoes >= 2);

const BOTTOM_ANTI = [...WITH_SAMPLE]
  .filter((d) => d.score === 0)
  .sort((a, b) => b.participacoes - a.participacoes || b.nao - a.nao)
  .slice(0, 20);

const TOTAL_100 = WITH_SAMPLE.filter((d) => d.score === 100 && d.participacoes >= 3).length;
const TOTAL_0 = WITH_SAMPLE.filter((d) => d.score === 0).length;
const TOTAL_PARTICIPANTES = DATA.deputados.length;

function DeputadoModal({
  deputado,
  onClose,
}: {
  deputado: CoerenciaDeputado;
  onClose: () => void;
}) {
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

  // Get votes where he voted NÃO
  const nosVotes = DATA.merito_vote_ids.filter(
    (vid) => deputado.votes_by_id[vid] === "Não"
  );
  const sinsVotes = DATA.merito_vote_ids.filter(
    (vid) => deputado.votes_by_id[vid] === "Sim"
  );
  const ausentesVotes = DATA.merito_vote_ids.filter(
    (vid) => !["Sim", "Não"].includes(deputado.votes_by_id[vid] || "")
  );

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
            </p>
            <p className="mt-3 text-sm font-bold text-[var(--color-blood)]">
              Votou NÃO em {deputado.nao} de {deputado.participacoes} votações
              de mérito em que participou.
            </p>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-[var(--color-bg-alt)] p-6">
          {/* Votou NÃO */}
          {nosVotes.length > 0 && (
            <section>
              <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--color-blood)]">
                [ Votou NÃO em {nosVotes.length} ]
              </p>
              <ul className="mt-3 space-y-3">
                {nosVotes.map((vid) => {
                  const info = VOTE_INFO.get(vid);
                  if (!info) return null;
                  return (
                    <li
                      key={vid}
                      className="rounded-lg border-l-4 border-[var(--color-blood)] bg-white p-4"
                    >
                      <p className="font-mono-data text-xs text-[var(--color-text-tertiary)]">
                        {info.pl_ref}
                      </p>
                      <p className="mt-1 text-base font-bold leading-tight text-[var(--color-text)]">
                        {info.o_que_foi_votado}
                      </p>
                      <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                        <strong className="text-[var(--color-text)]">O projeto:</strong>{" "}
                        {info.projeto_sobre}
                      </p>
                      <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                        <strong className="text-[var(--color-blood)]">
                          Votar NÃO significou:
                        </strong>{" "}
                        {info.interpretacao_nao}
                      </p>
                      <a
                        href={`https://www.camara.leg.br/propostas-legislativas/${info.pl_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-block font-mono-data text-xs text-[var(--color-blood)] hover:underline"
                      >
                        Ver projeto na Câmara →
                      </a>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* Votou SIM (secondary) */}
          {sinsVotes.length > 0 && (
            <section className="mt-8">
              <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--color-teal)]">
                [ Votou SIM em {sinsVotes.length} ]
              </p>
              <ul className="mt-3 space-y-2">
                {sinsVotes.map((vid) => {
                  const info = VOTE_INFO.get(vid);
                  if (!info) return null;
                  return (
                    <li key={vid} className="rounded bg-white p-3 text-sm">
                      <span className="font-mono-data text-xs text-[var(--color-text-tertiary)]">
                        {info.pl_ref}
                      </span>
                      <span className="ml-2 text-[var(--color-text-secondary)]">
                        {info.o_que_foi_votado}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* Ausentes */}
          {ausentesVotes.length > 0 && (
            <section className="mt-8">
              <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
                [ Não votou em {ausentesVotes.length} ]
              </p>
              <ul className="mt-3 space-y-2">
                {ausentesVotes.map((vid) => {
                  const info = VOTE_INFO.get(vid);
                  if (!info) return null;
                  return (
                    <li
                      key={vid}
                      className="rounded bg-white p-3 text-sm text-[var(--color-text-tertiary)]"
                    >
                      <span className="font-mono-data text-xs">
                        {info.pl_ref}
                      </span>
                      <span className="ml-2">
                        {info.o_que_foi_votado}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 bg-white p-4 text-center">
          <a
            href={`https://www.camara.leg.br/deputados/${deputado.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono-data text-xs uppercase tracking-widest text-[var(--color-blood)] hover:underline"
          >
            Perfil completo na Câmara →
          </a>
        </div>
      </div>
    </div>
  );
}

export default function CoerenciaDeputados() {
  const [selected, setSelected] = useState<CoerenciaDeputado | null>(null);

  return (
    <>
      <section className="bg-[var(--color-bg-alt)] px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 offset-left">
            <p className="mb-4 font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
              [ GUIA ELEITORAL ]
            </p>
            <ScrollFloat
              as="h2"
              text="Quem votou"
              stagger={40}
              className="block text-3xl font-black leading-[0.9] md:text-5xl text-[var(--color-text)] lg:text-7xl"
            />
            <ScrollFloat
              as="h2"
              text="contra?"
              stagger={40}
              delay={400}
              className="block text-3xl font-black leading-[0.9] md:text-5xl text-[var(--color-blood)] lg:text-7xl"
            />
          </div>

          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-[var(--color-text-secondary)] md:text-xl">
            Cruzando os votos individuais das 4 votações de mérito, é
            possível ver quais deputados votaram NÃO em todas as
            votações em que participaram. Clique em cada um para ver
            exatamente o que rejeitaram.
          </p>

          {/* Nuance disclaimer — ANTES da lista */}
          <div className="mt-6 rounded-xl border border-[var(--color-text-tertiary)]/20 bg-[var(--color-bg-alt)] p-5">
            <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
              [ Nota importante de leitura ]
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              <strong className="text-[var(--color-text)]">
                Votar NÃO nem sempre significa ser contra a proteção de
                mulheres.
              </strong>{" "}
              Em votações do tipo &ldquo;Mantido o texto&rdquo;, votar
              NÃO pode significar que o deputado queria uma versão{" "}
              <em>mais forte</em> da proposta — não necessariamente que
              era contra ela. O contexto de cada votação aparece dentro
              do card de cada deputado. Use esta lista como ponto de
              partida para investigar, não como veredito.
            </p>
          </div>

          {/* Stats */}
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-white p-5">
              <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
                [ Total de participantes ]
              </p>
              <p
                className="mt-2 text-4xl font-black text-[var(--color-text)]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {TOTAL_PARTICIPANTES}
              </p>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                deputados participaram de ao menos uma das 4 votações de mérito
              </p>
            </div>
            <div className="rounded-xl bg-[var(--color-blood)]/10 p-5">
              <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--color-blood)]">
                [ Votaram contra em 100% ]
              </p>
              <p
                className="mt-2 text-4xl font-black text-[var(--color-blood)]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {TOTAL_0}
              </p>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                votaram NÃO em todas as votações em que participaram
              </p>
            </div>
          </div>

          {/* Title */}
          <div className="mt-12 mb-4 flex items-baseline justify-between gap-3">
            <p className="font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
              [ Top {BOTTOM_ANTI.length} · ordenado por participações ]
            </p>
            <p className="hidden font-mono-data text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)] sm:block">
              ● votou contra · ○ ausente
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {BOTTOM_ANTI.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelected(d)}
                className="flex items-start gap-3 rounded-lg border border-gray-100 bg-white p-3 text-left transition-all hover:border-[var(--color-blood)] hover:shadow-md"
              >
                {d.foto && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={d.foto}
                    alt=""
                    loading="lazy"
                    className="h-10 w-10 flex-shrink-0 rounded-full object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[var(--color-text)]">
                    {d.nome}
                  </p>
                  <p className="font-mono-data text-[10px] text-[var(--color-text-tertiary)]">
                    {d.partido} · {d.uf}
                  </p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-1 pt-1">
                  {Array.from({ length: d.participacoes }).map((_, i) => (
                    <span
                      key={i}
                      className="inline-block h-2 w-2 rounded-full bg-[var(--color-blood)]"
                    />
                  ))}
                  {d.ausencias > 0 &&
                    Array.from({ length: d.ausencias }).map((_, i) => (
                      <span
                        key={`a-${i}`}
                        className="inline-block h-2 w-2 rounded-full border border-gray-300"
                      />
                    ))}
                </div>
              </button>
            ))}
          </div>

          <p className="mt-10 font-mono-data text-xs text-[var(--color-text-tertiary)]">
            Outros <strong className="text-[var(--color-teal)]">{TOTAL_100}</strong> deputados votaram
            pró-proteção em pelo menos 3 das 4 votações, sem nenhuma
            recusa. O índice considera apenas as 4 votações nominais de
            mérito — não reflete todo o histórico parlamentar, mas é uma
            amostra relevante.
          </p>
        </div>
      </section>

      {selected && (
        <DeputadoModal deputado={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
