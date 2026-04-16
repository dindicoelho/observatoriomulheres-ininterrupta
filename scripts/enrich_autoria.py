#!/usr/bin/env python3
"""
Lê autoria.json (saída do rebuild_autoria.py) e acrescenta campos
esperados pelo front: totalDeputados, totalPls, gender_stats, partidos, periodo.

Usa coerencia.json pra mapear sexo.
"""

import json
from pathlib import Path
from collections import defaultdict

DATA_DIR = Path(__file__).parent.parent / "src" / "data"


def main():
    autoria = json.loads((DATA_DIR / "autoria.json").read_text(encoding="utf-8"))
    coer = json.loads((DATA_DIR / "coerencia.json").read_text(encoding="utf-8"))
    sexo_idx = {d["id"]: d.get("sexo") for d in coer.get("deputados", [])}

    deps = autoria["deputados"]

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
        sexo = sexo_idx.get(d["id"])
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
