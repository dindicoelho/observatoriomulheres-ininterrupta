"use client";

import articuladoresData from "../data/articuladores_uf.json";
import feminicidioData from "../data/feminicidio_uf.json";
import ScrollFloat from "./ScrollFloat";

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
  ufs: Record<string, FeminicidioUF>;
};

type Articulador = {
  id: number;
  nome: string;
  partido: string;
  uf: string;
  foto: string;
  total_pls: number;
  estruturais: number;
  score_articulador: number;
};

type UFData = {
  total_deps: number;
  top3: Articulador[];
  zero_mulheres?: boolean;
};

type ArticuladoresJSON = {
  ufs: Record<string, UFData>;
};

const DATA = articuladoresData as ArticuladoresJSON;
const FEM = feminicidioData as FeminicidioJSON;

const UF_NAMES: Record<string, string> = {
  AC: "Acre", AL: "Alagoas", AM: "Amazonas", AP: "Amapá",
  BA: "Bahia", CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo",
  GO: "Goiás", MA: "Maranhão", MG: "Minas Gerais", MS: "Mato Grosso do Sul",
  MT: "Mato Grosso", PA: "Pará", PB: "Paraíba", PE: "Pernambuco",
  PI: "Piauí", PR: "Paraná", RJ: "Rio de Janeiro", RN: "Rio Grande do Norte",
  RO: "Rondônia", RR: "Roraima", RS: "Rio Grande do Sul", SC: "Santa Catarina",
  SE: "Sergipe", SP: "São Paulo", TO: "Tocantins",
};

type QuadranteUF = {
  uf: string;
  nome: string;
  taxa: number;
  vitimas: number;
  ranking: number;
  estimativa: boolean;
  subnotificacao: boolean;
  score: number;
  totalDeps: number;
  top3: Articulador[];
  zeroMulheres: boolean;
};

export default function QuadranteCritico() {
  // Calcular quadrante: alta violência + baixa produção
  const maxScore = Math.max(
    ...Object.values(DATA.ufs).map((u) => u.top3[0]?.score_articulador ?? 0)
  );

  const quadrante: QuadranteUF[] = [];
  for (const [uf, fem] of Object.entries(FEM.ufs)) {
    const art = DATA.ufs[uf];
    const score = art?.top3[0]?.score_articulador ?? 0;
    const altaViolencia = fem.taxa > FEM.media_nacional;
    const baixaProducao = score < maxScore * 0.3;

    if (altaViolencia && baixaProducao) {
      quadrante.push({
        uf,
        nome: UF_NAMES[uf] || uf,
        taxa: fem.taxa,
        vitimas: fem.vitimas,
        ranking: fem.ranking,
        estimativa: fem.estimativa,
        subnotificacao: fem.subnotificacao,
        score,
        totalDeps: art?.total_deps ?? 0,
        top3: art?.top3 ?? [],
        zeroMulheres: art?.zero_mulheres ?? false,
      });
    }
  }

  // Ordenar por taxa desc (pior primeiro)
  quadrante.sort((a, b) => b.taxa - a.taxa);

  if (quadrante.length === 0) return null;

  return (
    <section className="dark-section bg-[#0A0A0A] px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="offset-left">
          <p className="mb-4 font-mono-data text-xs uppercase tracking-[0.2em] text-white/50">
            [ ONDE MORREM × ONDE LEGISLAM ]
          </p>
          <ScrollFloat
            as="h2"
            text="Quem morre onde"
            stagger={50}
            className="block text-3xl font-black leading-[0.9] md:text-5xl text-white lg:text-7xl"
          />
          <ScrollFloat
            as="h2"
            text="ninguém legisla."
            stagger={50}
            delay={400}
            className="block text-3xl font-black leading-[0.9] md:text-5xl text-[#D43F3F] lg:text-7xl"
          />
        </div>

        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-white/70 md:text-xl">
          {quadrante.length} estados têm taxa de feminicídio{" "}
          <strong className="text-white">acima da média nacional</strong>{" "}
          e produção legislativa{" "}
          <strong className="text-white">abaixo de 30%</strong> do
          estado mais ativo. São lugares onde a urgência estatística
          não encontra resposta política.
        </p>

        <div className="mt-12 space-y-4">
          {quadrante.slice(0, 7).map((q) => (
            <div
              key={q.uf}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-white/50">
                    [ {q.nome} · {q.uf} ]
                  </p>
                  <div className="mt-3 flex items-baseline gap-4">
                    <p
                      className="leading-none text-[#D43F3F]"
                      style={{
                        fontFamily: "var(--font-display-condensed)",
                        fontSize: "clamp(2.5rem, 6vw, 4rem)",
                        letterSpacing: "-0.03em",
                      }}
                    >
                      {q.taxa.toFixed(1)}
                    </p>
                    <div>
                      <p className="text-sm text-white/70">
                        por 100 mil mulheres
                      </p>
                      <p className="font-mono-data text-[10px] text-white/50">
                        {q.ranking}º no ranking · {q.vitimas} vítimas
                        {q.estimativa && " *"}
                        {q.subnotificacao && " · ⚠ subnotificação"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-mono-data text-[10px] uppercase tracking-wider text-white/40">
                    Bancada: {q.totalDeps} dep.
                    {q.zeroMulheres && (
                      <span className="ml-2 text-[#D43F3F]">
                        0 mulheres
                      </span>
                    )}
                  </p>
                  <p className="mt-1 font-mono-data text-[10px] text-white/40">
                    Score máx: {q.score.toFixed(0)}
                  </p>
                </div>
              </div>

              {/* Top 3 da bancada */}
              {q.top3.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-3">
                  {q.top3.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center gap-2 rounded-lg bg-white/[0.04] px-3 py-2"
                    >
                      {d.foto && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={d.foto}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <p className="text-xs font-bold text-white">
                          {d.nome}
                        </p>
                        <p className="font-mono-data text-[9px] text-white/50">
                          {d.partido} · {d.total_pls} PLs
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="mt-10 font-mono-data text-xs text-white/40">
          Fontes: FBSP / 18º Anuário de Segurança Pública
          ({FEM.ano_referencia}) + API da Câmara dos Deputados.
          * Dados estimados com base em projeção regional.
          Média nacional: {FEM.media_nacional} por 100 mil mulheres.
        </p>
      </div>
    </section>
  );
}
