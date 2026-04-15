import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[var(--color-dark)] px-6 py-24 text-white">
      <div className="mx-auto max-w-3xl">
        {/* CTA */}
        <div className="mb-12 offset-left">
          <p className="mb-4 font-mono-data text-xs uppercase tracking-[0.2em] text-white/50">
            [ ENCERRAMENTO ]
          </p>
          <h2
            className="text-5xl font-black leading-[0.9] md:text-6xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            E você,
            <br />
            <span className="text-[var(--color-blood)]">o que faz com isso?</span>
          </h2>
        </div>

        <p className="mt-6 text-lg leading-relaxed text-white/75">
          Os dados deste observatório são públicos. As posições dos
          deputados também. O que falta é conexão entre esses dois
          mundos — e esse trabalho cabe a quem vota.
        </p>

        <div className="mt-10 space-y-5">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
            <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--color-blood-light)]">
              [ 01 · ANTES DE OUTUBRO ]
            </p>
            <p
              className="mt-3 text-xl font-bold text-white md:text-2xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Descubra como o seu deputado votou.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              Use o Ato 01 e o Guia Eleitoral deste site para identificar
              quem representa seu estado e como cada um se posicionou
              nas votações sobre violência contra mulher. Candidatos à
              reeleição têm histórico — o voto escolhe quem continua.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
            <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--color-blood-light)]">
              [ 02 · DURANTE A CAMPANHA ]
            </p>
            <p
              className="mt-3 text-xl font-bold text-white md:text-2xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Cobre posicionamento público.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              Envie os dados a candidatos. Pergunte por que votaram como
              votaram. Compartilhe nas redes as proposições da sua região.
              Cobrança pública move o voto parlamentar mais do que
              qualquer petição interna.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
            <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--color-blood-light)]">
              [ 03 · NA HORA DE VOTAR ]
            </p>
            <p
              className="mt-3 text-xl font-bold text-white md:text-2xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Vote com memória.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              Quem não quer perder o mandato fica atento ao que o
              eleitorado lembra. Esse site existe para que a memória seja
              mais longa que o ciclo eleitoral de 2 anos.
            </p>
          </div>
        </div>

        {/* Divider */}
        <hr className="my-16 border-white/10" />

        {/* Denúncia — discreta, não é o foco */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
          <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-white/40">
            [ Em situação de violência ]
          </p>
          <div className="mt-3 flex flex-wrap items-baseline gap-x-6 gap-y-2 text-sm">
            <span>
              <strong className="font-mono-data text-lg text-[var(--color-blood-light)]">180</strong>{" "}
              <span className="text-white/70">Central de Atendimento à Mulher · gratuito · 24h</span>
            </span>
            <span>
              <strong className="font-mono-data text-lg text-[var(--color-blood-light)]">190</strong>{" "}
              <span className="text-white/70">Polícia Militar · risco imediato</span>
            </span>
          </div>
        </div>

        {/* Link para metodologia */}
        <div className="mt-12 text-center">
          <Link
            href="/metodologia"
            className="inline-block border border-white/20 px-6 py-3 font-mono-data text-xs uppercase tracking-[0.2em] text-white/70 transition-colors hover:border-white hover:text-white"
          >
            Ler a metodologia completa →
          </Link>
        </div>

        {/* Credits */}
        <div className="mt-12 text-center text-xs text-white/30">
          <p>
            Dados extraídos das APIs públicas da Câmara dos Deputados e
            do Atlas da Violência (IPEA/FBSP). Todas as fontes são
            públicas e gratuitas.
          </p>
          <p className="mt-1">
            Observatório independente, sem fins lucrativos e sem
            financiamento. Publicado pela Ininterrupta.
          </p>
        </div>
      </div>
    </footer>
  );
}
