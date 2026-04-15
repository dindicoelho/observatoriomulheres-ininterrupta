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

type TaxaPoint = {
  year: number;
  total_abs: number;
  negras_abs: number;
  nao_negras_abs: number;
  taxa_total: number;
  taxa_negras: number;
  taxa_nao_negras: number;
  pop_fem: number;
};

type Mode = "absolutos" | "taxa";

// Filter to 2001+ where racial classification is consistently reliable
const tesoura: TesouraPoint[] = data.tesoura.filter((d) => d.year >= 2001);
const taxas: TaxaPoint[] = (data.taxas as TaxaPoint[]).filter((d) => d.year >= 2001);
const marcos = data.marcos;

const MARGIN_DESKTOP = { top: 40, right: 120, bottom: 50, left: 55 };
const MARGIN_MOBILE = { top: 25, right: 15, bottom: 40, left: 40 };

export default function TesouraChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [phase, setPhase] = useState(0);
  const [mode, setMode] = useState<Mode>("absolutos");

  const drawChart = useCallback(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const isMobile = window.innerWidth < 768;
    const MARGIN = isMobile ? MARGIN_MOBILE : MARGIN_DESKTOP;
    const height = isMobile
      ? Math.min(300, window.innerHeight * 0.38)
      : Math.min(500, window.innerHeight * 0.6);

    svg.attr("width", width).attr("height", height).attr("role", "img");

    const innerW = width - MARGIN.left - MARGIN.right;
    const innerH = height - MARGIN.top - MARGIN.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    // Scales
    const x = d3
      .scaleLinear()
      .domain([2001, 2023])
      .range([0, innerW]);

    // Select y values based on mode
    const getYTotal = (d: TesouraPoint, i: number) => {
      if (mode === "taxa" && taxas[i]) return taxas[i].taxa_total;
      return d.total ?? d.negras + d.naoNegras;
    };
    const getYNegras = (d: TesouraPoint, i: number) => {
      if (mode === "taxa" && taxas[i]) return taxas[i].taxa_negras;
      return d.negras;
    };
    const getYNaoNegras = (d: TesouraPoint, i: number) => {
      if (mode === "taxa" && taxas[i]) return taxas[i].taxa_nao_negras;
      return d.naoNegras;
    };

    const maxVal =
      mode === "taxa"
        ? d3.max(taxas, (d) =>
            Math.max(d.taxa_negras, d.taxa_nao_negras, d.taxa_total)
          ) ?? 6
        : d3.max(tesoura, (d) =>
            Math.max(d.negras, d.naoNegras, d.total ?? 0)
          ) ?? 4500;

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
    const yFormat = mode === "taxa"
      ? (d: d3.NumberValue) => (d as number).toFixed(1)
      : (d: d3.NumberValue) => d3.format(",")(d as number);

    g.append("g")
      .call(
        d3.axisLeft(y)
          .ticks(5)
          .tickFormat(yFormat)
      )
      .call((g) => g.select(".domain").remove());

    // Line generators
    const lineTotal = d3
      .line<TesouraPoint>()
      .x((d) => x(d.year))
      .y((d, i) => y(getYTotal(d, i)))
      .curve(d3.curveMonotoneX);

    const lineNegras = d3
      .line<TesouraPoint>()
      .x((d) => x(d.year))
      .y((d, i) => y(getYNegras(d, i)))
      .curve(d3.curveMonotoneX);

    const lineNaoNegras = d3
      .line<TesouraPoint>()
      .x((d) => x(d.year))
      .y((d, i) => y(getYNaoNegras(d, i)))
      .curve(d3.curveMonotoneX);

    const formatVal = (v: number) => {
      if (mode === "taxa") return v.toFixed(2);
      return v.toLocaleString("pt-BR");
    };

    if (phase === 0) {
      // Phase 0: single total line
      const path = g
        .append("path")
        .datum(tesoura)
        .attr("fill", "none")
        .attr("stroke", "var(--color-text)")
        .attr("stroke-width", 2.5)
        .attr("d", lineTotal);

      const totalLength = path.node()?.getTotalLength() ?? 0;
      path
        .attr("stroke-dasharray", totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(1500)
        .ease(d3.easeQuadOut)
        .attr("stroke-dashoffset", 0);

      const lastIdx = tesoura.length - 1;
      const last = tesoura[lastIdx];
      g.append("text")
        .attr("x", x(last.year) + 8)
        .attr("y", y(getYTotal(last, lastIdx)))
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

      const area = d3
        .area<TesouraPoint>()
        .x((d) => x(d.year))
        .y0((d, i) => y(getYNaoNegras(d, i)))
        .y1((d, i) => y(getYNegras(d, i)))
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

      const lastIdx = tesoura.length - 1;
      const lastPoint = tesoura[lastIdx];

      g.append("text")
        .attr("x", x(lastPoint.year) + 8)
        .attr("y", y(getYNegras(lastPoint, lastIdx)))
        .attr("dy", "0.35em")
        .attr("fill", "var(--color-blood)")
        .style("font-family", "var(--font-body)")
        .style("font-size", "13px")
        .style("font-weight", "700")
        .text(`Negras: ${formatVal(getYNegras(lastPoint, lastIdx))}`)
        .attr("opacity", 0)
        .transition()
        .delay(1200)
        .duration(500)
        .attr("opacity", 1);

      g.append("text")
        .attr("x", x(lastPoint.year) + 8)
        .attr("y", y(getYNaoNegras(lastPoint, lastIdx)))
        .attr("dy", "0.35em")
        .attr("fill", "var(--color-text-secondary)")
        .style("font-family", "var(--font-body)")
        .style("font-size", "13px")
        .style("font-weight", "700")
        .text(`Não negras: ${formatVal(getYNaoNegras(lastPoint, lastIdx))}`)
        .attr("opacity", 0)
        .transition()
        .delay(1200)
        .duration(500)
        .attr("opacity", 1);

      if (phase >= 2) {
        marcos.forEach((marco) => {
          if (marco.year < 2001 || marco.year > 2023) return;

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
      .on("touchstart touchmove", (event: TouchEvent) => {
        event.preventDefault();
      })
      .on("pointermove", (event: PointerEvent) => {
        const [mx] = d3.pointer(event);
        const yearHover = x.invert(mx - MARGIN.left);
        const idx = bisect(tesoura, yearHover, 1);
        const d0 = tesoura[idx - 1];
        const d1 = tesoura[idx];
        if (!d0 || !d1) return;
        const useI = yearHover - d0.year > d1.year - yearHover ? idx : idx - 1;
        const d = tesoura[useI];

        let html = `<strong>${d.year}</strong><br/>`;
        if (phase === 0) {
          html += `${mode === "taxa" ? "Taxa total" : "Total"}: ${formatVal(getYTotal(d, useI))}`;
          if (mode === "taxa") html += " <span style='color:#888'>/ 100 mil</span>";
        } else {
          html += `<span style="color:var(--color-blood)">Negras: ${formatVal(getYNegras(d, useI))}</span>`;
          if (mode === "taxa") html += " <span style='color:#888'>/ 100 mil</span>";
          html += `<br/><span style="color:var(--color-text-secondary)">Não negras: ${formatVal(getYNaoNegras(d, useI))}</span>`;
          if (mode === "taxa") html += " <span style='color:#888'>/ 100 mil</span>";
        }

        tooltip
          .html(html)
          .style("left", `${event.offsetX + 16}px`)
          .style("top", `${event.offsetY - 20}px`)
          .style("opacity", 1);
      })
      .on("pointerleave", () => {
        tooltip.style("opacity", 0);
      });
  }, [phase, mode]);

  useEffect(() => {
    drawChart();
    const handleResize = () => drawChart();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [drawChart]);

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
        <div className="mb-16 offset-left">
          <p className="mb-4 font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
            [ ATO 05 / A CAMADA RACIAL ]
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

        <div className="relative md:flex md:gap-12">
          <div className="sticky top-0 z-10 bg-[var(--color-bg-alt)] pb-4 pt-4 md:top-24 md:w-2/3 md:self-start md:pt-0">
            {/* Mode toggle */}
            <div className="mb-4 flex items-center gap-2 overflow-x-auto">
              <span className="hidden font-mono-data text-xs uppercase tracking-wider text-[var(--color-text-tertiary)] sm:inline">
                Ver como:
              </span>
              <button
                onClick={() => setMode("absolutos")}
                className={`flex-shrink-0 rounded-full px-3 py-1 text-xs transition-colors ${
                  mode === "absolutos"
                    ? "bg-[var(--color-text)] text-white"
                    : "bg-white text-[var(--color-text-secondary)] hover:bg-gray-100"
                }`}
              >
                <span className="sm:hidden">Absoluto</span>
                <span className="hidden sm:inline">Números absolutos</span>
              </button>
              <button
                onClick={() => setMode("taxa")}
                className={`flex-shrink-0 rounded-full px-3 py-1 text-xs transition-colors ${
                  mode === "taxa"
                    ? "bg-[var(--color-blood)] text-white"
                    : "bg-white text-[var(--color-text-secondary)] hover:bg-gray-100"
                }`}
              >
                <span className="sm:hidden">Taxa / 100 mil</span>
                <span className="hidden sm:inline">Taxa por 100 mil mulheres</span>
              </button>
            </div>

            <div ref={containerRef} className="relative">
              <svg ref={svgRef} className="w-full" />
            </div>
            <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">
              {mode === "absolutos"
                ? "Número absoluto de homicídios de mulheres por ano."
                : "Homicídios por 100 mil mulheres (ajustado pela população feminina)."}
              {" "}Fonte: Atlas da Violência (IPEA/FBSP), séries 40, 142, 143.
              {mode === "taxa" && " População: IBGE (estimativas) + PNAD Contínua (composição racial)."}
            </p>
          </div>

          <div className="mt-8 space-y-[50vh] md:mt-0 md:w-1/3 md:space-y-[60vh]">
            <div data-tesoura-step="0" className="min-h-[40vh] flex items-center">
              <div className="rounded-lg bg-white/80 p-6 backdrop-blur-sm">
                <p className="text-lg leading-relaxed text-[var(--color-text)]">
                  Entre 2001 e 2023, o Brasil registrou mais de{" "}
                  <strong>90 mil homicídios de mulheres</strong>.
                  A curva do número absoluto nunca caiu de verdade.
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
                  Em <strong>taxa por 100 mil mulheres</strong>, o risco de uma
                  mulher negra ser assassinada passou a ser quase{" "}
                  <strong className="text-[var(--color-blood)]">2× maior</strong>{" "}
                  que o de uma não negra.
                </p>
                <p className="mt-4 text-base text-[var(--color-text-secondary)]">
                  Em 2001, era praticamente igual. Experimente os dois modos
                  no gráfico.
                </p>
              </div>
            </div>

            <div className="h-[20vh]" />
          </div>
        </div>

        {/* Editorial note */}
        <div className="mx-auto mt-20 max-w-3xl space-y-5 text-[var(--color-text-secondary)]">
          <p className="font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
            Leitura dos dois lados da moeda
          </p>

          <p className="text-base leading-relaxed md:text-lg">
            <strong className="text-[var(--color-text)]">
              Nos números absolutos,
            </strong>{" "}
            o Brasil mata quase o mesmo número de mulheres por ano há duas
            décadas — entre 3,5 mil e 4,9 mil. A curva oscila, mas não cai
            estruturalmente.
          </p>

          <p className="text-base leading-relaxed md:text-lg">
            <strong className="text-[var(--color-text)]">
              Em taxa por 100 mil mulheres,
            </strong>{" "}
            o cenário tem mais de uma camada. A taxa total do país caiu de
            4,3 (2001) para 3,5 (2023) — redução modesta, ajudada pelo
            crescimento populacional. Mas a tesoura racial{" "}
            <strong className="text-[var(--color-blood)]">
              abriu, e muito.
            </strong>
          </p>

          <p className="text-base leading-relaxed md:text-lg">
            Em 2001, uma mulher negra tinha risco de assassinato{" "}
            <strong className="text-[var(--color-text)]">
              praticamente igual
            </strong>{" "}
            ao de uma mulher não negra. Hoje, esse risco é{" "}
            <strong className="text-[var(--color-blood)]">
              1,76× maior
            </strong>
            . A desigualdade racial na mortalidade feminina cresceu 56% em 22
            anos.
          </p>

          <p className="text-base leading-relaxed md:text-lg">
            Essa diferença entre os dois modos é importante. Quem olha só
            o número absoluto vê estagnação. Quem olha só a taxa total vê
            uma leve melhora. Quem olha{" "}
            <strong className="text-[var(--color-text)]">a taxa por raça</strong>{" "}
            vê o que está realmente acontecendo: o Brasil reduziu um pouco
            de risco para umas, e aumentou muito o risco para outras. A
            tesoura não é só uma metáfora — é o que os dados mostram,
            de duas maneiras diferentes de contar a mesma coisa.
          </p>

          <p className="text-base leading-relaxed md:text-lg">
            A queda aparente de 2017-2019 foi um fenômeno macro da segurança
            pública brasileira — acordos entre facções no Nordeste,
            reclassificação CID-10 após a Lei do Feminicídio, e
            subnotificação reconhecida pelo FBSP. Atingiu as duas curvas em
            proporção parecida. Não quebrou a tesoura.
          </p>
        </div>
      </div>
    </section>
  );
}
