import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Metodologia — Mapa da Violência contra a Mulher no Brasil",
  description:
    "Fontes, limitações e metodologia do observatório. Todos os dados são públicos e extraídos diretamente das APIs governamentais brasileiras.",
};

export default function MetodologiaPage() {
  return (
    <>
      <header className="border-b border-gray-200 bg-[var(--color-bg-alt)] px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/"
            className="font-mono-data text-xs uppercase tracking-widest text-[var(--color-text-tertiary)] hover:text-[var(--color-blood)]"
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
            Fontes, métodos e limitações dos dados apresentados neste
            observatório.
          </p>
        </div>
      </header>

      <main className="px-6 py-16">
        <article className="mx-auto max-w-3xl space-y-14 leading-relaxed text-[var(--color-text)]">
          {/* Sobre o projeto */}
          <section className="space-y-5">
            <h2
              className="text-3xl font-black text-[var(--color-text)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Sobre este projeto
            </h2>

            <p className="text-base md:text-lg">
              Este observatório foi criado por Dindi Coelho como parte da{" "}
              <strong>Ininterrupta</strong> (
              <a
                href="https://instagram.com/ininterrupta.sys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-blood)] hover:underline"
              >
                @ininterrupta.sys
              </a>
              ), uma publicação independente de inteligência cultural. O
              projeto não tem fins lucrativos e não recebe financiamento de
              nenhuma instituição pública ou privada.
            </p>

            <p className="text-base md:text-lg">
              Todos os dados apresentados aqui são públicos e foram
              extraídos diretamente de APIs governamentais brasileiras por
              meio do{" "}
              <a
                href="https://github.com/jxnxts/mcp-brasil"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-blood)] hover:underline"
              >
                mcp-brasil
              </a>
              , um servidor de protocolo aberto que conecta mais de 40
              fontes oficiais: Atlas da Violência (IPEA), DataJud (CNJ),
              Câmara dos Deputados, Senado Federal, Fórum Brasileiro de
              Segurança Pública, IBGE, Diários Oficiais de mais de 5.000
              municípios, entre outras.
            </p>

            <p className="text-base md:text-lg">
              Nenhum dado foi estimado, projetado ou modelado. Os números
              que aparecem nas visualizações são os mesmos que os órgãos
              públicos brasileiros disponibilizam em suas bases oficiais.
              As únicas transformações aplicadas são o cruzamento entre
              fontes, o cálculo de taxas per capita a partir de dados
              demográficos do IBGE e a classificação editorial das
              proposições legislativas. Todas essas transformações estão
              descritas abaixo.
            </p>

            <p className="text-base md:text-lg">
              O código do projeto é aberto. A metodologia completa está
              descrita a seguir.
            </p>
          </section>

          {/* Fontes de dados */}
          <section className="space-y-5">
            <h2
              className="text-3xl font-black text-[var(--color-text)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Fontes de dados
            </h2>

            {/* Atlas da Violência */}
            <div className="space-y-4">
              <h3
                className="text-xl font-bold text-[var(--color-text)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Atlas da Violência (IPEA/FBSP)
              </h3>
              <p className="text-base md:text-lg">
                O Atlas da Violência é mantido pelo Instituto de Pesquisa
                Econômica Aplicada em parceria com o Fórum Brasileiro de
                Segurança Pública. A base de dados primária é o Sistema de
                Informações sobre Mortalidade (SIM) do Ministério da Saúde,
                que registra todas as mortes ocorridas no país a partir de
                declarações de óbito emitidas por médicos.
              </p>
              <p className="text-base md:text-lg">
                Neste observatório utilizamos quatro séries temporais
                específicas do tema &ldquo;Violência por Gênero&rdquo;:
              </p>
              <ul className="ml-6 list-disc space-y-2 text-base text-[var(--color-text-secondary)] md:text-lg">
                <li>
                  <strong className="font-mono-data text-[var(--color-text)]">Série 40</strong>{" "}
                  — Homicídios de mulheres (total, 1989–2023), em números
                  absolutos, nos níveis país, estado e município.
                </li>
                <li>
                  <strong className="font-mono-data text-[var(--color-text)]">Série 142</strong>{" "}
                  — Homicídios de mulheres negras (1996–2023), números
                  absolutos.
                </li>
                <li>
                  <strong className="font-mono-data text-[var(--color-text)]">Série 143</strong>{" "}
                  — Homicídios de mulheres não negras (1996–2023), números
                  absolutos.
                </li>
                <li>
                  <strong className="font-mono-data text-[var(--color-text)]">Série 52</strong>{" "}
                  — Taxa de homicídios de mulheres por 100 mil, por unidade
                  da federação e município, 1980–2022.
                </li>
              </ul>
              <p className="text-base md:text-lg">
                A classificação de homicídios segue os códigos{" "}
                <strong>X85 a Y09</strong> da Classificação Internacional de
                Doenças (CID-10), que correspondem a mortes por agressão. A
                categoria &ldquo;mulheres negras&rdquo; agrega pessoas
                classificadas como pretas ou pardas nas declarações de
                óbito, seguindo a convenção do IBGE.
              </p>
            </div>

            {/* Câmara dos Deputados */}
            <div className="space-y-4 pt-6">
              <h3
                className="text-xl font-bold text-[var(--color-text)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Câmara dos Deputados
              </h3>
              <p className="text-base md:text-lg">
                Os dados legislativos vêm da{" "}
                <a
                  href="https://dadosabertos.camara.leg.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-blood)] hover:underline"
                >
                  API de Dados Abertos da Câmara dos Deputados
                </a>
                . Buscamos todas as proposições (PLs, PECs, PLPs, MSC, MPV,
                RCP, EMS e outras) apresentadas entre{" "}
                <strong>janeiro de 2019 e março de 2026</strong> contendo
                qualquer dos seguintes termos em ementa ou palavras-chave:
                &ldquo;feminicídio&rdquo;, &ldquo;violência contra
                mulher&rdquo;, &ldquo;Maria da Penha&rdquo; ou
                &ldquo;violência doméstica&rdquo;.
              </p>
              <p className="text-base md:text-lg">
                Para cada proposição coletamos: identificador, tipo
                (sigla), número, ano, ementa, data de apresentação, autoria
                principal (primeiro proponente), situação na tramitação e,
                quando disponível, resultado de votações nominais com o
                voto individual de cada parlamentar. O total da base é de
                1.007 proposições, das quais 805 foram apresentadas na
                legislatura atual (janeiro de 2023 a dezembro de 2026).
              </p>
              <p className="text-base md:text-lg">
                As proposições são classificadas editorialmente em três
                categorias:
              </p>
              <ul className="ml-6 list-disc space-y-2 text-base text-[var(--color-text-secondary)] md:text-lg">
                <li>
                  <strong style={{ color: "#6B6B64" }}>Simbólicas</strong>{" "}
                  — Criação de dias nacionais, homenagens, denominações,
                  campanhas de conscientização, inclusão em calendário
                  oficial.
                </li>
                <li>
                  <strong style={{ color: "#3B82D4" }}>Incrementais</strong>{" "}
                  — Alterações pontuais em leis existentes, ajustes em tipos
                  penais, mudanças procedimentais, aumentos de pena.
                </li>
                <li>
                  <strong style={{ color: "#1DB389" }}>Estruturais</strong>{" "}
                  — Criação de programas nacionais, fundos, políticas de
                  Estado, pensões, casas-abrigo, delegacias especializadas,
                  patrulhas Maria da Penha, monitoramento eletrônico,
                  botões do pânico, centros de referência.
                </li>
              </ul>
              <p className="text-base md:text-lg">
                A classificação é feita por análise automática das ementas
                com padrões regulares de correspondência. Por exemplo,
                qualquer ementa contendo &ldquo;institui o dia&rdquo; ou
                &ldquo;inclui no calendário&rdquo; é classificada como
                simbólica; &ldquo;cria o programa nacional&rdquo; ou
                &ldquo;institui o fundo&rdquo; é estrutural; demais são
                incrementais. Essa classificação é editorial e pode
                conter aproximações — o contexto completo de cada
                proposição não é considerado.
              </p>
            </div>

            {/* Votações */}
            <div className="space-y-4 pt-6">
              <h3
                className="text-xl font-bold text-[var(--color-text)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Votações nominais
              </h3>
              <p className="text-base md:text-lg">
                Para cada proposição, buscamos as votações registradas no
                endpoint{" "}
                <code className="font-mono-data text-sm">
                  /proposicoes/&#123;id&#125;/votacoes
                </code>
                . Filtramos as votações com placar registrado (Sim + Não
                &gt; 50 votantes) para destacar apenas votações
                contestadas. Para cada uma, coletamos os votos individuais
                e agregamos por partido no endpoint{" "}
                <code className="font-mono-data text-sm">
                  /votacoes/&#123;id&#125;/votos
                </code>
                .
              </p>
              <p className="text-base md:text-lg">
                As votações são classificadas em{" "}
                <strong>&ldquo;de mérito&rdquo;</strong> (quando decidem o
                conteúdo substantivo da proposta — por exemplo, &ldquo;
                Mantido o texto&rdquo;, &ldquo;Aprovada a Medida
                Provisória&rdquo;) ou{" "}
                <strong>&ldquo;procedurais&rdquo;</strong> (quando decidem
                aspectos do rito — &ldquo;Rejeitado o Requerimento&rdquo;,
                &ldquo;Rejeitada a Preferência&rdquo;, &ldquo;Rejeitado o
                Recurso&rdquo;). Essa distinção é editorial e está explícita
                em cada card, com descrição do que cada tipo de votação
                significa na prática.
              </p>
              <p className="text-base md:text-lg">
                O recorte temporal das votações apresentadas é{" "}
                <strong>2023–2026</strong> (legislatura atual). A
                interpretação de &ldquo;votar SIM&rdquo; e &ldquo;votar
                NÃO&rdquo; é escrita manualmente para cada votação, com
                base na ementa da PL, no descritivo da votação e no tipo
                regimental. O objetivo é traduzir o jargão parlamentar
                em linguagem acessível, mantendo fidelidade ao conteúdo
                votado.
              </p>
            </div>

            {/* IBGE */}
            <div className="space-y-4 pt-6">
              <h3
                className="text-xl font-bold text-[var(--color-text)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                IBGE
              </h3>
              <p className="text-base md:text-lg">
                Os dados demográficos do IBGE são usados para calcular as
                taxas per capita que aparecem no observatório. Três fontes
                específicas:
              </p>
              <ul className="ml-6 list-disc space-y-2 text-base text-[var(--color-text-secondary)] md:text-lg">
                <li>
                  <strong className="text-[var(--color-text)]">
                    Estimativas populacionais anuais
                  </strong>{" "}
                  (tabela 6579 do SIDRA) — população total do Brasil e por
                  unidade da federação, de 2001 a 2024.
                </li>
                <li>
                  <strong className="text-[var(--color-text)]">Censo 2022</strong>{" "}
                  — população por município (5.570 municípios), usada
                  para calcular a taxa municipal.
                </li>
                <li>
                  <strong className="text-[var(--color-text)]">PNAD Contínua</strong>{" "}
                  — proporção de pessoas autodeclaradas pretas ou pardas
                  na população brasileira ano a ano, de 2012 a 2023. Para
                  anos anteriores (2001–2011), utilizamos interpolação
                  linear entre o Censo 2000 e os dados da PNAD.
                </li>
              </ul>
              <p className="text-base md:text-lg">
                Quando apresentamos &ldquo;taxa de homicídios por 100 mil
                mulheres&rdquo;, o numerador vem do Atlas da Violência e
                o denominador vem do IBGE (população do mesmo ano e
                recorte geográfico, aplicando a proporção feminina
                nacional de 51,3%).
              </p>
            </div>

            {/* FBSP Anuário */}
            <div className="space-y-4 pt-6">
              <h3
                className="text-xl font-bold text-[var(--color-text)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Fórum Brasileiro de Segurança Pública
              </h3>
              <p className="text-base md:text-lg">
                O FBSP mantém um repositório público com mais de 236
                publicações sobre segurança pública no Brasil. Neste
                observatório utilizamos especificamente o{" "}
                <strong>18º Anuário Brasileiro de Segurança Pública (2024)</strong>{" "}
                como fonte primária dos dados sobre rede de proteção
                institucional: número de Delegacias Especializadas de
                Atendimento à Mulher (DEAMs), Centros de Referência da
                Mulher (CRAMs) e Casas-Abrigo por unidade da federação,
                com data de referência 31 de dezembro de 2023.
              </p>
              <p className="text-base md:text-lg">
                Publicações temáticas do FBSP (como o &ldquo;Retrato dos
                feminicídios no Brasil&rdquo; e relatórios sobre a
                pandemia) são usadas para contextualização editorial. Os
                dados quantitativos das visualizações vêm do Atlas da
                Violência e das APIs governamentais — não dos relatórios
                do FBSP.
              </p>
            </div>

            {/* Ministério das Mulheres */}
            <div className="space-y-4 pt-6">
              <h3
                className="text-xl font-bold text-[var(--color-text)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Ministério das Mulheres
              </h3>
              <p className="text-base md:text-lg">
                O Ministério das Mulheres mantém o diretório oficial do
                Ligue 180 com os equipamentos públicos de atendimento à
                mulher. Esse material é citado no observatório como
                referência para que a pessoa que consulta sua cidade
                possa verificar individualmente a existência de
                equipamentos locais. O observatório não armazena cópia
                desse diretório nem o substitui como fonte de consulta
                prática.
              </p>
            </div>

            {/* Fontes previstas */}
            <div className="space-y-4 pt-6">
              <h3
                className="text-xl font-bold text-[var(--color-text)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Fontes integradas parcialmente ou previstas
              </h3>
              <p className="text-base md:text-lg">
                Três fontes de dados estão disponíveis no{" "}
                <em>mcp-brasil</em> mas ainda não são usadas de forma
                quantitativa no observatório:
              </p>
              <ul className="ml-6 list-disc space-y-2 text-base text-[var(--color-text-secondary)] md:text-lg">
                <li>
                  <strong className="text-[var(--color-text)]">DataJud (CNJ)</strong>{" "}
                  — dados de Medidas Protetivas de Urgência (MPU) da Lei
                  Maria da Penha e da Lei Henry Borel. Serão integrados
                  numa próxima seção do observatório sobre o
                  escalonamento da violência (denúncia → medida protetiva
                  → descumprimento → feminicídio).
                </li>
                <li>
                  <strong className="text-[var(--color-text)]">
                    Querido Diário (Open Knowledge Brasil)
                  </strong>{" "}
                  — indexação de diários oficiais de mais de 5.000
                  municípios. Útil para mapear ações municipais (criação
                  de DEAMs, casas-abrigo, coordenadorias) via
                  palavras-chave em texto completo. Previsto para
                  enriquecer a busca municipal.
                </li>
                <li>
                  <strong className="text-[var(--color-text)]">
                    SINESP/Ministério da Justiça
                  </strong>{" "}
                  — datasets complementares sobre ocorrências criminais.
                  Uso futuro como fonte secundária quando a cobertura do
                  Atlas apresentar defasagem temporal.
                </li>
                <li>
                  <strong className="text-[var(--color-text)]">Senado Federal</strong>{" "}
                  — o observatório até o momento rastreia apenas
                  proposições da Câmara dos Deputados. A integração com
                  o Senado está prevista para mostrar o caminho
                  completo de tramitação de cada proposta.
                </li>
              </ul>
            </div>
          </section>

          {/* Metodologia */}
          <section className="space-y-5">
            <h2
              className="text-3xl font-black text-[var(--color-text)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Metodologia
            </h2>

            <div className="space-y-4">
              <h3
                className="text-xl font-bold text-[var(--color-text)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Cálculo de taxas
              </h3>
              <p className="text-base md:text-lg">
                Todas as taxas apresentadas seguem a fórmula padrão:{" "}
                <strong>
                  (número de ocorrências ÷ população do recorte) × 100.000
                </strong>
                . A população utilizada é a estimativa mais recente do
                IBGE para o mesmo ano e nível geográfico do numerador.
                Quando a estimativa do IBGE não está disponível para um
                ano específico (por exemplo, anos entre censos),
                utilizamos interpolação linear entre os dois pontos mais
                próximos.
              </p>
              <p className="text-base md:text-lg">
                Para calcular a taxa de homicídios de{" "}
                <strong>mulheres negras</strong>, dividimos o número de
                homicídios de mulheres negras (série 142) pela população
                feminina negra estimada (população total × 51,3% mulheres
                × proporção de pretas e pardas naquele ano, conforme
                PNAD Contínua). Idem para mulheres não negras.
              </p>
              <p className="text-base md:text-lg">
                Na busca municipal, a taxa de 2023 é calculada com a
                população do Censo 2022 (o Censo 2022 tem dados por
                município, mas a proporção feminina é estimada pela
                média nacional de 51,3% — o IBGE não publica proporção
                por sexo para todos os 5.570 municípios individualmente).
              </p>
            </div>

            <div className="space-y-4 pt-4">
              <h3
                className="text-xl font-bold text-[var(--color-text)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Recorte racial
              </h3>
              <p className="text-base md:text-lg">
                A classificação racial segue o padrão do IBGE:{" "}
                <strong>&ldquo;negras&rdquo;</strong> agrega as categorias
                <strong> pretas e pardas</strong>;{" "}
                <strong>&ldquo;não negras&rdquo;</strong> agrega{" "}
                <strong>brancas, amarelas e indígenas</strong>. Essa
                agregação é a mesma adotada pelo Atlas da Violência e
                pelo FBSP.
              </p>
              <p className="text-base md:text-lg">
                A classificação racial nos dados de homicídio provém das
                declarações de óbito preenchidas por profissionais de
                saúde (médicos que atestam o óbito). Isso está sujeito a
                <strong> heteroidentificação</strong> — é o profissional
                de saúde, e não a pessoa morta, quem classifica a raça —
                o que é uma limitação conhecida da base. Em geral, a
                heteroidentificação tende a subnotificar pessoas negras
                de pele mais clara (classificadas como brancas), o que
                pode fazer com que a desigualdade racial mostrada seja
                inferior à real.
              </p>
            </div>

            <div className="space-y-4 pt-4">
              <h3
                className="text-xl font-bold text-[var(--color-text)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Recorte temporal
              </h3>
              <p className="text-base md:text-lg">
                As séries temporais raciais (142 e 143) começam em 1996,
                mas o ano de 1996 registra apenas 24 mulheres negras
                assassinadas em todo o país — um número implausivelmente
                baixo que indica{" "}
                <strong>subnotificação massiva de raça</strong> nos
                primeiros anos do registro. Os anos 1997–2000 apresentam
                crescimento artificial à medida que o preenchimento do
                campo &ldquo;cor ou raça&rdquo; nas declarações de óbito
                se consolida.
              </p>
              <p className="text-base md:text-lg">
                Por isso, a narrativa principal do observatório utiliza
                o corte <strong>2001 em diante</strong>, quando a
                classificação racial se tornou consistente o suficiente
                para comparações válidas. Dados de 1989–2000 ainda são
                apresentados no modo de números absolutos totais (série
                40), pois essa série não depende de classificação racial.
              </p>
            </div>

            <div className="space-y-4 pt-4">
              <h3
                className="text-xl font-bold text-[var(--color-text)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Limitações dos dados
              </h3>
              <p className="text-base md:text-lg">
                A <strong>subnotificação</strong> é o principal problema
                estrutural. Os números apresentados representam o{" "}
                <strong>piso</strong> da violência real, nunca o teto.
                Feminicídios podem ser registrados como suicídios,
                acidentes, mortes por causa indeterminada ou outros
                códigos CID que mascaram a natureza violenta.
              </p>
              <p className="text-base md:text-lg">
                O FBSP estima que as <strong>Mortes Violentas por
                Causa Indeterminada (MVCI)</strong> podem conter uma
                parcela relevante de homicídios não classificados
                corretamente. O Atlas da Violência inclui uma série
                específica para MVCI, mas este observatório{" "}
                <strong>não redistribui</strong> esses óbitos entre as
                categorias de homicídio — apresentamos apenas os
                registros com classificação clara.
              </p>
              <p className="text-base md:text-lg">
                Outra limitação importante é a <strong>defasagem
                temporal</strong>. Os dados do SIM/Ministério da Saúde,
                que alimentam o Atlas, levam de 1 a 2 anos para
                consolidação após o fim do ano de referência. O dado
                mais recente disponível em abril de 2026 é referente ao
                ano de 2023.
              </p>
              <p className="text-base md:text-lg">
                Na busca municipal, municípios pequenos frequentemente
                apresentam dados incompletos — zero homicídios no Atlas
                pode significar ausência real de ocorrências ou apenas
                subnotificação local. Esse aviso aparece explicitamente
                em cada consulta que retorna zero.
              </p>
            </div>

            <div className="space-y-4 pt-4">
              <h3
                className="text-xl font-bold text-[var(--color-text)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Correlações e exceções
              </h3>
              <p className="text-base md:text-lg">
                A correlação entre rede de proteção institucional (DEAMs
                + CRAMs + Casas-Abrigo per capita) e taxa de homicídios
                de mulheres apresentada no observatório é baseada em{" "}
                <strong>comparação por clusters</strong> (top 3 vs
                bottom 3 em cobertura), não em regressão linear pura. A
                correlação de Pearson direta é fraca porque o efeito
                &ldquo;rede&rdquo; é confundido por outros fatores
                estruturais (rotas de tráfico, desigualdade, presença
                de facções criminosas).
              </p>
              <p className="text-base md:text-lg">
                A exceção mais importante é o <strong>Ceará</strong>,
                que possui rede de proteção razoável mas taxa de
                homicídios alta devido à disputa territorial entre
                facções nas últimas décadas. Esse e outros casos estão
                mencionados na narrativa. A correlação não deve ser
                lida como causal sem considerar o contexto local.
              </p>
            </div>

            <div className="space-y-4 pt-4">
              <h3
                className="text-xl font-bold text-[var(--color-text)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Atualização
              </h3>
              <p className="text-base md:text-lg">
                Os dados históricos (Atlas da Violência até 2023, séries
                encerradas) são coletados uma vez e permanecem estáveis.
                Os dados dinâmicos (proposições legislativas, votações)
                podem ser atualizados periodicamente via consulta
                automática às APIs governamentais pelo{" "}
                <em>mcp-brasil</em>. A última atualização de cada
                conjunto aparece no rodapé das seções correspondentes.
              </p>
            </div>

            <div className="space-y-4 pt-4">
              <h3
                className="text-xl font-bold text-[var(--color-text)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Infraestrutura técnica
              </h3>
              <p className="text-base md:text-lg">
                O{" "}
                <a
                  href="https://github.com/jxnxts/mcp-brasil"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-blood)] hover:underline"
                >
                  mcp-brasil
                </a>{" "}
                é um servidor de Model Context Protocol que conecta mais
                de 40 APIs de dados públicos brasileiros em uma
                interface unificada. As APIs incluem fontes do IPEA,
                CNJ, Câmara dos Deputados, Senado, IBGE, INPE, ANA,
                FBSP, Querido Diário, Portal da Transparência, TSE e
                Tribunais de Contas estaduais. Todas as consultas são
                feitas diretamente aos endpoints oficiais dos órgãos
                públicos. O mcp-brasil funciona como uma camada de
                acesso e <strong>não armazena dados</strong>.
              </p>
              <p className="text-base md:text-lg">
                O site em si é gerado estaticamente (Next.js com geração
                estática no build), hospedado gratuitamente na Vercel.
                As visualizações interativas usam D3.js e React. Nenhum
                dado pessoal é coletado de quem visita o site — não há
                cookies de rastreamento, pixels de redes sociais ou
                formulários de coleta.
              </p>
            </div>
          </section>

          {/* Closing */}
          <section className="border-t border-gray-200 pt-10">
            <p className="text-sm text-[var(--color-text-secondary)]">
              <strong className="text-[var(--color-text)]">Ininterrupta</strong>{" "}
              é uma publicação brasileira de inteligência cultural.
              <br />
              <a
                href="https://ininterrupta.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-blood)] hover:underline"
              >
                ininterrupta.com
              </a>{" "}
              ·{" "}
              <a
                href="https://instagram.com/ininterrupta.sys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-blood)] hover:underline"
              >
                @ininterrupta.sys
              </a>
            </p>
          </section>
        </article>
      </main>
    </>
  );
}
