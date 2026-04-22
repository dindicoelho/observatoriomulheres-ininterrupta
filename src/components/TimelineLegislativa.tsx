"use client";

import { useEffect, useRef, useState } from "react";
import legislativoData from "../data/legislativo.json";
import ScrollFloat from "./ScrollFloat";

type Proposicao = {
  id: number;
  tipo: string;
  numero: number;
  ano: number;
  ementa: string;
  data: string;
  categoria: "simbólica" | "incremental" | "estrutural";
  destino?: {
    categoria: string;
    situacao?: string | null;
    orgao?: string;
    data_hora?: string;
  };
};

type LegislativoJSON = {
  total: number;
  total_atual?: number;
  resumo: { simbólica: number; incremental: number; estrutural: number };
  resumo_atual?: { simbólica: number; incremental: number; estrutural: number };
  porAno: Record<string, { simbólica: number; incremental: number; estrutural: number }>;
  proposicoes: Proposicao[];
  destino_stats?: {
    total: number;
    por_categoria: {
      aprovada: number;
      no_senado: number;
      pronta: number;
      sem_relator: number;
      tramitando: number;
      arquivada: number;
    };
    categorias_labels: Record<string, string>;
  };
};

const DATA = legislativoData as LegislativoJSON;

const CATEGORY_COLORS = {
  simbólica: "#7A7A7A",
  incremental: "#005FFF",
  estrutural: "#DCFF00",
};

const CATEGORY_LABELS = {
  simbólica: "Simbólicas",
  incremental: "Incrementais",
  estrutural: "Estruturais",
};

const CATEGORY_DESC = {
  simbólica: "Datas comemorativas, homenagens, campanhas de conscientização.",
  incremental: "Alterações pontuais em leis existentes, ajustes de pena, mudanças procedimentais.",
  estrutural: "Criação de programas nacionais, fundos, políticas de Estado, pensões.",
};

// Animated big number component
function BigNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    const start = prev.current;
    const end = value;
    if (start === end) return;
    const duration = 800;
    const t0 = performance.now();
    let raf: number;
    const step = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    prev.current = value;
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <span
      className="block leading-[0.85]"
      style={{
        fontFamily: "var(--font-display-condensed)",
        letterSpacing: "-0.05em",
        fontSize: "clamp(6rem, 22vw, 22rem)",
      }}
    >
      {display.toLocaleString("pt-BR")}
    </span>
  );
}

