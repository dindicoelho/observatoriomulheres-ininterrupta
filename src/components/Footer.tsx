"use client";

import Link from "next/link";
import { useState } from "react";

export default function Footer() {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = typeof window !== "undefined"
      ? window.location.origin
      : "https://mapa-violencia-mulher.vercel.app";
    const title = "Observatório Político da Violência contra a Mulher";

    // 1. Tentar Web Share API (mobile + navegadores que suportam)
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // Usuário cancelou ou falhou — segue pro fallback
      }
    }

    // 2. Tentar clipboard
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        return;
      } catch {
        // Sem permissão — segue pro fallback
      }
    }

    // 3. Fallback: execCommand (funciona em mais contextos)
    try {
      const input = document.createElement("input");
      input.value = url;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Último recurso: abrir prompt
      window.prompt("Copie o link:", url);
    }
  };

  return (
    <footer className="bg-[var(--color-dark)] px-6 py-24 text-white">
      <div className="mx-auto max-w-3xl">
        {/* CTA */}
        <div className="mb-10 offset-left">
          <p className="mb-4 font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-neon)]">
            [ ~5 MESES PARA OUTUBRO DE 2026 ]
          </p>
          <h2
            className="text-3xl font-medium leading-[1.05] md:text-5xl lg:text-7xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Em outubro, o voto é seu.
            <br />
            <span className="text-[var(--color-neon)]">
              A responsabilidade também.
            </span>
          </h2>
        </div>

        <p className="mt-8 max-w-2xl text-base leading-relaxed text-white/85 md:text-lg">
          <strong className="text-white">513 deputados. 81 senadores.
          27 governadores.</strong> Outubro redesenha o Congresso que
          decide, pelos próximos quatro anos, se Maria da Penha avança
          ou retrocede, se feminicídio vira pauta ou estatística, se
          mulher é prioridade ou nota de rodapé.
        </p>

        <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/70 md:text-lg">
          Você acabou de ver quem propõe, quem vota a favor, quem vota
          contra, e quem usa o mandato pra desmontar direitos — com
          nome, partido, número de PL e data. Não dá mais pra dizer
          que o Congresso é uma caixa-preta.{" "}
          <strong className="text-white">E não dá mais pra dizer que
          não sabia.</strong>
        </p>

        {/* Plano de ação */}
        <div className="mt-10 rounded-2xl border-2 border-[var(--color-neon)] bg-[var(--color-neon)]/[0.06] p-6 md:p-8">
          <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--color-neon)]">
            [ O que fazer com isso ]
          </p>
          <ol className="mt-4 space-y-3 text-base leading-relaxed text-white md:text-lg">
            <li className="flex gap-4">
              <span className="font-display-condensed text-3xl leading-none text-[var(--color-neon)] md:text-4xl">
                01
              </span>
              <span className="pt-1">
                <strong>Salve este observatório.</strong> Ele é
                atualizado toda vez que a Câmara publica algo novo —
                volte antes de digitar o número na urna.
              </span>
            </li>
            <li className="flex gap-4">
              <span className="font-display-condensed text-3xl leading-none text-[var(--color-neon)] md:text-4xl">
                02
              </span>
              <span className="pt-1">
                <strong>Mande pra três pessoas</strong> que vão votar
                em outubro. Tia, primo, grupo da firma, vizinho. Cada
                um manda pra mais três.
              </span>
            </li>
            <li className="flex gap-4">
              <span className="font-display-condensed text-3xl leading-none text-[var(--color-neon)] md:text-4xl">
                03
              </span>
              <span className="pt-1">
                <strong>Vote sabendo.</strong> Cabine fechada,
                celular bloqueado, memória curta. Não dá pra dizer
                que esqueceu se ainda dá tempo de aprender.
              </span>
            </li>
          </ol>
          <p className="mt-6 border-t border-[var(--color-neon)]/20 pt-4 text-sm leading-relaxed text-white/75 md:text-base">
            O Congresso atual foi eleito por uma minoria que prestou
            atenção. O próximo vai ser eleito do mesmo jeito.{" "}
            <strong className="text-white">O voto é a única coisa
            que o Congresso ainda escuta.</strong>
          </p>
        </div>

        {/* Coletivos */}
        <p className="mt-8 text-sm leading-relaxed text-white/60 md:text-base">
          Este observatório é um meio. Para informação aprofundada,
          formação política e atuação coletiva, acesse os{" "}
          <Link
            href="/metodologia"
            className="text-[var(--color-neon)] underline-offset-4 hover:underline"
          >
            coletivos e ONGs listados na metodologia
          </Link>
          .
        </p>

        {/* Carta autoral */}
        <div className="mt-10 max-w-2xl border-l-2 border-[var(--color-neon)]/40 pl-5 md:pl-6">
          <p className="text-base leading-relaxed text-white/85 md:text-lg">
            Esse site é o que eu consegui fazer com o que sei. Sou
            comunicadora, entendo muito mais de comunicação do que
            de política — e o que sei fazer é programar, usar IA
            pra cruzar 21 mil proposições, e traduzir o juridiquês
            em algo que cabe no celular antes de você entrar na
            cabine. Não tem como fazer mais sozinha. E honestamente:
            tem muita gente que acha que eu nem deveria ter feito
            isso, por não ser especialista política nem organização
            constituída.
          </p>
          <p className="mt-4 text-base leading-relaxed text-white/85 md:text-lg">
            Eu falo aqui do lugar de cidadã, dentro de um ecossistema
            complexo da política brasileira — mulher LGBTQIAP+
            ocupando um espaço que normalmente pede credencial pra
            entrar. Porque o medo de fazer as coisas &ldquo;do jeito
            errado&rdquo; é o que mais trava a gente de fazer as
            coisas que importam. Esperar a permissão certa, o título
            certo, o instituto certo, é uma forma educada de não
            fazer nada.
          </p>
          <p className="mt-4 text-base leading-relaxed text-white/85 md:text-lg">
            Acredito de verdade que mais gente disposta a pesquisar
            política e compartilhar é um caminho interessante pra
            sociedade como um todo. Se você compartilhar, vira coisa
            de mais gente. E mais gente votando informada é o único
            jeito que eu conheço de fazer um Congresso melhor.
          </p>
          <p className="mt-5 font-mono-data text-[11px] uppercase tracking-[0.15em] text-white/60">
            — Dindi ·{" "}
            <a
              href="https://instagram.com/ininterrupta.sys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-neon)] hover:underline"
            >
              @ininterrupta.sys
            </a>
          </p>
        </div>

        {/* Actions */}
        <div className="mt-10 flex flex-wrap gap-3">
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-neon)] px-6 py-3 font-mono-data text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-dark)] transition-transform hover:scale-105"
          >
            {copied ? "Link copiado ✓" : "Mandar pra três eleitores"}
          </button>
          <Link
            href="/metodologia"
            className="inline-block rounded-full border border-white/20 px-6 py-3 font-mono-data text-xs uppercase tracking-[0.2em] text-white/70 transition-colors hover:border-white hover:text-white"
          >
            Ler metodologia →
          </Link>
        </div>

        {/* Divider */}
        <hr className="my-16 border-white/10" />

        {/* Denúncia — discreta */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
          <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-white/40">
            [ Em situação de violência ]
          </p>
          <div className="mt-3 flex flex-wrap items-baseline gap-x-6 gap-y-2 text-sm">
            <span>
              <strong className="font-mono-data text-lg text-[var(--color-neon)]">
                180
              </strong>{" "}
              <span className="text-white/70">
                Central de Atendimento à Mulher · gratuito · 24h
              </span>
            </span>
            <span>
              <strong className="font-mono-data text-lg text-[var(--color-neon)]">
                190
              </strong>{" "}
              <span className="text-white/70">
                Polícia Militar · risco imediato
              </span>
            </span>
          </div>
        </div>

        {/* Credits */}
        <div className="mt-12 text-center text-xs text-white/30">
          <p>
            Dados extraídos das APIs públicas da Câmara dos Deputados e
            do Atlas da Violência (IPEA/FBSP). Atualização automática.
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
