import type { Metadata } from "next";
import Link from "next/link";
import autoriaData from "../../data/autoria.json";

const TOTAL_BRUTAS = (autoriaData as { totalBrutas?: number }).totalBrutas ?? 21000;
const TOTAL_PLS = (autoriaData as { totalPls: number }).totalPls;
const TOTAL_DEPS = (autoriaData as { totalDeputados: number }).totalDeputados;
const TOTAL_REGR = (autoriaData as { totalRegressivas?: number }).totalRegressivas ?? 0;

// Arredondamentos pra leitura ("~21.000", "~1.060")
const roundTo = (n: number, step: number) => Math.round(n / step) * step;
const BRUTAS_APROX = roundTo(TOTAL_BRUTAS, 1000).toLocaleString("pt-BR");
const PLS_APROX = roundTo(TOTAL_PLS, 10).toLocaleString("pt-BR");
const REGR_APROX = roundTo(TOTAL_REGR, 10).toLocaleString("pt-BR");

export const metadata: Metadata = {
  title: "Metodologia — Observatório Político da Violência contra a Mulher",
  description:
    "Fontes, métodos, classificação e limitações. Dados públicos da Câmara dos Deputados, classificados por forma e postura com regex + LLM. Atualização automática diária.",
};

export default function MetodologiaPage() {
  return (
    <>
      <header className="border-b border-gray-200 bg-[var(--color-bg-alt)] px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/"
            className="font-mono-data text-xs uppercase tracking-widest text-[var(--color-text-tertiary)] hover:text-[var(--color-blue)]"
          >
            ← Voltar ao observatório
          </Link>
          <h1
            className="mt-8 text-4xl font-black leading-[0.9] text-[var(--color-text)] md:text-6xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Metodologia
          </h1>
          <p className="mt-4 text-lg text-[var(--color-text-secondary)]">
            De onde vêm os dados, como são classificados, quais são as
            escolhas editoriais e o que não está coberto.
          </p>
        </div>
      </header>

      <main className="px-6 py-16">
        <article className="mx-auto max-w-3xl space-y-14 leading-relaxed text-[var(--color-text)]">
          {/* Sobre */}
          <section className="space-y-5">
            <h2
              className="text-3xl font-black"
              style={{ fontFamily: "var(--font-display)" }}
            >
              O que é este site
            </h2>

            <p className="text-base md:text-lg">
              Este observatório foi criado por{" "}
              <strong>Dindi Coelho</strong> como parte da{" "}
              <a
                href="https://instagram.com/ininterrupta.sys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-blue)] hover:underline"
              >
                Ininterrupta
              </a>
              , uma publicação independente. Não tem fins lucrativos e não
              recebe financiamento de nenhuma instituição.{" "}
              <strong>
                É uma investigação autoral, que parte de um lugar de cidadã —
                não de organização política.
              </strong>
            </p>

            <div className="rounded-2xl border border-gray-200 bg-[var(--color-bg-alt)] p-6">
              <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
                [ Aviso ]
              </p>
              <p className="mt-3 text-base leading-relaxed">
                Eu não sou um órgão político. Para acessar coletivos
                especializados, recomendo:
              </p>
              <ul className="mt-3 space-y-1.5 text-base">
                <li>
                  <a
                    href="https://www.elasnocongresso.com.br/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--color-blue)] hover:underline"
                  >
                    Elas no Congresso
                  </a>
                </li>
                <li>
                  <a
                    href="https://inesc.org.br/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--color-blue)] hover:underline"
                  >
                    INESC — Instituto de Estudos Socioeconômicos
                  </a>
                </li>
                <li>
                  <a
                    href="https://cfemea.org.br/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--color-blue)] hover:underline"
                  >
                    CFEMEA — Centro Feminista de Estudos e Assessoria
                  </a>
                </li>
              </ul>
            </div>

            <p className="text-base md:text-lg">
              Você pode <strong>discordar</strong> das análises
              metodológicas, inclusive modificá-las e contribuir para o
              projeto. Tudo está disponível no{" "}
              <a
                href="https://github.com/dindicoelho/mapa-violencia-mulher"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-blue)] hover:underline"
              >
                GitHub
              </a>
              .
            </p>

            <p className="text-base md:text-lg">
              A premissa:{" "}
              <strong>
                violência, direitos reprodutivos, saúde, trabalho — muito
                do que protege as mulheres no Brasil já é lei.
              </strong>{" "}
              Quase ninguém sabe o que a Câmara dos Deputados faz — ou
              deixa de fazer — pra ampliar, defender ou retroceder esses
              direitos. Este site cruza dados da legislatura 2023-2026
              pra mostrar quem propõe, quem vota, quem engaveta, quem
              protege e quem retrocede.
            </p>

            <p className="text-base md:text-lg">
              Todos os dados vêm diretamente da{" "}
              <a
                href="https://dadosabertos.camara.leg.br"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-blue)] hover:underline"
              >
                API de Dados Abertos da Câmara
              </a>
              . Nenhum dado foi modelado, estimado ou projetado. Os
              números aparecem como publicados pelo órgão — o trabalho
              editorial está na <strong>classificação</strong> e na{" "}
              <strong>interpretação</strong>, detalhadas abaixo.
            </p>
          </section>

          {/* Postura editorial */}
          <section className="space-y-5">
            <div className="rounded-2xl border border-[var(--color-blue)]/20 bg-[var(--color-blue)]/5 p-6">
              <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--color-blue)]">
                [ Postura editorial ]
              </p>
              <p className="mt-3 text-base leading-relaxed">
                Este observatório parte de uma premissa explícita:{" "}
                <strong>
                  a pauta de direitos das mulheres — violência,
                  reprodução, saúde, trabalho, autonomia — deve ser
                  ampliada e defendida com políticas públicas protetivas.
                </strong>{" "}
                Punitivismo (aumentar pena sem proteger mais) e retrocesso
                em direitos conquistados não são tratados como avanço.
              </p>
              <p className="mt-3 text-base leading-relaxed">
                Na prática: proposições classificadas como{" "}
                <strong className="text-red-700">regressivas</strong> são{" "}
                <strong>removidas do ranking e subtraem pontos</strong> do
                score do autor. Proposições{" "}
                <strong className="text-amber-700">punitivistas</strong>{" "}
                contam como produção mas recebem selo. A classificação é
                transparente — os critérios estão detalhados abaixo.
              </p>
            </div>
          </section>

          {/* Fontes */}
          <section className="space-y-5">
            <h2
              className="text-3xl font-black"
              style={{ fontFamily: "var(--font-display)" }}
            >
              De onde vêm os dados
            </h2>

            <div className="space-y-4">
              <h3
                className="text-xl font-bold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Câmara dos Deputados
              </h3>
              <p className="text-base md:text-lg">
                Fonte primária e única fonte de dados legislativos.
                Consultamos diariamente:
              </p>
              <ul className="ml-6 list-disc space-y-2 text-base text-[var(--color-text-secondary)] md:text-lg">
                <li>
                  <strong className="text-[var(--color-text)]">
                    ~{BRUTAS_APROX} proposições brutas
                  </strong>{" "}
                  da 57ª legislatura (2023-2026), filtradas por ~90
                  palavras-chave em 11 categorias temáticas ligadas a
                  direitos das mulheres. Após filtro:{" "}
                  <strong className="text-[var(--color-text)]">
                    ~{PLS_APROX} proposições protetivas e punitivistas
                  </strong>{" "}
                  + ~{REGR_APROX} regressivas removidas do ranking.
                </li>
                <li>
                  <strong className="text-[var(--color-text)]">
                    {TOTAL_DEPS} deputados autores
                  </strong>{" "}
                  — com nome, partido, UF, foto, sexo e situação.
                </li>
                <li>
                  <strong className="text-[var(--color-text)]">
                    17 votações nominais de plenário
                  </strong>{" "}
                  sobre 6 PLs, com voto individual, placar por partido e
                  por gênero, autor e relator de cada proposição.
                </li>
                <li>
                  <strong className="text-[var(--color-text)]">
                    Tramitação individual
                  </strong>{" "}
                  de cada PL — se virou lei, se está em comissão, se nunca
                  recebeu relator.
                </li>
              </ul>
            </div>

            <div className="space-y-4 pt-4">
              <h3
                className="text-xl font-bold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Composição da Câmara
              </h3>
              <p className="text-base md:text-lg">
                A Câmara tem 513 deputados na 57ª legislatura; 91 são
                mulheres (17,7%). Esse dado — da Secretaria da Mulher da
                Câmara — é a base dos contrastes de gênero do site.
                Cinco estados (AL, AM, PB, PI, TO) não elegeram nenhuma
                deputada.
              </p>
            </div>
          </section>

          {/* Métodos */}
          <section className="space-y-5">
            <h2
              className="text-3xl font-black"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Como os dados são tratados
            </h2>

            {/* Keywords */}
            <div className="space-y-4">
              <h3
                className="text-xl font-bold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                1. Filtragem por palavras-chave
              </h3>
              <p className="text-base md:text-lg">
                Buscamos na ementa de cada proposição ao menos uma de{" "}
                <strong>~90 expressões organizadas em 11 categorias
                temáticas</strong>. A lista completa, com cada termo, está
                no script{" "}
                <code className="text-[var(--color-blue)]">
                  scripts/rebuild_autoria.py
                </code>
                :
              </p>
              <ul className="ml-6 list-disc space-y-2 text-base text-[var(--color-text-secondary)] md:text-lg">
                <li>
                  <strong className="text-[var(--color-text)]">
                    Violência (13 termos)
                  </strong>{" "}
                  — violência contra mulher, doméstica, familiar, de
                  gênero, política de gênero, política contra mulher,
                  obstétrica, psicológica, sexual, vicária.
                </li>
                <li>
                  <strong className="text-[var(--color-text)]">
                    Feminicídio (2)
                  </strong>{" "}
                  — feminicídio, transfeminicídio.
                </li>
                <li>
                  <strong className="text-[var(--color-text)]">
                    Leis de referência (7)
                  </strong>{" "}
                  — Lei Maria da Penha, lei do feminicídio, Henry Borel,
                  Carolina Dieckmann, Henrique Eduardo Alves.
                </li>
                <li>
                  <strong className="text-[var(--color-text)]">
                    Crimes sexuais (11)
                  </strong>{" "}
                  — estupro, importunação sexual, assédio (sexual e
                  moral), abuso sexual, exploração sexual, pornografia
                  infantil, crimes contra a dignidade sexual.
                </li>
                <li>
                  <strong className="text-[var(--color-text)]">
                    Proteção e políticas (11)
                  </strong>{" "}
                  — proteção à mulher/vítima, medida protetiva,
                  monitoramento eletrônico, patrulha Maria da Penha, Casa
                  da Mulher Brasileira, disque 180.
                </li>
                <li>
                  <strong className="text-[var(--color-text)]">
                    Saúde e direitos reprodutivos (20)
                  </strong>{" "}
                  — saúde da mulher, saúde materna, mortalidade materna,
                  parto humanizado, licença-maternidade, gestante,
                  gravidez, aborto, abortamento, interrupção da gravidez,
                  amamentação, câncer de mama, câncer de colo,
                  endometriose, climatério, menopausa.
                </li>
                <li>
                  <strong className="text-[var(--color-text)]">
                    Discriminação e igualdade (8)
                  </strong>{" "}
                  — discriminação por gênero/sexo, igualdade de gênero,
                  igualdade salarial, paridade, cotas para mulheres,
                  participação política da mulher.
                </li>
                <li>
                  <strong className="text-[var(--color-text)]">
                    Trabalho e economia (6)
                  </strong>{" "}
                  — mãe solo, monoparental, pensão alimentícia, guarda
                  compartilhada, mulher chefe de família.
                </li>
                <li>
                  <strong className="text-[var(--color-text)]">
                    Identidade (3)
                  </strong>{" "}
                  — mulher trans, mulheres trans, transexual.
                </li>
                <li>
                  <strong className="text-[var(--color-text)]">
                    Grupos específicos (6)
                  </strong>{" "}
                  — mulher negra, mulher indígena, mulher idosa, mulher
                  com deficiência, meninas e mulheres.
                </li>
                <li>
                  <strong className="text-[var(--color-text)]">
                    Educação e cultura (2)
                  </strong>{" "}
                  — educação de gênero, escola sem violência.
                </li>
              </ul>
              <p className="text-base md:text-lg">
                <strong>O filtro não cobre só violência.</strong> O site
                captura o universo amplo de pautas de gênero — saúde
                reprodutiva, trabalho, identidade, igualdade salarial,
                grupos específicos. Violência é a primeira (e maior)
                categoria, mas é uma de onze.
              </p>
              <p className="text-base md:text-lg">
                A lista é conservadora — na dúvida sobre incluir um termo,
                a versão atual deixa de fora. O resultado: ~{BRUTAS_APROX}{" "}
                proposições brutas da 57ª legislatura são reduzidas a{" "}
                ~{PLS_APROX} protetivas e punitivistas + ~{REGR_APROX}{" "}
                regressivas removidas do ranking.
              </p>
            </div>

            {/* Forma */}
            <div className="space-y-4 pt-4">
              <h3
                className="text-xl font-bold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                2. Classificação por forma
              </h3>
              <p className="text-base md:text-lg">
                Cada proposição é classificada automaticamente (regex
                sobre a ementa) em:
              </p>
              <ul className="ml-6 list-disc space-y-2 text-base text-[var(--color-text-secondary)] md:text-lg">
                <li>
                  <strong style={{ color: "#6B6B64" }}>Simbólica</strong>{" "}
                  — dias nacionais, homenagens, denominações, campanhas.
                </li>
                <li>
                  <strong style={{ color: "#3B82D4" }}>Incremental</strong>{" "}
                  — altera lei existente: ajuste de pena, mudança
                  procedimental, inclusão de artigo.
                </li>
                <li>
                  <strong style={{ color: "#1DB389" }}>Estrutural</strong>{" "}
                  — cria programa nacional, fundo, política de Estado,
                  pensão, sistema.
                </li>
              </ul>
            </div>

            {/* Postura */}
            <div className="space-y-4 pt-4">
              <h3
                className="text-xl font-bold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                3. Classificação por postura
              </h3>
              <p className="text-base md:text-lg">
                Duas camadas: primeiro uma regex conservadora, depois
                refinamento por LLM (Claude Haiku 4.5) sobre as PLs que
                a regex marcou como protetivas. Resultados:
              </p>
              <ul className="ml-6 list-disc space-y-2 text-base text-[var(--color-text-secondary)] md:text-lg">
                <li>
                  <strong className="text-emerald-700">Protetiva</strong>{" "}
                  — amplia direitos, cria política pública, protege a
                  vítima. Padrão quando não há sinal contrário.
                </li>
                <li>
                  <strong className="text-amber-700">Punitivista</strong>{" "}
                  — foca em aumentar pena, criar cadastro de condenados,
                  castração química, regime fechado. Não melhora a
                  proteção material. Conta como produção mas recebe selo.
                </li>
                <li>
                  <strong className="text-red-700">Regressiva</strong>{" "}
                  — criminaliza aborto legal, obriga notificação à polícia
                  de vítima de estupro que fez aborto, susta resoluções
                  que protegem crianças, autoriza porte de arma como
                  resposta à violência doméstica, condiciona BPC à
                  renúncia do aborto legal.{" "}
                  <strong>
                    Removida do ranking e subtrai 7 pontos do score.
                  </strong>
                </li>
              </ul>
              <p className="text-base md:text-lg">
                O LLM roda semanalmente e encontra regressivas/punitivistas
                sutis que a regex perde (ex: PLs que condicionam benefício
                financeiro à renúncia do aborto legal, ou que criminalizam
                falsas acusações de violência doméstica como obstáculo
                processual). Cada reclassificação inclui a justificativa
                do modelo no JSON — auditável por PL.
              </p>
            </div>

            {/* Votações */}
            <div className="space-y-4 pt-4">
              <h3
                className="text-xl font-bold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                4. Interpretação das votações
              </h3>
              <p className="text-base md:text-lg">
                Para cada votação nominal de plenário, escrevemos:
              </p>
              <ul className="ml-6 list-disc space-y-2 text-base text-[var(--color-text-secondary)] md:text-lg">
                <li>
                  O que o <strong>projeto de lei</strong> faz, em
                  linguagem acessível.
                </li>
                <li>
                  O que <strong>exatamente foi votado</strong> naquela
                  sessão (texto original, destaque, recurso ou
                  requerimento).
                </li>
                <li>
                  O <strong>resultado</strong> e suas consequências.
                </li>
                <li>
                  O que significa <strong>votar SIM</strong> e o que
                  significa <strong>votar NÃO</strong> — sem rótulo de
                  &ldquo;pró&rdquo; ou &ldquo;contra&rdquo;.
                </li>
              </ul>
              <p className="text-base md:text-lg">
                Cada votação é classificada em <strong>mérito</strong>{" "}
                (decide conteúdo substantivo) ou{" "}
                <strong>procedural</strong> (decide rito). Também
                mostramos autor e relator de cada proposição.
              </p>
            </div>

            {/* Gênero */}
            <div className="space-y-4 pt-4">
              <h3
                className="text-xl font-bold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                5. Agregação por gênero
              </h3>
              <p className="text-base md:text-lg">
                O campo <strong>sexo</strong> (M ou F) vem da API da
                Câmara, declarado pela própria Casa. Cruzamos com autoria,
                relatoria e votação pra gerar os contrastes do site:
                mulheres são 17% da Câmara mas respondem por ~45% das PLs
                sobre o tema e mais de 50% das estruturais.
              </p>
              <p className="text-sm text-[var(--color-text-tertiary)]">
                Limitação: a API não registra identidade de gênero
                auto-declarada. O observatório herda essa restrição.
              </p>
            </div>

            {/* Score */}
            <div className="space-y-4 pt-4">
              <h3
                className="text-xl font-bold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                6. Score do mapa por estado
              </h3>
              <p className="text-base md:text-lg">
                Tanto o ranking top 20 quanto o mapa por estado usam a
                mesma fórmula de score:
              </p>
              <p className="pl-6 font-mono-data text-sm">
                score = [(PLs estruturais × 3) + (PLs incrementais × 1)
                + (PLs simbólicas × 1) − (PLs punitivistas × 2)
                − (PLs regressivas × 7)
                − (votos SIM em regressivas × 5)]
                × ficha_limpa × peso_sexo
              </p>
              <p className="pl-6 font-mono-data text-sm">
                ficha_limpa = 1,5 se 100% protetivas · 1,0 caso
                contrário
              </p>
              <p className="text-base md:text-lg">
                Deputados com <strong>ficha 100% protetiva</strong>{" "}
                (zero punitivistas, zero regressivas, zero votos
                regressivos) recebem bônus <strong>×1,5</strong> no
                score. A lógica: quem só propõe proteção demonstra
                consistência e compromisso — merece diferenciação de
                quem mistura proteção com punitivismo ou retrocesso.
              </p>
              <p className="text-base md:text-lg">
                A penalidade por <strong>autoria</strong> de PL
                regressiva é −7 pontos. A penalidade por <strong>voto
                SIM</strong> em pauta regressiva é −5 pontos — menor
                que autoria, porque propor é mais ativo politicamente
                do que acompanhar uma votação, mas maior que
                punitivismo (−2), porque voto é responsabilidade
                direta pela aprovação. A penalidade por{" "}
                <strong>punitivismo</strong> de autoria é −2 pontos —
                não zero, porque punitivismo (aumento de pena,
                cadastros) não melhora proteção material.
              </p>
              <p className="pl-6 font-mono-data text-sm">
                peso_sexo = 5 se mulher SEM retrocesso · 1,0 caso
                contrário
              </p>
              <p className="text-base md:text-lg">
                O <strong>peso_sexo 5 para mulheres</strong> é uma{" "}
                <strong>escolha editorial declarada</strong> pra
                compensar a sub-representação feminina na Câmara (só
                17% da composição). Sem esse peso, o mapa ficaria
                dominado por quem tem mais acesso institucional, não
                por quem tem mais atuação relativa no tema.
              </p>
              <p className="text-base md:text-lg">
                Porém, esse peso <strong>só vale quando a ficha não
                tem retrocesso</strong> — zero PLs regressivas e zero
                votos SIM em pauta regressiva. Quem retrocede direitos
                da mulher não recebe o multiplicador desenhado para
                ampliar voz às mulheres da pauta. Punitivismo isolado
                mantém o peso porque já tem o desconto próprio de −2
                pontos.
              </p>
              <p className="text-base md:text-lg">
                Considera apenas deputados em{" "}
                <strong>exercício na atual legislatura</strong>. Quando
                o TSE publicar a lista oficial de candidatos a 2026, a
                seção será filtrada automaticamente para mostrar só quem
                efetivamente se candidatou à reeleição.
              </p>
            </div>

            {/* Destino */}
            <div className="space-y-4 pt-4">
              <h3
                className="text-xl font-bold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                7. Taxa de aprovação
              </h3>
              <p className="text-base md:text-lg">
                Pra cada PL, consultamos a situação atual de tramitação e
                categorizamos em 6 destinos: virou lei, tramita no Senado,
                pronta pra pauta, em tramitação com relator, aguardando
                relator, ou arquivada. Cada categoria é clicável no site —
                mostra as PLs naquele status.
              </p>
            </div>
          </section>

          {/* Fundamentação teórica */}
          <section className="space-y-5">
            <h2
              className="text-3xl font-black"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Fundamentação teórica
            </h2>

            <p className="text-base md:text-lg">
              Toda classificação de produção legislativa é política — não
              existe observação neutra de uma pauta como direitos das
              mulheres. As categorias usadas aqui (simbólica, incremental,
              estrutural; protetiva, punitivista, regressiva) e os pesos
              da fórmula de score não são invenção editorial: são tradução
              de frameworks consolidados em ciência política, análise de
              políticas públicas e criminologia feminista. Esta seção
              explicita as referências por trás de cada escolha — pra que
              o leitor possa concordar, discordar ou refazer as contas com
              outros pesos.
            </p>

            {/* Forma */}
            <div className="space-y-4 pt-2">
              <h3
                className="text-xl font-bold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Por que simbólica, incremental e estrutural
              </h3>
              <p className="text-base md:text-lg">
                A tipologia por forma tem três bases principais:
              </p>
              <ul className="ml-6 list-disc space-y-2 text-base text-[var(--color-text-secondary)] md:text-lg">
                <li>
                  <strong className="text-[var(--color-text)]">
                    Edelman (1964)
                  </strong>{" "}
                  introduz política simbólica como categoria analítica:
                  ações que respondem à demanda política produzindo
                  significados públicos sem alterar a alocação material
                  de recursos ou direitos. Dias nacionais, denominações,
                  campanhas. Não são &ldquo;inúteis&rdquo; — produzem
                  reconhecimento e agendamento — mas não mudam o que o
                  Estado entrega.
                </li>
                <li>
                  <strong className="text-[var(--color-text)]">
                    Lindblom (1959)
                  </strong>{" "}
                  formaliza o incrementalismo: mudanças marginais em
                  estruturas existentes — ajustar pena, mudar
                  procedimento, incluir artigo na Maria da Penha. É como
                  a maior parte da política pública avança.
                </li>
                <li>
                  <strong className="text-[var(--color-text)]">
                    Hall (1993)
                  </strong>{" "}
                  distingue mudanças de primeira ordem (parâmetros),
                  segunda (instrumentos) e terceira (paradigma). PLs
                  estruturais correspondem à terceira ordem — criam
                  programa, fundo, sistema, política de Estado.
                </li>
              </ul>
              <p className="text-base md:text-lg">
                No contexto brasileiro, a tipologia dialoga com{" "}
                <strong>Celina Souza (2006)</strong> e{" "}
                <strong>Klaus Frey (2000)</strong>, que organizam o
                campo de análise de políticas públicas em português.
              </p>
            </div>

            {/* Postura */}
            <div className="space-y-4 pt-4">
              <h3
                className="text-xl font-bold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Por que protetiva, punitivista e regressiva
              </h3>
              <p className="text-base md:text-lg">
                Separar punitivismo de proteção não é distinção jurídica
                — é criminológica e feminista. A literatura mostra
                consistentemente que aumento de pena não reduz violência
                contra a mulher; o que reduz é proteção material
                (atendimento, casa-abrigo, medida protetiva eficaz,
                independência econômica, prevenção). As fontes:
              </p>
              <ul className="ml-6 list-disc space-y-2 text-base text-[var(--color-text-secondary)] md:text-lg">
                <li>
                  <strong className="text-[var(--color-text)]">
                    Carol Smart (1989)
                  </strong>{" "}
                  abre uma tradição de crítica feminista ao recurso ao
                  direito penal como ferramenta de emancipação:
                  entregar ao Estado o código penal pra &ldquo;proteger
                  mulheres&rdquo; é dar a ele um instrumento que
                  historicamente foi usado contra elas.
                </li>
                <li>
                  <strong className="text-[var(--color-text)]">
                    Elena Larrauri
                  </strong>{" "}
                  documenta empiricamente, na criminologia feminista
                  espanhola, que punitivismo não reduz violência
                  doméstica.
                </li>
                <li>
                  <strong className="text-[var(--color-text)]">
                    Garland (2001)
                  </strong>{" "}
                  e <strong className="text-[var(--color-text)]">
                    Wacquant (2003)
                  </strong>{" "}
                  oferecem o framework geral: o Estado penal moderno
                  desloca questões sociais pra resposta carcerária —
                  pena maior como substituto barato de política pública.
                </li>
                <li>
                  <strong className="text-[var(--color-text)]">
                    Vera Andrade (2012)
                  </strong>{" "}
                  é a referência brasileira de criminologia crítica
                  feminista; trata diretamente do &ldquo;paradoxo do
                  feminismo punitivo&rdquo;.
                </li>
                <li>
                  <strong className="text-[var(--color-text)]">
                    Carmen Hein de Campos (org., 2011)
                  </strong>{" "}
                  lê a Lei Maria da Penha como lei de{" "}
                  <strong>proteção integral</strong>, não como lei
                  penal — é a leitura jurídico-feminista que orienta
                  este site.
                </li>
                <li>
                  <strong className="text-[var(--color-text)]">
                    Maria Lúcia Karam
                  </strong>{" "}
                  e <strong className="text-[var(--color-text)]">
                    Debora Diniz
                  </strong>{" "}
                  ancoram a posição sobre direitos reprodutivos e o
                  custo material da criminalização do aborto — base do
                  diagnóstico de que sustar resoluções protetivas e
                  criminalizar aborto legal é{" "}
                  <strong>regressivo</strong>, não &ldquo;neutro&rdquo;.
                </li>
              </ul>
              <p className="text-base md:text-lg">
                Daí a operacionalização:{" "}
                <strong className="text-emerald-700">protetiva</strong>{" "}
                amplia proteção material;{" "}
                <strong className="text-amber-700">punitivista</strong>{" "}
                aposta em pena maior, cadastro, regime fechado, castração
                química;{" "}
                <strong className="text-red-700">regressiva</strong>{" "}
                retrocede direito conquistado.
              </p>
            </div>

            {/* Pesos */}
            <div className="space-y-4 pt-4">
              <h3
                className="text-xl font-bold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Por que esses pesos
              </h3>
              <p className="text-base md:text-lg">
                Os pesos da fórmula (estrutural ×3, incremental e
                simbólico ×1, punitivismo −2, regressivo −7, voto SIM em
                regressiva −5) são a tradução dos frameworks acima em
                número. Não há valor &ldquo;objetivo&rdquo; — a leitura é:
              </p>
              <ul className="ml-6 list-disc space-y-2 text-base text-[var(--color-text-secondary)] md:text-lg">
                <li>
                  Estrutural multiplica porque corresponde à mudança de
                  terceira ordem em Hall — mais articulação política,
                  maior efeito redistributivo.
                </li>
                <li>
                  Punitivismo penaliza pouco (−2) porque{" "}
                  <em>ainda é produção legislativa</em> sobre o tema e
                  parte do leitorado pode discordar da nossa leitura
                  criminológica.
                </li>
                <li>
                  Regressivo penaliza muito (−7) porque retroceder
                  direito conquistado tem custo material diferente de
                  apenas não avançar — segue Garland, Wacquant e a
                  literatura de direitos reprodutivos.
                </li>
                <li>
                  O <strong>peso de gênero (×5)</strong>, aplicado só
                  ao mapa por estado, traduz numericamente o argumento
                  de <strong>Anne Phillips (1995)</strong> e da literatura
                  de &ldquo;política de presença&rdquo;: sub-representação
                  descritiva (mulheres = 17,7% da Câmara) é um problema
                  democrático em si. Sem o peso, o mapa seria dominado
                  por quem tem mais acesso institucional, não por quem
                  atua mais relativamente na pauta.
                </li>
              </ul>
              <p className="text-base md:text-lg">
                <strong>O leitor pode discordar dos pesos.</strong> Os
                dados brutos vêm da API pública da Câmara, os scripts de
                classificação estão em <code>scripts/</code>, e o JSON
                final é auditável por PL — qualquer pessoa pode refazer
                as contas com outros pesos.
              </p>
            </div>

            {/* Referências */}
            <div className="space-y-4 pt-4">
              <h3
                className="text-xl font-bold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Referências
              </h3>
              <ul className="ml-6 list-disc space-y-2 text-sm text-[var(--color-text-secondary)] md:text-base">
                <li>
                  Andrade, Vera Regina Pereira de.{" "}
                  <em>
                    Pelas mãos da criminologia: o controle penal para
                    além da (des)ilusão
                  </em>
                  . Rio de Janeiro: Revan/ICC, 2012.
                </li>
                <li>
                  Campos, Carmen Hein de (org.).{" "}
                  <em>
                    Lei Maria da Penha Comentada em uma Perspectiva
                    Jurídico-Feminista
                  </em>
                  . Rio de Janeiro: Lumen Juris, 2011.
                </li>
                <li>
                  Diniz, Debora; Medeiros, Marcelo. &ldquo;Aborto no
                  Brasil: uma pesquisa domiciliar com técnica de
                  urna&rdquo;.{" "}
                  <em>Ciência &amp; Saúde Coletiva</em>, 15 (supl. 1),
                  2010.
                </li>
                <li>
                  Edelman, Murray.{" "}
                  <em>The Symbolic Uses of Politics</em>. Urbana:
                  University of Illinois Press, 1964.
                </li>
                <li>
                  Frey, Klaus. &ldquo;Políticas públicas: um debate
                  conceitual e reflexões referentes à prática da
                  análise de políticas públicas no Brasil&rdquo;.{" "}
                  <em>Planejamento e Políticas Públicas</em> (IPEA),
                  n. 21, 2000.
                </li>
                <li>
                  Garland, David.{" "}
                  <em>
                    The Culture of Control: Crime and Social Order in
                    Contemporary Society
                  </em>
                  . Oxford: Oxford University Press, 2001.
                </li>
                <li>
                  Hall, Peter A. &ldquo;Policy Paradigms, Social
                  Learning, and the State: The Case of Economic
                  Policymaking in Britain&rdquo;.{" "}
                  <em>Comparative Politics</em>, 25(3), 1993.
                </li>
                <li>
                  Karam, Maria Lúcia.{" "}
                  <em>
                    Recuperar o desejo da liberdade e conter o poder
                    punitivo
                  </em>
                  . Rio de Janeiro: Lumen Juris, 2009.
                </li>
                <li>
                  Larrauri, Elena.{" "}
                  <em>
                    Mujeres y sistema penal: violencia doméstica
                  </em>
                  . Montevideo / Buenos Aires: BdeF, 2008.
                </li>
                <li>
                  Lindblom, Charles E. &ldquo;The Science of
                  &lsquo;Muddling Through&rsquo;&rdquo;.{" "}
                  <em>Public Administration Review</em>, 19(2), 1959.
                </li>
                <li>
                  Phillips, Anne.{" "}
                  <em>The Politics of Presence</em>. Oxford: Oxford
                  University Press, 1995.
                </li>
                <li>
                  Smart, Carol.{" "}
                  <em>Feminism and the Power of Law</em>. London:
                  Routledge, 1989.
                </li>
                <li>
                  Souza, Celina. &ldquo;Políticas Públicas: uma
                  revisão da literatura&rdquo;.{" "}
                  <em>Sociologias</em>, 8(16), 2006.
                </li>
                <li>
                  Wacquant, Loïc.{" "}
                  <em>
                    Punir os Pobres: a nova gestão da miséria nos
                    Estados Unidos
                  </em>
                  . Rio de Janeiro: Revan, 2003.
                </li>
              </ul>
            </div>
          </section>

          {/* Automação */}
          <section className="space-y-5">
            <h2
              className="text-3xl font-black"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Atualização automática
            </h2>

            <p className="text-base md:text-lg">
              O site é atualizado <strong>todos os dias às 03:00
              (horário de Brasília)</strong> via GitHub Actions. O
              pipeline:
            </p>
            <ol className="ml-6 list-decimal space-y-1.5 text-base text-[var(--color-text-secondary)] md:text-lg">
              <li>Busca todas as proposições 2023-2026 na API da Câmara</li>
              <li>Filtra por ~90 palavras-chave em 11 categorias (violência, saúde reprodutiva, trabalho, identidade, igualdade, grupos específicos, etc.)</li>
              <li>Classifica por forma (regex) e postura (regex)</li>
              <li>Agrega por UF, gênero, partido, destino</li>
              <li>Busca autor e relator de cada votação</li>
              <li>Tenta buscar candidatos 2026 no TSE (ativa quando publicar)</li>
              <li>Se dados mudaram, commita e pusha</li>
              <li>Vercel rebuilda o site automaticamente</li>
            </ol>
            <p className="text-base md:text-lg">
              <strong>Às segundas-feiras</strong>, o LLM (Claude Haiku 4.5)
              roda sobre as PLs protetivas pra detectar regressivas e
              punitivistas sutis que a regex perde. Custo: ~$0,85 por
              execução.
            </p>
            <p className="text-base md:text-lg">
              Todo o processo é reprodutível e auditável internamente.
            </p>
          </section>

          {/* Limitações */}
          <section className="space-y-5">
            <h2
              className="text-3xl font-black"
              style={{ fontFamily: "var(--font-display)" }}
            >
              O que não está coberto
            </h2>

            <ul className="ml-6 list-disc space-y-3 text-base text-[var(--color-text-secondary)] md:text-lg">
              <li>
                <strong className="text-[var(--color-text)]">
                  Só Câmara, não Senado.
                </strong>{" "}
                PLs que nasceram no Senado ou medidas provisórias só
                aparecem se tramitaram na Câmara. Integração com Senado
                está prevista.
              </li>
              <li>
                <strong className="text-[var(--color-text)]">
                  Classificação automática tem erros.
                </strong>{" "}
                Uma PL pode ser marcada como incremental quando teria
                efeitos estruturais. A classificação por postura (regex +
                LLM) é conservadora: na dúvida, marca como protetiva. Mas
                LLMs alucinam — cada reclassificação tem justificativa
                auditável no JSON.
              </li>
              <li>
                <strong className="text-[var(--color-text)]">
                  Interpretação SIM/NÃO é editorial.
                </strong>{" "}
                Um voto NÃO pode significar &ldquo;quero enfraquecer
                proteção&rdquo; ou &ldquo;quero uma proteção ainda mais
                forte&rdquo;. O site explica o contexto em cada card, mas
                o leitor deve ler antes de concluir.
              </li>
              <li>
                <strong className="text-[var(--color-text)]">
                  Gênero binário.
                </strong>{" "}
                A API da Câmara registra M ou F. Não há dado de identidade
                de gênero auto-declarada.
              </li>
              <li>
                <strong className="text-[var(--color-text)]">
                  Votações de comissão não aparecem.
                </strong>{" "}
                Mostramos só votações nominais de plenário. Deputados
                podem ter votado consistentemente em comissões de forma
                diferente.
              </li>
              <li>
                <strong className="text-[var(--color-text)]">
                  O peso 5 pra mulheres é uma escolha editorial.
                </strong>{" "}
                Aplicado apenas no mapa por estado. Existe pra compensar
                a sub-representação feminina (17% da Câmara). Nem todo
                leitor vai concordar.
              </li>
            </ul>
          </section>

          {/* Infraestrutura */}
          <section className="space-y-5">
            <h2
              className="text-3xl font-black"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Infraestrutura
            </h2>

            <p className="text-base md:text-lg">
              Next.js (SSG) + D3.js + Tailwind, hospedado na Vercel.
              Pipeline em Python. Classificação LLM via Anthropic API
              (Haiku 4.5). Cron via GitHub Actions. Custo total: ~$4/mês
              (LLM semanal). Nenhum dado pessoal é coletado — sem
              cookies, pixels ou formulários.
            </p>
          </section>

          {/* Assinatura */}
          {/* Sobre a Ininterrupta */}
          <section className="space-y-5">
            <h2
              className="text-3xl font-black"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Sobre a Ininterrupta
            </h2>

            <p className="text-base md:text-lg">
              A <strong>Ininterrupta</strong> é uma publicação brasileira
              independente de inteligência cultural. Fundada por Dindi
              Coelho, investiga as camadas invisíveis que conectam
              cultura, tecnologia e comportamento no Brasil.
            </p>

            <p className="text-base md:text-lg">
              A publicação não tem fins lucrativos e não recebe
              financiamento de nenhuma instituição pública ou privada.
              Opera com dados públicos, código aberto e transparência
              editorial.
            </p>

            <p className="text-base md:text-lg">
              Este observatório político é um dos projetos da
              Ininterrupta — nasceu da pergunta{" "}
              <em>
                &ldquo;todo mundo sabe que violência contra mulher é
                crime, mas quem está fazendo algo pra mudar?&rdquo;
              </em>{" "}
              e usa exclusivamente dados da API da Câmara dos Deputados
              pra responder.
            </p>

            <div className="mt-6 flex flex-wrap gap-4">
              <a
                href="https://instagram.com/ininterrupta.sys"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:border-[var(--color-blue)] hover:text-[var(--color-blue)]"
              >
                @ininterrupta.sys
              </a>
            </div>
          </section>

          {/* Agradecimentos */}
          <section className="space-y-5 border-t border-gray-200 pt-10">
            <h2
              className="text-3xl font-black"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Agradecimentos
            </h2>

            <p className="text-base md:text-lg">
              Este projeto não seria possível sem o olhar, feedback e
              tempo de pessoas incríveis que ajudaram com suas opiniões
              e experiência — seja na navegação, estruturação de dados
              e apontamentos:
            </p>

            <div className="mt-4 flex flex-wrap gap-x-1 gap-y-0.5 text-base text-[var(--color-text-secondary)]">
              {[
                "Ana Freitas",
                "Ana Machado",
                "Ana Mohallem",
                "Ana Paula Passarelli",
                "Annahy Laira",
                "Annelize Conti",
                "Ariane Polvani",
                "Beatriz Pascon",
                "Beatriz Zappa",
                "Beta Harada",
                "Bianca Brega",
                "Camila Ribeiro",
                "Danielle Marques",
                "Isabella Mulholland",
                "Janaina Navarrette",
                "João JB Junior",
                "Julia Teodoro",
                "Juliana Ghiselini",
                "Juliana Morganti",
                "Lilian Otuka",
                "Mafe Galetti",
                "Mariana Ramos",
                "Marina Dias",
                "Marina Landherr",
                "Patricia Chmielewski",
                "Rafaella Gobara",
                "Rafael Oliveira",
                "Renata Ruas",
                "Stella Pirani",
                "Thais Jacoponi",
                "Thais Mara",
              ].map((nome, i, arr) => (
                <span key={nome}>
                  <strong className="text-[var(--color-text)]">{nome}</strong>
                  {i < arr.length - 1 ? " ·" : ""}
                </span>
              ))}
            </div>

            <p className="mt-4 text-sm text-[var(--color-text-tertiary)]">
              Obrigada por acreditarem nesse projeto.
            </p>
          </section>
        </article>
      </main>
    </>
  );
}
