"use client";

import { useState, useEffect } from "react";
import autoriaData from "../data/autoria.json";
import coerenciaData from "../data/coerencia.json";
import relatoriaData from "../data/relatoria.json";
import candidatosData from "../data/candidatos_2026.json";
import votacoesData from "../data/votacoes.json";
import ScrollFloat from "./ScrollFloat";
import Counter from "./Counter";
import AnimatedList from "./AnimatedList";
import ShareButton from "./ShareButton";

type PL = {
  id: number;
  tipo: string;
  numero: number;
  ano: number;
  ementa: string;
  data: string;
  categoria: "simbólica" | "incremental" | "estrutural";
  stance?: "protetivo" | "punitivista" | "regressivo" | "nao_classificado";
  llm_justificativa?: string;
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
  protetivos?: number;
  punitivistas?: number;
  regressivos?: number;
  votos_regressivos?: number;
  votos_regressivos_detalhe?: Array<{
    pl_ref: string;
    descricao: string;
    data: string;
    placar: string;
    voto: string;
  }>;
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

// Labels das votações de mérito — derivados de votacoes.json
// (mesma fonte que rebuild_coerencia.py usa pros IDs). Quando
// update_votacoes.py detectar uma nova votação de mérito, ela
// aparece automaticamente no modal sem precisar editar nada aqui.
type VotacoesJSON = {
  votacoes: Array<{
    id: string;
    pl_ref?: string;
    titulo_curto?: string;
    tipo?: string;
    totalSim?: number;
    totalNao?: number;
  }>;
};
const VOTACOES = votacoesData as VotacoesJSON;
const MERITO_LABELS: Record<string, string> = Object.fromEntries(
  VOTACOES.votacoes
    .filter((v) => v.tipo === "mérito")
    .map((v) => [
      v.id,
      v.titulo_curto ? `${v.pl_ref ?? "?"} — ${v.titulo_curto}` : (v.pl_ref ?? v.id),
    ])
);
// Votações de mérito aprovadas por acordo/consenso vêm da API com placar
// 0×0 (sem registro nominal). Pra esses casos, "ausência" no votes_by_id
// não significa que o deputado faltou — significa que ninguém foi
// chamado a votar individualmente.
const MERITO_CONSENSO_IDS = new Set<string>(
  VOTACOES.votacoes
    .filter(
      (v) =>
        v.tipo === "mérito" &&
        (v.totalSim ?? 0) + (v.totalNao ?? 0) === 0
    )
    .map((v) => v.id)
);

// IDs das votações de mérito vêm de coerencia.json (que por sua vez
// derivou de votacoes.json no pipeline). As duas fontes têm que bater.
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

const CATEGORY_LABELS_PLURAL: Record<string, string> = {
  simbólica: "Simbólicas",
  incremental: "Incrementais",
  estrutural: "Estruturais",
};

// ── Detecção de "protocolo em massa" ──────────────────────────────
// Protocolar dezenas de PLs no mesmo dia ("fábrica de PL") infla a
// produção sem trabalho legislativo real — é position-taking (Mayhew).
// Aqui apenas SINALIZAMOS o padrão de forma genérica: qualquer deputado
// que faça o mesmo recebe o mesmo alerta. Nada é hardcoded a ninguém.
const SURTO_FLAG_MIN = 10; // nº de PLs no mesmo dia a partir do qual sinalizamos

function maiorSurto(pls: PL[]): { qtd: number; data: string | null } {
  const porDia = new Map<string, number>();
  for (const p of pls) {
    const dia = (p.data || "").slice(0, 10);
    if (!dia) continue;
    porDia.set(dia, (porDia.get(dia) ?? 0) + 1);
  }
  let qtd = 0;
  let data: string | null = null;
  for (const [dia, n] of porDia) {
    if (n > qtd) {
      qtd = n;
      data = dia;
    }
  }
  return { qtd, data };
}

function formatarData(iso: string | null): string {
  if (!iso) return "";
  const [a, m, d] = iso.split("-");
  return d && m && a ? `${d}/${m}/${a}` : iso;
}

function DeputadoModal({
  deputado,
  onClose,
}: {
  deputado: Deputado;
  onClose: () => void;
}) {
  const [filter, setFilter] = useState<"all" | "simbólica" | "incremental" | "estrutural" | "protetivo" | "punitivista" | "regressivo">("all");

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

  const stanceFilters = ["protetivo", "punitivista", "regressivo"] as const;
  const isStanceFilter = stanceFilters.includes(filter as typeof stanceFilters[number]);

  const filteredPLs =
    filter === "all"
      ? deputado.pls
      : isStanceFilter
        ? deputado.pls.filter((p) => p.stance === filter)
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

            {/* Stance breakdown — proteção vs punitivismo vs retrocesso */}
            {(deputado.protetivos !== undefined ||
              deputado.punitivistas !== undefined ||
              deputado.regressivos !== undefined) && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(deputado.protetivos ?? 0) > 0 && (
                  <button
                    onClick={() => setFilter(filter === "protetivo" ? "all" : "protetivo")}
                    className={`rounded px-2 py-0.5 font-mono-data text-[10px] font-bold uppercase tracking-wider transition-colors ${
                      filter === "protetivo"
                        ? "bg-[#1DB389] text-white"
                        : "bg-[#1DB389]/10 text-[#0F8B6B] hover:bg-[#1DB389]/20"
                    }`}
                  >
                    {deputado.protetivos} protetivos
                  </button>
                )}
                {(deputado.punitivistas ?? 0) > 0 && (
                  <button
                    onClick={() => setFilter(filter === "punitivista" ? "all" : "punitivista")}
                    className={`rounded px-2 py-0.5 font-mono-data text-[10px] font-bold uppercase tracking-wider transition-colors ${
                      filter === "punitivista"
                        ? "bg-amber-500 text-white"
                        : "bg-amber-500/15 text-amber-700 hover:bg-amber-500/25"
                    }`}
                  >
                    {deputado.punitivistas} punitivistas
                  </button>
                )}
                {(deputado.regressivos ?? 0) > 0 && (
                  <button
                    onClick={() => setFilter(filter === "regressivo" ? "all" : "regressivo")}
                    className={`rounded px-2 py-0.5 font-mono-data text-[10px] font-bold uppercase tracking-wider transition-colors ${
                      filter === "regressivo"
                        ? "bg-red-600 text-white"
                        : "bg-red-600/15 text-red-700 hover:bg-red-600/25"
                    }`}
                  >
                    {deputado.regressivos} regressivos
                  </button>
                )}
              </div>
            )}
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

        {/* ⚠ Protocolo em massa — sinalização editorial */}
        {(() => {
          const s = maiorSurto(deputado.pls);
          if (s.qtd < SURTO_FLAG_MIN) return null;
          return (
            <div className="border-b border-amber-200 bg-amber-50 px-6 py-4">
              <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-amber-700">
                [ ⚠ Movimento sob análise editorial ]
              </p>
              <p className="mt-2 text-sm leading-relaxed text-amber-900">
                Este parlamentar protocolou{" "}
                <strong>{s.qtd} proposições sobre o tema num único dia</strong>{" "}
                ({formatarData(s.data)}). Protocolar dezenas de PLs de uma vez
                — o chamado &ldquo;fábrica de PL&rdquo; — infla a produção sem
                trabalho legislativo correspondente. O total exibido é real,
                mas o peso disso na posição do ranking está{" "}
                <strong>em revisão metodológica</strong>.
              </p>
            </div>
          );
        })()}

        {/* Coerência nas votações de mérito */}
        {(() => {
          const coer = COERENCIA_MAP.get(deputado.id);
          if (!coer) return null;
          const lastFive = MERITO_IDS.slice(0, 5);
          const regressivos = deputado.votos_regressivos_detalhe ?? [];
          return (
            <div className="border-b border-gray-100 bg-[var(--color-bg-alt)] px-6 py-4">
              <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
                [ Voto nas últimas {lastFive.length} votações de mérito ]
              </p>
              <p className="mt-1 text-[11px] text-[var(--color-text-tertiary)]">
                O voto aqui listado não equivale a posição contra ou a
                favor de mulheres — o contexto específico de cada PL
                importa. Veja detalhes no Ato 02.{" "}
                <span className="text-[var(--color-blue)]">Consenso</span>{" "}
                = aprovado por acordo de líderes, sem registro nominal
                individual.
              </p>
              <ul className="mt-3 space-y-1.5">
                {lastFive.map((vid) => {
                  const votoRaw = coer.votes_by_id[vid];
                  const isConsenso = !votoRaw && MERITO_CONSENSO_IDS.has(vid);
                  const voto = votoRaw || (isConsenso ? "Consenso" : "Ausente");
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
                            : isConsenso
                            ? "bg-[var(--color-blue)]/15 text-[var(--color-blue)]"
                            : "bg-gray-200 text-[var(--color-text-tertiary)]"
                        }`}
                      >
                        {isSim ? "✓" : isNao ? "✗" : isConsenso ? "≡" : "—"}
                      </span>
                      <span className="flex-1 text-[var(--color-text-secondary)]">
                        {label}
                      </span>
                      <span
                        className={`font-mono-data text-[10px] uppercase tracking-wider ${
                          isConsenso
                            ? "text-[var(--color-blue)]"
                            : "text-[var(--color-text-tertiary)]"
                        }`}
                      >
                        {voto}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {regressivos.length > 0 && (
                <>
                  <p className="mt-5 font-mono-data text-[10px] uppercase tracking-[0.2em] text-[#B02525]">
                    [ ⚠ Voto regressivo no histórico — desconta no score ]
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {regressivos.map((vr) => (
                      <li key={vr.pl_ref + vr.data} className="flex items-start gap-3 text-xs">
                        <span className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#ED447F] font-mono-data text-[10px] font-bold text-white">
                          ⚠
                        </span>
                        <div className="flex-1">
                          <p className="text-[var(--color-text-secondary)]">
                            <span className="font-mono-data text-[10px] font-bold text-[#B02525]">
                              {vr.pl_ref}
                            </span>{" "}
                            — {vr.descricao}
                          </p>
                          <p className="font-mono-data text-[10px] text-[var(--color-text-tertiary)]">
                            Votou {vr.voto} · {vr.placar} · {vr.data}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
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
                {CATEGORY_LABELS_PLURAL[cat]} ({count})
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
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="font-mono-data text-sm font-bold text-[var(--color-text)]">
                        {pl.tipo} {pl.numero}/{pl.ano}
                      </span>
                      <span className="font-mono-data text-xs text-[var(--color-text-tertiary)]">
                        {pl.data}
                      </span>
                      {pl.stance === "punitivista" && (
                        <span className="rounded bg-amber-500/15 px-1.5 py-0.5 font-mono-data text-[9px] font-bold uppercase tracking-wider text-amber-700">
                          punitivista
                        </span>
                      )}
                      {pl.stance === "regressivo" && (
                        <span className="rounded bg-red-600/15 px-1.5 py-0.5 font-mono-data text-[9px] font-bold uppercase tracking-wider text-red-700">
                          regressivo
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                      {pl.ementa.length > 280
                        ? pl.ementa.slice(0, 280) + "…"
                        : pl.ementa}
                    </p>
                    {pl.llm_justificativa && (pl.stance === "regressivo" || pl.stance === "punitivista") && (
                      <p className="mt-2 rounded bg-gray-50 px-3 py-2 text-xs leading-relaxed text-[var(--color-text-tertiary)]">
                        <span className={`font-mono-data text-[9px] uppercase tracking-wider ${
                          pl.stance === "regressivo" ? "text-red-600" : "text-amber-600"
                        }`}>
                          Por que é {pl.stance}:{" "}
                        </span>
                        {pl.llm_justificativa}
                      </p>
                    )}
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

function GlossarioPLs() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-10 max-w-2xl overflow-hidden rounded-xl border border-[var(--color-blue)]/20 bg-[var(--color-blue-light)]">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left transition-colors hover:bg-[var(--color-blue)]/10"
      >
        <div>
          <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--color-blue)]">
            [ Antes de mergulhar nos nomes ]
          </p>
          <p className="mt-1 text-sm font-medium text-[var(--color-text)]">
            Como funciona o processo legislativo? Entenda em 1 minuto.
          </p>
        </div>
        <span
          className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-[var(--color-blue)]/30 font-mono-data text-sm text-[var(--color-blue)] transition-all duration-300"
          style={{ transform: open ? "rotate(45deg)" : "rotate(0deg)" }}
          aria-hidden="true"
        >
          +
        </span>
      </button>

      <div
        className="grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div
            className="border-t border-[var(--color-blue)]/20 px-6 py-5 transition-opacity duration-300"
            style={{ opacity: open ? 1 : 0 }}
          >
            <div className="space-y-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              <p>
                <strong className="text-[var(--color-text)]">
                  Proposição (PL)
                </strong>{" "}
                é qualquer projeto de lei apresentado por um deputado.
                Pode ser uma ideia de 2 linhas ou uma proposta
                estrutural complexa. O número bruto de PLs não diz
                muito — o que importa é se a proposta muda a estrutura
                ou só faz barulho.
              </p>
              <p>
                <strong className="text-[var(--color-text)]">
                  Relatoria
                </strong>{" "}
                é quando um deputado é designado para analisar a
                proposta e emitir parecer. É o trabalho pesado — sem
                relator, a PL morre na gaveta. Quem relata decide o
                destino.
              </p>
              <p>
                Nós classificamos cada proposição em duas dimensões.
                Primeiro por <strong className="text-[var(--color-text)]">forma</strong>:{" "}
                <strong style={{ color: "#7A7A7A" }}>simbólicas</strong>{" "}
                (datas, homenagens),{" "}
                <strong style={{ color: "#005FFF" }}>incrementais</strong>{" "}
                (ajustes em leis existentes) e{" "}
                <strong
                  style={{
                    color: "#DCFF00",
                    backgroundColor: "#0A0A0A",
                    padding: "0 4px",
                    borderRadius: 2,
                  }}
                >
                  estruturais
                </strong>{" "}
                (criam programas, fundos ou políticas novas).
              </p>
              <p>
                Depois por <strong className="text-[var(--color-text)]">postura</strong>:{" "}
                <strong className="text-emerald-700">protetivas</strong>{" "}
                (ampliam direitos, criam políticas, protegem a vítima),{" "}
                <strong className="text-amber-700">punitivistas</strong>{" "}
                (focam em aumentar pena sem proteção material — contam
                no ranking, recebem selo e{" "}
                <strong className="text-[var(--color-text)]">
                  subtraem 2 pontos do score
                </strong>
                ) e{" "}
                <strong className="text-red-700">regressivas</strong>{" "}
                (criminalizam aborto legal, obrigam notificação à polícia,
                sustam resoluções protetivas, propõem armamentismo —{" "}
                <strong className="text-[var(--color-text)]">
                  subtraem pontos do score
                </strong>
                ).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const CANDIDATOS = new Set(
  (candidatosData as { candidatos_ids: number[] }).candidatos_ids
);
const TSE_DISPONIVEL = CANDIDATOS.size > 0;

export default function RankingDeputados() {
  const [sortBy, setSortBy] = useState<"total" | "estruturais" | "pct_estrutural">("total");
  const [selected, setSelected] = useState<Deputado | null>(null);
  const minPls = 3;

  const filtered = DATA.deputados.filter((d) => d.total >= minPls);

  // Score: (estr×3 + incr + simb - punit×2 - regr×7 - votos_regr×5) × ficha_limpa
  const scoreOf = (d: Deputado) => {
    const base = d.estruturais * 3 + d.incrementais + d.simbolicas
      - (d.punitivistas ?? 0) * 2
      - (d.regressivos ?? 0) * 7
      - (d.votos_regressivos ?? 0) * 5;
    const fichaLimpa = (d.punitivistas ?? 0) === 0
      && (d.regressivos ?? 0) === 0
      && (d.votos_regressivos ?? 0) === 0;
    return fichaLimpa ? base * 1.5 : base;
  };

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "total") return scoreOf(b) - scoreOf(a);
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
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
                [ ATO 01 / QUEM FAZ AS LEIS ]
              </p>
              <ShareButton path="/ato-01" title="Quem propõe as leis sobre direitos das mulheres" />
            </div>
            <ScrollFloat
              as="h2"
              text="Quem propõe"
              stagger={40}
              className="block text-3xl font-black leading-[0.9] md:text-5xl text-[var(--color-text)] lg:text-7xl"
            />
            <ScrollFloat
              as="h2"
              text="o quê?"
              stagger={40}
              delay={400}
              className="block text-3xl font-black leading-[0.9] md:text-5xl text-[var(--color-blue)] lg:text-7xl"
            />
          </div>

          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-[var(--color-text-secondary)] md:text-xl">
            Dos 513 deputados da Câmara, <strong>{DATA.totalDeputados} propuseram</strong>{" "}
            {DATA.totalPls} proposições ligadas a políticas pra mulheres.{" "}
            <strong>{513 - DATA.totalDeputados} não propuseram nada</strong> sobre o tema.
            Quem são?
          </p>

          <GlossarioPLs />

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
              <div className="mt-12 overflow-hidden rounded-3xl bg-[var(--color-blue)] text-white">
                {/* Header section */}
                <div className="px-8 pb-2 pt-10 md:px-12 md:pt-14">
                  <p className="font-mono-data text-[10px] uppercase tracking-[0.3em] text-[var(--color-neon)]">
                    [ Quem carrega o trabalho ]
                  </p>
                  <h3
                    className="mt-6 text-[clamp(1.75rem,3.5vw,3rem)] font-medium leading-[1.15] tracking-tight text-white"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Mulheres são <span className="border-b-2 border-white/30">17% da Câmara</span>.
                    <br />
                    Mas fazem{" "}
                    <span className="text-[var(--color-neon)]">
                      quase todo o trabalho
                    </span>{" "}
                    na pauta das mulheres.
                  </h3>
                </div>

                {/* Big 2 stats — destaque editorial */}
                <div className="mt-10 grid md:grid-cols-2">
                  <div className="border-t border-white/15 px-8 py-10 md:px-12 md:py-14 md:border-r">
                    <p
                      className="leading-[0.85] text-[var(--color-neon)]"
                      style={{
                        fontFamily: "var(--font-display-condensed)",
                        fontSize: "clamp(5rem, 10vw, 9rem)",
                        letterSpacing: "-0.04em",
                      }}
                    >
                      <Counter to={fPlPct} decimals={0} suffix="%" duration={1800} />
                    </p>
                    <p
                      className="mt-4 text-xl leading-snug text-white md:text-2xl"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      das PLs sobre o tema são de autoria feminina.
                    </p>
                    <p className="mt-3 font-mono-data text-xs uppercase tracking-wider text-[var(--color-neon)]/80">
                      {sobreAutoria > 0 ? `+${sobreAutoria.toFixed(0)}%` : `${sobreAutoria.toFixed(0)}%`} acima do esperado pela representação
                    </p>
                  </div>

                  <div className="border-t border-white/15 px-8 py-10 md:px-12 md:py-14">
                    <p
                      className="leading-[0.85] text-[var(--color-neon)]"
                      style={{
                        fontFamily: "var(--font-display-condensed)",
                        fontSize: "clamp(5rem, 10vw, 9rem)",
                        letterSpacing: "-0.04em",
                      }}
                    >
                      <Counter to={pctFRelatoria} decimals={0} suffix="%" duration={1800} />
                    </p>
                    <p
                      className="mt-4 text-xl leading-snug text-white md:text-2xl"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      das relatorias dessas PLs são atribuídas a mulheres.
                    </p>
                    <p className="mt-3 font-mono-data text-xs uppercase tracking-wider text-[var(--color-neon)]/80">
                      {RELATORIA.pls_tipo_relatoria["só mulher"]} PLs só com relatoras · {RELATORIA.pls_tipo_relatoria["só homem"]} só com homens
                    </p>
                  </div>
                </div>

                {/* Stats menores */}
                <div className="grid md:grid-cols-2">
                  <div className="border-t border-white/15 px-8 py-8 md:px-12 md:border-r">
                    <div className="flex items-baseline gap-3">
                      <p
                        className="leading-none text-white"
                        style={{
                          fontFamily: "var(--font-display-condensed)",
                          fontSize: "clamp(2.5rem, 5vw, 4rem)",
                          letterSpacing: "-0.03em",
                        }}
                      >
                        <Counter to={fPerDep / mPerDep} decimals={1} suffix="×" duration={1500} />
                      </p>
                      <p className="text-base leading-snug text-white/90">
                        mais PLs por pessoa nas deputadas
                      </p>
                    </div>
                    <p className="mt-2 font-mono-data text-[10px] uppercase tracking-wider text-white/55">
                      {fPerDep.toFixed(1)} por mulher · {mPerDep.toFixed(1)} por homem
                    </p>
                  </div>

                  <div className="border-t border-white/15 px-8 py-8 md:px-12">
                    <div className="flex items-baseline gap-3">
                      <p
                        className="leading-none text-white"
                        style={{
                          fontFamily: "var(--font-display-condensed)",
                          fontSize: "clamp(2.5rem, 5vw, 4rem)",
                          letterSpacing: "-0.03em",
                        }}
                      >
                        <Counter to={top20F} duration={1500} /><span className="text-white/40">/20</span>
                      </p>
                      <p className="text-base leading-snug text-white/90">
                        do top 20 em produção legislativa são mulheres
                      </p>
                    </div>
                    <p className="mt-2 font-mono-data text-[10px] uppercase tracking-wider text-white/55">
                      {((top20F / 20) * 100).toFixed(0)}% do ranking abaixo
                    </p>
                  </div>
                </div>

                {/* Conclusão editorial */}
                <div className="border-t border-white/15 bg-black/20 px-8 py-10 md:px-12">
                  <p
                    className="max-w-3xl text-lg leading-relaxed text-white/95 md:text-xl"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    A pauta de direitos das mulheres no Brasil é
                    sustentada, em larga medida,{" "}
                    <strong className="text-[var(--color-neon)]">
                      pelas próprias mulheres do parlamento
                    </strong>
                    .
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Controls */}
          <div className="mt-10 flex flex-wrap items-center gap-3">
            {/* Legenda candidatos 2026 */}
            {TSE_DISPONIVEL && (
              <span className="ml-auto flex items-center gap-1.5 font-mono-data text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                <span className="rounded-full bg-[var(--color-blue)] px-1.5 py-0.5 text-[8px] font-bold text-white">
                  2026
                </span>
                = candidato à reeleição
              </span>
            )}
          </div>

          {/* Ranking */}
          <AnimatedList as="div" className="mt-10 space-y-2" stagger={50}>
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
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="font-bold text-[var(--color-text)]">
                          {d.nome}
                        </span>
                        <span className="font-mono-data text-xs text-[var(--color-text-tertiary)]">
                          {d.partido}·{d.uf}
                        </span>
                        {TSE_DISPONIVEL && CANDIDATOS.has(d.id) && (
                          <span className="rounded-full bg-[var(--color-blue)] px-2 py-0.5 font-mono-data text-[8px] font-bold uppercase tracking-wider text-white">
                            2026
                          </span>
                        )}
                        {d.situacao !== "Exercício" && (
                          <span className="font-mono-data text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                            {d.situacao}
                          </span>
                        )}
                        {(() => {
                          const s = maiorSurto(d.pls);
                          if (s.qtd < SURTO_FLAG_MIN) return null;
                          return (
                            <span
                              className="rounded bg-amber-500/20 px-2 py-0.5 font-mono-data text-[10px] font-bold uppercase tracking-wider text-amber-800"
                              title={`Protocolou ${s.qtd} PLs num único dia (${formatarData(s.data)}). Protocolo em massa ("fábrica de PL") — peso no ranking sob análise editorial.`}
                            >
                              ⚠ {s.qtd} PLs em 1 dia · em análise
                            </span>
                          );
                        })()}
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

                      {/* Selo voto regressivo */}
                      {(d.votos_regressivos ?? 0) > 0 && d.votos_regressivos_detalhe && (
                        <div
                          className="mt-2 rounded bg-[#ED447F]/10 px-2.5 py-1.5"
                          title={d.votos_regressivos_detalhe.map(
                            (vr) => `Votou ${vr.voto} no ${vr.pl_ref}: ${vr.descricao}. ${vr.placar} em ${vr.data}.`
                          ).join(" ")}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-[#ED447F]">⚠</span>
                            <span className="font-mono-data text-[10px] font-bold text-[#ED447F]">
                              Votou SIM: {d.votos_regressivos_detalhe[0].descricao}
                            </span>
                          </div>
                          <p className="mt-0.5 pl-5 font-mono-data text-[9px] text-[#ED447F]/70">
                            {d.votos_regressivos_detalhe[0].pl_ref} · {d.votos_regressivos_detalhe[0].placar} · {d.votos_regressivos_detalhe[0].data}
                          </p>
                        </div>
                      )}

                    </div>

                    <span className="self-center font-mono-data text-xs text-[var(--color-text-tertiary)]">
                      ver ↗
                    </span>
                  </div>
                </button>
              );
            })}
          </AnimatedList>


          <p className="mt-8 font-mono-data text-xs text-[var(--color-text-tertiary)]">
            Fonte: API de Dados Abertos da Câmara dos Deputados ·
            Legislatura 2023-2026 · Deputados com 3+ PLs ·
            Score: [(estruturais × 3) + (incrementais × 1) + (simbólicas × 1) − (punitivistas × 2) − (regressivas × 7) − (votos regressivos × 5)] × 1,5 se ficha 100% protetiva ·
            ⚠ Protocolos em massa (10+ PLs no mesmo dia) são sinalizados e estão sob análise metodológica ·
            Atualização automática diária.
          </p>
        </div>
      </section>

      {selected && (
        <DeputadoModal deputado={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
