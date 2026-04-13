import Hero from "@/components/Hero";
import TesouraChart from "@/components/TesouraChart";
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
              Os dados abaixo vem do{" "}
              <strong>Atlas da Violencia</strong> (IPEA/FBSP),
              a fonte mais completa sobre homicidios no Brasil.
              Sao numeros oficiais, publicos, verificaveis.
            </p>
          </div>
        </div>

        <TesouraChart />

        {/* Transition to city search */}
        <div className="bg-white py-16">
          <div className="mx-auto max-w-2xl px-6 text-center">
            <p className="text-lg leading-relaxed text-[var(--color-text-secondary)]">
              Os numeros nacionais escondem realidades locais muito diferentes.
              O que esta acontecendo no seu municipio?
            </p>
          </div>
        </div>

        <CitySearch />
      </main>
      <Footer />
    </>
  );
}
