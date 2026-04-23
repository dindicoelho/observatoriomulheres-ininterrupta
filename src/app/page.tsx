import Hero from "@/components/Hero";
import TimelineLegislativa from "@/components/TimelineLegislativa";
import RankingDeputados from "@/components/RankingDeputados";
import VotacoesPartidos from "@/components/VotacoesPartidos";
import ArticuladoresMap from "@/components/ArticuladoresMap";
import ProducaoRegressiva from "@/components/ProducaoRegressiva";
import ComoVotar from "@/components/ComoVotar";
// import SenadoSection from "@/components/SenadoSection";
import QuadranteCritico from "@/components/QuadranteCritico";
import Footer from "@/components/Footer";
import ProgressBar from "@/components/ProgressBar";
import MarqueeTicker from "@/components/MarqueeTicker";

export default function Home() {
  return (
    <>
      <ProgressBar />
      <main>
        <Hero />

        {/* Guia de voto — logo após o hero */}
        <ComoVotar />

        {/* ATO 01 — Quem propõe */}
        <div id="ato-01">
          <RankingDeputados />
        </div>

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

        {/* ATO 02 — Como se vota */}
        <div id="ato-02">
          <VotacoesPartidos />
        </div>

        {/* ATO 03 — Timeline legislativa */}
        <TimelineLegislativa />

        {/* ATO 04 — Quem atua contra */}
        <div id="ato-04">
          <ProducaoRegressiva />
        </div>

        {/* Guia eleitoral por estado */}
        <div id="guia-estados">
          <ArticuladoresMap />
        </div>

        {/* Quadrante crítico */}
        <QuadranteCritico />

      </main>
      <Footer />
    </>
  );
}
