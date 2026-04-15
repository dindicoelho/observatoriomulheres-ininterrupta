import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Metodologia — Observatório Político da Violência contra a Mulher",
  description:
    "Fontes, métodos e limitações do observatório político. Todos os dados são públicos, extraídos diretamente das APIs da Câmara dos Deputados e do Atlas da Violência.",
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
            Como este observatório foi construído, de onde vêm os dados
            políticos, o que foi classificado editorialmente e quais são
            as limitações.
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
              Sobre este observatório
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
              projeto não tem fins lucrativos e não recebe financiamento
              de nenhuma instituição pública ou privada.
            </p>

            <p className="text-base md:text-lg">
              A premissa é simples:{" "}
              <strong>
                os números da violência contra a mulher no Brasil já são
                conhecidos.
              </strong>{" "}
              O que quase ninguém mostra é a camada política que decide o
              que fazer com esses números — quem propõe leis sobre o tema,
              quem vota a favor, quem vota contra, quem engaveta e quem
              realmente transforma proposta em lei. Este observatório
              cruza seis anos de dados da Câmara dos Deputados com a
              composição demográfica do parlamento para revelar essa
              camada.
            </p>

            <p className="text-base md:text-lg">
              Os dados vêm diretamente das APIs de Dados Abertos da
              Câmara, intermediadas pelo{" "}
              <a
                href="https://github.com/jxnxts/mcp-brasil"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-blood)] hover:underline"
              >
                mcp-brasil
              </a>
              , um servidor aberto de protocolo que conecta APIs públicas
              brasileiras em uma interface unificada. Nenhum dado foi
              modelado, estimado ou projetado — os números aparecem no
              observatório como estão publicados pelos órgãos públicos.
            </p>

            <p className="text-base md:text-lg">
              Apenas três camadas de trabalho editorial foram aplicadas:
              a <strong>classificação</strong> das proposições em
              simbólicas, incrementais e estruturais; a{" "}
              <strong>interpretação</strong> do que significa votar SIM ou
              NÃO em cada votação nominal; e a{" "}
              <strong>agregação</strong> de métricas por gênero (autoria,
              relatoria, votos). Tudo isso está detalhado abaixo.
            </p>
          </section>

          {/* Fontes */}
          <section className="space-y-5">
            <h2
              className="text-3xl font-black text-[var(--color-text)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Fontes de dados
            </h2>

            {/* Câmara */}
            <div className="space-y-4">
              <h3
                className="text-xl font-bold text-[var(--color-text)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Câmara dos Deputados
              </h3>
              <p className="text-base md:text-lg">
                A{" "}
                <a
                  href="https://dadosabertos.camara.leg.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-blood)] hover:underline"
                >
                  API de Dados Abertos da Câmara
                </a>{" "}
                é a fonte primária do observatório. Dela vêm:
              </p>
              <ul className="ml-6 list-disc space-y-2 text-base text-[var(--color-text-secondary)] md:text-lg">
                <li>
                  <strong className="text-[var(--color-text)]">
                    1.007 proposições
                  </strong>{" "}
                  apresentadas entre janeiro de 2019 e março de 2026
                  contendo as palavras-chave &ldquo;feminicídio&rdquo;,
                  &ldquo;violência contra mulher&rdquo;, &ldquo;Maria da
                  Penha&rdquo; ou &ldquo;violência doméstica&rdquo; em
                  ementa. Para cada PL: identificador, tipo, número, ano,
                  ementa, data de apresentação, autoria principal e
                  status atual de tramitação.
                </li>
                <li>
                  <strong className="text-[var(--color-text)]">
                    447 deputados autores
                  </strong>{" "}
                  (285 na atual legislatura) das PLs acima, com dados
                  completos: nome, partido, UF, foto, situação e sexo.
                </li>
                <li>
                  <strong className="text-[var(--color-text)]">
                    17 votações nominais contestadas
                  </strong>{" "}
                  (com mais de 50 votantes registrados) em plenário
                  entre 2023 e 2026 sobre essas proposições. Para cada
                  votação: descrição, placar, voto individual de cada
                  parlamentar e tramitação associada.
                </li>
                <li>
                  <strong className="text-[var(--color-text)]">
                    Tramitações completas
                  </strong>{" "}
                  das 568 PLs apresentadas de 2023 em diante. Nesses
                  dados identificamos: data de designação de relator,
                  nome do relator, apresentação de pareceres e situação
                  atual.
                </li>
              </ul>
            </div>

            {/* IBGE e contexto */}
            <div className="space-y-4 pt-6">
              <h3
                className="text-xl font-bold text-[var(--color-text)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                IBGE e composição do Congresso
              </h3>
              <p className="text-base md:text-lg">
                Para contextualizar proporções de gênero, utilizamos:
              </p>
              <ul className="ml-6 list-disc space-y-2 text-base text-[var(--color-text-secondary)] md:text-lg">
                <li>
                  <strong className="text-[var(--color-text)]">
                    Composição da Câmara 57ª legislatura
                  </strong>{" "}
                  (2023–2026): 513 deputados, dos quais 91 são mulheres
                  (17,7%). Fonte: Secretaria da Mulher da Câmara dos
                  Deputados.
                </li>
                <li>
                  <strong className="text-[var(--color-text)]">
                    IBGE — Estimativas populacionais
                  </strong>{" "}
                  e <strong className="text-[var(--color-text)]">Censo 2022</strong>{" "}
                  para dados populacionais usados na busca municipal.
                </li>
              </ul>
            </div>

            {/* Atlas (agora secundário) */}
            <div className="space-y-4 pt-6">
              <h3
                className="text-xl font-bold text-[var(--color-text)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Atlas da Violência (IPEA/FBSP)
              </h3>
              <p className="text-base md:text-lg">
                Usado como fonte contextual. O número do Hero
                (3.903 mulheres assassinadas em 2023) vem da série 40 do
                Atlas, que por sua vez se alimenta do Sistema de
                Informações sobre Mortalidade (SIM) do Ministério da
                Saúde. O Atlas também é citado na busca municipal
                (Ato 04) para a taxa de homicídios por 100 mil mulheres
                de cada cidade.
              </p>
              <p className="text-base md:text-lg">
                O observatório{" "}
                <strong>não discute a demografia da violência</strong>{" "}
                (raça, geografia, escalonamento) porque esses dados já são
                amplamente conhecidos e cobertos em outros lugares. O
                foco aqui é o gap entre o problema e a resposta política.
              </p>
            </div>
          </section>

          {/* Metodologia */}
          <section className="space-y-5">
            <h2
              className="text-3xl font-black text-[var(--color-text)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Métodos
            </h2>

            <div className="space-y-4">
              <h3
                className="text-xl font-bold text-[var(--color-text)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Classificação das proposições
              </h3>
              <p className="text-base md:text-lg">
                As 1.007 proposições foram classificadas editorialmente
                em três categorias:
              </p>
              <ul className="ml-6 list-disc space-y-2 text-base text-[var(--color-text-secondary)] md:text-lg">
                <li>
                  <strong style={{ color: "#6B6B64" }}>Simbólicas</strong>{" "}
                  — Criação de dias nacionais, homenagens, denominações
                  de prédios e pontes, inclusão em calendário oficial,
                  campanhas de conscientização.
                </li>
                <li>
                  <strong style={{ color: "#3B82D4" }}>Incrementais</strong>{" "}
                  — Alterações pontuais em leis existentes (principalmente
                  na Lei Maria da Penha), ajustes em tipos penais,
                  aumentos de pena, mudanças procedimentais.
                </li>
                <li>
                  <strong style={{ color: "#1DB389" }}>Estruturais</strong>{" "}
                  — Criação de programas nacionais, fundos, políticas de
                  Estado, pensões, casas-abrigo, delegacias
                  especializadas, patrulhas Maria da Penha, monitoramento
                  eletrônico obrigatório, centros de referência.
                </li>
              </ul>
              <p className="text-base md:text-lg">
                A classificação é automática, por correspondência de
                padrões regulares sobre a ementa de cada PL. Palavras
                como &ldquo;institui o dia&rdquo; ou &ldquo;inclui no
                calendário&rdquo; disparam simbólica; &ldquo;cria o
                programa nacional&rdquo; ou &ldquo;institui o fundo&rdquo;
                disparam estrutural; as demais caem em incremental. É um
                trabalho de filtro, não de análise jurídica — o contexto
                completo de cada proposição não é considerado.
              </p>
            </div>

            <div className="space-y-4 pt-4">
              <h3
                className="text-xl font-bold text-[var(--color-text)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Interpretação das votações
              </h3>
              <p className="text-base md:text-lg">
                Para cada uma das 17 votações nominais apresentadas,
                escrevemos manualmente:
              </p>
              <ul className="ml-6 list-disc space-y-2 text-base text-[var(--color-text-secondary)] md:text-lg">
                <li>
                  Um parágrafo explicando <strong>o projeto de lei</strong>{" "}
                  em linguagem acessível.
                </li>
                <li>
                  Uma frase sobre{" "}
                  <strong>o que exatamente foi votado</strong> (se é o
                  texto original, um destaque, um recurso ou um
                  requerimento).
                </li>
                <li>
                  Uma frase sobre{" "}
                  <strong>o resultado e suas consequências</strong>.
                </li>
                <li>
                  Duas frases interpretando{" "}
                  <strong>o que significa votar SIM</strong> e{" "}
                  <strong>o que significa votar NÃO</strong>.
                </li>
              </ul>
              <p className="text-base md:text-lg">
                Cada votação também é classificada em{" "}
                <strong>mérito</strong> (quando decide conteúdo
                substantivo) ou <strong>procedural</strong> (quando
                decide rito: destaques, requerimentos, recursos). Essa
                distinção aparece como selo em cada card.
              </p>
            </div>

            <div className="space-y-4 pt-4">
              <h3
                className="text-xl font-bold text-[var(--color-text)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Índice de coerência por deputado
              </h3>
              <p className="text-base md:text-lg">
                Apenas as 4 votações classificadas como <strong>de mérito</strong>{" "}
                são usadas no cálculo do índice de coerência. Para cada
                deputado que participou de ao menos uma dessas 4
                votações, calculamos:
              </p>
              <p className="pl-6 font-mono-data text-sm text-[var(--color-text)]">
                score = (votos SIM ÷ participações) × 100
              </p>
              <p className="text-base md:text-lg">
                Nas 4 votações de mérito analisadas, votar SIM equivale a
                apoiar a ampliação de proteção às mulheres (inclusão da
                violência vicária na Maria da Penha, política nacional
                de assistência jurídica, monitoramento eletrônico
                obrigatório, criminalização do descumprimento de medida
                protetiva mesmo com consentimento). Essa equivalência{" "}
                <strong>é uma escolha editorial</strong> — um leitor pode
                discordar do sentido de alguma das votações. O índice
                deve ser lido como amostra, não como juízo final.
              </p>
              <p className="text-base md:text-lg">
                Para ser incluído na listagem &ldquo;100% pró-proteção&rdquo;,
                o deputado precisa ter votado SIM em pelo menos 3 das 4
                votações, sem nenhuma recusa. O critério de 3 mínimo
                evita distorções por participações pontuais.
              </p>
            </div>

            <div className="space-y-4 pt-4">
              <h3
                className="text-xl font-bold text-[var(--color-text)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Agregação por gênero
              </h3>
              <p className="text-base md:text-lg">
                Para cada um dos 447 deputados autores e dos ~535
                deputados que participaram de alguma votação,
                consultamos a API{" "}
                <code className="font-mono-data text-sm">/deputados/&#123;id&#125;</code>{" "}
                para obter o campo <strong>sexo</strong> (M ou F). Esse
                dado vem declarado pela própria Casa no registro de cada
                parlamentar. Cruzamos com as métricas de autoria,
                relatoria e votação para gerar os contrastes que
                aparecem no site: 17% da composição vs 41% da autoria,
                79% das relatorias, 2,1× de produtividade per capita.
              </p>
            </div>

            <div className="space-y-4 pt-4">
              <h3
                className="text-xl font-bold text-[var(--color-text)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Identificação de relatores
              </h3>
              <p className="text-base md:text-lg">
                Para cada uma das 568 PLs da atual legislatura,
                buscamos todas as tramitações registradas e extraímos
                eventos cujo despacho começa com &ldquo;Designad[o|a]
                Relator&rdquo;. O nome do relator e seu partido/UF são
                parseados por expressão regular. Em seguida, cruzamos
                com a base de deputados para identificar o sexo.
              </p>
              <p className="text-base md:text-lg">
                Foram identificadas{" "}
                <strong>537 designações de relatoria em 314 PLs</strong>{" "}
                (algumas PLs passam por múltiplas comissões, então têm
                relatores diferentes em cada uma). As demais 254 PLs
                ainda não tinham relator designado quando os dados foram
                coletados.
              </p>
            </div>

            <div className="space-y-4 pt-4">
              <h3
                className="text-xl font-bold text-[var(--color-text)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Taxa de aprovação
              </h3>
              <p className="text-base md:text-lg">
                Para cada PL da atual legislatura, consultamos o campo{" "}
                <code className="font-mono-data text-sm">
                  statusProposicao.descricaoSituacao
                </code>
                . Categorizamos em 6 destinos: (1) transformou-se em lei;
                (2) aprovada na Câmara, tramitando no Senado; (3) pronta
                para pauta; (4) em tramitação com relator ou parecer;
                (5) aguardando relator; (6) arquivada, retirada ou
                devolvida. A categorização é feita por correspondência de
                padrões sobre a descrição da situação.
              </p>
            </div>
          </section>

          {/* Limitações */}
          <section className="space-y-5">
            <h2
              className="text-3xl font-black text-[var(--color-text)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Limitações
            </h2>

            <ul className="ml-6 list-disc space-y-3 text-base text-[var(--color-text-secondary)] md:text-lg">
              <li>
                <strong className="text-[var(--color-text)]">
                  O observatório cobre apenas a Câmara dos Deputados.
                </strong>{" "}
                Proposições que nasceram no Senado ou medidas provisórias
                só aparecem se também tramitaram na Câmara. A integração
                com o Senado está prevista para versão futura.
              </li>
              <li>
                <strong className="text-[var(--color-text)]">
                  A classificação das PLs é automática.
                </strong>{" "}
                Uma proposta pode cair em &ldquo;incremental&rdquo;
                quando, no contexto mais amplo, teria efeitos estruturais
                — ou o contrário. A classificação deve ser lida como
                filtro agregado, não como juízo sobre cada PL
                individualmente.
              </li>
              <li>
                <strong className="text-[var(--color-text)]">
                  A interpretação SIM/NÃO é editorial.
                </strong>{" "}
                Nas votações de &ldquo;Mantido o texto&rdquo;, um voto
                NÃO pode significar tanto &ldquo;quero enfraquecer
                proteção&rdquo; quanto &ldquo;quero uma proteção ainda
                mais forte que foi rejeitada&rdquo;. Onde essa ambiguidade
                existe, ela é mencionada explicitamente no card da
                votação.
              </li>
              <li>
                <strong className="text-[var(--color-text)]">
                  O índice de coerência não cobre todo o histórico
                  parlamentar
                </strong>
                . São apenas 4 votações, escolhidas por serem as mais
                contestadas em plenário sobre o tema na atual
                legislatura. Um deputado pode ter votado consistentemente
                em comissões (dados não exibidos aqui) de forma
                diferente do que aparece em plenário.
              </li>
              <li>
                <strong className="text-[var(--color-text)]">
                  Binariedade de gênero.
                </strong>{" "}
                A API da Câmara registra sexo apenas como M ou F. Não há
                dado sobre identidade de gênero auto-declarada. O
                observatório herda essa limitação.
              </li>
              <li>
                <strong className="text-[var(--color-text)]">
                  Relatorias invisíveis.
                </strong>{" "}
                PLs apensadas a outras ou que tramitam em conjunto podem
                ter relatoria que não aparece diretamente nos dados de
                tramitação da PL original. O número de relatorias
                identificadas é um piso, não um teto.
              </li>
              <li>
                <strong className="text-[var(--color-text)]">
                  Subnotificação do Atlas.
                </strong>{" "}
                O número do Hero (3.903) é o piso reconhecido por IPEA e
                FBSP. Mortes violentas por causa indeterminada e casos
                classificados erroneamente como suicídio ou acidente
                podem conter feminicídios que não aparecem aqui.
              </li>
            </ul>
          </section>

          {/* Atualização */}
          <section className="space-y-5">
            <h2
              className="text-3xl font-black text-[var(--color-text)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Atualização e infraestrutura
            </h2>

            <p className="text-base md:text-lg">
              Os dados legislativos (proposições, votações, relatorias,
              status) podem ser atualizados diariamente via nova consulta
              às APIs. Os dados demográficos e do Atlas da Violência são
              estáticos e refletem a última publicação oficial. A data
              da última coleta aparece no rodapé de cada seção quando
              relevante.
            </p>

            <p className="text-base md:text-lg">
              O site é gerado estaticamente (Next.js com SSG), hospedado
              gratuitamente na Vercel. As visualizações usam D3.js e
              React. Nenhum dado pessoal é coletado de quem visita —
              não há cookies de rastreamento, pixels de redes sociais ou
              formulários de coleta. O código é aberto.
            </p>
          </section>

          {/* Assinatura */}
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
