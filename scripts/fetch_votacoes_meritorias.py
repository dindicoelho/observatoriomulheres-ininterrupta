#!/usr/bin/env python3
"""
Abordagem rápida: busca votações de PLENÁRIO em janelas de 3 meses via
/votacoes?dataInicio&dataFim, filtra por PLs no novo universo e recupera
votos individuais APENAS pras que cruzam.

Muito mais rápido que iterar 1142 PLs.
"""

import json
import time
import urllib.request
from pathlib import Path
from datetime import date, timedelta
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
        except Exception as exc:
            if attempt == retries - 1:
                print(f"    skip: {exc}")
                return {}
            time.sleep(1 + attempt)
    return {}


def date_windows(start: date, end: date):
    """Gera janelas de até 90 dias"""
    cur = start
    while cur < end:
        stop = min(cur + timedelta(days=89), end)
        yield cur, stop
        cur = stop + timedelta(days=1)


def fetch_all_votacoes_plenario(start, end):
    """Busca todas votações no plenário na janela, paginando"""
    out = []
    page = 1
    while True:
        url = (
            f"{API}/votacoes?dataInicio={start.isoformat()}"
            f"&dataFim={end.isoformat()}"
            f"&itens=200&pagina={page}&ordem=ASC&ordenarPor=dataHoraRegistro"
        )
        data = fetch_json(url)
        dados = data.get("dados", [])
        if not dados:
            break
        # Filtra só plenário (PLEN)
        for v in dados:
            if (v.get("siglaOrgao") or "").upper() == "PLEN":
                out.append(v)
        if len(dados) < 200:
            break
        page += 1
        if page > 100:
            break
        time.sleep(0.1)
    return out


