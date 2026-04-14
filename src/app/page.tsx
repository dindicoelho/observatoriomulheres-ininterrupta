import Hero from "@/components/Hero";
import TesouraChart from "@/components/TesouraChart";
import RetratoRacial from "@/components/RetratoRacial";
import ChoroplethMap from "@/components/ChoroplethMap";
import TimelineLegislativa from "@/components/TimelineLegislativa";
import RankingDeputados from "@/components/RankingDeputados";
import VotacoesPartidos from "@/components/VotacoesPartidos";
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

        {/* Transition light */}
        <div className="bg-[var(--color-bg-alt)] py-20">
          <div className="mx-auto max-w-3xl px-6">
            <p className="font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
              [ INTRODUÇÃO ]
            </p>
            <p className="mt-4 text-2xl font-medium leading-tight text-[var(--color-text)] md:text-3xl" style={{ fontFamily: "var(--font-display)" }}>
              Os dados abaixo vêm do Atlas da Violência (IPEA/FBSP),
              a fonte mais completa sobre homicídios no Brasil.
              <span className="text-[var(--color-text-tertiary)]"> São números oficiais, públicos, verificáveis.</span>
            </p>
          </div>
        </div>

        <TesouraChart />

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

        <RetratoRacial />

        {/* Transition */}
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

        <TimelineLegislativa />

        {/* Transition — Eleição */}
        <div className="bg-[var(--color-bg-alt)] py-20">
          <div className="mx-auto max-w-3xl px-6">
            <p className="font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-blood)]">
              [ ANO DE ELEIÇÃO / 2026 ]
            </p>
            <p className="mt-4 text-2xl font-medium leading-tight text-[var(--color-text)] md:text-3xl" style={{ fontFamily: "var(--font-display)" }}>
              Mas quem, especificamente, está propondo o quê?
              <span className="text-[var(--color-text-tertiary)]"> E como seu partido vota quando o tema vai a plenário?</span>
            </p>
          </div>
        </div>

        <RankingDeputados />

        <VotacoesPartidos />

        {/* Transition */}
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

        <CitySearch />
      </main>
      <Footer />
    </>
  );
}