function DestinoModal({
  label,
  color,
  proposicoes,
  onClose,
}: {
  label: string;
  color: string;
  proposicoes: Proposicao[];
  onClose: () => void;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/80 backdrop-blur-sm md:items-center md:px-4"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full flex-col overflow-hidden bg-[#0A0A0A] shadow-2xl md:h-auto md:max-h-[90vh] md:max-w-2xl md:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-white/10 p-6">
          <span
            className="inline-block h-4 w-4 flex-shrink-0 rounded-sm"
            style={{ backgroundColor: color }}
          />
          <div className="flex-1">
            <h3
              className="text-xl font-bold text-white"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {label}
            </h3>
            <p className="font-mono-data text-xs text-white/50">
              {proposicoes.length} proposições
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 rounded-full bg-white/5 p-2 hover:bg-white/10"
            aria-label="Fechar"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ul className="divide-y divide-white/5">
            {proposicoes.slice(0, 50).map((p) => (
              <li key={p.id} className="p-4 hover:bg-white/[0.03]">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono-data text-sm font-bold text-white">
                    {p.tipo} {p.numero}/{p.ano}
                  </span>
                  <span className="font-mono-data text-xs text-white/40">{p.data}</span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-white/70">
                  {p.ementa.length > 250 ? p.ementa.slice(0, 250) + "…" : p.ementa}
                </p>
                <a
                  href={`https://www.camara.leg.br/propostas-legislativas/${p.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block font-mono-data text-xs text-white/40 hover:text-white"
                >
                  Ver na Câmara →
                </a>
              </li>
            ))}
            {proposicoes.length > 50 && (
              <li className="p-4 text-center font-mono-data text-xs text-white/40">
                Mostrando 50 de {proposicoes.length}. Consulte a API pra lista completa.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function TimelineLegislativa() {
  const [phase, setPhase] = useState(0);
  const [destinoModal, setDestinoModal] = useState<{ label: string; color: string; key: string } | null>(null);

  // Scroll-triggered phases
  useEffect(() => {
    const steps = document.querySelectorAll("[data-timeline-step]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const step = parseInt(
              (entry.target as HTMLElement).dataset.timelineStep ?? "0"
            );
            setPhase(step);
          }
        });
      },
      { threshold: 0.6 }
    );
    steps.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const years = Object.keys(DATA.porAno).map(Number).sort();
  const maxYearTotal = Math.max(
    ...years.map((y) => {
      const d = DATA.porAno[String(y)];
      return d.simbólica + d.incremental + d.estrutural;
    })
  );

  const percentSimbolica = (DATA.resumo.simbólica / DATA.total) * 100;
  const percentIncremental = (DATA.resumo.incremental / DATA.total) * 100;
  const percentEstrutural = (DATA.resumo.estrutural / DATA.total) * 100;


  // PLs filtradas por destino pro modal
  const destinoProposicoes = destinoModal
    ? DATA.proposicoes.filter(
        (p) => p.destino?.categoria === destinoModal.key
      )
    : [];

  return (
    <>
      {destinoModal && (
        <DestinoModal
          label={destinoModal.label}
          color={destinoModal.color}
          proposicoes={destinoProposicoes}
          onClose={() => setDestinoModal(null)}
        />
      )}
    <section className="dark-section px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="offset-left">
          <p className="mb-4 font-mono-data text-xs uppercase tracking-[0.2em] text-white/50">
            [ ATO 04 / O TIPO DE LEI ]
          </p>
          <ScrollFloat
            as="h2"
            text="O Congresso"
            stagger={50}
            className="block text-3xl font-black leading-[0.9] md:text-5xl text-white lg:text-7xl"
          />
          <ScrollFloat
            as="h2"
            text="está agindo?"
            stagger={50}
            delay={500}
            className="block text-3xl font-black leading-[0.9] md:text-5xl text-[var(--color-neon)] lg:text-7xl"
          />
        </div>

        {/* Scrollytelling big funnel */}
        {(() => {
          // Base: legislatura atual (2023-2026)
          const total = DATA.total_atual ?? DATA.destino_stats?.total ?? 568;
          const incrementais = DATA.resumo_atual?.incremental ?? 494;
          const estruturais = DATA.resumo_atual?.estrutural ?? 71;
          const viraramLei = DATA.destino_stats?.por_categoria.aprovada ?? 13;

          const phases = [
            {
              value: total,
              label: "proposições",
              title: "proposições sobre violência contra a mulher foram apresentadas na atual legislatura (2023-2026).",
              color: "#ffffff",
              pctTotal: 100,
            },
            {
              value: incrementais,
              label: "incrementais",
              title: `(${((incrementais / total) * 100).toFixed(0)}%) são apenas alterações pontuais em leis que já existem.`,
              color: CATEGORY_COLORS.incremental,
              pctTotal: (incrementais / total) * 100,
            },
            {
              value: estruturais,
              label: "estruturais",
              title: `(${((estruturais / total) * 100).toFixed(0)}%) criam programas, fundos ou políticas novas.`,
              color: CATEGORY_COLORS.estrutural,
              pctTotal: (estruturais / total) * 100,
            },
            {
              value: viraramLei,
              label: "viraram lei",
              title: `(${((viraramLei / total) * 100).toFixed(1)}%) se transformaram em norma em 3 anos.`,
              color: "#DCFF00",
              pctTotal: (viraramLei / total) * 100,
            },
          ];

          const current = phases[Math.min(phase, phases.length - 1)];

          return (
            <div className="relative mt-12 md:mt-0 md:flex md:gap-12">
              {/* Sticky big number */}
              <div className="pb-4 pt-4 md:sticky md:top-24 md:z-10 md:w-1/2 md:self-start md:bg-[var(--color-dark)] md:pt-0">
                <div className="transition-colors duration-700 offset-left" style={{ color: current.color }}>
                  <BigNumber value={current.value} />
                </div>
                <p className="mt-2 font-mono-data text-sm uppercase tracking-widest text-white/50">
                  [ {current.label} ]
                </p>

                {/* Visual: bar showing proportion */}
                <div className="mt-6 h-4 w-full overflow-hidden rounded bg-white/10">
                  <div
                    className="h-4 transition-all duration-700 ease-out"
                    style={{
                      width: `${Math.max(current.pctTotal, 0.5)}%`,
                      backgroundColor: current.color,
                    }}
                  />
                </div>
                <p className="mt-2 font-mono-data text-xs text-white/40">
                  {current.pctTotal.toFixed(1)}% do total
                </p>
              </div>

              {/* Scroll steps */}
              <div className="mt-8 space-y-[50vh] md:mt-0 md:w-1/2 md:space-y-[60vh]">
                {phases.map((p, i) => (
                  <div
                    key={i}
                    data-timeline-step={i}
                    className="flex min-h-[40vh] items-center"
                  >
                    <div className="rounded-lg bg-white/5 p-6 backdrop-blur-sm">
                      <p className="text-sm font-mono-data uppercase tracking-widest" style={{ color: p.color }}>
                        [ {String(i + 1).padStart(2, "0")} / 04 ]
                      </p>
                      <p className="mt-3 text-xl leading-relaxed text-white md:text-2xl">
                        <strong
                          style={{
                            color: p.color,
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          {p.value.toLocaleString("pt-BR")}
                        </strong>{" "}
                        {p.title}
                      </p>
                    </div>
                  </div>
                ))}

                <div className="h-[30vh]" />
              </div>
            </div>
          );
        })()}

        {/* Legend */}
        <div className="mt-16 grid gap-3 text-sm sm:grid-cols-3">
          {(["incremental", "estrutural", "simbólica"] as const).map((cat) => (
            <div
              key={cat}
              className="rounded border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-sm"
                  style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                />
                <span className="font-bold text-white">{CATEGORY_LABELS[cat]}</span>
                <span
                  className="ml-auto font-bold text-white"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {DATA.resumo[cat]}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-white/60">
                {CATEGORY_DESC[cat]}
              </p>
            </div>
          ))}
        </div>

        {/* Destino das propostas */}
        {DATA.destino_stats && (() => {
          const d = DATA.destino_stats.por_categoria;
          const total = DATA.destino_stats.total;
          const aprovadas = d.aprovada;
          const pctAprovadas = (aprovadas / total) * 100;
          const pctSemRelator = (d.sem_relator / total) * 100;
          const destinos = [
            { key: "aprovada", label: "Viraram lei", count: d.aprovada, color: "#DCFF00" },
            { key: "no_senado", label: "Aprovadas na Câmara, tramitando no Senado", count: d.no_senado, color: "#A3C500" },
            { key: "pronta", label: "Prontas para pauta, ainda sem votação", count: d.pronta, color: "#7DA4FF" },
            { key: "tramitando", label: "Em tramitação nas comissões", count: d.tramitando, color: "#4A75CC" },
            { key: "sem_relator", label: "Aguardando relator, nunca saíram do zero", count: d.sem_relator, color: "#D63143" },
            { key: "arquivada", label: "Arquivadas, retiradas ou devolvidas", count: d.arquivada, color: "#6B1D24" },
          ];
          return (
            <div className="mt-24 border-t border-white/10 pt-16">
              <p className="mb-4 font-mono-data text-xs uppercase tracking-[0.2em] text-white/50">
                [ E onde param as outras {total - aprovadas} ]
              </p>
              <div className="flex items-baseline gap-4">
                <p
                  className="leading-none text-[var(--color-blood)]"
                  style={{
                    fontFamily: "var(--font-display-condensed)",
                    fontSize: "clamp(4rem, 12vw, 10rem)",
                    letterSpacing: "-0.03em",
                  }}
                >
                  {((d.tramitando / total) * 100).toFixed(0)}%
                </p>
                <h3
                  className="max-w-md text-2xl font-bold leading-tight text-white md:text-3xl"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  estão paradas em comissões.
                </h3>
              </div>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70">
                Das {total} proposições da atual legislatura,{" "}
                <strong className="text-white">{d.tramitando}</strong>{" "}
                ainda tramitam em comissões sem previsão de votação. Outras{" "}
                <strong
                  className="text-[var(--color-blood)]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {d.sem_relator}
                </strong>{" "}
                nunca receberam relator — propostas que nunca começaram a
                ser analisadas. Só{" "}
                <strong className="text-[var(--color-neon)]">{aprovadas}</strong>{" "}
                viraram lei em 3 anos.
                {" "}Clique em cada categoria pra ver as proposições.
              </p>

              {/* Stacked bar */}
              <div className="mt-10 flex h-16 w-full overflow-hidden rounded-sm">
                {destinos.map((dest) => {
                  const pct = (dest.count / total) * 100;
                  if (pct < 0.3) return null;
                  return (
                    <div
                      key={dest.key}
                      className="flex items-center justify-center text-[10px] font-bold text-white"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: dest.color,
                      }}
                      title={`${dest.label}: ${dest.count}`}
                    >
                      {pct > 6 ? `${pct.toFixed(1)}%` : ""}
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {destinos.map((dest) => (
                  <button
                    key={dest.key}
                    onClick={() =>
                      setDestinoModal({
                        label: dest.label,
                        color: dest.color,
                        key: dest.key,
                      })
                    }
                    className="flex w-full items-start gap-3 rounded border border-white/10 bg-white/[0.03] p-3 text-left transition-colors hover:border-white/25 hover:bg-white/[0.06]"
                  >
                    <span
                      className="mt-1 inline-block h-3 w-3 flex-shrink-0 rounded-sm"
                      style={{ backgroundColor: dest.color }}
                    />
                    <div className="flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm text-white">{dest.label}</span>
                        <span
                          className="font-bold text-white"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          {dest.count}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <p className="mt-6 font-mono-data text-xs leading-relaxed text-white/50">
                Fonte: API da Câmara dos Deputados, endpoint /proposicoes/&#123;id&#125;.
                Dados de {new Date().toLocaleDateString("pt-BR")}.
              </p>
            </div>
          );
        })()}

        {/* Timeline by year */}
        <div className="mt-20">
          <p className="mb-6 font-mono-data text-xs uppercase tracking-[0.2em] text-white/50">
            Proposições por ano
          </p>
          <div className="space-y-3">
            {years.map((year) => {
              const d = DATA.porAno[String(year)];
              const total = d.simbólica + d.incremental + d.estrutural;
              const widthPercent = (total / maxYearTotal) * 100;
              return (
                <div key={year} className="flex items-center gap-3">
                  <span
                    className="w-12 flex-shrink-0 font-mono-data text-sm text-white/50"
                  >
                    {year}
                  </span>
                  <div className="flex-1">
                    <div
                      className="flex h-7 overflow-hidden"
                      style={{ width: `${widthPercent}%`, minWidth: "60px" }}
                    >
                      <div
                        style={{
                          width: `${(d.incremental / total) * 100}%`,
                          backgroundColor: CATEGORY_COLORS.incremental,
                        }}
                      />
                      <div
                        style={{
                          width: `${(d.estrutural / total) * 100}%`,
                          backgroundColor: CATEGORY_COLORS.estrutural,
                        }}
                      />
                      <div
                        style={{
                          width: `${(d.simbólica / total) * 100}%`,
                          backgroundColor: CATEGORY_COLORS.simbólica,
                        }}
                      />
                    </div>
                  </div>
                  <span className="w-10 text-right font-mono-data text-sm font-bold text-white">
                    {total}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Curiosidades — quadro editorial */}
        <div className="mt-20">
          <p className="mb-2 font-mono-data text-xs uppercase tracking-[0.2em] text-white/50">
            [ Curiosidades do legislativo ]
          </p>
          <ScrollFloat
            as="h3"
            text="O que passa despercebido"
            stagger={30}
            className="block text-2xl font-black leading-[0.95] text-white md:text-4xl"
          />

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {[
              {
                selo: "Decisão mais apertada",
                pl: "PL 6415/2025",
                titulo:
                  "Política Nacional de Assistência Jurídica às Vítimas",
                dado: "213 × 152",
                texto:
                  "A votação mais disputada de proposições sobre proteção à mulher na 57ª legislatura. Foi aprovada por 61 votos de diferença em 11 de março de 2026. O texto agora tramita no Senado.",
                link: "https://www.camara.leg.br/propostas-legislativas/2596663",
              },
              {
                selo: "Tema em ascensão",
                pl: "4 PLs em abril/2026",
                titulo: "Climatério e menopausa viram política pública",
                dado: "2 semanas",
                texto:
                  "Em duas semanas, 4 proposições foram apresentadas estabelecendo diretrizes de atenção à saúde da mulher no climatério e menopausa — pauta até então quase ausente das estatísticas legislativas.",
                link: "https://www.camara.leg.br/propostas-legislativas/2617029",
              },
              {
                selo: "Lei in memoriam",
                pl: "PL 827/2025",
                titulo:
                  "Dia Nacional do Enfrentamento ao Transfeminicídio",
                dado: "15/fev",
                texto:
                  "Proposição da dep. Erika Hilton instituindo um dia nacional in memoriam à travesti Dandara dos Santos, brutalmente assassinada em Fortaleza em 2017. O caso chocou o Brasil e tornou-se marco na discussão sobre transfeminicídio.",
                link: "https://www.camara.leg.br/propostas-legislativas/2453894",
              },
              {
                selo: "Novo conceito legal",
                pl: "PL 3880/2024",
                titulo: "Violência vicária entra na Maria da Penha",
                dado: "232 × 151",
                texto:
                  "Pela primeira vez, o Brasil reconhece legalmente a violência vicária — quando o agressor atinge a mulher através de seus filhos. A proposta foi aprovada e segue para o Senado.",
                link: "https://www.camara.leg.br/propostas-legislativas/2462009",
              },
              {
                selo: "Fenômeno recente",
                pl: "PL 1870/2026",
                titulo:
                  "Programa Nacional de Proteção a Órfãos de Feminicídio",
                dado: "1/4 dos casos",
                texto:
                  "Apresentada em abril de 2026, propõe proteção integral a crianças cujas mães foram mortas em feminicídio. Segundo o FBSP, 1 em cada 4 feminicídios deixa filhos órfãos — hoje sem política específica.",
                link: "https://www.camara.leg.br/propostas-legislativas/2615283",
              },
              {
                selo: "Campanha batizada",
                pl: "PL 3397/2024",
                titulo: "Setembro Neon — violência política de gênero",
                dado: "Nova cor, nova pauta",
                texto:
                  "Proposição da dep. Sâmia Bomfim institui campanha nacional contra a violência política de gênero e raça contra a mulher. Batizada de “Setembro Neon”, a iniciativa reconhece uma forma de violência ainda tratada como residual.",
                link: "https://www.camara.leg.br/propostas-legislativas/2452147",
              },
            ].map((c, i) => (
              <a
                key={i}
                href={c.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-xl border border-white/10 bg-white/[0.02] p-6 transition-colors hover:border-[var(--color-neon)]/40 hover:bg-white/[0.04]"
              >
                <div className="flex items-center justify-between">
                  <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--color-neon)]">
                    [ {c.selo} ]
                  </p>
                  <span className="font-mono-data text-[10px] text-white/40 group-hover:text-white">
                    {c.pl} →
                  </span>
                </div>
                <h4
                  className="mt-4 text-xl font-bold leading-tight text-white md:text-2xl"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {c.titulo}
                </h4>
                <p
                  className="mt-3 leading-none text-[var(--color-neon)]"
                  style={{
                    fontFamily: "var(--font-display-condensed)",
                    fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {c.dado}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-white/70">
                  {c.texto}
                </p>
              </a>
            ))}
          </div>
        </div>

        <p className="mt-12 font-mono-data text-xs text-white/40">
          Fonte: API de Dados Abertos da Câmara dos Deputados. Busca por
          &ldquo;feminicídio&rdquo;, &ldquo;Maria da Penha&rdquo;,
          &ldquo;violência contra mulher&rdquo; e &ldquo;violência doméstica&rdquo;
          entre 2019 e 2026. Classificação automática por análise de ementa.
        </p>
      </div>
    </section>
    </>
  );
}
