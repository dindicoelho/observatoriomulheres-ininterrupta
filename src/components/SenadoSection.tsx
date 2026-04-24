"use client";

import { useState } from "react";
import senadoData from "../data/senado.json";
import ScrollFloat from "./ScrollFloat";
import ShareButton from "./ShareButton";
import Counter from "./Counter";

type Senador = {
  id: number;
  nome: string;
  partido: string;
  uf: string;
  foto: string;
  sexo: "F" | "M";
  total: number;
  estruturais: number;
  incrementais: number;
  simbolicas: number;
  protetivos: number;
  punitivistas: number;
  regressivos: number;
  score: number;
  pls: Array<{
    codigo: string;
    sigla: string;
    numero: string;
    ano: string;
    ementa: string;
    categoria: string;
    stance: string;
  }>;
};

type SenadoJSON = {
  ranking: Senador[];
  total_senadores: number;
  senadores_F: number;
  senadores_M: number;
  total_materias: number;
  total_protetivas: number;
  total_regressivas: number;
  total_punitivistas: number;
  atualizado: string;
};

const DATA = senadoData as SenadoJSON;

export default function SenadoSection() {
  const [selectedSen, setSelectedSen] = useState<Senador | null>(null);
  const top15 = DATA.ranking.slice(0, 15);
  const topF = top15.filter((s) => s.sexo === "F").length;
  const pctF = ((DATA.senadores_F / DATA.total_senadores) * 100).toFixed(0);

  return (
    <>
      {/* Modal */}
      {selectedSen && (
        <SenadorModal senador={selectedSen} onClose={() => setSelectedSen(null)} />
      )}

      <section className="bg-[var(--color-bg-alt)] px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 offset-left">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
                [ SENADO FEDERAL ]
              </p>
              <ShareButton path="/senado" title="Senado: quem propõe leis sobre violência contra a mulher" />
            </div>
            <ScrollFloat
              as="h2"
              text="E no Senado?"
              stagger={40}
              className="block text-3xl font-black leading-[0.9] md:text-5xl text-[var(--color-text)] lg:text-7xl"
            />
          </div>

          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-[var(--color-text-secondary)] md:text-xl">
            O Senado tem {DATA.total_senadores} senadores —{" "}
            <strong className="text-[var(--color-text)]">
              {DATA.senadores_F} são mulheres ({pctF}%)
            </strong>
            . Na legislatura atual, foram apresentadas{" "}
            <strong className="text-[var(--color-text)]">
              {DATA.total_materias} matérias
            </strong>{" "}
            sobre violência contra a mulher. Clique em cada senador
            pra ver os projetos.
          </p>

          {/* Big stats */}
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-[var(--color-blue)]/20 bg-white p-6">
              <p
                className="leading-none text-[var(--color-blue)]"
                style={{
                  fontFamily: "var(--font-display-condensed)",
                  fontSize: "clamp(2.5rem, 6vw, 4rem)",
                  letterSpacing: "-0.03em",
                }}
              >
                <Counter to={topF} duration={1500} />/15
              </p>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                do top 15 são mulheres
              </p>
              <p className="mt-1 font-mono-data text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                {pctF}% da composição, dominam o ranking
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <p
                className="leading-none text-[var(--color-text)]"
                style={{
                  fontFamily: "var(--font-display-condensed)",
                  fontSize: "clamp(2.5rem, 6vw, 4rem)",
                  letterSpacing: "-0.03em",
                }}
              >
                <Counter to={DATA.total_materias} duration={1500} />
              </p>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                matérias sobre o tema
              </p>
              <p className="mt-1 font-mono-data text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                Legislatura 2023-2026
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <p
                className="leading-none text-[var(--color-text)]"
                style={{
                  fontFamily: "var(--font-display-condensed)",
                  fontSize: "clamp(2.5rem, 6vw, 4rem)",
                  letterSpacing: "-0.03em",
                }}
              >
                <Counter to={DATA.total_punitivistas} duration={1500} />
              </p>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                punitivistas
              </p>
              <p className="mt-1 font-mono-data text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                {DATA.total_regressivas} regressivas
              </p>
            </div>
          </div>

          {/* Disclaimer score */}
          <div className="mt-14 rounded-xl border border-[var(--color-text-tertiary)]/20 bg-white p-5">
            <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
              [ Sobre este ranking ]
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              Score = <strong>[(PLs estruturais × 2) + (PLs incrementais
              × 1) − (PLs regressivas × 5)] × peso_sexo</strong>. O{" "}
              <strong>peso_sexo</strong> é <strong>5 para mulheres</strong>{" "}
              e 1,0 para homens. Requerimentos (RQS, REQ) e indicações
              (INS) são filtrados — contam apenas projetos de lei,
              PECs, PDLs e resoluções.
            </p>
          </div>

          {/* Ranking */}
          <div className="mt-8">
            <p className="mb-6 font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
              [ Top 15 senadores · produção legislativa sobre mulher ]
            </p>
            <div className="space-y-2">
              {top15.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSen(s)}
                  className="flex w-full items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 text-left transition-colors hover:border-[var(--color-blue)]/40 hover:bg-[var(--color-blue)]/5"
                >
                  <span
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-mono-data text-sm font-bold"
                    style={{
                      backgroundColor: i < 3 ? "#DCFF00" : "var(--color-bg-alt)",
                      color: i < 3 ? "#0A0A0A" : "var(--color-text)",
                    }}
                  >
                    {i + 1}
                  </span>
                  {s.foto && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={s.foto}
                      alt=""
                      loading="lazy"
                      className="h-10 w-10 flex-shrink-0 rounded-full object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[var(--color-text)]">
                      {s.nome}
                    </p>
                    <p className="font-mono-data text-[10px] text-[var(--color-text-tertiary)]">
                      {s.partido} · {s.uf}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="rounded bg-[var(--color-bg-alt)] px-2 py-0.5 font-mono-data text-[10px] font-bold text-[var(--color-text)]">
                      {s.total} PLs
                    </span>
                    {s.estruturais > 0 && (
                      <span className="rounded bg-[#0A0A0A] px-2 py-0.5 font-mono-data text-[10px] font-bold text-[#DCFF00]">
                        {s.estruturais} estr
                      </span>
                    )}
                    {s.punitivistas > 0 && (
                      <span className="rounded bg-amber-500/15 px-2 py-0.5 font-mono-data text-[10px] font-bold text-amber-700">
                        {s.punitivistas} punit
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <p className="mt-8 font-mono-data text-xs text-[var(--color-text-tertiary)]">
            Fonte: API de Dados Abertos do Senado Federal ·
            Legislatura 2023-2026 · ~80 palavras-chave ·
            Atualização automática diária.
          </p>
        </div>
      </section>
    </>
  );
}

function SenadorModal({
  senador,
  onClose,
}: {
  senador: Senador;
  onClose: () => void;
}) {
  const [filter, setFilter] = useState<"all" | "protetivo" | "punitivista" | "regressivo">("all");

  const filteredPls =
    filter === "all"
      ? senador.pls
      : senador.pls.filter((p) => p.stance === filter);

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/70 backdrop-blur-sm md:items-center md:px-4"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl md:h-auto md:max-h-[90vh] md:max-w-2xl md:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4 border-b border-gray-100 p-6">
          {senador.foto && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={senador.foto} alt="" className="h-16 w-16 flex-shrink-0 rounded-full object-cover" />
          )}
          <div className="flex-1">
            <h3
              className="text-2xl font-bold text-[var(--color-text)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Sen. {senador.nome}
            </h3>
            <p className="font-mono-data text-sm text-[var(--color-text-tertiary)]">
              {senador.partido} · {senador.uf} · Senado Federal
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {senador.protetivos > 0 && (
                <button
                  onClick={() => setFilter(filter === "protetivo" ? "all" : "protetivo")}
                  className={`rounded px-2 py-0.5 font-mono-data text-[10px] font-bold uppercase tracking-wider transition-colors ${
                    filter === "protetivo"
                      ? "bg-[#1DB389] text-white"
                      : "bg-[#1DB389]/10 text-[#0F8B6B] hover:bg-[#1DB389]/20"
                  }`}
                >
                  {senador.protetivos} protetivos
                </button>
              )}
              {senador.punitivistas > 0 && (
                <button
                  onClick={() => setFilter(filter === "punitivista" ? "all" : "punitivista")}
                  className={`rounded px-2 py-0.5 font-mono-data text-[10px] font-bold uppercase tracking-wider transition-colors ${
                    filter === "punitivista"
                      ? "bg-amber-500 text-white"
                      : "bg-amber-500/15 text-amber-700 hover:bg-amber-500/25"
                  }`}
                >
                  {senador.punitivistas} punitivistas
                </button>
              )}
              {senador.regressivos > 0 && (
                <button
                  onClick={() => setFilter(filter === "regressivo" ? "all" : "regressivo")}
                  className={`rounded px-2 py-0.5 font-mono-data text-[10px] font-bold uppercase tracking-wider transition-colors ${
                    filter === "regressivo"
                      ? "bg-red-600 text-white"
                      : "bg-red-600/15 text-red-700 hover:bg-red-600/25"
                  }`}
                >
                  {senador.regressivos} regressivos
                </button>
              )}
            </div>
          </div>
          <button onClick={onClose} className="flex-shrink-0 rounded-full bg-[var(--color-bg-alt)] p-2 hover:bg-gray-200" aria-label="Fechar">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <ul className="divide-y divide-gray-100">
            {filteredPls.map((pl) => (
              <li key={pl.codigo} className="p-5 hover:bg-[var(--color-bg-alt)]">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono-data text-sm font-bold text-[var(--color-text)]">
                    {pl.sigla} {pl.numero}/{pl.ano}
                  </span>
                  {pl.stance === "punitivista" && (
                    <span className="rounded bg-amber-500/15 px-1.5 py-0.5 font-mono-data text-[9px] font-bold uppercase text-amber-700">
                      punitivista
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  {pl.ementa.length > 280 ? pl.ementa.slice(0, 280) + "…" : pl.ementa}
                </p>
                <a
                  href={`https://www25.senado.leg.br/web/atividade/materias/-/materia/${pl.codigo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block font-mono-data text-xs text-[var(--color-blue)] hover:underline"
                >
                  Ver no Senado →
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-gray-100 bg-[var(--color-bg-alt)] p-4 text-center">
          <a
            href={`https://www25.senado.leg.br/web/senadores/senador/-/perfil/${senador.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono-data text-xs text-[var(--color-blue)] hover:underline"
          >
            Ver perfil completo no Senado →
          </a>
        </div>
      </div>
    </div>
  );
}
