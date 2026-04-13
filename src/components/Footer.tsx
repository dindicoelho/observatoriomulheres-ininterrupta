export default function Footer() {
  return (
    <footer className="bg-[var(--color-text)] px-6 py-20 text-white">
      <div className="mx-auto max-w-2xl">
        {/* CTA */}
        <h2
          className="text-center text-2xl font-bold leading-tight md:text-3xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          O que você pode fazer
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
              Central de Atendimento à Mulher. Gratuito, 24h, inclusive de
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
              Polícia Militar. Em caso de risco imediato.
            </span>
          </a>
        </div>

        <div className="mt-8 space-y-2 text-center text-sm text-white/50">
          <p>
            Delegacias Especializadas de Atendimento à Mulher (DEAMs) atendem em todo o país.
          </p>
          <p>
            Denúncias também podem ser feitas online pelo app{" "}
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
              <strong className="text-white/80">Atlas da Violência</strong>{" "}
              (IPEA/FBSP) — Séries 40 (homicídios de mulheres), 142 (mulheres
              negras), 143 (mulheres não negras), 52 (taxa por 100 mil por UF e
              município). Dados de 1989 a 2023.
            </li>
            <li>
              <strong className="text-white/80">Classificação racial</strong>{" "}
              — Segue o padrão do IBGE/Atlas: &ldquo;negras&rdquo; inclui pretas + pardas;
              &ldquo;não negras&rdquo; inclui brancas + amarelas + indígenas.
            </li>
            <li>
              <strong className="text-white/80">Taxa por 100 mil</strong>{" "}
              — Homicídios de mulheres dividido pela população feminina do município/estado,
              multiplicado por 100.000. População: IBGE.
            </li>
            <li>
              <strong className="text-white/80">Limitações</strong>{" "}
              — Dados oficiais representam o piso, não o teto. Subnotificação é
              um problema reconhecido pelo FBSP. Municípios pequenos podem ter
              dados incompletos.
            </li>
          </ul>
        </div>

        {/* Credits */}
        <div className="mt-12 text-center text-xs text-white/30">
          <p>
            Dados extraídos das APIs públicas do governo brasileiro via Atlas da Violência (IPEA/FBSP).
          </p>
          <p className="mt-1">
            Todas as fontes são públicas e gratuitas. Nenhum dado pessoal de vítimas é coletado ou exibido.
          </p>
        </div>
      </div>
    </footer>
  );
}
