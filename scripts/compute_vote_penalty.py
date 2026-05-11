#!/usr/bin/env python3
"""
Calcula a penalidade por voto SIM em proposição classificada como regressiva.

Para cada deputado em autoria.json, popula:
- votos_regressivos: contagem de votos SIM em votações de pauta regressiva
- votos_regressivos_detalhe: lista [{pl_ref, descricao, data, placar, voto, votacao_id}]

Fonte de classificação editorial:
- scripts/regressive_votes_seed.json — arquivo curado a mão. Cada entrada
  documenta uma votação específica do plenário com justificativa explícita
  do porquê votar SIM é regressivo. Auditável.

Por que o seed é a fonte primária: classificar a PL pela ementa não é
suficiente. Uma PL regressiva pode ter recebido substitutivo pró-mulher
da relatora (caso PL 6020/2023 — substitutivo pró-mulher, mesmo que a
proposta original criminalizasse o consentimento da vítima). Votações
procedurais (destaque, requerimento, preferência) dependem do contexto
da pauta. Só a curadoria humana resolve essa ambiguidade.

Função auxiliar: o script também faz scan das PLs regressivas em
autoria.json e imprime no log votações candidatas que ainda não estão
no seed — pra curadoria editorial avaliar e adicionar quando faz
sentido. ESSAS NÃO ENTRAM NO CÁLCULO automaticamente.

Idempotente: zera os campos antes de recalcular. Roda no cron diário.
"""

import json
import os
import subprocess
import time
import urllib.error
import urllib.request
from collections import defaultdict
from pathlib import Path

API = "https://dadosabertos.camara.leg.br/api/v2"
DATA_DIR = Path(__file__).parent.parent / "src" / "data"
SEED_PATH = Path(__file__).parent / "regressive_votes_seed.json"
SNAPSHOT_PATH = Path(__file__).parent / "regressive_votes_candidates.json"


def fetch_json(url: str, retries: int = 4) -> dict:
    for attempt in range(retries):
        try:
            req = urllib.request.Request(
                url, headers={"User-Agent": "mapa-violencia-mulher/1.0"}
            )
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.loads(r.read().decode("utf-8"))
        except (urllib.error.URLError, TimeoutError) as exc:
            if attempt == retries - 1:
                print(f"    falhou após {retries} tentativas: {exc}")
                return {}
            time.sleep(2 ** attempt)
    return {}


def carregar_seed() -> dict:
    """Retorna {votacao_id: meta} a partir de scripts/regressive_votes_seed.json."""
    if not SEED_PATH.exists():
        print(">>> regressive_votes_seed.json não encontrado.")
        return {}
    try:
        seed = json.loads(SEED_PATH.read_text(encoding="utf-8"))
    except Exception as exc:
        print(f">>> ERRO lendo seed: {exc}")
        return {}
    out = {}
    for entry in seed.get("votacoes", []):
        vid = entry.get("votacao_id")
        if not vid:
            continue
        out[vid] = entry
    print(f">>> {len(out)} votações curadas no seed editorial")
    return out


def buscar_votos_sim(votacao_id: str) -> list:
    """Retorna lista de dicts {deputado_id} para quem votou SIM."""
    data = fetch_json(f"{API}/votacoes/{votacao_id}/votos")
    sims = []
    for vt in data.get("dados", []) or []:
        tipo_voto = (vt.get("tipoVoto") or "").lower()
        if "sim" not in tipo_voto:
            continue
        dep = vt.get("deputado_") or {}
        dep_id = dep.get("id")
        if not dep_id:
            continue
        sims.append({"deputado_id": dep_id, "deputado_nome": dep.get("nome")})
    return sims


def sugerir_novas_votacoes(autoria: dict, ja_no_seed: set) -> list:
    """Função auxiliar: lista votações em PLs regressivas que ainda não
    estão no seed. NÃO conta no cálculo — só sugere para curadoria humana."""
    pls_regressivas = {}
    for dep in autoria["deputados"]:
        for pl in dep["pls"]:
            if pl.get("stance") != "regressivo":
                continue
            pls_regressivas[pl["id"]] = {
                "tipo": pl["tipo"],
                "numero": pl["numero"],
                "ano": pl["ano"],
                "ementa": pl["ementa"][:120],
            }

    sugestoes = []
    for i, (pid, meta) in enumerate(sorted(pls_regressivas.items()), 1):
        if i % 30 == 0:
            print(f"    [{i}/{len(pls_regressivas)}] scan...")
        data = fetch_json(f"{API}/proposicoes/{pid}/votacoes")
        for v in data.get("dados", []) or []:
            if (v.get("siglaOrgao") or "").upper() != "PLEN":
                continue
            if v.get("aprovacao") is None:
                continue
            if v["id"] in ja_no_seed:
                continue
            sugestoes.append({
                "votacao_id": v["id"],
                "pl_ref": f"{meta['tipo']} {meta['numero']}/{meta['ano']}",
                "data": (v.get("data") or "")[:10],
                "descricao_camara": (v.get("descricao") or "")[:80],
                "ementa_pl": meta["ementa"],
            })
        time.sleep(0.05)
    return sugestoes


