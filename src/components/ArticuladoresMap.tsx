"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import articuladoresData from "../data/articuladores_uf.json";
import autoriaData from "../data/autoria.json";
import candidatosData from "../data/candidatos_2026.json";
import coerenciaData from "../data/coerencia.json";
import feminicidioData from "../data/feminicidio_uf.json";
import votacoesData from "../data/votacoes.json";
import ScrollFloat from "./ScrollFloat";
import ShareButton from "./ShareButton";

type CoerenciaDeputado = {
  id: number;
  votes_by_id: Record<string, string>;
};
type CoerenciaJSON = {
  merito_vote_ids: string[];
  deputados: CoerenciaDeputado[];
};
const COERENCIA = coerenciaData as CoerenciaJSON;
const COERENCIA_MAP = new Map(COERENCIA.deputados.map((d) => [d.id, d]));

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
const MERITO_IDS = COERENCIA.merito_vote_ids;

type FeminicidioUF = {
  taxa: number;
  vitimas: number;
  ranking: number;
  estimativa: boolean;
  subnotificacao: boolean;
};
type FeminicidioJSON = {
  ano_referencia: number;
  media_nacional: number;
  total_nacional: number;
  ufs: Record<string, FeminicidioUF>;
};
const FEMINICIDIO = feminicidioData as FeminicidioJSON;

type MapLayer = "producao" | "feminicidio" | "cruzamento";

type Articulador = {
  id: number;
  nome: string;
  partido: string;
  uf: string;
  foto: string;
  sexo: string | null;
  situacao: string | null;
  total_pls: number;
  estruturais: number;
  incrementais: number;
  simbolicas: number;
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
  coerencia_sim: number;
  coerencia_nao: number;
  coerencia_participacoes: number;
  coerencia_score: number | null;
  score_articulador: number;
  pls_descontadas?: number;
  surto_qtd?: number;
  surto_data?: string | null;
};

function formatarDataSurto(iso: string | null | undefined): string {
  if (!iso) return "";
  const [a, m, d] = iso.split("-");
  return d && m && a ? `${d}/${m}/${a}` : iso;
}

type UFData = {
  total_deps: number;
  deputados_atuantes?: number;
  top3: Articulador[];
  camara_F?: number;
  camara_M?: number;
  camara_total?: number;
  zero_mulheres?: boolean;
};

type ArticuladoresJSON = {
  ufs: Record<string, UFData>;
  total_deputados: number;
};

const DATA = articuladoresData as ArticuladoresJSON;

type AutoriaDep = {
  id: number;
  nome: string;
  partido: string;
  uf: string;
  foto: string;
  total: number;
  estruturais: number;
  incrementais: number;
  simbolicas: number;
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
  pls: Array<{
    id: number;
    tipo: string;
    numero: number;
    ano: number;
    ementa: string;
    data: string;
    categoria: string;
    stance?: string;
    llm_justificativa?: string;
  }>;
};
const AUTORIA_IDX = new Map(
  (autoriaData as { deputados: AutoriaDep[] }).deputados.map((d) => [d.id, d])
);
const CANDIDATOS_SET = new Set(
  (candidatosData as { candidatos_ids: number[] }).candidatos_ids
);
const TSE_ON = CANDIDATOS_SET.size > 0;

const UF_NAMES: Record<string, string> = {
  AC: "Acre", AL: "Alagoas", AM: "Amazonas", AP: "Amapá",
  BA: "Bahia", CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo",
  GO: "Goiás", MA: "Maranhão", MG: "Minas Gerais", MS: "Mato Grosso do Sul",
  MT: "Mato Grosso", PA: "Pará", PB: "Paraíba", PE: "Pernambuco",
  PI: "Piauí", PR: "Paraná", RJ: "Rio de Janeiro", RN: "Rio Grande do Norte",
  RO: "Rondônia", RR: "Roraima", RS: "Rio Grande do Sul", SC: "Santa Catarina",
  SE: "Sergipe", SP: "São Paulo", TO: "Tocantins",
};

