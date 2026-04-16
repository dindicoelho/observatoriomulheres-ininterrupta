#!/usr/bin/env python3
"""
Busca todas as votações de plenário das PLs no novo universo (1142 PLs
em autoria.json). Recupera votos individuais, agrega por partido e gênero.

Produz `votacoes_raw.json` com dados crus. As interpretações editoriais
(titulo_curto, o_que_foi_votado, interpretacao_sim/nao) ficam pra etapa
manual posterior.
"""

import json
import time
import http.client
from pathlib import Path
from collections import defaultdict

DATA_DIR = Path(__file__).parent.parent / "src" / "data"
API_HOST = "dadosabertos.camara.leg.br"
API_PREFIX = "/api/v2"


# Conexão HTTPS reusada (keep-alive) — urllib não reusa por default
_conn = None


def _get_conn():
    global _conn
    if _conn is None:
        _conn = http.client.HTTPSConnection(API_HOST, timeout=30)
    return _conn


def fetch_json(path, retries=3):
    """path é relativo ao API_PREFIX (ex.: '/proposicoes/123/votacoes')"""
    global _conn
    full = API_PREFIX + path
    for attempt in range(retries):
        try:
            conn = _get_conn()
            conn.request("GET", full, headers={"User-Agent": "mapa-violencia-mulher/1.0"})
            resp = conn.getresponse()
            body = resp.read()
            if resp.status != 200:
                if attempt == retries - 1:
                    return {}
                time.sleep(1 + attempt)
                continue
            return json.loads(body.decode("utf-8"))
        except Exception:
            try:
                if _conn:
                    _conn.close()
            except Exception:
                pass
            _conn = None
            if attempt == retries - 1:
                return {}
            time.sleep(1 + attempt)
    return {}


