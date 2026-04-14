"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import data from "../data/homicidios.json";

type TesouraPoint = {
  year: number;
  total: number | null;
  negras: number;
  naoNegras: number;
};

const tesoura: TesouraPoint[] = data.tesoura;
const marcos = data.marcos;

const MARGIN = { top: 40, right: 120, bottom: 50, left: 55 };

export default function TesouraChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [phase, setPhase] = useState(0);
  // 0 = total line only
  // 1 = split into negras + naoNegras
  // 2 = show marcos legislativos

  const drawChart = useCallback(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = Math.min(500, window.innerHeight * 0.6);

    svg.attr("width", width).attr("height", height).attr("role", "img");

    const innerW = width - MARGIN.left - MARGIN.right;
    const innerH = height - MARGIN.top - MARGIN.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    // Scales
    const x = d3
      .scaleLinear()
      .domain([1997, 2023])
      .range([0, innerW]);

    const maxVal = d3.max(tesoura, (d) => Math.max(d.negras, d.naoNegras, d.total ?? 0)) ?? 4500;
    const y = d3
      .scaleLinear()
      .domain([0, maxVal * 1.1])
      .range([innerH, 0]);

    // Grid lines
    g.append("g")
      .attr("class", "grid")
      .call(
        d3.axisLeft(y)
          .ticks(5)
          .tickSize(-innerW)
          .tickFormat(() => "")
      )
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll(".tick line").attr("stroke", "#f0efed").attr("stroke-dasharray", "2,4"));

    // X axis
    g.append("g")
      .attr("transform", `translate(0,${innerH})`)
      .call(
        d3.axisBottom(x)
          .ticks(7)
          .tickFormat((d) => String(d))
      )
      .call((g) => g.select(".domain").attr("stroke", "#e5e5e5"));

    // Y axis
    g.append("g")
      .call(
        d3.axisLeft(y)
          .ticks(5)
          .tickFormat((d) => d3.format(",")(d as number))
      )
      .call((g) => g.select(".domain").remove());

    // Line generators
    const lineTotal = d3
      .line<TesouraPoint>()
      .x((d) => x(d.year))
      .y((d) => y(d.total ?? d.negras + d.naoNegras))
      .curve(d3.curveMonotoneX);

    const lineNegras = d3
      .line<TesouraPoint>()
      .x((d) => x(d.year))
      .y((d) => y(d.negras))
      .curve(d3.curveMonotoneX);

    const lineNaoNegras = d3
      .line<TesouraPoint>()
      .x((d) => x(d.year))
      .y((d) => y(d.naoNegras))
      .curve(d3.curveMonotoneX);

    if (phase === 0) {
      // Phase 0: single total line
      const path = g
        .append("path")
        .datum(tesoura)
        .attr("fill", "none")
        .attr("stroke", "var(--color-text)")
        .attr("stroke-width", 2.5)
        .attr("d", lineTotal);

      // Animate line drawing
      const totalLength = path.node()?.getTotalLength() ?? 0;
      path
        .attr("stroke-dasharray", totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(1500)
        .ease(d3.easeQuadOut)
        .attr("stroke-dashoffset", 0);

      // Label
      const last = tesoura[tesoura.length - 1];
      g.append("text")
        .attr("x", x(last.year) + 8)
        .attr("y", y(last.total ?? last.negras + last.naoNegras))
        .attr("dy", "0.35em")
        .attr("fill", "var(--color-text)")
        .style("font-family", "var(--font-body)")
        .style("font-size", "13px")
        .style("font-weight", "700")
        .text("Total")
        .attr("opacity", 0)
        .transition()
        .delay(1500)
        .duration(500)
        .attr("opacity", 1);
    } else {
      // Phase 1+: split lines
      // Negras line
      const pathNegras = g
        .append("path")
        .datum(tesoura)
        .attr("fill", "none")
        .attr("stroke", "var(--color-blood)")
        .attr("stroke-width", 3)
        .attr("d", lineNegras);

      const lenNegras = pathNegras.node()?.getTotalLength() ?? 0;
      pathNegras
        .attr("stroke-dasharray", lenNegras)
        .attr("stroke-dashoffset", lenNegras)
        .transition()
        .duration(1200)
        .ease(d3.easeQuadOut)
        .attr("stroke-dashoffset", 0);

      // Nao negras line
      const pathNaoNegras = g
        .append("path")
        .datum(tesoura)
        .attr("fill", "none")
        .attr("stroke", "var(--color-neutral)")
        .attr("stroke-width", 3)
        .attr("d", lineNaoNegras);

      const lenNaoNegras = pathNaoNegras.node()?.getTotalLength() ?? 0;
      pathNaoNegras
        .attr("stroke-dasharray", lenNaoNegras)
        .attr("stroke-dashoffset", lenNaoNegras)
        .transition()
        .duration(1200)
        .ease(d3.easeQuadOut)
        .attr("stroke-dashoffset", 0);

      // Area between the lines (the gap)
      const area = d3
        .area<TesouraPoint>()
        .x((d) => x(d.year))
        .y0((d) => y(d.naoNegras))
        .y1((d) => y(d.negras))
        .curve(d3.curveMonotoneX);

      g.append("path")
        .datum(tesoura)
        .attr("fill", "var(--color-blood)")
        .attr("opacity", 0)
        .attr("d", area)
        .transition()
        .delay(800)
        .duration(800)
        .attr("opacity", 0.08);

      // End labels
      const lastPoint = tesoura[tesoura.length - 1];

      // Negras label
      g.append("text")
        .attr("x", x(lastPoint.year) + 8)
        .attr("y", y(lastPoint.negras))
        .attr("dy", "0.35em")
        .attr("fill", "var(--color-blood)")
        .style("font-family", "var(--font-body)")
        .style("font-size", "13px")
        .style("font-weight", "700")
        .text(`Negras: ${lastPoint.negras.toLocaleString("pt-BR")}`)
        .attr("opacity", 0)
        .transition()
        .delay(1200)
        .duration(500)
        .attr("opacity", 1);

      // Nao negras label
      g.append("text")
        .attr("x", x(lastPoint.year) + 8)
        .attr("y", y(lastPoint.naoNegras))
        .attr("dy", "0.35em")
        .attr("fill", "var(--color-text-secondary)")
        .style("font-family", "var(--font-body)")
        .style("font-size", "13px")
        .style("font-weight", "700")
        .text(`Não negras: ${lastPoint.naoNegras.toLocaleString("pt-BR")}`)
        .attr("opacity", 0)
        .transition()
        .delay(1200)
        .duration(500)
        .attr("opacity", 1);

      // Phase 2: marcos legislativos
      if (phase >= 2) {
        marcos.forEach((marco) => {
          if (marco.year < 1997 || marco.year > 2023) return;

          const marcoG = g
            .append("g")
            .attr("opacity", 0)
            .transition()
            .delay(1500)
            .duration(500)
            .attr("opacity", 1);

          // Vertical dashed line
          g.append("line")
            .attr("x1", x(marco.year))
            .attr("x2", x(marco.year))
            .attr("y1", 0)
            .attr("y2", innerH)
            .attr("stroke", "var(--color-blue)")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "4,4")
            .attr("opacity", 0)
            .transition()
            .delay(1500)
            .duration(500)
            .attr("opacity", 0.6);

          // Label
          g.append("text")
            .attr("x", x(marco.year))
            .attr("y", -8)
            .attr("text-anchor", "middle")
            .attr("fill", "var(--color-blue)")
            .style("font-family", "var(--font-body)")
            .style("font-size", "11px")
            .style("font-weight", "500")
            .text(marco.label)
            .attr("opacity", 0)
            .transition()
            .delay(1600)
            .duration(500)
            .attr("opacity", 1);
        });
      }
    }

    // Tooltip
    const tooltip = d3
      .select(container)
      .selectAll(".tooltip")
      .data([null])
      .join("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("pointer-events", "none")
      .style("background", "white")
      .style("border", "1px solid #e5e5e5")
      .style("border-radius", "6px")
      .style("padding", "8px 12px")
      .style("font-size", "13px")
      .style("font-family", "var(--font-body)")
      .style("box-shadow", "0 2px 8px rgba(0,0,0,0.08)")
      .style("opacity", 0)
      .style("z-index", "10");

    const bisect = d3.bisector<TesouraPoint, number>((d) => d.year).left;

    svg
      .on("mousemove", (event: MouseEvent) => {
        const [mx] = d3.pointer(event);
        const yearHover = x.invert(mx - MARGIN.left);
        const idx = bisect(tesoura, yearHover, 1);
        const d0 = tesoura[idx - 1];
        const d1 = tesoura[idx];
        if (!d0 || !d1) return;
        const d = yearHover - d0.year > d1.year - yearHover ? d1 : d0;

        let html = `<strong>${d.year}</strong><br/>`;
        if (phase === 0) {
          html += `Total: ${(d.total ?? 0).toLocaleString("pt-BR")}`;
        } else {
          html += `<span style="color:var(--color-blood)">Negras: ${d.negras.toLocaleString("pt-BR")}</span><br/>`;
          html += `<span style="color:var(--color-text-secondary)">Não negras: ${d.naoNegras.toLocaleString("pt-BR")}</span>`;
        }

        tooltip
          .html(html)
          .style("left", `${event.offsetX + 16}px`)
          .style("top", `${event.offsetY - 20}px`)
          .style("opacity", 1);
      })
      .on("mouseleave", () => {
        tooltip.style("opacity", 0);
      });
  }, [phase]);

  // Redraw on phase change or resize
  useEffect(() => {
    drawChart();
    const handleResize = () => drawChart();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [drawChart]);

  // Scroll-triggered phase changes
  useEffect(() => {
    const sections = document.querySelectorAll("[data-tesoura-step]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const step = parseInt(
              (entry.target as HTMLElement).dataset.tesouraStep ?? "0"
            );
            setPhase(step);
          }
        });
      },
      { threshold: 0.6 }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="bg-[var(--color-bg-alt)]">
      <div className="mx-auto max-w-5xl px-6 py-24">
        {/* Section header */}
        <div className="mb-16 offset-left">
          <p className="mb-4 font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
            Ato 01 · A Divergência
          </p>
          <h2
            className="text-5xl font-black leading-[0.9] text-[var(--color-text)] md:text-7xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            A mesma lei.
            <br />
            <span className="text-[var(--color-blood)]">Resultados opostos.</span>
          </h2>
        </div>

        {/* Sticky chart */}
        <div className="relative md:flex md:gap-12">
          <div className="md:sticky md:top-24 md:w-2/3 md:self-start">
            <div ref={containerRef} className="relative">
              <svg ref={svgRef} className="w-full" />
            </div>
            <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">
              Fonte: Atlas da Violência (IPEA/FBSP). Séries 40, 142, 143.
            </p>
          </div>

          {/* Scroll steps */}
          <div className="mt-12 space-y-[60vh] md:mt-0 md:w-1/3">
            <div data-tesoura-step="0" className="min-h-[40vh] flex items-center">
              <div className="rounded-lg bg-white/80 p-6 backdrop-blur-sm">
                <p className="text-lg leading-relaxed text-[var(--color-text)]">
                  Entre 1997 e 2023, o Brasil registrou mais de{" "}
                  <strong>100 mil homicídios de mulheres</strong>.
                  A curva nunca caiu de verdade.
                </p>
              </div>
            </div>

            <div data-tesoura-step="1" className="min-h-[40vh] flex items-center">
              <div className="rounded-lg bg-white/80 p-6 backdrop-blur-sm">
                <p className="text-lg leading-relaxed text-[var(--color-text)]">
                  Mas quando separamos por raça, a linha se parte em duas.{" "}
                  <span className="font-bold text-[var(--color-blood)]">
                    Mulheres negras
                  </span>{" "}
                  e{" "}
                  <span className="font-bold text-[var(--color-text-secondary)]">
                    mulheres não negras
                  </span>{" "}
                  vivem realidades opostas.
                </p>
              </div>
            </div>

            <div data-tesoura-step="2" className="min-h-[40vh] flex items-center">
              <div className="rounded-lg bg-white/80 p-6 backdrop-blur-sm">
                <p className="text-lg leading-relaxed text-[var(--color-text)]">
                  A <span className="font-bold text-[var(--color-blue)]">Lei Maria da Penha</span> (2006) e a{" "}
                  <span className="font-bold text-[var(--color-blue)]">Lei do Feminicídio</span> (2015)
                  reduziram os homicídios de mulheres não negras.
                </p>
                <p className="mt-4 text-lg font-bold leading-relaxed text-[var(--color-blood)]">
                  Para mulheres negras, os números subiram.
                </p>
                <p className="mt-2 text-base text-[var(--color-text-secondary)]">
                  A mesma lei. Resultados opostos.
                </p>
              </div>
            </div>

            {/* Spacer for scroll */}
            <div className="h-[20vh]" />
          </div>
        </div>

      </div>
    </section>
  );
}
