"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import articuladoresData from "../data/articuladores_uf.json";
import ScrollFloat from "./ScrollFloat";

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
  coerencia_sim: number;
  coerencia_nao: number;
  coerencia_participacoes: number;
  coerencia_score: number | null;
  score_articulador: number;
};

type UFData = {
  total_deps: number;
  top3: Articulador[];
};

type ArticuladoresJSON = {
  ufs: Record<string, UFData>;
  total_deputados: number;
};

const DATA = articuladoresData as ArticuladoresJSON;

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

    // Color scale based on score of top articulador
    const scores = Object.values(DATA.ufs).map(
      (u) => u.top3[0]?.score_articulador ?? 0
    );
    const maxScore = Math.max(...scores);
    const colorScale = d3
      .scaleSequential<string>()
      .domain([0, maxScore])
      .interpolator(d3.interpolateRgb("#E6EEFF", "#005FFF"));

    const projection = d3.geoMercator().fitSize([width, height], geoData);
    const path = d3.geoPath(projection);

    const g = svg.append("g");

    g.selectAll<SVGPathElement, Feature>("path")
      .data(geoData.features)
      .join("path")
      .attr("d", (d) => path(d) ?? "")
      .attr("fill", (d) => {
        const sigla = (d.properties as { sigla: string }).sigla;
        const uf = DATA.ufs[sigla];
        const score = uf?.top3[0]?.score_articulador ?? 0;
        return score > 0 ? colorScale(score) : "#E6EEFF";
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
      .on("pointerenter", function (_, d) {
        const sigla = (d.properties as { sigla: string }).sigla;
        setHoveredUf(sigla);
        d3.select(this).attr("stroke", "#DCFF00").attr("stroke-width", 3);
      })
      .on("pointerleave", function (_, d) {
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
        const uf = DATA.ufs[sigla];
        const score = uf?.top3[0]?.score_articulador ?? 0;
        return score > 20 ? "#ffffff" : "#0A0A0A";
      })
      .style("font-family", "var(--font-mono)")
      .style("font-size", "10px")
      .style("font-weight", "700")
      .style("pointer-events", "none")
      .text((d) => (d.properties as { sigla: string }).sigla);
  }, [geoData, selectedUf]);

  useEffect(() => {
    drawMap();
    const handleResize = () => drawMap();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [drawMap]);

  const displayUf = hoveredUf || selectedUf;
  const displayData = DATA.ufs[displayUf];

  return (
    <section className="bg-white px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 offset-left">
          <p className="mb-4 font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
            [ GUIA ELEITORAL POR ESTADO ]
          </p>
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

        {/* Disclaimer */}
        <div className="mt-6 rounded-xl border border-[var(--color-text-tertiary)]/20 bg-[var(--color-bg-alt)] p-5">
          <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
            [ Sobre este ranking ]
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
            Score = (PLs estruturais × 2) + (PLs incrementais × 1).
            Considera apenas deputados em{" "}
            <strong>exercício na atual legislatura</strong>. Quando o
            TSE publicar a lista oficial de candidatos a 2026, a seção
            será filtrada automaticamente para mostrar só quem
            efetivamente se candidatou à reeleição.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-[1fr_1.2fr]">
          {/* Map */}
          <div>
            <div ref={containerRef} className="relative">
              <svg ref={svgRef} className="w-full" />
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-[var(--color-text-tertiary)]">
              <span className="font-mono-data uppercase tracking-wider">
                Produção legislativa por estado
              </span>
              <div className="flex items-center gap-2">
                <span>baixa</span>
                <div
                  className="h-3 w-20 rounded"
                  style={{
                    background:
                      "linear-gradient(to right, #E6EEFF, #7DA4FF, #005FFF)",
                  }}
                />
                <span>alta</span>
              </div>
            </div>
          </div>

          {/* Top 3 panel */}
          <div className="rounded-2xl bg-[var(--color-bg-alt)] p-6">
            <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--color-blue)]">
              [ {UF_NAMES[displayUf] || displayUf} · Top 3 articuladores ]
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
              {displayData
                ? `Dentre ${displayData.total_deps} deputados em exercício`
                : "Selecione um estado"}
            </p>

            {displayData && (
              <ul className="mt-6 space-y-4">
                {displayData.top3.map((d, i) => (
                  <li
                    key={d.id}
                    className="rounded-lg border border-gray-200 bg-white p-4"
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
                        <p className="truncate text-sm font-bold text-[var(--color-text)]">
                          {d.nome}
                        </p>
                        <p className="font-mono-data text-[10px] text-[var(--color-text-tertiary)]">
                          {d.partido} · {d.uf}
                        </p>
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
                          {d.coerencia_participacoes > 0 && (
                            <span
                              className="text-[var(--color-text-secondary)]"
                            >
                              coerência{" "}
                              <strong
                                style={{
                                  color:
                                    (d.coerencia_score ?? 0) >= 75
                                      ? "var(--color-teal)"
                                      : (d.coerencia_score ?? 0) >= 50
                                      ? "var(--color-text)"
                                      : "var(--color-blood)",
                                }}
                              >
                                {d.coerencia_score?.toFixed(0)}%
                              </strong>
                            </span>
                          )}
                        </div>
                      </div>
                      <a
                        href={`https://www.camara.leg.br/deputados/${d.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 font-mono-data text-[10px] uppercase tracking-wider text-[var(--color-blue)] hover:underline"
                      >
                        ver ↗
                      </a>
                    </div>
                  </li>
                ))}
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

        <p className="mt-10 font-mono-data text-xs text-[var(--color-text-tertiary)]">
          Fontes: autoria de PLs e votações da API da Câmara dos Deputados
          · Considera {DATA.total_deputados} deputados ativos na
          57ª legislatura. Atualização automática quando TSE publicar
          candidatos 2026.
        </p>
      </div>
    </section>
  );
}
