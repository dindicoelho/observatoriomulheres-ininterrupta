#!/usr/bin/env python3
"""
Regenera legislativo.json a partir do autoria.json atualizado.

- Deduplica PLs (autoria tem duplicação por co-autoria)
- Exclui PLs marcados como regressivos (não são "em prol da mulher")
- Pra cada PL: usa destino conhecido do legislativo.json antigo; busca API pros novos
- Recalcula total, resumo, porAno, destino_stats
"""

import json
import re
import time
import urllib.request
from pathlib import Path
from collections import defaultdict

DATA_DIR = Path(__file__).parent.parent / "src" / "data"
API = "https://dadosabertos.camara.leg.br/api/v2"


def fetch_json(url: str, retries: int = 3) -> dict:
    for attempt in range(retries):
        try:
            req = urllib.request.Request(
                url, headers={"User-Agent": "mapa-violencia-mulher/1.0"}
            )
            with urllib.request.urlopen(req, timeout=45) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception as exc:
            if attempt == retries - 1:
                return {}
            time.sleep(2 ** attempt)
    return {}


def classify_destino(situacao: str, dsc_orgao: str, estado: str) -> str:
    """Mapeia tramitação → categoria (aprovada, no_senado, pronta, sem_relator, tramitando, arquivada)"""
    s = (situacao or "").lower()
    o = (dsc_orgao or "").lower()
    e = (estado or "").lower()

    if "transformado" in s or "transformada" in s or "lei n" in s:
        return "aprovada"
    if "arquiv" in s or "prejudicad" in s or "retirad" in s:
        return "arquivada"
    if "senado" in o:
        return "no_senado"
    if "pronta" in s or "pauta" in s:
        return "pronta"
    if "sem relator" in s or "aguardando parecer do relator" in s:
        return "sem_relator"
    return "tramitando"


def fetch_tramitacao(prop_id: int) -> dict:
    data = fetch_json(f"{API}/proposicoes/{prop_id}")
    dados = data.get("dados", {}) if data else {}
    situacao = (dados.get("statusProposicao") or {}).get("descricaoSituacao", "")
    orgao = (dados.get("statusProposicao") or {}).get("siglaOrgao", "")
    data_hora = (dados.get("statusProposicao") or {}).get("dataHora", "")
    return {
        "categoria": classify_destino(situacao, orgao, ""),
        "situacao": situacao,
        "orgao": orgao,
        "data_hora": data_hora,
    }


def main():
    autoria = json.loads((DATA_DIR / "autoria.json").read_text(encoding="utf-8"))
    old_leg = json.loads((DATA_DIR / "legislativo.json").read_text(encoding="utf-8"))

    old_destinos = {p["id"]: p.get("destino") for p in old_leg["proposicoes"] if p.get("destino")}

    # Deduplicar PLs, excluir regressivos
    seen = set()
    pls = []
    for d in autoria["deputados"]:
        for pl in d["pls"]:
            if pl["id"] in seen:
                continue
            if pl.get("stance") == "regressivo":
                continue
            seen.add(pl["id"])
            pls.append(
                {
                    "id": pl["id"],
                    "tipo": pl["tipo"],
                    "numero": pl["numero"],
                    "ano": pl["ano"],
                    "ementa": pl["ementa"],
                    "data": pl["data"],
                    "categoria": pl["categoria"],
                    "stance": pl.get("stance", "protetivo"),
                }
            )

    print(f">>> {len(pls)} PLs únicos (após remover regressivos)")

    # Buscar tramitação pros PLs que não tem no antigo
    need_fetch = [p for p in pls if p["id"] not in old_destinos]
    print(f">>> {len(need_fetch)} PLs sem tramitação — buscando API...")

    for i, p in enumerate(need_fetch, 1):
        if i % 50 == 0:
            print(f"  [{i}/{len(need_fetch)}]")
        p["destino"] = fetch_tramitacao(p["id"])
        time.sleep(0.1)

    for p in pls:
        if "destino" not in p:
            p["destino"] = old_destinos.get(p["id"])

    # Calcular totais
    resumo_atual = defaultdict(int)
    porAno = defaultdict(lambda: defaultdict(int))
    destino_counts = defaultdict(int)

    for p in pls:
        resumo_atual[p["categoria"]] += 1
        porAno[str(p["ano"])][p["categoria"]] += 1
        dest = p.get("destino") or {}
        destino_counts[dest.get("categoria", "tramitando")] += 1

    # Ordenar por data desc
    pls.sort(key=lambda p: p.get("data", ""), reverse=True)

    out = {
        "total": len(pls),
        "total_atual": len(pls),
        "resumo": dict(resumo_atual),
        "resumo_atual": dict(resumo_atual),
        "porAno": {
            k: dict(v)
            for k, v in sorted(porAno.items())
        },
        "proposicoes": pls,
        "destino_stats": {
            "total": len(pls),
            "por_categoria": dict(destino_counts),
            "categorias_labels": {
                "aprovada": "Transformou-se em lei",
                "no_senado": "Aprovada na Câmara, tramitando no Senado",
                "pronta": "Pronta para pauta — ainda sem votação",
                "sem_relator": "Aguardando relator — nunca saiu do zero",
                "tramitando": "Em tramitação (com relator ou parecer)",
                "arquivada": "Arquivada, rejeitada ou prejudicada",
            },
        },
    }

    (DATA_DIR / "legislativo.json").write_text(
        json.dumps(out, ensure_ascii=False), encoding="utf-8"
    )

    print(f"\n>>> legislativo.json salvo")
    print(f"    total: {out['total']}")
    print(f"    resumo: {out['resumo']}")
    print(f"    porAno: {list(out['porAno'].items())[-4:]}")
    print(f"    destino_stats: {out['destino_stats']['por_categoria']}")


if __name__ == "__main__":
    main()
