#!/usr/bin/env python3
"""
Gera articuladores_uf.json a partir de autoria.json.

Score = (estruturais × 2) + (incrementais × 1)
Top 3 por UF entre deputados em exercício.
Mantém campos de coerência por compatibilidade (zerados — seção já não usa).
"""

import json
from pathlib import Path
from collections import defaultdict

DATA_DIR = Path(__file__).parent.parent / "src" / "data"


def main():
    autoria = json.loads((DATA_DIR / "autoria.json").read_text(encoding="utf-8"))
    deps = autoria["deputados"]

    # Tentar carregar coerência por id (se existir)
    try:
        coer = json.loads((DATA_DIR / "coerencia.json").read_text(encoding="utf-8"))
        coer_idx = {d["id"]: d for d in coer.get("deputados", [])}
    except FileNotFoundError:
        coer_idx = {}

    por_uf = defaultdict(list)
    for d in deps:
        uf = d.get("uf")
        if not uf:
            continue
        if (d.get("situacao") or "").lower() != "exercício":
            continue
        score = d["estruturais"] * 2 + d["incrementais"]
        if score <= 0:
            continue

        c = coer_idx.get(d["id"], {})
        por_uf[uf].append(
            {
                "id": d["id"],
                "nome": d["nome"],
                "partido": d["partido"],
                "uf": uf,
                "foto": d["foto"],
                "sexo": c.get("sexo"),
                "situacao": d.get("situacao"),
                "total_pls": d["total"],
                "estruturais": d["estruturais"],
                "incrementais": d["incrementais"],
                "simbolicas": d["simbolicas"],
                "coerencia_sim": c.get("sim", 0),
                "coerencia_nao": c.get("nao", 0),
                "coerencia_participacoes": c.get("participacoes", 0),
                "coerencia_score": c.get("score"),
                "score_articulador": score,
            }
        )

    for uf, lst in por_uf.items():
        lst.sort(key=lambda x: x["score_articulador"], reverse=True)

    ufs_out = {}
    for uf, lst in por_uf.items():
        ufs_out[uf] = {
            "total_deps": len(lst),
            "top3": lst[:3],
        }

    total_deputados = sum(len(v) for v in por_uf.values())
    out = {"ufs": ufs_out, "total_deputados": total_deputados}

    (DATA_DIR / "articuladores_uf.json").write_text(
        json.dumps(out, ensure_ascii=False), encoding="utf-8"
    )

    print(f">>> articuladores_uf.json salvo: {len(ufs_out)} UFs, {total_deputados} deputados")
    for uf in sorted(ufs_out.keys()):
        top = ufs_out[uf]["top3"]
        if top:
            names = ", ".join(f"{t['nome']} ({t['score_articulador']})" for t in top)
            print(f"  {uf}: {names}")


if __name__ == "__main__":
    main()
