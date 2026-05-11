# Mudamos o score do Observatório. Eis por quê.

Até esta semana, a deputada Silvye Alves (UNIÃO/GO) aparecia em **#7** no nosso ranking de "quem está fazendo algo" pela mulher na Câmara. Vinte e duas proposições no tema, quatro estruturais, relatora de uma PL sobre violência vicária. Por trás, no entanto, havia uma decisão que o ranking nunca enxergou: ela votou **SIM no PDL 3/2025**, o decreto legislativo que sustou a resolução do Conanda sobre atendimento de crianças vítimas de violência sexual — incluindo o acesso ao aborto legal.

Esse era o paradoxo metodológico. O score penalizava **autoria** de PL regressiva, mas era cego para **voto** em pauta regressiva. Como se assinar e votar fossem coisas diferentes em política — não são. Aprovação se conta no plenário.

A partir desta atualização, **voto SIM em pauta regressiva pesa igual a autoria**.

## A fórmula nova

```
score = [(estruturais × 3) + (incrementais × 1) + (simbólicas × 1)
       − (punitivistas × 2)
       − (PLs regressivas × 7)
       − (votos SIM em regressivas × 5)] × ficha_limpa
```

Onde `ficha_limpa = 1,5` se a deputada tem zero punitivistas, zero regressivas e zero votos regressivos. Caso contrário, `1,0`.

A primeira PL no escopo da penalidade por voto é o **PDL 3/2025 (Conanda)**, aprovado em 5 de novembro de 2025 pelo placar 317×111. Cento e noventa e nove deputados em exercício votaram SIM nesse decreto, e portanto recebem o desconto de −5 pontos no score. Outras votações podem ser adicionadas à lista no futuro, sempre com curadoria editorial explícita — cada entrada da lista vive em [`scripts/regressive_votes_seed.json`](../scripts/regressive_votes_seed.json) com justificativa publicada.

O peso da penalidade por voto (−5) é menor que o da penalidade por autoria de PL regressiva (−7) — reconhecendo que propor uma PL é um ato político mais ativo que acompanhar uma votação. Mas é maior que o peso por punitivismo de autoria (−2), porque voto é responsabilidade direta pela aprovação da pauta.

## Quem desceu

Quatro nomes que estavam na vitrine do ranking saem da vista:

| Deputada | Antes | Depois | Voto SIM em PDL 3/2025 |
|---|---|---|---|
| Silvye Alves (UNIÃO/GO) | #7 | #57 | sim |
| Duda Ramos (PODE/RR) | #5 | #49 | sim |
| Fred Linhares (REPUBLICANOS/DF) | #20 | #83 | sim |
| Rogéria Santos (REPUBLICANOS/BA) | #17 | #97 | sim |

No mapa por estado, **Silvye Alves** sai do top 3 de Goiás (Delegada Adriana Accorsi sobe para o topo). **Rogéria Santos** sai do top 3 da Bahia. As outras nomes baianas ocupam a frente — Alice Portugal e Ivoneide Caetano, ambas com ficha protetiva, sem voto regressivo.

## Por que o peso_sexo virou condicional

Outra mudança neste patch toca o mapa por estado. O `peso_sexo × 5` — multiplicador editorial que compensa o fato de mulheres serem 17% da Câmara mas responderem por quase metade das PLs sobre o tema — agora **só vale quando a deputada tem ficha sem retrocesso**: zero PLs regressivas e zero votos regressivos.

Punitivismo isolado não descaracteriza o peso: ele já tem o desconto próprio de −2 pontos. Mas voto em retrocesso, sim. A lógica é simples: o multiplicador foi pensado para ampliar a voz de **quem faz a pauta da mulher avançar**. Não para amplificar quem está empurrando a pauta na direção oposta enquanto carrega o crachá da mesma luta.

## O que ficou fora deste patch

Considerou-se adicionar **selos informativos de filiação partidária** — para sinalizar deputados que se filiaram em 2026 a partidos cuja bancada votou massivamente SIM no PDL Conanda. A decisão foi **não fazer**: o critério depende muito de escolhas editoriais (qual partido, qual janela, qual percentual da bancada) e mistura comportamento individual com comportamento de bancada. O Observatório prefere registrar voto, autoria e relatoria — o que cada deputada e cada deputado fez —, e deixar para a leitora associar isso ao partido ou ao caminho político de cada um.

## Auditabilidade

Cada selo de voto regressivo linka para a votação original na API da Câmara. A fórmula está documentada na [seção 6 da página de metodologia](https://observatoriomulheres.ininterrupta.com/metodologia). O código da penalidade vive em [`scripts/compute_vote_penalty.py`](../scripts/compute_vote_penalty.py), com a lista curada de votações regressivas em arquivo separado e versionado. Os testes que garantem que o ranking se mantém coerente estão em [`tests/`](../tests/) — quem quiser conferir, basta rodar `pytest`.

O Observatório é independente, sem financiamento institucional. Se você encontrar um erro nos números, no critério ou no código, **escreva para a gente**. A discussão pública sobre o que conta como ação parlamentar pró-mulher é tão importante quanto o ranking em si.
