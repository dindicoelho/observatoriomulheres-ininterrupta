import type { Metadata } from "next";
import Link from "next/link";

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
              recebe financiamento de nenhuma instituição.
            </p>

            <p className="text-base md:text-lg">
              A premissa:{" "}
              <strong>
                todo mundo já sabe que violência contra mulher é crime.
              </strong>{" "}
              Quase ninguém sabe o que a Câmara dos Deputados faz — ou
              deixa de fazer — sobre isso. Este site cruza dados da
              legislatura 2023-2026 pra mostrar quem propõe, quem vota,
              quem engaveta, quem protege e quem retrocede.
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
                  violência contra a mulher é um problema estrutural que
                  deve ser enfrentado com políticas públicas protetivas.
                </strong>{" "}
                Punitivismo (aumentar pena sem proteger mais) e retrocesso
                em direitos reprodutivos não são tratados como avanço.
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
                    ~21.000 proposições brutas
                  </strong>{" "}
                  da 57ª legislatura (2023-2026), filtradas por ~80
                  palavras-chave ligadas a direitos das mulheres. Após
                  filtro:{" "}
                  <strong className="text-[var(--color-text)]">
                    ~1.060 proposições protetivas e punitivistas
                  </strong>{" "}
                  + ~170 regressivas removidas do ranking.
                </li>
                <li>
                  <strong className="text-[var(--color-text)]">
                    389 deputados autores
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
                Buscamos na ementa de cada proposição ao menos uma de ~80
                expressões: violência contra a mulher, violência doméstica,
                violência sexual, Maria da Penha, feminicídio,
                transfeminicídio, aborto, assédio, violência política de
                gênero, saúde da mulher, mãe solo, mulher trans, mulher
                indígena, entre outras.
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
                    Removida do ranking e subtrai 2 pontos do score.
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
                − (votos SIM em regressivas × 7)]
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
                A penalidade por <strong>voto</strong> em proposição
                regressiva tem o mesmo peso da penalidade por{" "}
                <strong>autoria</strong> (−7 pontos). A penalidade por{" "}
                <strong>punitivismo</strong> é −2 pontos — menor que
                regressiva, mas não zero, porque punitivismo (aumento
                de pena, cadastros) não melhora proteção material.
              </p>
              <p className="text-base md:text-lg">
                Deputados filiados recentemente a partidos cuja bancada
                votou &gt;70% SIM no PDL 3/2025 (sustação do Conanda)
                recebem um <strong>selo informativo de filiação</strong>{" "}
                — sem desconto no score, apenas contexto factual sobre
                alinhamento partidário.
              </p>
              <p className="pl-6 font-mono-data text-sm">
                peso_sexo = 5 se mulher · 1,0 se homem
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
              <li>Filtra por ~80 palavras-chave</li>
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
                  O peso 2,5 pra mulheres é uma escolha.
                </strong>{" "}
                Existe pra compensar sub-representação. Nem todo leitor
                vai concordar.
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
              cultura, política e comportamento no Brasil.
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
        </article>
      </main>
    </>
  );
}
