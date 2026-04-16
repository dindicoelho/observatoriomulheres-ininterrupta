"use client";

import { useMemo } from "react";
import autoriaData from "../data/autoria.json";
import ScrollFloat from "./ScrollFloat";

type PL = {
  id: number;
  tipo: string;
  numero: number;
  ano: number;
  ementa: string;
  data: string;
  categoria: "simbólica" | "incremental" | "estrutural";
  stance?: "protetivo" | "punitivista" | "regressivo";
};

type Deputado = {
  id: number;
  nome: string;
  partido: string;
  uf: string;
  foto: string;
  sexo?: "F" | "M" | null;
  regressivos?: number;
  pls: PL[];
};

type AutoriaJSON = {
  deputados: Deputado[];
};

const DATA = autoriaData as AutoriaJSON;

type Agrupamento = {
  padrao: string;
  descricao: string;
  exemplo_pl: string;
  total_autores: number;
  autores: Array<{ nome: string; partido: string; uf: string }>;
};

export default function ProducaoRegressiva() {
  const { top, agrupamentos, total } = useMemo(() => {
    const comRegr = DATA.deputados.filter(
      (d) => (d.regressivos ?? 0) > 0
    );
    comRegr.sort((a, b) => (b.regressivos ?? 0) - (a.regressivos ?? 0));

    // Top 12 deputados com mais PLs regressivas
    const top = comRegr.slice(0, 12).map((d) => ({
      id: d.id,
      nome: d.nome,
      partido: d.partido,
      uf: d.uf,
      foto: d.foto,
      sexo: d.sexo,
      regressivos: d.regressivos ?? 0,
      pls_regressivos: d.pls.filter((p) => p.stance === "regressivo"),
    }));

    // Agrupar PLs regressivas recorrentes — mesma PL assinada por muitos
    const plCount = new Map<
      string,
      {
        tipo: string;
        numero: number;
        ano: number;
        ementa: string;
        autores: Array<{ nome: string; partido: string; uf: string }>;
      }
    >();
    for (const d of comRegr) {
      for (const pl of d.pls) {
        if (pl.stance !== "regressivo") continue;
        const key = `${pl.tipo}${pl.numero}/${pl.ano}`;
        if (!plCount.has(key)) {
          plCount.set(key, {
            tipo: pl.tipo,
            numero: pl.numero,
            ano: pl.ano,
            ementa: pl.ementa,
            autores: [],
          });
        }
        plCount.get(key)!.autores.push({
          nome: d.nome,
          partido: d.partido,
          uf: d.uf,
        });
      }
    }

    const agrupamentos: Agrupamento[] = [];
    for (const [key, info] of plCount.entries()) {
      if (info.autores.length < 3) continue; // só PLs com 3+ assinaturas
      let descricao = "";
      const e = info.ementa.toLowerCase();
      if (e.includes("conanda") && e.includes("258")) {
        descricao =
          "Sustam a resolução do Conanda que protege crianças e adolescentes vítimas de violência sexual e autoriza o aborto legal em casos previstos em lei. Aprovar sustaria essa proteção.";
      } else if (
        e.includes("notificação") &&
        (e.includes("interrupção") || e.includes("aborto"))
      ) {
        descricao =
          "Obriga hospitais e unidades de saúde a notificar à polícia toda vítima que faz aborto legal — inclusive de estupro. Transforma vítima em suspeita e criminaliza o cuidado.";
      } else if (
        e.includes("aumenta") &&
        e.includes("pena") &&
        e.includes("aborto")
      ) {
        descricao =
          "Aumenta a pena do crime de aborto. Literatura empírica mostra que criminalizar aborto não reduz sua incidência — aumenta a mortalidade materna.";
      } else if (
        e.includes("porte") &&
        e.includes("arma") &&
        (e.includes("vítima") || e.includes("mulher"))
      ) {
        descricao =
          "Autoriza o porte de arma à mulher vítima de violência doméstica. Armamentismo como solução — literatura mostra que a presença de arma em casa aumenta o risco de feminicídio, não diminui.";
      } else {
        descricao = info.ementa.slice(0, 180) + "…";
      }
      agrupamentos.push({
        padrao: key,
        descricao,
        exemplo_pl: key,
        total_autores: info.autores.length,
        autores: info.autores,
      });
    }
    agrupamentos.sort((a, b) => b.total_autores - a.total_autores);

    const total = comRegr.length;

    return { top, agrupamentos: agrupamentos.slice(0, 4), total };
  }, []);

  return (
    <section className="dark-section bg-[#0A0A0A] px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="offset-left">
          <p className="mb-4 font-mono-data text-xs uppercase tracking-[0.2em] text-[#D43F3F]">
            [ ATO 04 / QUEM ATUA CONTRA ]
          </p>
          <ScrollFloat
            as="h2"
            text="Nem toda lei"
            stagger={50}
            className="block text-3xl font-black leading-[0.9] md:text-5xl text-white lg:text-7xl"
          />
          <ScrollFloat
            as="h2"
            text="é proteção."
            stagger={50}
            delay={400}
            className="block text-3xl font-black leading-[0.9] md:text-5xl text-[#D43F3F] lg:text-7xl"
          />
        </div>

        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-white/70 md:text-xl">
          Algumas das proposições mais assinadas do Congresso sobre
          &ldquo;mulher&rdquo; atuam <strong>contra</strong> direitos
          conquistados. Criminalizam o aborto legal em casos de estupro,
          obrigam hospitais a denunciar vítimas à polícia, sustam
          resoluções que protegem crianças contra violência sexual,
          propõem armamento como resposta à violência doméstica. O site
          remove essas PLs do ranking de atuação — e{" "}
          <strong>subtrai do score</strong> de quem as assina.
        </p>

        <div className="mt-4 max-w-2xl rounded-xl border border-[#D43F3F]/40 bg-[#D43F3F]/10 p-4">
          <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[#FF8080]">
            [ Método ]
          </p>
          <p className="mt-2 text-sm leading-relaxed text-white/80">
            Classificamos como <strong>regressiva</strong> toda PL que:
            criminaliza aborto legal, obriga notificação à polícia de
            interrupção da gestação, susta resoluções protetivas
            (Conanda 258), autoriza porte de arma como &ldquo;proteção&rdquo;
            à vítima, ou criminaliza a reaproximação consensual. Cada
            regressiva subtrai <strong>2 pontos</strong> do score do
            autor.
          </p>
        </div>

        {/* Padrões recorrentes */}
        <div className="mt-16">
          <p className="mb-8 font-mono-data text-xs uppercase tracking-[0.2em] text-[#FF8080]">
            [ 4 padrões assinados em massa ]
          </p>
          <div className="space-y-6">
            {agrupamentos.map((a) => (
              <div
                key={a.padrao}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div>
                    <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[#D43F3F]">
                      [ {a.exemplo_pl} ]
                    </p>
                    <p
                      className="mt-2 leading-[0.95] text-white"
                      style={{
                        fontFamily: "var(--font-display-condensed)",
                        fontSize: "clamp(2rem, 5vw, 3.5rem)",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {a.total_autores} assinaturas
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-base leading-relaxed text-white/80">
                  {a.descricao}
                </p>
                <details className="group mt-4">
                  <summary className="cursor-pointer font-mono-data text-[10px] uppercase tracking-wider text-white/50 hover:text-[#FF8080]">
                    Ver os {a.autores.length} parlamentares que assinam →
                  </summary>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {a.autores.map((au, i) => (
                      <span
                        key={i}
                        className="rounded bg-white/5 px-2 py-1 font-mono-data text-[11px] text-white/70"
                      >
                        {au.nome} <span className="opacity-50">
                          ({au.partido}/{au.uf})
                        </span>
                      </span>
                    ))}
                  </div>
                </details>
              </div>
            ))}
          </div>
        </div>

        {/* Ranking dos que mais assinam regressivas */}
        <div className="mt-20">
          <p className="mb-4 font-mono-data text-xs uppercase tracking-[0.2em] text-[#FF8080]">
            [ {total} deputados com alguma PL regressiva · Top 12 ]
          </p>
          <ScrollFloat
            as="h3"
            text="Quem mais assina"
            stagger={30}
            className="block text-2xl font-black leading-[0.95] text-white md:text-4xl"
          />

          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {top.map((d, i) => (
              <a
                key={d.id}
                href={`https://www.camara.leg.br/deputados/${d.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 transition-colors hover:border-[#D43F3F]/40 hover:bg-[#D43F3F]/5"
              >
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#D43F3F]/15 font-mono-data text-xs font-bold text-[#FF8080]">
                  {i + 1}
                </span>
                {d.foto && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={d.foto}
                    alt=""
                    className="h-12 w-12 flex-shrink-0 rounded-full object-cover grayscale"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white">
                    {d.nome}
                  </p>
                  <p className="font-mono-data text-[10px] text-white/50">
                    {d.partido} · {d.uf}
                  </p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p
                    className="leading-none text-[#D43F3F]"
                    style={{
                      fontFamily: "var(--font-display-condensed)",
                      fontSize: "2.25rem",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {d.regressivos}
                  </p>
                  <p className="font-mono-data text-[9px] uppercase tracking-wider text-white/50">
                    regressivas
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>

        <p className="mt-12 max-w-2xl font-mono-data text-xs leading-relaxed text-white/40">
          Classificação automática baseada em palavras-chave conservadoras
          — na dúvida, uma PL é contada como protetiva. Os padrões de
          regex estão publicados em{" "}
          <code className="text-white/60">
            scripts/classify_stance.py
          </code>
          .
        </p>
      </div>
    </section>
  );
}
