import Hero from "@/components/Hero";
import TesouraChart from "@/components/TesouraChart";
import RetratoRacial from "@/components/RetratoRacial";
import ChoroplethMap from "@/components/ChoroplethMap";
import TimelineLegislativa from "@/components/TimelineLegislativa";
import RankingDeputados from "@/components/RankingDeputados";
import VotacoesPartidos from "@/components/VotacoesPartidos";
import CoerenciaDeputados from "@/components/CoerenciaDeputados";
import CitySearch from "@/components/CitySearch";
import Footer from "@/components/Footer";
import TriggerWarning from "@/components/TriggerWarning";
import ProgressBar from "@/components/ProgressBar";
import MarqueeTicker from "@/components/MarqueeTicker";

export default function Home() {
  return (
    <>
      <TriggerWarning />
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
              <span className="text-[var(--color-text-tertiary)]"> existe um universo de centenas de proposições. Qual é o tipo dominante?</span>
            </p>
          </div>
        </div>

        {/* ATO 03 — Timeline legislativa */}
        <TimelineLegislativa />

        {/* Transition — geografia */}
        <div className="bg-white py-20">
          <div className="mx-auto max-w-3xl px-6">
            <p className="font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
              [ INTERLÚDIO ]
            </p>
            <p className="mt-4 text-2xl font-medium leading-tight text-[var(--color-text)] md:text-3xl" style={{ fontFamily: "var(--font-display)" }}>
              A violência também tem geografia.
              <span className="text-[var(--color-text-tertiary)]"> Viver em um estado ou outro muda drasticamente a probabilidade de uma mulher ser assassinada.</span>
            </p>
          </div>
        </div>

        {/* ATO 04 — Mapa */}
        <ChoroplethMap />

        {/* Marquee — estados com maior taxa */}
        <div className="bg-[var(--color-bg-alt)] py-8">
          <MarqueeTicker
            duration={50}
            items={[
              <span key="1" className="font-mono-data text-xs uppercase tracking-widest text-[var(--color-text-secondary)]">RR · 10,38 / 100 mil</span>,
              <span key="2" className="font-mono-data text-xs uppercase tracking-widest text-[var(--color-text-secondary)]">RO · 7,15</span>,
              <span key="3" className="font-mono-data text-xs uppercase tracking-widest text-[var(--color-text-secondary)]">MT · 6,21</span>,
              <span key="4" className="font-mono-data text-xs uppercase tracking-widest text-[var(--color-text-secondary)]">CE · 5,73</span>,
              <span key="5" className="font-mono-data text-xs uppercase tracking-widest text-[var(--color-text-secondary)]">AM · 5,62</span>,
              <span key="6" className="font-mono-data text-xs uppercase tracking-widest text-[var(--color-text-tertiary)]">SP · 1,53</span>,
            ]}
          />
        </div>

        {/* Transition — racial */}
        <div className="bg-white py-20">
          <div className="mx-auto max-w-3xl px-6">
            <p className="font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
              [ INTERLÚDIO ]
            </p>
            <p className="mt-4 text-2xl font-medium leading-tight text-[var(--color-text)] md:text-3xl" style={{ fontFamily: "var(--font-display)" }}>
              E ainda existe uma camada que atravessa tudo isso.
              <span className="text-[var(--color-text-tertiary)]"> O risco muda drasticamente dependendo de quem é a mulher.</span>
            </p>
          </div>
        </div>

        {/* ATO 05 — Tesoura + Retrato racial */}
        <TesouraChart />

        <RetratoRacial />

        {/* Transition to city search */}
        <div className="bg-white py-20">
          <div className="mx-auto max-w-3xl px-6">
            <p className="font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
              [ ÚLTIMO ATO ]
            </p>
            <p className="mt-4 text-2xl font-medium leading-tight text-[var(--color-text)] md:text-3xl" style={{ fontFamily: "var(--font-display)" }}>
              Os números nacionais escondem realidades locais muito diferentes.
              <span className="text-[var(--color-text-tertiary)]"> O que está acontecendo no seu município?</span>
            </p>
          </div>
        </div>

        {/* ATO 06 — Busca municipal */}
        <CitySearch />
      </main>
      <Footer />
    </>
  );
}
