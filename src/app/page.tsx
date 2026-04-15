import Hero from "@/components/Hero";
import TimelineLegislativa from "@/components/TimelineLegislativa";
import RankingDeputados from "@/components/RankingDeputados";
import VotacoesPartidos from "@/components/VotacoesPartidos";
import CoerenciaDeputados from "@/components/CoerenciaDeputados";
import CitySearch from "@/components/CitySearch";
import Footer from "@/components/Footer";
import ProgressBar from "@/components/ProgressBar";
import MarqueeTicker from "@/components/MarqueeTicker";

export default function Home() {
  return (
    <>
      <ProgressBar />
      <main>
        <Hero />

        {/* Transition — do número para política */}
        <div className="bg-[var(--color-bg-alt)] py-20">
          <div className="mx-auto max-w-3xl px-6">
            <p className="font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
              [ INTRODUÇÃO ]
            </p>
            <p className="mt-4 text-2xl font-medium leading-tight text-[var(--color-text)] md:text-3xl" style={{ fontFamily: "var(--font-display)" }}>
              Esse número está na imprensa todo ano.
              <span className="text-[var(--color-text-tertiary)]"> O que quase ninguém conta é quem está decidindo o que fazer com ele.</span>
            </p>
          </div>
        </div>

        {/* ATO 01 — Quem propõe */}
        <RankingDeputados />

        {/* Marquee — marcos legislativos */}
        <div className="bg-[var(--color-dark)] py-8">
          <MarqueeTicker
            dark
            duration={60}
            items={[
              <span key="1" className="font-mono-data text-xs uppercase tracking-widest text-white/60">1988 · Constituição Federal</span>,
              <span key="2" className="font-mono-data text-xs uppercase tracking-widest text-white/60">2006 · Lei Maria da Penha</span>,
              <span key="3" className="font-mono-data text-xs uppercase tracking-widest text-white/60">2015 · Lei do Feminicídio</span>,
              <span key="4" className="font-mono-data text-xs uppercase tracking-widest text-white/60">2018 · Lei da Importunação Sexual</span>,
              <span key="5" className="font-mono-data text-xs uppercase tracking-widest text-white/60">2022 · Lei Henry Borel</span>,
            ]}
          />
        </div>

        {/* Transition — propor × votar */}
        <div className="bg-white py-20">
          <div className="mx-auto max-w-3xl px-6">
            <p className="font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
              [ INTERLÚDIO ]
            </p>
            <p className="mt-4 text-2xl font-medium leading-tight text-[var(--color-text)] md:text-3xl" style={{ fontFamily: "var(--font-display)" }}>
              Propor é uma coisa. Votar é outra.
              <span className="text-[var(--color-text-tertiary)]"> Quando o projeto chega ao plenário, o jogo muda.</span>
            </p>
          </div>
        </div>

        {/* ATO 02 — Como se vota */}
        <VotacoesPartidos />

        {/* Guia eleitoral: coerência */}
        <CoerenciaDeputados />

        {/* Transition — volume de política */}
        <div className="bg-white py-20">
          <div className="mx-auto max-w-3xl px-6">
            <p className="font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
              [ INTERLÚDIO ]
            </p>
            <p className="mt-4 text-2xl font-medium leading-tight text-[var(--color-text)] md:text-3xl" style={{ fontFamily: "var(--font-display)" }}>
              Por trás das votações de maior atenção,
              <span className="text-[var(--color-text-tertiary)]"> existe um universo de centenas de proposições. Qual é o tipo dominante? E quantas viram lei?</span>
            </p>
          </div>
        </div>

        {/* ATO 03 — Timeline legislativa */}
        <TimelineLegislativa />

        {/* Transition para cidade */}
        <div className="bg-white py-20">
          <div className="mx-auto max-w-3xl px-6">
            <p className="font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
              [ ÚLTIMO ATO ]
            </p>
            <p className="mt-4 text-2xl font-medium leading-tight text-[var(--color-text)] md:text-3xl" style={{ fontFamily: "var(--font-display)" }}>
              E na ponta, onde a política encontra o território,
              <span className="text-[var(--color-text-tertiary)]"> o que está acontecendo no seu município?</span>
            </p>
          </div>
        </div>

        {/* ATO 04 — Busca municipal */}
        <CitySearch />
      </main>
      <Footer />
    </>
  );
}