def main():
    autoria = json.loads((DATA_DIR / "autoria.json").read_text(encoding="utf-8"))

    pl_ids = set()
    for d in autoria["deputados"]:
        for pl in d["pls"]:
            if pl.get("stance") != "regressivo":
                pl_ids.add(pl["id"])
    print(f">>> {len(pl_ids)} PLs no universo")

    pls_meta = {}
    for d in autoria["deputados"]:
        for pl in d["pls"]:
            if pl["id"] not in pls_meta and pl.get("stance") != "regressivo":
                pls_meta[pl["id"]] = {
                    "tipo": pl["tipo"],
                    "numero": pl["numero"],
                    "ano": pl["ano"],
                    "ementa": pl["ementa"],
                    "categoria": pl["categoria"],
                    "stance": pl.get("stance", "protetivo"),
                }

    start = date(2023, 1, 1)
    end = date(2026, 4, 16)

    print(f"\n>>> Buscando votações PLEN em janelas de 3 meses ({start} → {end})...")
    all_vots = []
    for s, e in date_windows(start, end):
        vots = fetch_all_votacoes_plenario(s, e)
        print(f"  {s} → {e}: {len(vots)} votações de plenário")
        all_vots.extend(vots)
        time.sleep(0.1)
    print(f">>> Total bruto: {len(all_vots)} votações de plenário")

    # Pra cada votação, extrair proposicaoObjeto id
    def extract_pl_id(v):
        obj = v.get("proposicaoObjeto")
        if not obj:
            uri = v.get("uriProposicaoObjeto")
            if uri:
                try:
                    return int(uri.rstrip("/").split("/")[-1])
                except Exception:
                    return None
            return None
        if isinstance(obj, dict):
            return obj.get("id")
        if isinstance(obj, int):
            return obj
        return None

    # Muitas votações não têm proposicaoObjeto setado diretamente — precisamos
    # buscar detalhes individuais pra saber o PL. Pra evitar isso, vamos parsear
    # descrição procurando "PL XXXX/AAAA" e mapear.
    import re
    def pl_ref_from_descricao(v):
        desc = v.get("descricao") or ""
        m = re.search(r"(PL|PLP|PDL|PEC|PRC)\s*n?[oº°]?\s*([\d\.]+)[/ ]*(\d{4})", desc, re.IGNORECASE)
        if m:
            tipo = m.group(1).upper()
            num = int(m.group(2).replace(".", ""))
            ano = int(m.group(3))
            return (tipo, num, ano)
        return None

    # Map (tipo, numero, ano) -> pl_id
    ref_to_id = {}
    for pid, m in pls_meta.items():
        ref_to_id[(m["tipo"], m["numero"], m["ano"])] = pid

    matched = []
    for v in all_vots:
        pid = extract_pl_id(v)
        if pid and pid in pl_ids:
            v["_pl_id"] = pid
            matched.append(v)
            continue
        ref = pl_ref_from_descricao(v)
        if ref and ref in ref_to_id:
            v["_pl_id"] = ref_to_id[ref]
            matched.append(v)

    print(f"\n>>> {len(matched)} votações cruzam com nosso universo")

    # Extrair só as nominais (aprovacao não-nula) e agrupar por PL
    meritorias_candidates = []
    for v in matched:
        # proposicaoObjeto é o PL em questão. Se a votação foi nominal o campo aprovacao é 0/1
        if v.get("aprovacao") is None:
            continue
        meritorias_candidates.append(v)
    print(f">>> {len(meritorias_candidates)} com aprovacao registrada (nominais)")

    # Buscar votos individuais
    print("\nBuscando votos de cada votação...")
    coer = json.loads((DATA_DIR / "coerencia.json").read_text(encoding="utf-8"))
    sexo_idx = {d["id"]: d.get("sexo") for d in coer.get("deputados", [])}

    enriched = []
    for i, v in enumerate(meritorias_candidates, 1):
        if i % 20 == 0:
            print(f"  [{i}/{len(meritorias_candidates)}]")
        votos_data = fetch_json(f"{API}/votacoes/{v['id']}/votos").get("dados", [])
        partidos = defaultdict(lambda: {"sim": 0, "nao": 0, "outros": 0, "total": 0})
        genero = {
            "F": {"sim": 0, "nao": 0, "outros": 0, "total": 0},
            "M": {"sim": 0, "nao": 0, "outros": 0, "total": 0},
        }
        total_sim = 0
        total_nao = 0
        for vt in votos_data:
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

        part_out = {}
        for p, d in partidos.items():
            valid = d["sim"] + d["nao"]
            d["pctSim"] = (d["sim"] / valid * 100) if valid > 0 else 0
            part_out[p] = d
        for s, d in genero.items():
            valid = d["sim"] + d["nao"]
            d["pctSim"] = (d["sim"] / valid * 100) if valid > 0 else 0

        pid = v["_pl_id"]
        m = pls_meta[pid]
        enriched.append(
            {
                "id": v["id"],
                "data": v.get("data"),
                "dataHoraRegistro": v.get("dataHoraRegistro"),
                "pl_id": pid,
                "pl_tipo": m["tipo"],
                "pl_numero": m["numero"],
                "pl_ano": m["ano"],
                "pl_ref": f"{m['tipo']} {m['numero']}/{m['ano']}",
                "pl_ementa": m["ementa"],
                "pl_categoria": m["categoria"],
                "pl_stance": m["stance"],
                "descricao": v.get("descricao"),
                "aprovacao": v.get("aprovacao"),
                "totalSim": total_sim,
                "totalNao": total_nao,
                "resultado_placar": "aprovado" if v.get("aprovacao") == 1 else "rejeitado",
                "partidos": part_out,
                "genero": genero,
            }
        )
        time.sleep(0.1)

    enriched.sort(key=lambda x: x.get("dataHoraRegistro") or "", reverse=True)

    out_path = DATA_DIR / "votacoes_raw.json"
    out_path.write_text(
        json.dumps({"votacoes": enriched}, ensure_ascii=False),
        encoding="utf-8",
    )
    print(f"\n>>> votacoes_raw.json salvo ({len(enriched)} votações)")
    print("\n>>> Votações por PL:")
    por_pl = defaultdict(list)
    for v in enriched:
        por_pl[v["pl_ref"]].append(v)
    for pl_ref, vots in sorted(por_pl.items(), key=lambda x: -len(x[1])):
        sample = vots[0]
        print(
            f"  {pl_ref}: {len(vots)} votações — última {sample['data']} "
            f"{sample['totalSim']}x{sample['totalNao']} "
            f"[{sample['resultado_placar']}] — {sample['descricao'][:80]}"
        )


if __name__ == "__main__":
    main()
