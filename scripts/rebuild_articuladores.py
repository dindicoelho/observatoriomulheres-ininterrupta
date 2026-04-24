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
        regr = d.get("regressivos", 0)
        base_score = d["estruturais"] * 2 + d["incrementais"] - regr * 5
        # Peso 2.5 pra mulheres no score de articulação
        sexo = d.get("sexo") or coer_idx.get(d["id"], {}).get("sexo")
        mult = 2.5 if sexo == "F" else 1.0
        score = base_score * mult
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

    # Composição da Câmara por UF — conta deputadas na legislatura 57ª
    comp_uf = {}
    for cd in coer.get("deputados", []):
        uf = cd.get("uf")
        if not uf:
            continue
        if uf not in comp_uf:
            comp_uf[uf] = {"F": 0, "M": 0, "total": 0}
        s = cd.get("sexo")
        if s == "F":
            comp_uf[uf]["F"] += 1
        elif s == "M":
            comp_uf[uf]["M"] += 1
        comp_uf[uf]["total"] += 1

    # Anotar zero_mulheres por UF
    for uf, data in ufs_out.items():
        camara = comp_uf.get(uf, {"F": 0, "M": 0, "total": 0})
        data["camara_F"] = camara["F"]
        data["camara_M"] = camara["M"]
        data["camara_total"] = camara["total"]
        data["zero_mulheres"] = camara["F"] == 0

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
