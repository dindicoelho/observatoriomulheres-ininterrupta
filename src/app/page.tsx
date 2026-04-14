import Hero from "@/components/Hero";
import TesouraChart from "@/components/TesouraChart";
import RetratoRacial from "@/components/RetratoRacial";
import ChoroplethMap from "@/components/ChoroplethMap";
import TimelineLegislativa from "@/components/TimelineLegislativa";
import CitySearch from "@/components/CitySearch";
import Footer from "@/components/Footer";
import TriggerWarning from "@/components/TriggerWarning";

export default function Home() {
  return (
    <>
      <TriggerWarning />
      <main>
        <Hero />

        {/* Transition */}
        <div className="bg-gradient-to-b from-white to-[var(--color-bg-alt)] py-16">
          <div className="mx-auto max-w-2xl px-6 text-center">
            <p className="text-base leading-relaxed text-[var(--color-text-secondary)]">
              Os dados abaixo vêm do{" "}
              <strong>Atlas da Violência</strong> (IPEA/FBSP),
              a fonte mais completa sobre homicídios no Brasil.
              São números oficiais, públicos, verificáveis.
            </p>
          </div>
        </div>

        <TesouraChart />

        <RetratoRacial />

        {/* Transition */}
        <div className="bg-white py-16">
          <div className="mx-auto max-w-2xl px-6 text-center">
            <p className="text-lg leading-relaxed text-[var(--color-text-secondary)]">
              A violência também tem geografia. Viver em um estado ou outro
              muda drasticamente a probabilidade de uma mulher ser assassinada.
            </p>
          </div>
        </div>

        <ChoroplethMap />

        {/* Transition */}
        <div className="bg-white py-16">
          <div className="mx-auto max-w-2xl px-6 text-center">
            <p className="text-lg leading-relaxed text-[var(--color-text-secondary)]">
              Diante desses dados, o que o Poder Legislativo tem feito?
            </p>
          </div>
        </div>

        <TimelineLegislativa />

        {/* Transition to city search */}
        <div className="bg-[var(--color-bg-alt)] py-16">
          <div className="mx-auto max-w-2xl px-6 text-center">
            <p className="text-lg leading-relaxed text-[var(--color-text-secondary)]">
              Os números nacionais escondem realidades locais muito diferentes.
              O que está acontecendo no seu município?
            </p>
          </div>
        </div>

        <CitySearch />
      </main>
      <Footer />
    </>
  );
}
