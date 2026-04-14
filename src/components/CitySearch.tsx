"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import municipiosData from "../data/municipios.json";

type Municipio = {
  n: string; // nome
  c: string; // cod
  h: number; // homicidios 2023
  t: number | null; // taxa per 100k 2022
};

const municipios: Municipio[] = municipiosData as Municipio[];

// Pre-compute national average rate
const withRate = municipios.filter((m) => m.t !== null && m.t > 0);
const avgRate =
  withRate.reduce((sum, m) => sum + (m.t ?? 0), 0) / withRate.length;
const totalHomicidios = municipios.reduce((sum, m) => sum + m.h, 0);

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function CitySearch() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Municipio | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(() => {
    if (query.length < 2) return [];
    const q = normalize(query);
    return municipios
      .filter((m) => normalize(m.n).includes(q))
      .slice(0, 8);
  }, [query]);

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

  return (
    <section className="bg-white px-6 py-24">
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 offset-left">
          <p className="mb-4 font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
            Ato 05 · Seu território
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
        <div className="relative mx-auto mt-10 max-w-md">
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
            placeholder="Ex: Recife, Salvador, Manaus..."
            className="w-full rounded-xl border border-gray-200 bg-[var(--color-bg-alt)] px-5 py-4 text-lg outline-none transition-all focus:border-[var(--color-blood)] focus:ring-2 focus:ring-[var(--color-blood-light)]"
            style={{ fontFamily: "var(--font-body)" }}
          />

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && !selected && (
            <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg">
              {suggestions.map((m) => (
                <li key={m.c}>
                  <button
                    onClick={() => selectCity(m)}
                    className="w-full px-5 py-3 text-left text-base transition-colors hover:bg-[var(--color-bg-alt)]"
                  >
                    <span className="font-medium">{m.n}</span>
                    {m.h > 0 && (
                      <span className="ml-2 text-sm text-[var(--color-text-tertiary)]">
                        {m.h} homicídio{m.h > 1 ? "s" : ""} em 2023
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Result card */}
        {selected && (
          <div className="mx-auto mt-8 max-w-md animate-[fadeIn_0.5s_ease-out] rounded-2xl border border-gray-100 bg-[var(--color-bg-alt)] p-8">
            <h3
              className="text-2xl font-bold text-[var(--color-text)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {selected.n}
            </h3>

            <div className="mt-6 space-y-5">
              {/* Homicidios */}
              <div>
                <p className="text-sm uppercase tracking-wider text-[var(--color-text-tertiary)]">
                  Mulheres assassinadas em 2023
                </p>
                <p
                  className={`mt-1 text-4xl font-black ${
                    selected.h > 0
                      ? "text-[var(--color-blood)]"
                      : "text-[var(--color-teal)]"
                  }`}
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {selected.h}
                </p>
                {selected.h === 0 && (
                  <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
                    Nenhum registro no Atlas da Violência.
                    Isso pode significar zero ocorrências ou dados não reportados.
                  </p>
                )}
              </div>

              {/* Taxa */}
              {selected.t !== null && selected.t > 0 && (
                <div>
                  <p className="text-sm uppercase tracking-wider text-[var(--color-text-tertiary)]">
                    Taxa por 100 mil mulheres (2022)
                  </p>
                  <div className="mt-1 flex items-baseline gap-3">
                    <span
                      className={`text-3xl font-black ${
                        selected.t > avgRate
                          ? "text-[var(--color-blood)]"
                          : "text-[var(--color-teal)]"
                      }`}
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {selected.t.toFixed(2)}
                    </span>
                    <span className="text-sm text-[var(--color-text-tertiary)]">
                      média nacional: {avgRate.toFixed(2)}
                    </span>
                  </div>

                  {/* Bar comparison */}
                  <div className="mt-3 space-y-2">
                    <div>
                      <div className="flex justify-between text-xs text-[var(--color-text-tertiary)]">
                        <span>{selected.n}</span>
                        <span>{selected.t.toFixed(2)}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-100">
                        <div
                          className="h-2 rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.min((selected.t / 12) * 100, 100)}%`,
                            backgroundColor:
                              selected.t > avgRate
                                ? "var(--color-blood)"
                                : "var(--color-teal)",
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-[var(--color-text-tertiary)]">
                        <span>Média nacional</span>
                        <span>{avgRate.toFixed(2)}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-100">
                        <div
                          className="h-2 rounded-full bg-[var(--color-neutral)] transition-all duration-700"
                          style={{
                            width: `${Math.min((avgRate / 12) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <p className="mt-6 text-xs text-[var(--color-text-tertiary)]">
              Fonte: Atlas da Violência (IPEA/FBSP), séries 40 e 52.
              Dados de 2023 (homicídios) e 2022 (taxa).
            </p>
          </div>
        )}

        {/* Context after search */}
        {selected && selected.h === 0 && (
          <div className="mx-auto mt-6 max-w-md rounded-xl bg-amber-50 p-5">
            <p className="text-sm leading-relaxed text-amber-900">
              <strong>Sobre zeros no Atlas:</strong> Municípios menores
              frequentemente não reportam dados completos. Zero no Atlas não
              significa necessariamente zero violência — pode significar
              subnotificação. O Fórum Brasileiro de Segurança Pública estima que
              os dados oficiais representam o <strong>piso</strong>, não o teto.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
