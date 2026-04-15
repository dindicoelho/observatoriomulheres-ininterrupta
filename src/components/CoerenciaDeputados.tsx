"use client";

import { useState } from "react";
import coerenciaData from "../data/coerencia.json";
import RevealText from "./RevealText";

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

const DATA = coerenciaData as CoerenciaJSON;

// Filter: only deputies with at least 2 participations (sample grande o suficiente)
const WITH_SAMPLE = DATA.deputados.filter((d) => d.participacoes >= 2);

const TOP_PRO = [...WITH_SAMPLE]
  .filter((d) => d.score === 100 && d.participacoes >= 3)
  .sort((a, b) => b.participacoes - a.participacoes || a.nome.localeCompare(b.nome))
  .slice(0, 20);

const BOTTOM_ANTI = [...WITH_SAMPLE]
  .filter((d) => d.score === 0)
  .sort((a, b) => b.participacoes - a.participacoes || b.nao - a.nao)
  .slice(0, 20);

const TOTAL_100 = WITH_SAMPLE.filter((d) => d.score === 100 && d.participacoes >= 3).length;
const TOTAL_0 = WITH_SAMPLE.filter((d) => d.score === 0).length;
const TOTAL_PARTICIPANTES = DATA.deputados.length;

function DeputadoCard({ d, variant }: { d: CoerenciaDeputado; variant: "pro" | "anti" }) {
  const color = variant === "pro" ? "var(--color-teal)" : "var(--color-blood)";
  return (
    <div className="flex items-start gap-3 rounded-lg border border-gray-100 bg-white p-3">
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
      <div className="flex flex-shrink-0 items-center gap-1">
        {Array.from({ length: d.participacoes }).map((_, i) => (
          <span
            key={i}
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: color }}
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
    </div>
  );
}

export default function CoerenciaDeputados() {
  const [tab, setTab] = useState<"pro" | "anti">("anti");

  return (
    <section className="bg-[var(--color-bg-alt)] px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 offset-left">
          <p className="mb-4 font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
            [ PÓS-ATO 02 / GUIA ELEITORAL ]
          </p>
          <RevealText
            as="h2"
            text="Quem protege"
            stagger={40}
            className="block text-5xl font-black leading-[0.9] text-[var(--color-text)] md:text-7xl"
          />
          <RevealText
            as="h2"
            text="e quem não?"
            stagger={40}
            delay={400}
            className="block text-5xl font-black leading-[0.9] text-[var(--color-blood)] md:text-7xl"
          />
        </div>

        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-[var(--color-text-secondary)] md:text-xl">
          Cruzando os votos individuais das 4 votações de mérito, é
          possível saber quantas vezes cada deputado votou{" "}
          <strong className="text-[var(--color-teal)]">a favor</strong> da
          proteção às mulheres — e quantas{" "}
          <strong className="text-[var(--color-blood)]">contra</strong>.
        </p>

        {/* Stats */}
        <div className="mt-10 grid gap-4 md:grid-cols-3">
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
              deputados participaram de ao menos uma das 4 votações
            </p>
          </div>
          <div className="rounded-xl bg-[var(--color-teal)]/10 p-5">
            <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--color-teal)]">
              [ 100% Pró-proteção ]
            </p>
            <p
              className="mt-2 text-4xl font-black text-[var(--color-teal)]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {TOTAL_100}
            </p>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              votaram SIM em ao menos 3 das 4 PLs-chave, sem nenhuma recusa
            </p>
          </div>
          <div className="rounded-xl bg-[var(--color-blood)]/10 p-5">
            <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--color-blood)]">
              [ 0% Pró-proteção ]
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

        {/* Tabs */}
        <div className="mt-16 flex flex-wrap gap-2">
          <button
            onClick={() => setTab("anti")}
            className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
              tab === "anti"
                ? "bg-[var(--color-blood)] text-white"
                : "bg-white text-[var(--color-text-secondary)] hover:bg-gray-100"
            }`}
          >
            Votaram contra ({BOTTOM_ANTI.length})
          </button>
          <button
            onClick={() => setTab("pro")}
            className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
              tab === "pro"
                ? "bg-[var(--color-teal)] text-white"
                : "bg-white text-[var(--color-text-secondary)] hover:bg-gray-100"
            }`}
          >
            Votaram pró em todas ({TOP_PRO.length})
          </button>
        </div>

        <div className="mt-8">
          {tab === "anti" && (
            <>
              <p className="mb-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                Deputados que votaram NÃO em todas as votações de mérito em
                que participaram. São os nomes mais anti-proteção do
                plenário — pelo menos nessa amostra de votações. Ordenado
                por número de votos NÃO registrados.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {BOTTOM_ANTI.map((d) => (
                  <DeputadoCard key={d.id} d={d} variant="anti" />
                ))}
              </div>
            </>
          )}
          {tab === "pro" && (
            <>
              <p className="mb-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                Deputados com histórico 100% pró-proteção em pelo menos 3
                das 4 votações de mérito. Mostrando 20 com mais
                participações.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {TOP_PRO.map((d) => (
                  <DeputadoCard key={d.id} d={d} variant="pro" />
                ))}
              </div>
            </>
          )}
        </div>

        <p className="mt-10 font-mono-data text-xs text-[var(--color-text-tertiary)]">
          Bolinhas coloridas representam participações em votações. Bolinhas
          vazias = ausências. O índice considera apenas as 4 votações
          nominais de mérito. Não reflete todo o histórico do deputado, mas
          é uma amostra relevante.
        </p>
      </div>
    </section>
  );
}
