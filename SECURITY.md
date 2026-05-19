# Política de Segurança

## Reportar vulnerabilidade

Encontrou uma falha de segurança? **Não abra issue pública.**

Em vez disso, manda mensagem direta no Instagram [@ininterrupta.sys](https://instagram.com/ininterrupta.sys) descrevendo:

- O que é a vulnerabilidade
- Como reproduzir
- Impacto que você imagina (vazamento de dados, defacement, etc)

Resposta em até 7 dias.

## Escopo

Pertinente para reporte:

- Vazamento da tabela `leads` no Supabase (emails de inscritos)
- Injeção / XSS em qualquer rota
- Bypass de validação na rota `/api/leads`
- Credenciais expostas no repositório ou no bundle de produção
- Qualquer acesso não-autorizado a dados ou infraestrutura

Fora do escopo:

- Vulnerabilidades em dependências sem PoC de impacto neste site (use `npm audit` ou Dependabot)
- Conteúdo editorial (classificação de PLs, pesos da fórmula) — pra divergir da metodologia, abra issue pública discutindo o critério

## Dados sensíveis coletados

O único dado pessoal coletado é o **email** opcional informado no formulário de inscrição da newsletter. Fica armazenado no Supabase, acessado apenas por mim. Não tem cookies, pixels de rastreamento ou analytics de terceiros.
