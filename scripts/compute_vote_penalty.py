#!/usr/bin/env python3
"""
Computa penalidade por voto SIM em proposições regressivas.

Busca votações de PLs classificadas como regressivas que foram a plenário,
identifica quem votou SIM, e adiciona campo `votos_regressivos` a cada
deputado em autoria.json.

Score: votos_sim_em_regressivas × 5 (mesmo peso que autoria regressiva).

Também salva detalhes dos votos regressivos pra exibir selos no front.
"""

import json
import time
import urllib.request
from pathlib import Path
from collections import defaultdict

DATA_DIR = Path(__file__).parent.parent / "src" / "data"
API = "https://dadosabertos.camara.leg.br/api/v2"


def fetch_json(url, retries=3):
    for attempt in range(retries):
        try:
            req = urllib.request.Request(
                url, headers={"User-Agent": "mapa-violencia-mulher/1.0"}
            )
            with urllib.request.urlopen(req, timeout=20) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception:
            if attempt == retries - 1:
                return {}
            time.sleep(1 + attempt)
    return {}


# PLs regressivas conhecidas que foram a votação nominal em plenário
# Formato: (pl_id, votacao_id, descricao, data, voto_regressivo="sim"|"nao")
# voto_regressivo indica qual voto (SIM ou NÃO) é o regressivo
REGRESSIVAS_VOTADAS = [
    {
        "pl_id": 2482078,
        "votacao_id": "2482078-57",
        "pl_ref": "PDL 3/2025",
        "descricao": "Sustou diretrizes do Conanda sobre aborto legal em crianças vítimas de estupro",
        "data": "2025-11-05",
        "placar": "317×111",
        "voto_regressivo": "sim",  # votar SIM = sustar = regressivo
    },
]


def main():
    autoria = json.loads((DATA_DIR / "autoria.json").read_text(encoding="utf-8"))
    dep_idx = {d["id"]: d for d in autoria["deputados"]}

    # Para cada votação regressiva, buscar votos individuais
    votos_regressivos_por_dep = defaultdict(list)

    for vr in REGRESSIVAS_VOTADAS:
        print(f">>> Buscando votos: {vr['pl_ref']} ({vr['votacao_id']})...")
        votos = fetch_json(f"{API}/votacoes/{vr['votacao_id']}/votos").get("dados", [])
        print(f"    {len(votos)} votos encontrados")

        for v in votos:
            dep = v.get("deputado_", {})
            dep_id = dep.get("id")
            if not dep_id:
                continue

            tipo_voto = (v.get("tipoVoto") or "").lower().strip()
            is_sim = "sim" in tipo_voto
            is_nao = "não" in tipo_voto or "nao" in tipo_voto

            # Determinar se o voto é regressivo
            votou_regressivo = False
            if vr["voto_regressivo"] == "sim" and is_sim:
                votou_regressivo = True
            elif vr["voto_regressivo"] == "nao" and is_nao:
                votou_regressivo = True

            if votou_regressivo:
                votos_regressivos_por_dep[dep_id].append({
                    "pl_ref": vr["pl_ref"],
                    "descricao": vr["descricao"],
                    "data": vr["data"],
                    "placar": vr["placar"],
                    "voto": v.get("tipoVoto"),
                })

    print(f"\n>>> {len(votos_regressivos_por_dep)} deputados votaram regressivamente")

    # Aplicar a autoria.json
    for d in autoria["deputados"]:
        vr = votos_regressivos_por_dep.get(d["id"], [])
        d["votos_regressivos"] = len(vr)
        d["votos_regressivos_detalhe"] = vr

    # Stats
    no_ranking = [d for d in autoria["deputados"] if d["total"] >= 3]
    no_ranking.sort(
        key=lambda d: (
            d["estruturais"] * 3 + d["incrementais"] + d["simbolicas"]
            - d.get("regressivos", 0) * 5
            - d.get("votos_regressivos", 0) * 5
        ),
        reverse=True,
    )

    print("\n>>> TOP 20 com penalidade de voto:")
    for i, d in enumerate(no_ranking[:20], 1):
        score_old = d["estruturais"] * 3 + d["incrementais"] + d["simbolicas"] - d.get("regressivos", 0) * 5
        score_new = score_old - d.get("votos_regressivos", 0) * 5
        vr = d.get("votos_regressivos", 0)
        mark = f" ⚠ -{vr*5}pts ({vr} voto{'s' if vr>1 else ''} regr)" if vr > 0 else ""
        print(f"  {i:2d}. {d['nome']:<35} score={score_new:+d} (antes={score_old}){mark}")

    # Salvar
    (DATA_DIR / "autoria.json").write_text(
        json.dumps(autoria, ensure_ascii=False), encoding="utf-8"
    )
    print("\n>>> autoria.json atualizado com votos_regressivos")


if __name__ == "__main__":
    main()
