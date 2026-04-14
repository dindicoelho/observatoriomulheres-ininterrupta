"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import estados from "../data/estados.json";

type StateData = {
  name: string;
  values: Record<string, number>;
  absolutos: Record<string, number>;
};

type StatesJSON = {
  years: number[];
  states: Record<string, StateData>;
};

const DATA = estados as StatesJSON;
const RATE_YEARS = Object.keys(
  DATA.states[Object.keys(DATA.states)[0]].values
)
  .map(Number)
  .sort();
const DEFAULT_YEAR = Math.max(...RATE_YEARS); // 2022

export default function ChoroplethMap() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [geoData, setGeoData] =
    useState<FeatureCollection<Geometry, { sigla: string; name: string }> | null>(
      null
    );
  const [year, setYear] = useState(DEFAULT_YEAR);
  const [hoveredUF, setHoveredUF] = useState<string | null>(null);

  // Load geojson on mount (lazy)
  useEffect(() => {
    fetch("/brazil-states.geojson")
      .then((r) => r.json())
      .then(setGeoData)
      .catch(console.error);
  }, []);

  // Build ranking
  const ranking = Object.entries(DATA.states)
    .map(([uf, d]) => ({
      uf,
      name: d.name,
      rate: d.values[String(year)] ?? null,
    }))
    .filter((r) => r.rate !== null)
    .sort((a, b) => (b.rate ?? 0) - (a.rate ?? 0));

  const drawMap = useCallback(() => {
    if (!geoData || !svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const containerW = containerRef.current.clientWidth;
    const width = containerW;
    const height = Math.min(600, window.innerHeight * 0.7);

    svg.attr("width", width).attr("height", height);

    // Color scale
    const maxRate = d3.max(
      Object.values(DATA.states).flatMap((s) =>
        Object.values(s.values)
      )
    ) as number;

    const colorScale = d3
      .scaleSequential<string>()
      .domain([0, maxRate])
      .interpolator(
        d3.interpolateRgb("#FCEBEB", "#791F1F")
      );

    // Projection
    const projection = d3
      .geoMercator()
      .fitSize([width, height], geoData);

    const path = d3.geoPath(projection);

    const g = svg.append("g");

    // Tooltip
    const tooltip = d3
      .select(containerRef.current)
      .selectAll<HTMLDivElement, null>(".map-tooltip")
      .data([null])
      .join("div")
      .attr("class", "map-tooltip")
      .style("position", "absolute")
      .style("pointer-events", "none")
      .style("background", "white")
      .style("border", "1px solid #e5e5e5")
      .style("border-radius", "8px")
      .style("padding", "10px 14px")
      .style("font-size", "13px")
      .style("font-family", "var(--font-body)")
      .style("box-shadow", "0 4px 12px rgba(0,0,0,0.1)")
      .style("opacity", 0)
      .style("z-index", "20")
      .style("transition", "opacity 0.15s");

    g.selectAll<SVGPathElement, Feature>("path")
      .data(geoData.features)
      .join("path")
      .attr("d", (d) => path(d) ?? "")
      .attr("fill", (d) => {
        const sigla = (d.properties as { sigla: string }).sigla;
        const state = DATA.states[sigla];
        const rate = state?.values[String(year)];
        return rate !== undefined ? colorScale(rate) : "#ddd";
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.8)
      .style("cursor", "pointer")
      .style("transition", "fill 0.3s, opacity 0.15s")
      .on("mouseenter", function (event, d) {
        const sigla = (d.properties as { sigla: string }).sigla;
        const state = DATA.states[sigla];
        if (!state) return;

        d3.select(this).attr("stroke", "#1A1A1A").attr("stroke-width", 2);
        setHoveredUF(sigla);

        const rate = state.values[String(year)];
        const absYear = Math.max(
          ...Object.keys(state.absolutos).map(Number).filter((y) => y <= year + 1)
        );
        const abs = state.absolutos[String(absYear)];

        tooltip
          .html(
            `<strong>${state.name}</strong><br/>` +
              `Taxa: <strong>${rate?.toFixed(2) ?? "—"}</strong> por 100 mil (${year})<br/>` +
              `Absolutos: <strong>${abs ?? "—"}</strong> homicídios (${absYear})`
          )
          .style("opacity", 1);
      })
      .on("mousemove", function (event) {
        const [x, y] = d3.pointer(event, containerRef.current);
        tooltip
          .style("left", `${x + 16}px`)
          .style("top", `${y - 10}px`);
      })
      .on("mouseleave", function () {
        d3.select(this).attr("stroke", "#fff").attr("stroke-width", 0.8);
        setHoveredUF(null);
        tooltip.style("opacity", 0);
      });

    // State labels for top 5
    const top5 = ranking.slice(0, 5).map((r) => r.uf);
    g.selectAll<SVGTextElement, Feature>("text.uf-label")
      .data(
        geoData.features.filter((f) =>
          top5.includes((f.properties as { sigla: string }).sigla)
        )
      )
      .join("text")
      .attr("class", "uf-label")
      .attr("x", (d) => path.centroid(d)[0])
      .attr("y", (d) => path.centroid(d)[1])
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("fill", "#fff")
      .attr("stroke", "#791F1F")
      .attr("stroke-width", 0.5)
      .style("font-family", "var(--font-body)")
      .style("font-size", "10px")
      .style("font-weight", "700")
      .style("pointer-events", "none")
      .text((d) => (d.properties as { sigla: string }).sigla);
  }, [geoData, year, ranking]);

  useEffect(() => {
    drawMap();
    const handleResize = () => drawMap();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [drawMap]);

  const maxRate = ranking[0]?.rate ?? 0;

  return (
    <section className="bg-white px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 offset-left">
          <p className="mb-4 font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
            Ato 03 · Geografia
          </p>
          <h2
            className="text-5xl font-black leading-[0.9] text-[var(--color-text)] md:text-7xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Onde você mora
            <br />
            <span className="text-[var(--color-blood)]">importa.</span>
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--color-text-secondary)]">
            A probabilidade de uma mulher ser assassinada varia em até{" "}
            <strong>7 vezes</strong> dependendo do estado onde mora.
          </p>
        </div>

        {/* Year selector */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
          <span className="text-sm text-[var(--color-text-tertiary)]">Ano:</span>
          {RATE_YEARS.filter((y) => y >= 2012).map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={`rounded-full px-3 py-1 text-sm transition-all ${
                y === year
                  ? "bg-[var(--color-blood)] text-white"
                  : "bg-[var(--color-bg-alt)] text-[var(--color-text-secondary)] hover:bg-gray-200"
              }`}
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {y}
            </button>
          ))}
        </div>

        {/* Map + Ranking */}
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {/* Map */}
          <div className="md:col-span-2">
            <div ref={containerRef} className="relative">
              <svg ref={svgRef} className="w-full" />
            </div>
            {/* Legend */}
            <div className="mt-4 flex items-center justify-center gap-3 text-xs text-[var(--color-text-tertiary)]">
              <span>Taxa por 100 mil mulheres</span>
              <div className="flex items-center gap-1">
                <span>0</span>
                <div
                  className="h-3 w-32 rounded"
                  style={{
                    background:
                      "linear-gradient(to right, #FCEBEB, #D47575, #791F1F)",
                  }}
                />
                <span>{maxRate.toFixed(1)}+</span>
              </div>
            </div>
          </div>

          {/* Ranking */}
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">
              Ranking {year}
            </h3>
            <ol className="space-y-2">
              {ranking.slice(0, 10).map((r, i) => (
                <li
                  key={r.uf}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                    hoveredUF === r.uf
                      ? "bg-[var(--color-blood-light)]"
                      : "hover:bg-[var(--color-bg-alt)]"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className="w-5 text-[var(--color-text-tertiary)]"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {i + 1}
                    </span>
                    <span className="font-medium">{r.name}</span>
                  </span>
                  <span
                    className="font-bold text-[var(--color-blood)]"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {r.rate?.toFixed(2)}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Context */}
        <div className="mx-auto mt-12 max-w-2xl rounded-xl bg-[var(--color-bg-alt)] p-6 text-center">
          <p className="text-base leading-relaxed text-[var(--color-text-secondary)]">
            Em <strong>{ranking[0]?.name}</strong> a taxa é de{" "}
            <strong className="text-[var(--color-blood)]">
              {ranking[0]?.rate?.toFixed(2)}
            </strong>{" "}
            por 100 mil mulheres.{" "}
            Em <strong>{ranking[ranking.length - 1]?.name}</strong>, de{" "}
            <strong className="text-[var(--color-teal)]">
              {ranking[ranking.length - 1]?.rate?.toFixed(2)}
            </strong>
            . A mesma lei, a mesma federação — geografias de proteção diferentes.
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-[var(--color-text-tertiary)]">
          Fonte: Atlas da Violência (IPEA/FBSP), série 52. Dados até {DEFAULT_YEAR}.
        </p>
      </div>
    </section>
  );
}