export default function ArticuladoresMap() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [geoData, setGeoData] = useState<FeatureCollection<
    Geometry,
    { sigla: string; name: string }
  > | null>(null);
  const [selectedUf, setSelectedUf] = useState<string>("SP");
  const [hoveredUf, setHoveredUf] = useState<string | null>(null);
  const [selectedDep, setSelectedDep] = useState<AutoriaDep | null>(null);
  const [mapModalFilter, setMapModalFilter] = useState<
    | "all"
    | "protetivo"
    | "punitivista"
    | "regressivo"
    | "estrutural"
    | "incremental"
    | "simbólica"
  >("all");
  const [layer, setLayer] = useState<MapLayer>("producao");

  // Load geojson
  useEffect(() => {
    fetch("/brazil-states.geojson")
      .then((r) => r.json())
      .then(setGeoData)
      .catch(console.error);
  }, []);

  // Draw map
  const drawMap = useCallback(() => {
    if (!geoData || !svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const containerW = containerRef.current.clientWidth;
    const isMobile = window.innerWidth < 768;
    const width = containerW;
    const height = isMobile ? 400 : 560;

    svg.attr("width", width).attr("height", height);

    // Color scales per layer
    const scores = Object.values(DATA.ufs).map(
      (u) => u.top3[0]?.score_articulador ?? 0
    );
    const maxScore = Math.max(...scores);
    const prodScale = d3
      .scaleSequential<string>()
      .domain([0, maxScore])
      .interpolator(d3.interpolateRgb("#E6EEFF", "#005FFF"));

    const taxas = Object.values(FEMINICIDIO.ufs).map((u) => u.taxa);
    const maxTaxa = Math.max(...taxas);
    const femScale = d3
      .scaleSequential<string>()
      .domain([0, maxTaxa])
      .interpolator(d3.interpolateRgb("#FFF5F5", "#991B1B"));

    const getFill = (sigla: string): string => {
      if (layer === "producao") {
        const uf = DATA.ufs[sigla];
        if (uf?.zero_mulheres) return "url(#no-women-pattern)";
        const score = uf?.top3[0]?.score_articulador ?? 0;
        return score > 0 ? prodScale(score) : "#E6EEFF";
      }
      if (layer === "feminicidio") {
        const fem = FEMINICIDIO.ufs[sigla];
        return fem ? femScale(fem.taxa) : "#F3F4F6";
      }
      // Cruzamento: alta violência + baixa produção = vermelho escuro
      const fem = FEMINICIDIO.ufs[sigla];
      const uf = DATA.ufs[sigla];
      const taxa = fem?.taxa ?? 0;
      const score = uf?.top3[0]?.score_articulador ?? 0;
      const altaViolencia = taxa > FEMINICIDIO.media_nacional;
      const altaProducao = score > maxScore * 0.3;
      if (altaViolencia && !altaProducao) return "#7F1D1D"; // vermelho escuro
      if (altaViolencia && altaProducao) return "#DC2626"; // verde escuro
      if (!altaViolencia && altaProducao) return "#DBEAFE"; // verde claro
      return "#E5E7EB"; // cinza — baixa violência + baixa produção
    };

    const projection = d3.geoMercator().fitSize([width, height], geoData);
    const path = d3.geoPath(projection);

    // Padrão hachurado (diagonais vermelhas) pra marcar UFs sem deputada
    const defs = svg.append("defs");
    const pattern = defs
      .append("pattern")
      .attr("id", "no-women-pattern")
      .attr("patternUnits", "userSpaceOnUse")
      .attr("width", 8)
      .attr("height", 8)
      .attr("patternTransform", "rotate(45)");
    pattern
      .append("rect")
      .attr("width", 8)
      .attr("height", 8)
      .attr("fill", "#FFE4E4");
    pattern
      .append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 0)
      .attr("y2", 8)
      .attr("stroke", "#D43F3F")
      .attr("stroke-width", 2);

    const g = svg.append("g");

    g.selectAll<SVGPathElement, Feature>("path")
      .data(geoData.features)
      .join("path")
      .attr("d", (d) => path(d) ?? "")
      .attr("fill", (d) => {
        const sigla = (d.properties as { sigla: string }).sigla;
        return getFill(sigla);
      })
      .attr("stroke", (d) => {
        const sigla = (d.properties as { sigla: string }).sigla;
        return sigla === selectedUf ? "#DCFF00" : "#ffffff";
      })
      .attr("stroke-width", (d) => {
        const sigla = (d.properties as { sigla: string }).sigla;
        return sigla === selectedUf ? 3 : 1;
      })
      .style("cursor", "pointer")
      .style("transition", "fill 0.3s, stroke 0.2s")
      .style("touch-action", "manipulation")
      .on("pointerenter", function (event, d) {
        // Em touch, pular hover — o tap já dispara o click e atualiza o
        // painel via selectedUf. O ciclo enter→leave intermediário causava
        // o painel piscar e o click não registrar em mobile.
        if (event.pointerType === "touch") return;
        const sigla = (d.properties as { sigla: string }).sigla;
        setHoveredUf(sigla);
        d3.select(this).attr("stroke", "#DCFF00").attr("stroke-width", 3);
      })
      .on("pointerleave", function (event, d) {
        if (event.pointerType === "touch") return;
        const sigla = (d.properties as { sigla: string }).sigla;
        setHoveredUf(null);
        if (sigla !== selectedUf) {
          d3.select(this).attr("stroke", "#ffffff").attr("stroke-width", 1);
        }
      })
      .on("click", function (_, d) {
        const sigla = (d.properties as { sigla: string }).sigla;
        setSelectedUf(sigla);
      });

    // UF labels
    g.selectAll<SVGTextElement, Feature>("text.uf-label")
      .data(geoData.features)
      .join("text")
      .attr("class", "uf-label")
      .attr("x", (d) => path.centroid(d)[0])
      .attr("y", (d) => path.centroid(d)[1])
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("fill", (d) => {
        const sigla = (d.properties as { sigla: string }).sigla;
        if (layer === "feminicidio") {
          const fem = FEMINICIDIO.ufs[sigla];
          return (fem?.taxa ?? 0) > 1.8 ? "#ffffff" : "#0A0A0A";
        }
        if (layer === "cruzamento") {
          const fill = getFill(sigla);
          return fill === "#7F1D1D" || fill === "#DC2626" ? "#ffffff" : "#0A0A0A";
        }
        const uf = DATA.ufs[sigla];
        const score = uf?.top3[0]?.score_articulador ?? 0;
        return score > 20 ? "#ffffff" : "#0A0A0A";
      })
      .style("font-family", "var(--font-mono)")
      .style("font-size", "10px")
      .style("font-weight", "700")
      .style("pointer-events", "none")
      .text((d) => (d.properties as { sigla: string }).sigla);
  }, [geoData, selectedUf, layer]);

  useEffect(() => {
    drawMap();
    const handleResize = () => drawMap();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [drawMap]);

  const displayUf = hoveredUf || selectedUf;
  const displayData = DATA.ufs[displayUf];

  return (
    <>
    {/* Modal do deputado */}
    {selectedDep && (() => {
      const dep = selectedDep;
      const stanceFilters = ["protetivo", "punitivista", "regressivo"] as const;
      const isStance = (stanceFilters as readonly string[]).includes(mapModalFilter);
      const filteredPls =
        mapModalFilter === "all"
          ? dep.pls
          : isStance
            ? dep.pls.filter((p) => p.stance === mapModalFilter)
            : dep.pls.filter((p) => p.categoria === mapModalFilter);
      const coer = COERENCIA_MAP.get(dep.id);
      const lastFiveMerito = MERITO_IDS.slice(0, 5);
      const regressivos = dep.votos_regressivos_detalhe ?? [];
      const CATS = [
        { key: "estrutural" as const, label: "Estruturais", color: "#1DB389", count: dep.estruturais },
        { key: "incremental" as const, label: "Incrementais", color: "#3B82D4", count: dep.incrementais },
        { key: "simbólica" as const, label: "Simbólicas", color: "#6B6B64", count: dep.simbolicas },
      ];
      return (
        <div
          className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/70 backdrop-blur-sm md:items-center md:px-4"
          onClick={() => setSelectedDep(null)}
        >
          <div
            className="flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl md:h-auto md:max-h-[90vh] md:max-w-2xl md:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 border-b border-gray-100 p-6">
              {dep.foto && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={dep.foto} alt="" className="h-16 w-16 flex-shrink-0 rounded-full object-cover" />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-bold text-[var(--color-text)]" style={{ fontFamily: "var(--font-display)" }}>
                    {dep.nome}
                  </h3>
                  {TSE_ON && CANDIDATOS_SET.has(dep.id) && (
                    <span className="rounded-full bg-[var(--color-blue)] px-2 py-0.5 font-mono-data text-[8px] font-bold uppercase tracking-wider text-white">
                      Candidato 2026
                    </span>
                  )}
                </div>
                <p className="font-mono-data text-sm text-[var(--color-text-tertiary)]">
                  {dep.partido} · {dep.uf}
                </p>
                <div className="mt-3 flex flex-wrap gap-3 text-sm">
                  <span><strong className="font-mono-data">{dep.total}</strong> <span className="text-[var(--color-text-secondary)]">proposições</span></span>
                  <span><strong className="font-mono-data" style={{ color: "#1DB389" }}>{dep.estruturais}</strong> <span className="text-[var(--color-text-secondary)]">estruturais</span></span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(dep.protetivos ?? 0) > 0 && (
                    <button
                      onClick={() => setMapModalFilter(mapModalFilter === "protetivo" ? "all" : "protetivo")}
                      className={`rounded px-2 py-0.5 font-mono-data text-[10px] font-bold uppercase tracking-wider transition-colors ${
                        mapModalFilter === "protetivo"
                          ? "bg-[#1DB389] text-white"
                          : "bg-[#1DB389]/10 text-[#0F8B6B] hover:bg-[#1DB389]/20"
                      }`}
                    >
                      {dep.protetivos} protetivos
                    </button>
                  )}
                  {(dep.punitivistas ?? 0) > 0 && (
                    <button
                      onClick={() => setMapModalFilter(mapModalFilter === "punitivista" ? "all" : "punitivista")}
                      className={`rounded px-2 py-0.5 font-mono-data text-[10px] font-bold uppercase tracking-wider transition-colors ${
                        mapModalFilter === "punitivista"
                          ? "bg-amber-500 text-white"
                          : "bg-amber-500/15 text-amber-700 hover:bg-amber-500/25"
                      }`}
                    >
                      {dep.punitivistas} punitivistas
                    </button>
                  )}
                  {(dep.regressivos ?? 0) > 0 && (
                    <button
                      onClick={() => setMapModalFilter(mapModalFilter === "regressivo" ? "all" : "regressivo")}
                      className={`rounded px-2 py-0.5 font-mono-data text-[10px] font-bold uppercase tracking-wider transition-colors ${
                        mapModalFilter === "regressivo"
                          ? "bg-red-600 text-white"
                          : "bg-red-600/15 text-red-700 hover:bg-red-600/25"
                      }`}
                    >
                      {dep.regressivos} regressivos
                    </button>
                  )}
                </div>
                {/* Selo de voto regressivo no modal — torna explícito o
                    motivo do desconto no score */}
                {(dep.votos_regressivos ?? 0) > 0 && dep.votos_regressivos_detalhe && dep.votos_regressivos_detalhe.length > 0 && (
                  <div
                    className="mt-3 rounded bg-[#ED447F]/10 px-2.5 py-1.5"
                    title={dep.votos_regressivos_detalhe.map(
                      (vr) => `Votou ${vr.voto} no ${vr.pl_ref}: ${vr.descricao}. ${vr.placar} em ${vr.data}.`
                    ).join(" ")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#ED447F]">⚠</span>
                      <span className="font-mono-data text-[10px] font-bold text-[#ED447F]">
                        Votou SIM: {dep.votos_regressivos_detalhe[0].descricao}
                      </span>
                    </div>
                    <p className="mt-0.5 pl-5 font-mono-data text-[9px] text-[#ED447F]/70">
                      {dep.votos_regressivos_detalhe[0].pl_ref} · {dep.votos_regressivos_detalhe[0].placar} · {dep.votos_regressivos_detalhe[0].data}
                    </p>
                  </div>
                )}
              </div>
              <button onClick={() => setSelectedDep(null)} className="flex-shrink-0 rounded-full bg-[var(--color-bg-alt)] p-2 hover:bg-gray-200" aria-label="Fechar">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              </button>
            </div>

            {/* Coerência nas últimas 5 votações de mérito + regressivos */}
            {coer && (
              <div className="border-b border-gray-100 bg-[var(--color-bg-alt)] px-6 py-4">
                <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
                  [ Voto nas últimas {lastFiveMerito.length} votações de mérito ]
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
                  {lastFiveMerito.map((vid) => {
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
            )}

            {/* Filtro por categoria — estrutural/incremental/simbólica */}
            <div className="flex flex-wrap gap-2 border-b border-gray-100 bg-[var(--color-bg-alt)] px-6 py-3">
              <button
                onClick={() => setMapModalFilter("all")}
                className={`rounded-full px-3 py-1 text-xs transition-colors ${
                  mapModalFilter === "all"
                    ? "bg-[var(--color-text)] text-white"
                    : "bg-white text-[var(--color-text-secondary)] hover:bg-gray-100"
                }`}
              >
                Todas ({dep.total})
              </button>
              {CATS.map((cat) =>
                cat.count > 0 ? (
                  <button
                    key={cat.key}
                    onClick={() => setMapModalFilter(cat.key)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      mapModalFilter === cat.key ? "text-white" : "bg-white hover:bg-gray-100"
                    }`}
                    style={
                      mapModalFilter === cat.key
                        ? { backgroundColor: cat.color }
                        : { color: cat.color }
                    }
                  >
                    {cat.label} ({cat.count})
                  </button>
                ) : null
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              <ul className="divide-y divide-gray-100">
                {filteredPls.slice(0, 30).map((pl) => {
                  const catColor =
                    pl.categoria === "estrutural"
                      ? "#1DB389"
                      : pl.categoria === "incremental"
                      ? "#3B82D4"
                      : "#6B6B64";
                  const catLabel =
                    pl.categoria === "estrutural"
                      ? "Estrutural"
                      : pl.categoria === "incremental"
                      ? "Incremental"
                      : "Simbólica";
                  return (
                  <li key={pl.id} className="p-5 hover:bg-[var(--color-bg-alt)]">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span
                        className="rounded px-1.5 py-0.5 font-mono-data text-[9px] font-bold uppercase tracking-wider text-white"
                        style={{ backgroundColor: catColor }}
                      >
                        {catLabel}
                      </span>
                      <span className="font-mono-data text-sm font-bold text-[var(--color-text)]">{pl.tipo} {pl.numero}/{pl.ano}</span>
                      <span className="font-mono-data text-xs text-[var(--color-text-tertiary)]">{pl.data}</span>
                      {pl.stance === "punitivista" && <span className="rounded bg-amber-500/15 px-1.5 py-0.5 font-mono-data text-[9px] font-bold uppercase text-amber-700">punitivista</span>}
                      {pl.stance === "regressivo" && <span className="rounded bg-red-600/15 px-1.5 py-0.5 font-mono-data text-[9px] font-bold uppercase text-red-700">regressivo</span>}
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                      {pl.ementa.length > 250 ? pl.ementa.slice(0, 250) + "…" : pl.ementa}
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
                  </li>
                  );
                })}
              </ul>
            </div>
            <div className="border-t border-gray-100 bg-[var(--color-bg-alt)] p-4 text-center">
              <a href={`https://www.camara.leg.br/deputados/${dep.id}`} target="_blank" rel="noopener noreferrer" className="font-mono-data text-xs text-[var(--color-blue)] hover:underline">
                Ver perfil completo na Câmara →
              </a>
            </div>
          </div>
        </div>
      );
    })()}

    <section className="bg-white px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 offset-left">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
              [ GUIA ELEITORAL POR ESTADO ]
            </p>
            <ShareButton path="/guia-estados" title="Quem representa seu estado" />
          </div>
          <ScrollFloat
            as="h2"
            text="Quem representa"
            stagger={40}
            className="block text-3xl font-black leading-[0.9] md:text-5xl text-[var(--color-text)] lg:text-7xl"
          />
          <ScrollFloat
            as="h2"
            text="o seu estado?"
            stagger={40}
            delay={400}
            className="block text-3xl font-black leading-[0.9] md:text-5xl text-[var(--color-blue)] lg:text-7xl"
          />
        </div>

        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-[var(--color-text-secondary)] md:text-xl">
          Os 3 deputados em cada estado que mais se destacam em políticas
          de proteção à mulher — considerando número de projetos
          propostos, quantos são estruturais, e como votaram nas
          votações-chave. Passe o mouse ou clique no mapa.
        </p>

        {/* Selos editoriais */}
        <div className="mt-8 grid gap-3 md:grid-cols-2">
          {/* Selo 1 — Peso 5× para mulheres */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--color-blue)] bg-[var(--color-blue)] p-5 text-white shadow-sm">
            <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-white/70">
              [ Recorte editorial ]
            </p>
            <div className="mt-3 flex items-center gap-4">
              <span className="font-display-condensed text-5xl leading-none text-[var(--color-neon)] md:text-6xl">
                ×5
              </span>
              <p className="text-base font-bold leading-tight md:text-lg">
                Mulheres sem retrocesso na ficha entram no ranking com{" "}
                <span className="text-[var(--color-neon)]">peso 5×</span>.
              </p>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-white/85">
              Compensação editorial explícita pela sub-representação
              feminina na Câmara — elas são só <strong>17% da casa</strong>,
              mas respondem pela maioria dos PLs estruturais. Quem
              retrocede direitos da mulher não recebe o multiplicador.
            </p>
          </div>

          {/* Selo 2 — Aguardando TSE */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-[var(--color-text)] bg-[var(--color-neon)] p-5 text-[var(--color-text)] shadow-sm">
            <div className="flex items-center justify-between">
              <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--color-text)]/70">
                [ Aguardando TSE ]
              </p>
              <span className="flex items-center gap-1.5 font-mono-data text-[10px] uppercase tracking-wider text-[var(--color-text)]/70">
                <span className="relative inline-flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-text)] opacity-60"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-text)]"></span>
                </span>
                live
              </span>
            </div>
            <p className="mt-3 text-base font-bold leading-tight text-[var(--color-text)] md:text-lg">
              Será atualizado automaticamente quando sair a lista
              oficial de candidatos a 2026.
            </p>
            <p className="mt-3 text-xs leading-relaxed text-[var(--color-text)]/80">
              Hoje listamos todos os deputados em <strong>exercício na
              atual legislatura</strong>. Quando o TSE publicar quem
              se candidatou, o ranking refiltra em tempo real e passa
              a mostrar só quem está concorrendo à reeleição.
            </p>
          </div>
        </div>

        {/* Disclaimer — dropdown */}
        <details className="group mt-6 rounded-xl border border-[var(--color-text-tertiary)]/20 bg-[var(--color-bg-alt)] open:bg-[var(--color-bg-alt)]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 hover:bg-gray-100/60 [&::-webkit-details-marker]:hidden">
            <span className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
              [ Sobre este ranking ]
            </span>
            <span className="flex items-center gap-2 font-mono-data text-[10px] uppercase tracking-wider text-[var(--color-text-secondary)]">
              <span className="group-open:hidden">ver fórmula</span>
              <span className="hidden group-open:inline">fechar</span>
              <svg
                className="h-3 w-3 transition-transform group-open:rotate-180"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 4.5l3 3 3-3" />
              </svg>
            </span>
          </summary>
          <p className="px-5 pb-5 text-sm leading-relaxed text-[var(--color-text-secondary)]">
            Score = <strong>[(PLs estruturais × 3) + (PLs incrementais
            × 1) + (PLs simbólicas × 1) − (PLs punitivistas × 2) − (PLs regressivas × 7) − (votos regressivos × 5)] × ficha_limpa × peso_sexo</strong>. Deputados com{" "}
            <strong>100% de PLs protetivas</strong> (zero punitivistas,
            zero regressivas, zero votos regressivos) recebem bônus
            ×1,5 no score. O{" "}
            <strong>peso_sexo</strong> é <strong>5 para mulheres
            sem retrocesso na ficha</strong> (zero PLs regressivas e
            zero votos SIM em pauta regressiva) e 1,0 caso contrário —
            uma compensação editorial explícita pela sub-representação
            feminina na Câmara (só 17% da composição). Quem retrocede
            direitos da mulher não recebe o multiplicador desenhado
            para ampliar voz às mulheres da pauta.{" "}
            <strong>Cap anti-mutirão:</strong> no máximo 5 PLs protocoladas
            no mesmo dia contam pro score — protocolo em massa (&ldquo;fábrica
            de PL&rdquo;) não infla o mapa; 10+ num só dia recebem selo de
            alerta. Considera apenas
            deputados em <strong>exercício na atual legislatura</strong>.
            Quando o TSE publicar a lista oficial de candidatos a 2026,
            a seção será filtrada automaticamente para mostrar só quem
            efetivamente se candidatou à reeleição.
          </p>
        </details>

        {/* Layer toggle */}
        <div className="mt-8 flex flex-wrap gap-2">
          {([
            { key: "producao" as MapLayer, label: "Produção legislativa" },
            { key: "feminicidio" as MapLayer, label: "Taxa de feminicídio" },
            { key: "cruzamento" as MapLayer, label: "Cruzamento" },
          ]).map((opt) => (
            <button
              key={opt.key}
              onClick={() => setLayer(opt.key)}
              className={`rounded-full px-4 py-1.5 font-mono-data text-xs uppercase tracking-wider transition-colors ${
                layer === opt.key
                  ? "bg-[var(--color-text)] text-white"
                  : "bg-[var(--color-bg-alt)] text-[var(--color-text-secondary)] hover:bg-gray-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-8 md:grid-cols-[1fr_1.2fr]">
          {/* Map */}
          <div>
            <div ref={containerRef} className="relative">
              <svg ref={svgRef} className="w-full" />
            </div>

            {/* Legenda dinâmica */}
            {layer === "producao" && (
              <>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--color-text-tertiary)]">
                  <span className="font-mono-data uppercase tracking-wider">
                    Produção legislativa por estado
                  </span>
                  <div className="flex items-center gap-2">
                    <span>baixa</span>
                    <div className="h-3 w-20 rounded" style={{ background: "linear-gradient(to right, #E6EEFF, #7DA4FF, #005FFF)" }} />
                    <span>alta</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-[var(--color-text-tertiary)]">
                  <div className="h-4 w-6 rounded border border-[#D43F3F]/40" style={{ background: "repeating-linear-gradient(45deg, #FFE4E4, #FFE4E4 3px, #D43F3F 3px, #D43F3F 5px)" }} />
                  <span className="font-mono-data uppercase tracking-wider">Sem deputada eleita</span>
                </div>
              </>
            )}
            {layer === "feminicidio" && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--color-text-tertiary)]">
                <span className="font-mono-data uppercase tracking-wider">
                  Taxa por 100 mil mulheres ({FEMINICIDIO.ano_referencia})
                </span>
                <div className="flex items-center gap-2">
                  <span>baixa</span>
                  <div className="h-3 w-20 rounded" style={{ background: "linear-gradient(to right, #FFF5F5, #DC2626, #991B1B)" }} />
                  <span>alta</span>
                </div>
              </div>
            )}
            {layer === "cruzamento" && (
              <div className="mt-4 space-y-2 text-xs text-[var(--color-text-tertiary)]">
                <p className="font-mono-data uppercase tracking-wider">Violência × resposta legislativa</p>
                <div className="flex flex-wrap gap-3">
                  <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-sm bg-[#7F1D1D]" /> Alta violência · baixa produção</span>
                  <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-sm bg-[#DC2626]" /> Alta violência · alta produção</span>
                  <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-sm bg-[#DBEAFE]" /> Baixa violência · alta produção</span>
                  <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-sm bg-[#E5E7EB]" /> Baixa violência · baixa produção</span>
                </div>
              </div>
            )}
          </div>

          {/* Detail panel */}
          <div className="space-y-4">
            {/* Feminicídio stats */}
            {(() => {
              const fem = FEMINICIDIO.ufs[displayUf];
              if (!fem) return null;
              const diff = fem.taxa - FEMINICIDIO.media_nacional;
              const above = diff > 0;
              return (
                <div className={`rounded-2xl p-5 ${above ? "border border-red-200 bg-red-50" : "border border-gray-200 bg-white"}`}>
                  <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
                    [ {UF_NAMES[displayUf]} · Feminicídio {FEMINICIDIO.ano_referencia} ]
                  </p>
                  <div className="mt-3 flex items-baseline gap-3">
                    <p
                      className={`leading-none ${above ? "text-red-700" : "text-[var(--color-text)]"}`}
                      style={{ fontFamily: "var(--font-display-condensed)", fontSize: "clamp(2rem, 5vw, 3rem)", letterSpacing: "-0.02em" }}
                    >
                      {fem.taxa.toFixed(1)}
                    </p>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      por 100 mil mulheres
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono-data text-[10px]">
                    <span className="text-[var(--color-text-secondary)]">
                      <strong className={above ? "text-red-700" : "text-[var(--color-text)]"}>
                        {fem.ranking}º
                      </strong>{" "}
                      no ranking nacional
                    </span>
                    <span className="text-[var(--color-text-secondary)]">
                      <strong className="text-[var(--color-text)]">{fem.vitimas}</strong> vítimas
                    </span>
                    <span className={above ? "text-red-600" : "text-emerald-600"}>
                      {above ? "+" : ""}{diff.toFixed(1)} pts da média
                    </span>
                  </div>
                  {fem.estimativa && (
                    <p className="mt-2 font-mono-data text-[9px] text-[var(--color-text-tertiary)]">
                      * Dado estimado (fonte regional FBSP)
                    </p>
                  )}
                  {fem.subnotificacao && (
                    <p className="mt-2 font-mono-data text-[9px] text-amber-600">
                      ⚠ Subnotificação reconhecida pelo FBSP
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Top 3 panel */}
            <div className="rounded-2xl bg-[var(--color-bg-alt)] p-6">
            <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--color-blue)]">
              [ {UF_NAMES[displayUf] || displayUf} · Top 3 articuladores ]
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
              {displayData
                ? `${displayData.total_deps} deputados na bancada · ${displayData.deputados_atuantes ?? 0} atuam no tema`
                : "Selecione um estado"}
            </p>

            {/* Selo de zero mulheres */}
            {displayData?.zero_mulheres && (
              <div className="mt-4 rounded-lg border-l-4 border-[#D43F3F] bg-[#FFE4E4]/60 p-3">
                <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[#B02525]">
                  [ ⚠ Zero deputadas eleitas ]
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--color-text)]">
                  <strong>
                    {UF_NAMES[displayUf] || displayUf}
                  </strong>{" "}
                  tem{" "}
                  <strong>
                    {displayData.camara_total ?? 0} deputados na atual
                    legislatura — nenhuma mulher.
                  </strong>{" "}
                  Quem atua em pautas da mulher nesse estado são
                  homens, por ausência de representação feminina
                  eleita.
                </p>
              </div>
            )}

            {displayData && (
              <ul className="mt-6 space-y-4">
                {displayData.top3.map((d, i) => {
                  const dep = AUTORIA_IDX.get(d.id);
                  const isCandidato = TSE_ON && CANDIDATOS_SET.has(d.id);
                  return (
                    <li key={d.id}>
                      <button
                        onClick={() => { if (dep) { setMapModalFilter("all"); setSelectedDep(dep); } }}
                        className="w-full rounded-lg border border-gray-200 bg-white p-4 text-left transition-colors hover:border-[var(--color-blue)]/40 hover:bg-[var(--color-blue)]/5"
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-mono-data text-sm font-bold"
                            style={{
                              backgroundColor: i === 0 ? "#DCFF00" : "var(--color-bg-alt)",
                              color: i === 0 ? "#0A0A0A" : "var(--color-text)",
                            }}
                          >
                            {i + 1}
                          </span>
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
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-bold text-[var(--color-text)]">
                                {d.nome}
                              </p>
                              {isCandidato && (
                                <span className="rounded-full bg-[var(--color-blue)] px-2 py-0.5 font-mono-data text-[8px] font-bold uppercase tracking-wider text-white">
                                  2026
                                </span>
                              )}
                            </div>
                            <p className="font-mono-data text-[10px] text-[var(--color-text-tertiary)]">
                              {d.partido} · {d.uf}
                            </p>
                            {(d.surto_qtd ?? 0) >= 10 && (
                              <p
                                className="mt-1 inline-block rounded bg-amber-500/20 px-1.5 py-0.5 font-mono-data text-[9px] font-bold uppercase tracking-wider text-amber-800"
                                title={`Protocolou ${d.surto_qtd} PLs num único dia (${formatarDataSurto(d.surto_data)}). Protocolo em massa — acima de 5/dia não conta pro score${(d.pls_descontadas ?? 0) > 0 ? ` (${d.pls_descontadas} descontadas)` : ""}.`}
                              >
                                ⚠ {d.surto_qtd} PLs em 1 dia
                              </p>
                            )}
                            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono-data text-[10px]">
                              <span className="text-[var(--color-text-secondary)]">
                                <strong className="text-[var(--color-text)]">
                                  {d.total_pls}
                                </strong>{" "}
                                PLs
                              </span>
                              {d.estruturais > 0 && (
                                <span
                                  className="rounded px-1.5"
                                  style={{
                                    backgroundColor: "#0A0A0A",
                                    color: "#DCFF00",
                                  }}
                                >
                                  <strong>{d.estruturais}</strong> estruturais
                                </span>
                              )}
                              {d.incrementais > 0 && (
                                <span className="text-[var(--color-text-secondary)]">
                                  <strong className="text-[var(--color-text)]">
                                    {d.incrementais}
                                  </strong>{" "}
                                  incrementais
                                </span>
                              )}
                            </div>
                            {/* Selo de voto regressivo — explicita por que o
                                score caiu quando há SIM em pauta regressiva */}
                            {(d.votos_regressivos ?? 0) > 0 && d.votos_regressivos_detalhe && d.votos_regressivos_detalhe.length > 0 && (
                              <div
                                className="mt-2 rounded bg-[#ED447F]/10 px-2 py-1"
                                title={d.votos_regressivos_detalhe.map(
                                  (vr) => `Votou ${vr.voto} no ${vr.pl_ref}: ${vr.descricao}. ${vr.placar} em ${vr.data}.`
                                ).join(" ")}
                              >
                                <div className="flex items-center gap-1">
                                  <span className="text-[#ED447F] text-[10px]">⚠</span>
                                  <span className="font-mono-data text-[9px] font-bold text-[#ED447F]">
                                    Votou SIM: {d.votos_regressivos_detalhe[0].descricao}
                                  </span>
                                </div>
                                <p className="mt-0.5 pl-4 font-mono-data text-[8px] text-[#ED447F]/70">
                                  {d.votos_regressivos_detalhe[0].pl_ref} · {d.votos_regressivos_detalhe[0].data}
                                </p>
                              </div>
                            )}
                          </div>
                          <span className="flex-shrink-0 font-mono-data text-[10px] uppercase tracking-wider text-[var(--color-blue)]">
                            ver →
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {!displayData && (
              <div className="mt-10 text-center text-sm text-[var(--color-text-tertiary)]">
                Passe o mouse sobre um estado do mapa para ver os
                articuladores políticos da região.
              </div>
            )}
            </div>
          </div>
        </div>

        <p className="mt-10 font-mono-data text-xs text-[var(--color-text-tertiary)]">
          Fontes: API da Câmara dos Deputados (produção legislativa) ·
          FBSP / 18º Anuário de Segurança Pública (feminicídio {FEMINICIDIO.ano_referencia}) ·
          Atualização automática diária.
        </p>
      </div>
    </section>
    </>
  );
}