def main():
    print("=" * 60)
    print("Computando penalidade por voto em pauta regressiva")
    print("=" * 60)

    autoria_path = DATA_DIR / "autoria.json"
    autoria = json.loads(autoria_path.read_text(encoding="utf-8"))

    # 1) Universo de votações regressivas: APENAS o seed editorial
    print("\n[1/3] Carregando universo de votações regressivas (seed curado)...")
    universo = carregar_seed()

    # Reset idempotente: zerar tudo primeiro
    for d in autoria["deputados"]:
        d["votos_regressivos"] = 0
        d["votos_regressivos_detalhe"] = []

    if not universo:
        print(">>> Nenhuma votação no seed — saindo sem mudanças.")
        autoria_path.write_text(json.dumps(autoria, ensure_ascii=False), encoding="utf-8")
        return

    # 2) Pra cada votação, coletar votos SIM
    print(f"\n[2/3] Coletando votos SIM em {len(universo)} votações...")
    por_deputado: defaultdict[int, list] = defaultdict(list)
    for i, (vid, meta) in enumerate(universo.items(), 1):
        print(f"    [{i}/{len(universo)}] {vid} ({meta.get('pl_ref','?')})")
        sims = buscar_votos_sim(vid)
        for s in sims:
            por_deputado[s["deputado_id"]].append({
                "votacao_id": vid,
                "pl_ref": meta.get("pl_ref", ""),
                "descricao": meta.get("descricao", ""),
                "data": meta.get("data", ""),
                "placar": meta.get("placar", ""),
                "tooltip_longo": meta.get("tooltip_longo", ""),
                "voto": "Sim",
            })
        time.sleep(0.1)

    # 3) Aplicar em autoria.json
    print(f"\n[3/3] Aplicando em autoria.json...")
    deputados_afetados = 0
    for d in autoria["deputados"]:
        votos = por_deputado.get(d["id"], [])
        votos.sort(key=lambda x: x.get("data", ""), reverse=True)
        d["votos_regressivos"] = len(votos)
        d["votos_regressivos_detalhe"] = votos
        if votos:
            deputados_afetados += 1

    autoria_path.write_text(json.dumps(autoria, ensure_ascii=False), encoding="utf-8")
    print(f">>> {deputados_afetados} deputados com pelo menos 1 voto regressivo registrado")

    # Preview
    sample = sorted(
        [d for d in autoria["deputados"] if d.get("votos_regressivos", 0) > 0],
        key=lambda x: x["votos_regressivos"], reverse=True,
    )
    print("\n>>> Top 10 deputados por votos regressivos:")
    for d in sample[:10]:
        descs = "; ".join(v["pl_ref"] for v in d["votos_regressivos_detalhe"][:2])
        print(f"    {d['votos_regressivos']}× {d['nome']:<32} ({d['partido']}/{d['uf']}) — {descs}")

    # Sugestões pra curadoria + alerta de novas candidatas
    print("\n[curadoria] Procurando candidatos a novas votações regressivas...")
    sugestoes = sugerir_novas_votacoes(autoria, set(universo.keys()))
    detectar_e_alertar_novas(sugestoes)


