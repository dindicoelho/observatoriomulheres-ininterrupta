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
import time
import urllib.error
import urllib.request
from collections import defaultdict
from pathlib import Path

API = "https://dadosabertos.camara.leg.br/api/v2"
DATA_DIR = Path(__file__).parent.parent / "src" / "data"
SEED_PATH = Path(__file__).parent / "regressive_votes_seed.json"


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

    # Sugestões pra curadoria (não afeta cálculo)
    print("\n[opcional] Procurando candidatos a novas votações regressivas...")
    sugestoes = sugerir_novas_votacoes(autoria, set(universo.keys()))
    if sugestoes:
        print(f">>> {len(sugestoes)} votações candidatas (PL regressiva, votação em PLEN, ainda não no seed):")
        for s in sugestoes[:15]:
            print(f"    {s['votacao_id']:>14} | {s['pl_ref']:<14} {s['data']} | {s['descricao_camara']}")
        if len(sugestoes) > 15:
            print(f"    … e mais {len(sugestoes)-15}. Avaliar no log e adicionar ao seed quando aplicável.")
    else:
        print(">>> Nenhum candidato novo. Universo está sincronizado.")


if __name__ == "__main__":
    main()