def main():
    autoria = json.loads((DATA_DIR / "autoria.json").read_text(encoding="utf-8"))

    # PLs no universo (sem regressivos) — usar deputados para garantir dedup
    pl_ids = set()
    for d in autoria["deputados"]:
        for pl in d["pls"]:
            if pl.get("stance") != "regressivo":
                pl_ids.add(pl["id"])
    print(f">>> {len(pl_ids)} PLs no universo pra buscar votações")

    # Index PLs by id -> meta
    pls_meta = {}
    for d in autoria["deputados"]:
        for pl in d["pls"]:
            if pl["id"] not in pls_meta:
                pls_meta[pl["id"]] = {
                    "tipo": pl["tipo"],
                    "numero": pl["numero"],
                    "ano": pl["ano"],
                    "ementa": pl["ementa"],
                    "categoria": pl["categoria"],
                    "stance": pl.get("stance", "protetivo"),
                }

    # Buscar votações pra cada PL (apenas em Plenário, nominais)
    all_votacoes = []
    count_with_vote = 0
    for i, pl_id in enumerate(sorted(pl_ids), 1):
        if i % 100 == 0:
            print(f"  [{i}/{len(pl_ids)}] — {count_with_vote} com votação até agora")
        data = fetch_json(f"/proposicoes/{pl_id}/votacoes")
        votacoes = data.get("dados", []) or []
        if not votacoes:
            time.sleep(0.05)
            continue

        plenary_votes = [
            v for v in votacoes
            if (v.get("siglaOrgao") or "").upper() == "PLEN"
            and (v.get("aprovacao") is not None)  # nominal
        ]
        if plenary_votes:
            count_with_vote += 1
            for v in plenary_votes:
                v["_pl_id"] = pl_id
                v["_pl_meta"] = pls_meta[pl_id]
                all_votacoes.append(v)
        time.sleep(0.05)

    print(f"\n>>> {len(all_votacoes)} votações de plenário em {count_with_vote} PLs")

    # Para cada votação: buscar votos individuais
    print("\nBuscando votos individuais de cada votação...")
    for i, v in enumerate(all_votacoes, 1):
        if i % 20 == 0:
            print(f"  [{i}/{len(all_votacoes)}]")
        votos = fetch_json(f"/votacoes/{v['id']}/votos").get("dados", [])
        v["_votos"] = votos
        time.sleep(0.05)

    # Buscar info dos deputados (partido + sexo) pra agregar
    dep_ids = set()
    for v in all_votacoes:
        for vt in v.get("_votos", []):
            dep = vt.get("deputado_") or {}
            if dep.get("id"):
                dep_ids.add(dep["id"])

    # Use coerencia.json pra sexo (maior cobertura)
    coer = json.loads((DATA_DIR / "coerencia.json").read_text(encoding="utf-8"))
    sexo_idx = {d["id"]: d.get("sexo") for d in coer.get("deputados", [])}

    print(f"\n>>> {len(dep_ids)} deputados distintos votando. Sexo conhecido: {sum(1 for i in dep_ids if sexo_idx.get(i))}")

    # Agregar por partido e sexo
    for v in all_votacoes:
        partidos = defaultdict(lambda: {"sim": 0, "nao": 0, "outros": 0, "total": 0})
        genero = {
            "F": {"sim": 0, "nao": 0, "outros": 0, "total": 0},
            "M": {"sim": 0, "nao": 0, "outros": 0, "total": 0},
        }
        total_sim = 0
        total_nao = 0
        for vt in v.get("_votos", []):
            tipo = (vt.get("tipoVoto") or "").lower()
            dep = vt.get("deputado_") or {}
            p = dep.get("siglaPartido") or "S/ PARTIDO"
            s = sexo_idx.get(dep.get("id"))

            if "sim" in tipo:
                partidos[p]["sim"] += 1
                if s in genero:
                    genero[s]["sim"] += 1
                total_sim += 1
            elif "não" in tipo or "nao" in tipo:
                partidos[p]["nao"] += 1
                if s in genero:
                    genero[s]["nao"] += 1
                total_nao += 1
            else:
                partidos[p]["outros"] += 1
                if s in genero:
                    genero[s]["outros"] += 1
            partidos[p]["total"] += 1
            if s in genero:
                genero[s]["total"] += 1

        # Calcular pctSim
        part_out = {}
        for p, d in partidos.items():
            valid = d["sim"] + d["nao"]
            d["pctSim"] = (d["sim"] / valid * 100) if valid > 0 else 0
            part_out[p] = d
        for s, d in genero.items():
            valid = d["sim"] + d["nao"]
            d["pctSim"] = (d["sim"] / valid * 100) if valid > 0 else 0

        v["_partidos"] = part_out
        v["_genero"] = genero
        v["_totalSim"] = total_sim
        v["_totalNao"] = total_nao

    # Ordenar por data desc
    all_votacoes.sort(key=lambda v: v.get("dataHoraRegistro", ""), reverse=True)

    # Salvar cru
    out_raw = {
        "votacoes": [
            {
                "id": v["id"],
                "data": v.get("data"),
                "dataHoraRegistro": v.get("dataHoraRegistro"),
                "siglaOrgao": v.get("siglaOrgao"),
                "descricao": v.get("descricao"),
                "aprovacao": v.get("aprovacao"),
                "pl_id": v["_pl_id"],
                "pl_meta": v["_pl_meta"],
                "partidos": v["_partidos"],
                "genero": v["_genero"],
                "totalSim": v["_totalSim"],
                "totalNao": v["_totalNao"],
            }
            for v in all_votacoes
        ]
    }

    (DATA_DIR / "votacoes_raw.json").write_text(
        json.dumps(out_raw, ensure_ascii=False), encoding="utf-8"
    )

    print(f"\n>>> votacoes_raw.json salvo — {len(all_votacoes)} votações")
    # PLs com votação, pra análise
    pls_with_vote = defaultdict(list)
    for v in all_votacoes:
        pls_with_vote[v["_pl_id"]].append(v)
    print(f"    {len(pls_with_vote)} PLs únicas com votação de plenário")
    print("\n>>> PLs com votação + placar (até 40 primeiros):")
    for pl_id, vots in list(pls_with_vote.items())[:40]:
        m = pls_meta[pl_id]
        for v in vots:
            sim = v["_totalSim"]
            nao = v["_totalNao"]
            print(
                f"  {m['tipo']} {m['numero']}/{m['ano']:4d} "
                f"[{v.get('data','?')}] sim={sim:3d} nao={nao:3d} "
                f"[{'aprov' if v.get('aprovacao') else 'reprov'}] — {v.get('descricao','')[:100]}"
            )


if __name__ == "__main__":
    main()