def detectar_e_alertar_novas(sugestoes_atuais: list) -> None:
    """Compara candidatas atuais com o snapshot anterior. Pra cada votação
    que apareceu agora e não existia antes, abre um GitHub Issue (quando
    rodando em CI com gh disponível) ou só imprime no log."""
    atuais_por_id = {s["votacao_id"]: s for s in sugestoes_atuais}

    # Snapshot anterior (lista de IDs já vistos)
    if SNAPSHOT_PATH.exists():
        try:
            snap = json.loads(SNAPSHOT_PATH.read_text(encoding="utf-8"))
            ja_vistos = set(snap.get("candidatos_ids", []))
        except Exception as exc:
            print(f">>> snapshot ilegível ({exc}); tratando como vazio")
            ja_vistos = set()
    else:
        ja_vistos = set()
        print(">>> Sem snapshot anterior — primeira execução. Vou gravar sem alertar.")

    primeira_execucao = not SNAPSHOT_PATH.exists()
    novas = [s for vid, s in atuais_por_id.items() if vid not in ja_vistos]

    print(f">>> {len(atuais_por_id)} candidatas no scan atual · {len(novas)} novas vs snapshot anterior")

    # Atualizar snapshot SEMPRE — mantém o repo como fonte da verdade
    SNAPSHOT_PATH.write_text(
        json.dumps(
            {
                "_nota": "Lista de votações candidatas detectadas pelo compute_vote_penalty.py. NÃO é o seed — só registra o que o scan automático achou pra detectar quando aparece coisa nova. Atualizado pelo script a cada execução.",
                "atualizado_em": time.strftime("%Y-%m-%d"),
                "candidatos_ids": sorted(atuais_por_id.keys()),
                "candidatos": sorted(atuais_por_id.values(), key=lambda x: x.get("votacao_id", "")),
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    if primeira_execucao:
        print(">>> Snapshot inicial gravado. Próximas execuções vão comparar contra ele.")
        return

    if not novas:
        print(">>> Nenhuma votação candidata nova. Nada a alertar.")
        return

    for s in novas:
        print(f"    [NOVA] {s['votacao_id']} | {s['pl_ref']:<14} {s['data']} | {s['descricao_camara']}")

    # Em ambiente CI com gh disponível, abre issue pra cada nova candidata
    if os.environ.get("GITHUB_ACTIONS") == "true":
        for s in novas:
            abrir_issue_curadoria(s)
    else:
        print(">>> (rodando local) Issues NÃO foram abertos. No CI, cada candidata viraria 1 issue.")


def abrir_issue_curadoria(sugestao: dict) -> None:
    """Cria um GitHub Issue pra curadoria avaliar a nova votação candidata."""
    title = f"[curadoria] Nova votação candidata a regressiva: {sugestao['pl_ref']}"
    body = f"""O scan automático de `compute_vote_penalty.py` detectou uma nova votação em PL regressiva que ainda não está no seed editorial.

**Votação:** [`{sugestao['votacao_id']}`](https://dadosabertos.camara.leg.br/api/v2/votacoes/{sugestao['votacao_id']})
**PL:** {sugestao['pl_ref']}
**Data:** {sugestao['data']}
**Descrição da Câmara:** {sugestao['descricao_camara']}

**Ementa da PL:**
> {sugestao['ementa_pl']}

---

### Como decidir

Aplicar os 4 critérios documentados em `scripts/regressive_votes_seed.json`:

1. É votação de **mérito** ou só procedural decorrente de outra já no seed?
2. A pauta toca **diretamente** direitos da mulher/meninas?
3. O mérito virou pró-mulher por **substitutivo** (caso PL 6020/2023)?
4. A classificação da PL como regressiva é correta ou é **bug do classifier**?

### Se decidir que entra

Adicionar entrada em `scripts/regressive_votes_seed.json`:

```json
{{
  "votacao_id": "{sugestao['votacao_id']}",
  "pl_id": ?,
  "pl_ref": "{sugestao['pl_ref']}",
  "data": "{sugestao['data']}",
  "placar": "Sim X × Não Y",
  "descricao": "...",
  "tooltip_longo": "Votou SIM em ...",
  "justificativa_regressiva": "..."
}}
```

### Se decidir que NÃO entra

Fechar este issue. O snapshot já registrou a votação, então ela não vai gerar issue de novo na próxima execução do cron.
"""
    try:
        subprocess.run(
            ["gh", "issue", "create", "--title", title, "--body", body, "--label", "curadoria"],
            check=True,
            capture_output=True,
        )
        print(f"    >>> Issue aberto pra {sugestao['votacao_id']}")
    except subprocess.CalledProcessError as exc:
        print(f"    >>> Falha ao abrir issue pra {sugestao['votacao_id']}: {exc.stderr.decode() if exc.stderr else exc}")
    except FileNotFoundError:
        print(f"    >>> gh CLI não encontrado — issue NÃO criado para {sugestao['votacao_id']}")


if __name__ == "__main__":
    main()
