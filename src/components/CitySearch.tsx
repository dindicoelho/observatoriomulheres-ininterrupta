"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import estadosData from "../data/estados.json";
import redeData from "../data/rede_protecao.json";

type Municipio = {
  n: string;
  c: string;
  uf: string;
  uf_name: string;
  r: string; // região
  pop: number | null;
  sh: (number | null)[]; // series homicides 2019-2023
  st: (number | null)[]; // series taxa 2019-2023 (last is null)
  t_2023: number | null;
};

type MunicipiosJSON = {
  years: number[];
  municipios: Municipio[];
};

type StatesJSON = {
  years: number[];
  states: Record<string, {
    name: string;
    values: Record<string, number>;
    absolutos: Record<string, number>;
  }>;
};

const ESTADOS = estadosData as StatesJSON;
const REDE = redeData as {
  ano: number;
  estados: Record<string, {
    taxa: number;
    deams: number;
    abrigos: number;
    crams: number;
    pop_fem: number;
    deams_per_100k: number;
    abrigos_per_100k: number;
    crams_per_100k: number;
    total_per_100k: number;
  }>;
};

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function Sparkline({
  values,
  max,
  color = "var(--color-blood)",
}: {
  values: (number | null)[];
  max: number;
  color?: string;
}) {
  const validVals = values.filter((v): v is number => v !== null);
  if (validVals.length < 2) return null;

  const width = 120;
  const height = 40;
  const step = width / (values.length - 1);

  const points = values
    .map((v, i) => {
      if (v === null) return null;
      const x = i * step;
      const y = height - (v / max) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .filter(Boolean);

  const pathD = "M" + points.join(" L");
  const last = values[values.length - 1];
  const first = validVals[0];
  const trend = last !== null ? ((last - first) / first) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <svg width={width} height={height}>
        <path d={pathD} fill="none" stroke={color} strokeWidth="2" />
        {values.map((v, i) => {
          if (v === null) return null;
          const x = i * step;
          const y = height - (v / max) * height;
          return <circle key={i} cx={x} cy={y} r="2.5" fill={color} />;
        })}
      </svg>
      {last !== null && (
        <span
          className={`font-mono-data text-xs ${
            trend > 0
              ? "text-[var(--color-blood)]"
              : "text-[var(--color-teal)]"
          }`}
        >
          {trend > 0 ? "↑" : "↓"} {Math.abs(trend).toFixed(0)}%
        </span>
      )}
    </div>
  );
}

export default function CitySearch() {
  const [data, setData] = useState<MunicipiosJSON | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Municipio | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/municipios.json")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, []);

  const suggestions = useMemo(() => {
    if (!data || query.length < 2) return [];
    const q = normalize(query);
    return data.municipios
      .filter((m) => normalize(m.n).includes(q))
      .slice(0, 8);
  }, [data, query]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.parentElement?.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const selectCity = (m: Municipio) => {
    setSelected(m);
    setQuery(m.n);
    setShowSuggestions(false);
  };

  // Compute comparisons
  const stateInfo = selected ? ESTADOS.states[selected.uf] : null;
  const stateRate = stateInfo ? stateInfo.values["2022"] : null;
  const allStateRates = Object.values(ESTADOS.states)
    .map((s) => s.values["2022"])
    .filter((v): v is number => typeof v === "number");
  const nationalAvgRate = allStateRates.length
    ? allStateRates.reduce((a, b) => a + b, 0) / allStateRates.length
    : 0;

  // Maxima for sparkline scaling
  const maxHomicides = selected
    ? Math.max(...selected.sh.filter((v): v is number => v !== null), 1)
    : 1;

  return (
    <section className="bg-white px-6 py-24">
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 offset-left">
          <p className="mb-4 font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
            [ ATO 04 / SEU TERRITÓRIO ]
          </p>
          <h2
            className="text-5xl font-black leading-[0.9] text-[var(--color-text)] md:text-7xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            E na
            <br />
            <span className="text-[var(--color-blood)]">sua cidade?</span>
          </h2>
          <p className="mt-6 text-lg text-[var(--color-text-secondary)]">
            Digite o nome do seu município e veja os dados.
          </p>
        </div>

        {/* Search input */}
        <div className="relative mx-auto max-w-md">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(null);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder={data ? "Ex: Recife, Salvador, Manaus..." : "Carregando..."}
            disabled={!data}
            className="w-full rounded-xl border border-gray-200 bg-[var(--color-bg-alt)] px-5 py-4 text-lg outline-none transition-all focus:border-[var(--color-blood)] focus:ring-2 focus:ring-[var(--color-blood-light)] disabled:opacity-50"
            style={{ fontFamily: "var(--font-body)" }}
          />

          {showSuggestions && suggestions.length > 0 && !selected && (
            <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg">
              {suggestions.map((m) => (
                <li key={m.c}>
                  <button
                    onClick={() => selectCity(m)}
                    className="w-full px-5 py-3 text-left text-base transition-colors hover:bg-[var(--color-bg-alt)]"
                  >
                    <span className="font-medium">{m.n}</span>
                    <span className="ml-2 font-mono-data text-xs text-[var(--color-text-tertiary)]">
                      {m.uf}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Result card */}
        {selected && (
          <div className="mx-auto mt-8 animate-[fadeIn_0.5s_ease-out] overflow-hidden rounded-2xl border border-gray-100 bg-[var(--color-bg-alt)]">
            {/* Header */}
            <div className="border-b border-gray-200/60 p-8">
              <p className="font-mono-data text-xs uppercase tracking-widest text-[var(--color-text-tertiary)]">
                {selected.uf_name} · Região {selected.r}
              </p>
              <h3
                className="mt-2 text-4xl font-black text-[var(--color-text)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {selected.n}
              </h3>
              {selected.pop && (
                <p className="mt-2 font-mono-data text-sm text-[var(--color-text-secondary)]">
                  {selected.pop.toLocaleString("pt-BR")} habitantes
                </p>
              )}
            </div>

            <div className="grid gap-4 p-6 sm:grid-cols-2">
              {/* Homicídios 2023 */}
              <div className="rounded-xl bg-white p-5">
                <p className="font-mono-data text-[10px] uppercase tracking-widest text-[var(--color-text-tertiary)]">
                  Mulheres assassinadas em 2023
                </p>
                <p
                  className={`mt-2 text-5xl font-black ${
                    selected.sh[4] && selected.sh[4] > 0
                      ? "text-[var(--color-blood)]"
                      : "text-[var(--color-teal)]"
                  }`}
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {selected.sh[4] ?? 0}
                </p>
                {selected.t_2023 !== null && (
                  <p className="mt-1 font-mono-data text-xs text-[var(--color-text-secondary)]">
                    {selected.t_2023} por 100 mil mulheres
                  </p>
                )}
              </div>

              {/* Taxa */}
              {selected.t_2023 !== null && (
                <div className="rounded-xl bg-white p-5">
                  <p className="font-mono-data text-[10px] uppercase tracking-widest text-[var(--color-text-tertiary)]">
                    Comparação
                  </p>
                  <div className="mt-2 space-y-2">
                    <div>
                      <div className="flex items-center justify-between font-mono-data text-xs">
                        <span className="text-[var(--color-text-secondary)]">
                          {selected.n}
                        </span>
                        <span
                          className={`font-bold ${
                            selected.t_2023 > nationalAvgRate
                              ? "text-[var(--color-blood)]"
                              : "text-[var(--color-teal)]"
                          }`}
                        >
                          {selected.t_2023}
                        </span>
                      </div>
                      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.min((selected.t_2023 / 12) * 100, 100)}%`,
                            backgroundColor:
                              selected.t_2023 > nationalAvgRate
                                ? "var(--color-blood)"
                                : "var(--color-teal)",
                          }}
                        />
                      </div>
                    </div>
                    {stateRate !== null && stateRate !== undefined && (
                      <div>
                        <div className="flex items-center justify-between font-mono-data text-xs">
                          <span className="text-[var(--color-text-secondary)]">
                            Estado ({selected.uf})
                          </span>
                          <span className="font-bold text-[var(--color-text-secondary)]">
                            {stateRate.toFixed(2)}
                          </span>
                        </div>
                        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-2 rounded-full bg-[var(--color-neutral)] transition-all"
                            style={{
                              width: `${Math.min((stateRate / 12) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="flex items-center justify-between font-mono-data text-xs">
                        <span className="text-[var(--color-text-secondary)]">
                          Média nacional
                        </span>
                        <span className="font-bold text-[var(--color-text-tertiary)]">
                          {nationalAvgRate.toFixed(2)}
                        </span>
                      </div>
                      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-2 rounded-full bg-[var(--color-text-tertiary)] transition-all"
                          style={{
                            width: `${Math.min((nationalAvgRate / 12) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Série temporal */}
              <div className="rounded-xl bg-white p-5 sm:col-span-2">
                <p className="font-mono-data text-[10px] uppercase tracking-widest text-[var(--color-text-tertiary)]">
                  Evolução 2019 → 2023
                </p>
                <div className="mt-3 flex items-start justify-between gap-4">
                  <div className="grid flex-1 grid-cols-5 gap-2">
                    {selected.sh.map((v, i) => (
                      <div key={i} className="text-center">
                        <p className="font-mono-data text-[10px] text-[var(--color-text-tertiary)]">
                          {2019 + i}
                        </p>
                        <p
                          className={`mt-1 font-mono-data text-lg font-bold ${
                            v && v > 0
                              ? "text-[var(--color-text)]"
                              : "text-[var(--color-text-tertiary)]"
                          }`}
                        >
                          {v ?? "—"}
                        </p>
                      </div>
                    ))}
                  </div>
                  <Sparkline values={selected.sh} max={maxHomicides} />
                </div>
              </div>

              {/* Rede de proteção estadual */}
              {REDE.estados[selected.uf] && (
                <div className="rounded-xl bg-white p-5 sm:col-span-2">
                  <p className="font-mono-data text-[10px] uppercase tracking-widest text-[var(--color-text-tertiary)]">
                    Rede de proteção no estado de {selected.uf}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
                    Infraestrutura pública disponível em todo o estado
                  </p>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="rounded-lg bg-[var(--color-bg-alt)] p-3 text-center">
                      <p
                        className="font-mono-data text-3xl font-black text-[var(--color-text)]"
                      >
                        {REDE.estados[selected.uf].deams}
                      </p>
                      <p className="mt-1 font-mono-data text-[9px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                        Delegacias da Mulher (DEAMs)
                      </p>
                    </div>
                    <div className="rounded-lg bg-[var(--color-bg-alt)] p-3 text-center">
                      <p
                        className="font-mono-data text-3xl font-black text-[var(--color-text)]"
                      >
                        {REDE.estados[selected.uf].crams}
                      </p>
                      <p className="mt-1 font-mono-data text-[9px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                        Centros de Referência (CRAMs)
                      </p>
                    </div>
                    <div className="rounded-lg bg-[var(--color-bg-alt)] p-3 text-center">
                      <p
                        className="font-mono-data text-3xl font-black text-[var(--color-text)]"
                      >
                        {REDE.estados[selected.uf].abrigos}
                      </p>
                      <p className="mt-1 font-mono-data text-[9px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                        Casas-Abrigo sigilosas
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                    Para saber se <strong>{selected.n}</strong> tem um
                    desses equipamentos específicos,{" "}
                    <a
                      href="https://www.gov.br/mulheres/pt-br/central-de-conteudos/publicacoes/publicacoes/2024/ligue-180-onde-denunciar-violencia-contra-a-mulher.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--color-blood)] underline hover:opacity-80"
                    >
                      consulte o guia do Ligue 180
                    </a>{" "}
                    ou ligue <strong className="font-mono-data">180</strong>{" "}
                    (gratuito, 24h).
                  </p>
                </div>
              )}
            </div>

            {/* Note */}
            {selected.sh[4] === 0 && (
              <div className="border-t border-gray-200/60 bg-amber-50 p-5">
                <p className="text-sm leading-relaxed text-amber-900">
                  <strong>Sobre zeros no Atlas:</strong> municípios menores
                  frequentemente não reportam dados completos. Zero no Atlas não
                  significa necessariamente zero violência — pode significar
                  subnotificação. O Fórum Brasileiro de Segurança Pública
                  estima que os dados oficiais representam o{" "}
                  <strong>piso</strong>, não o teto.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-gray-200/60 bg-white p-4">
              <p className="font-mono-data text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                Atlas da Violência · IBGE · Código IBGE: {selected.c}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
