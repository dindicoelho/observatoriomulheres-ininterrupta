# Observatório Político da Violência contra a Mulher

Mapa de quem propõe, quem vota, quem engaveta, quem protege e quem retrocede direitos das mulheres na Câmara dos Deputados — legislatura 2023-2026.

Investigação autoral de [Dindi Coelho](https://instagram.com/ininterrupta.sys) como parte da [Ininterrupta](https://instagram.com/ininterrupta.sys), publicação independente de inteligência cultural.

🔗 **Site:** https://mapaviolenciamulher.com.br (ou seu domínio na Vercel)

---

## O que faz

- Cruza ~21.000 proposições da 57ª legislatura da Câmara, filtra ~1.060 ligadas a direitos das mulheres, classifica por forma (simbólica, incremental, estrutural) e postura (protetiva, punitivista, regressiva).
- Mapa por estado com top 3 articuladores em cada UF.
- Ranking top 20 de produção legislativa.
- Como cada deputado votou nas últimas votações de mérito.
- Cruzamento com taxa de feminicídio (FBSP).
- Senado, votações, relatoria, tramitação.

A metodologia completa está em [`/metodologia`](https://mapaviolenciamulher.com.br/metodologia) no site — fontes, classificação, pesos, limitações e fundamentação teórica.

## Stack

- **Frontend:** Next.js 16 (App Router) + React 19 + Tailwind 4 + D3.js
- **Pipeline de dados:** Python 3.12 + API de Dados Abertos da Câmara dos Deputados
- **Classificação LLM:** Claude Haiku 4.5 (Anthropic) — roda semanalmente
- **Captação de email:** Supabase (anon + RLS)
- **Deploy:** Vercel (SSG)
- **Automação:** GitHub Actions (cron diário às 06:00 UTC)

## Rodar localmente

Pré-requisitos: Node 20+, Python 3.12+.

```bash
# 1. Instalar deps do front
npm install

# 2. Variáveis de ambiente (opcional — só pra captação de email)
cp .env.example .env.local
# edita .env.local com sua URL e anon key do Supabase

# 3. Subir dev server
npm run dev
```

Abre http://localhost:3000.

Pra reprocessar os dados localmente (não é necessário — os JSONs já vêm versionados):

```bash
pip install anthropic
python scripts/rebuild_autoria.py
python scripts/classify_stance.py
# ... (sequência completa em .github/workflows/update-data.yml)
```

## Como contribuir

Crítica metodológica é bem-vinda. Os pesos da fórmula de score são uma escolha editorial declarada — qualquer pessoa pode refazer as contas com outros pesos.

- **Achou um bug ou erro de classificação?** Abra uma [issue](https://github.com/dindicoelho/observatoriomulheres-ininterrupta/issues) descrevendo a PL e por que a classificação está errada.
- **Quer sugerir mudança na metodologia?** Issue com a proposta + referências.
- **Quer mandar PR?** Vai em frente. Tenta manter o estilo do código e adicionar/atualizar teste em `tests/` quando mudar lógica de pipeline.

## Estrutura

```
src/
  app/              # rotas Next.js (App Router)
  components/       # componentes React
  data/             # JSONs gerados pelo pipeline
  lib/              # helpers (supabase, etc)
scripts/            # pipeline Python
tests/              # testes do pipeline (pytest)
.github/workflows/  # cron de atualização automática
posts/              # notas editoriais (changelog metodológico)
```

## Segurança

Para reportar vulnerabilidade, ver [SECURITY.md](SECURITY.md).

## Licença

[MIT](LICENSE) — fork, modifique, redistribua. Só mantém o crédito.

## Autoria

Dindi Coelho · [@ininterrupta.sys](https://instagram.com/ininterrupta.sys)

A Ininterrupta não tem fins lucrativos e não recebe financiamento de nenhuma instituição pública ou privada. Opera com dados públicos, código aberto e transparência editorial.
