export default function Footer() {
  return (
    <footer className="bg-[var(--color-text)] px-6 py-20 text-white">
      <div className="mx-auto max-w-2xl">
        {/* CTA */}
        <h2
          className="text-center text-2xl font-bold leading-tight md:text-3xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          O que voce pode fazer
        </h2>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <a
            href="tel:180"
            className="flex flex-col rounded-xl bg-white/10 p-5 transition-colors hover:bg-white/15"
          >
            <span className="font-mono-data text-2xl font-bold text-[var(--color-blood-light)]">
              180
            </span>
            <span className="mt-1 text-sm text-white/70">
              Central de Atendimento a Mulher. Gratuito, 24h, inclusive de
              celular.
            </span>
          </a>
          <a
            href="tel:190"
            className="flex flex-col rounded-xl bg-white/10 p-5 transition-colors hover:bg-white/15"
          >
            <span className="font-mono-data text-2xl font-bold text-[var(--color-blood-light)]">
              190
            </span>
            <span className="mt-1 text-sm text-white/70">
              Policia Militar. Em caso de risco imediato.
            </span>
          </a>
        </div>

        <div className="mt-8 space-y-2 text-center text-sm text-white/50">
          <p>
            Delegacias Especializadas de Atendimento a Mulher (DEAMs) atendem em todo o pais.
          </p>
          <p>
            Denuncias tambem podem ser feitas online pelo app{" "}
            <strong className="text-white/70">Direitos Humanos Brasil</strong>.
          </p>
        </div>

        {/* Divider */}
        <hr className="my-12 border-white/10" />

        {/* Fontes */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white/50">
            Fontes e metodologia
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-white/60">
            <li>
              <strong className="text-white/80">Atlas da Violencia</strong>{" "}
              (IPEA/FBSP) — Series 40 (homicidios de mulheres), 142 (mulheres
              negras), 143 (mulheres nao negras), 52 (taxa por 100 mil por UF e
              municipio). Dados de 1989 a 2023.
            </li>
            <li>
              <strong className="text-white/80">Classificacao racial</strong>{" "}
              — Segue o padrao do IBGE/Atlas: &ldquo;negras&rdquo; inclui pretas + pardas;
              &ldquo;nao negras&rdquo; inclui brancas + amarelas + indigenas.
            </li>
            <li>
              <strong className="text-white/80">Taxa por 100 mil</strong>{" "}
              — Homicidios de mulheres dividido pela populacao feminina do municipio/estado,
              multiplicado por 100.000. Populacao: IBGE.
            </li>
            <li>
              <strong className="text-white/80">Limitacoes</strong>{" "}
              — Dados oficiais representam o piso, nao o teto. Subnotificacao e
              um problema reconhecido pelo FBSP. Municipios pequenos podem ter
              dados incompletos.
            </li>
          </ul>
        </div>

        {/* Credits */}
        <div className="mt-12 text-center text-xs text-white/30">
          <p>
            Dados extraidos das APIs publicas do governo brasileiro via Atlas da Violencia (IPEA/FBSP).
          </p>
          <p className="mt-1">
            Todas as fontes sao publicas e gratuitas. Nenhum dado pessoal de vitimas e coletado ou exibido.
          </p>
        </div>
      </div>
    </footer>
  );
}
