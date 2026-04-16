#!/usr/bin/env python3
"""
Adiciona autor + relator a cada votação em votacoes.json.

Autor: API /proposicoes/{id}/autores (pega principal)
Relator: regex sobre /proposicoes/{id}/tramitacoes procurando "Designado(a) Relator(a)"
"""

import json
import re
import time
import urllib.request
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "src" / "data"
API = "https://dadosabertos.camara.leg.br/api/v2"


def fetch_json(url: str) -> dict:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "mapa-violencia-mulher/1.0"})
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read().decode("utf-8"))
    except Exception as exc:
        print(f"  erro: {exc}")
        return {}


def fetch_autor_principal(pl_id: int) -> dict | None:
    d = fetch_json(f"{API}/proposicoes/{pl_id}/autores").get("dados", [])
    # pegar primeiro com ordemAssinatura = 1
    if not d:
        return None
    principal = min(d, key=lambda a: a.get("ordemAssinatura") or 999)
    return {
        "nome": principal.get("nome"),
        "tipo": principal.get("tipo"),
        "uri": principal.get("uri"),
    }


def fetch_ultimo_relator(pl_id: int) -> dict | None:
    tram = fetch_json(f"{API}/proposicoes/{pl_id}/tramitacoes").get("dados", [])
    relatores = []
    for t in tram:
        desp = t.get("despacho", "") or ""
        # Padrão: "Designad[oa] Relat[oa]ra?, Dep. NOME (PARTIDO-UF)." ou ".../PARTIDO-UF"
        m = re.search(
            r"Designad[oa]\s+Relat[oa]r[ae]?,?\s*Dep\.?\s*([^(]+?)\s*\(([^)]+)\)",
            desp,
            re.IGNORECASE,
        )
        if m:
            nome = m.group(1).strip().rstrip(".")
            partido_uf = m.group(2).strip().replace("/", "-")
            relatores.append(
                {
                    "nome": nome,
                    "partido_uf": partido_uf,
                    "orgao": t.get("siglaOrgao"),
                    "data": (t.get("dataHora") or "")[:10],
                }
            )
    if not relatores:
        return None
    # último relator designado (mais recente)
    relatores.sort(key=lambda r: r.get("data") or "", reverse=True)
    return relatores[0]


def main():
    vot = json.loads((DATA_DIR / "votacoes.json").read_text(encoding="utf-8"))

    # Deduplicar fetches por pl_id (pois múltiplas votações podem ter mesma PL)
    unique_pls = {v["pl_id"] for v in vot["votacoes"]}
    print(f"Buscando autor + relator de {len(unique_pls)} PLs únicos...")

    cache_autor = {}
    cache_relator = {}
    for i, pl_id in enumerate(sorted(unique_pls), 1):
        print(f"  [{i}/{len(unique_pls)}] PL id {pl_id}")
        cache_autor[pl_id] = fetch_autor_principal(pl_id)
        time.sleep(0.1)
        cache_relator[pl_id] = fetch_ultimo_relator(pl_id)
        time.sleep(0.1)

    # Aplicar às votações
    for v in vot["votacoes"]:
        pl_id = v["pl_id"]
        v["autor"] = cache_autor.get(pl_id)
        v["relator"] = cache_relator.get(pl_id)

    (DATA_DIR / "votacoes.json").write_text(
        json.dumps(vot, ensure_ascii=False), encoding="utf-8"
    )

    print("\n>>> votacoes.json enriquecido:")
    for v in vot["votacoes"]:
        a = v.get("autor") or {}
        r = v.get("relator") or {}
        print(
            f"  {v['pl_ref']}: autor={a.get('nome','?')} | relator={r.get('nome','—')} ({r.get('partido_uf','')})"
        )


if __name__ == "__main__":
    main()
