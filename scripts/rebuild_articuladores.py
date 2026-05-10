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
        votos_regr = d.get("votos_regressivos", 0)
        base_score = d["estruturais"] * 2 + d["incrementais"] + d["simbolicas"] - regr * 5 - votos_regr * 5
        # Peso 5 pra mulheres DEPOIS do desconto
        sexo = d.get("sexo") or coer_idx.get(d["id"], {}).get("sexo")
        mult = 5.0 if sexo == "F" else 1.0
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

    # Composição da Câmara por UF — conta TODOS deputados da legislatura 57ª
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

    # Montar ufs_out com total_deps = TOTAL da bancada (não só quem tem score)
    ufs_out = {}
    for uf, lst in por_uf.items():
        camara = comp_uf.get(uf, {"F": 0, "M": 0, "total": 0})
        atuantes = len(lst)
        ufs_out[uf] = {
            "total_deps": camara["total"],  # total da bancada, não só quem pontuou
            "deputados_atuantes": atuantes,
            "top3": lst[:3],
            "camara_F": camara["F"],
            "camara_M": camara["M"],
            "camara_total": camara["total"],
            "zero_mulheres": camara["F"] == 0,
        }

    # UFs que estão na composição mas não em por_uf (0 PLs sobre o tema)
    for uf, camara in comp_uf.items():
        if uf not in ufs_out:
            ufs_out[uf] = {
                "total_deps": camara["total"],
                "deputados_atuantes": 0,
                "top3": [],
                "camara_F": camara["F"],
                "camara_M": camara["M"],
                "camara_total": camara["total"],
                "zero_mulheres": camara["F"] == 0,
            }

    total_deputados = sum(comp_uf[uf]["total"] for uf in comp_uf)
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
