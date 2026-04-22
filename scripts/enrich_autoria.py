#!/usr/bin/env python3
"""
Lê autoria.json (saída do rebuild_autoria.py) e acrescenta campos
esperados pelo front: totalDeputados, totalPls, gender_stats, partidos, periodo.

Usa coerencia.json pra mapear sexo.
"""

import json
import time
import urllib.request
from pathlib import Path
from collections import defaultdict

DATA_DIR = Path(__file__).parent.parent / "src" / "data"
API = "https://dadosabertos.camara.leg.br/api/v2"


def fetch_sexo(dep_id: int) -> str | None:
    try:
        req = urllib.request.Request(
            f"{API}/deputados/{dep_id}",
            headers={"User-Agent": "mapa-violencia-mulher/1.0"},
        )
        with urllib.request.urlopen(req, timeout=30) as r:
            data = json.loads(r.read().decode("utf-8"))
        return data.get("dados", {}).get("sexo")
    except Exception as exc:
        print(f"  erro sexo {dep_id}: {exc}")
        return None


def main():
    autoria = json.loads((DATA_DIR / "autoria.json").read_text(encoding="utf-8"))
    coer = json.loads((DATA_DIR / "coerencia.json").read_text(encoding="utf-8"))
    sexo_idx = {d["id"]: d.get("sexo") for d in coer.get("deputados", [])}

    deps = autoria["deputados"]

    # Populate sexo per deputy (use coerencia first, fallback to API)
    print("Resolvendo sexo por deputado...")
    faltantes = 0
    for d in deps:
        s = sexo_idx.get(d["id"])
        if not s:
            s = fetch_sexo(d["id"])
            faltantes += 1
            time.sleep(0.05)
        d["sexo"] = s
    print(f"  {faltantes} deputados precisaram da API (não estavam em coerencia.json)")

    # Gender stats: somar por sexo contando PLs, estruturais, etc
    gender = {
        "F": {"total": 0, "estruturais": 0, "incrementais": 0, "simbolicas": 0, "deputados": 0},
        "M": {"total": 0, "estruturais": 0, "incrementais": 0, "simbolicas": 0, "deputados": 0},
    }

    partidos = defaultdict(lambda: {
        "total": 0, "estruturais": 0, "incrementais": 0, "simbolicas": 0, "deputados": 0
    })

    total_pls_set = set()
    for d in deps:
        sexo = d.get("sexo")
        if sexo in gender:
            gender[sexo]["total"] += d["total"]
            gender[sexo]["estruturais"] += d["estruturais"]
            gender[sexo]["incrementais"] += d["incrementais"]
            gender[sexo]["simbolicas"] += d["simbolicas"]
            gender[sexo]["deputados"] += 1

        p = d.get("partido") or "S/ PARTIDO"
        partidos[p]["total"] += d["total"]
        partidos[p]["estruturais"] += d["estruturais"]
        partidos[p]["incrementais"] += d["incrementais"]
        partidos[p]["simbolicas"] += d["simbolicas"]
        partidos[p]["deputados"] += 1

        for pl in d["pls"]:
            if pl.get("stance") != "regressivo":
                total_pls_set.add(pl["id"])

    autoria["totalDeputados"] = len(deps)
    autoria["totalPls"] = len(total_pls_set)
    autoria["gender_stats"] = gender
    autoria["partidos"] = dict(partidos)
    autoria["periodo"] = "2023-2026 (57ª legislatura)"

    (DATA_DIR / "autoria.json").write_text(
        json.dumps(autoria, ensure_ascii=False), encoding="utf-8"
    )

    print(f">>> Enriquecido:")
    print(f"    totalDeputados: {autoria['totalDeputados']}")
    print(f"    totalPls (únicos): {autoria['totalPls']}")
    print(f"    gender_stats F: {gender['F']}")
    print(f"    gender_stats M: {gender['M']}")


if __name__ == "__main__":
    main()
