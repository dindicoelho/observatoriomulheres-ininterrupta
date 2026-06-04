"use client";

import destaqueData from "../data/destaque.json";
import ScrollFloat from "./ScrollFloat";

type DestaqueShape = {
  destaque: {
    categoria: string;
    selo: string;
    headline: string;
    anchor: string;
    o_que_propoe: string;
    onde_esta: string;
    o_que_se_decide: string;
    pl_ref: string;
    link: string;
    link_label: string;
    updated_at: string;
  };
};

export default function DestaqueAtual() {
  const d = (destaqueData as DestaqueShape).destaque;
  const linhas = [
    { rotulo: "O que propõe", valor: d.o_que_propoe },
    { rotulo: "Onde está agora", valor: d.onde_esta },
    { rotulo: "O que está em jogo", valor: d.o_que_se_decide },
  ].filter((l) => l.valor);

  return (
    <div className="mt-20">
      <ScrollFloat
        as="h3"
        text="O fato mais relevante agora"
        stagger={30}
        className="block text-2xl font-black leading-[0.95] text-[var(--color-text)] md:text-4xl"
      />

      <div className="mt-10 rounded-2xl bg-[var(--color-blue)] p-8 shadow-2xl md:p-12">
        <div className="flex items-center justify-between gap-4">
          <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--color-neon)]">
            [ {d.selo} ]
          </p>
          {d.pl_ref && (
            <span className="font-mono-data text-[10px] text-white/70">
              {d.pl_ref}
            </span>
          )}
        </div>

        <h4
          className="mt-6 text-3xl font-black leading-[1.05] text-white md:text-5xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {d.headline}
        </h4>

        {d.anchor && (
          <p className="mt-4 font-mono-data text-sm text-[var(--color-neon)]">
            {d.anchor}
          </p>
        )}

        {linhas.length > 0 && (
          <dl className="mt-8 grid gap-5 border-t border-white/20 pt-8">
            {linhas.map((l) => (
              <div
                key={l.rotulo}
                className="grid gap-1 md:grid-cols-[180px_1fr] md:gap-6"
              >
                <dt className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--color-neon)]">
                  {l.rotulo}
                </dt>
                <dd className="text-base leading-relaxed text-white md:text-lg">
                  {l.valor}
                </dd>
              </div>
            ))}
          </dl>
        )}

        {d.link && (
          <a
            href={d.link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/40 px-5 py-2 font-mono-data text-xs uppercase tracking-[0.15em] text-white transition-colors hover:border-[var(--color-neon)] hover:bg-[var(--color-neon)] hover:text-[var(--color-blue)]"
          >
            {d.link_label} →
          </a>
        )}
      </div>
    </div>
  );
}
