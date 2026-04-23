#!/usr/bin/env python3
"""
Pipeline de dados do Senado Federal.

Busca matérias (proposições) sobre violência contra a mulher,
identifica autoria, classifica por forma + postura, e agrega.

API: https://legis.senado.leg.br/dadosabertos/
Sem autenticação. Formato JSON via sufixo .json.
"""

import json
import re
import time
import urllib.request
from pathlib import Path
from collections import defaultdict
from datetime import date

DATA_DIR = Path(__file__).parent.parent / "src" / "data"
API = "https://legis.senado.leg.br/dadosabertos"

# Reusar keywords e classificadores do pipeline da Câmara
import sys
sys.path.insert(0, str(Path(__file__).parent))
from rebuild_autoria import KEYWORDS, KW_NORMALIZED, normalize, matches_keywords
from classify_stance import classify_stance


def fetch_json(url, retries=3):
    for attempt in range(retries):
        try:
            req = urllib.request.Request(
                url, headers={
                    "User-Agent": "mapa-violencia-mulher/1.0",
                    "Accept": "application/json",
                }
            )
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception as exc:
            if attempt == retries - 1:
                print(f"    erro: {exc}")
                return {}
            time.sleep(1 + attempt)
    return {}


def fetch_senadores_atuais():
    """Lista de senadores em exercício na legislatura atual."""
    data = fetch_json(f"{API}/senador/lista/atual.json")
    lista = data.get("ListaParlamentarEmExercicio", {})
    parlamentares = lista.get("Parlamentares", {}).get("Parlamentar", [])
    if isinstance(parlamentares, dict):
        parlamentares = [parlamentares]

    senadores = []
    for p in parlamentares:
        ident = p.get("IdentificacaoParlamentar", {})
        mandato = p.get("Mandato", {})
        senadores.append({
            "id": int(ident.get("CodigoParlamentar", 0)),
            "nome": ident.get("NomeParlamentar"),
            "nome_completo": ident.get("NomeCompletoParlamentar"),
            "partido": ident.get("SiglaPartidoParlamentar"),
            "uf": ident.get("UfParlamentar"),
            "foto": ident.get("UrlFotoParlamentar"),
            "sexo": ident.get("SexoParlamentar"),
            "participacao": mandato.get("DescricaoParticipacao"),
        })
    return senadores


def fetch_materias_keyword(ano_inicio=2023, ano_fim=2026):
    """Busca matérias por keyword. A API do Senado não tem filtro por keyword
    na listagem, então buscamos todas e filtramos localmente."""
    all_materias = []

    # Buscar matérias da legislatura atual
    # Endpoint: /materia/pesquisa/lista.json com filtros
    # Tentar por ano
    for ano in range(ano_inicio, ano_fim + 1):
        url = f"{API}/materia/pesquisa/lista.json?ano={ano}&v=7"
        data = fetch_json(url)

        pesquisa = data.get("PesquisaBasicaMateria", {})
        materias = pesquisa.get("Materias", {}).get("Materia", [])
        if isinstance(materias, dict):
            materias = [materias]

        print(f"  {ano}: {len(materias)} matérias brutas")
        all_materias.extend(materias)
        time.sleep(0.3)

    return all_materias


def fetch_materia_detalhe(codigo):
    """Busca detalhes de uma matéria específica."""
    data = fetch_json(f"{API}/materia/{codigo}.json")
    return data.get("DetalheMateria", {}).get("Materia", {})


def main():
    print("=" * 60)
    print("Pipeline Senado Federal")
    print("=" * 60)

    # 1. Senadores atuais
    print("\n>>> Buscando senadores em exercício...")
    senadores = fetch_senadores_atuais()
    sen_idx = {s["id"]: s for s in senadores}
    print(f"    {len(senadores)} senadores")
    f_count = sum(1 for s in senadores if s.get("sexo") == "Feminino")
    m_count = sum(1 for s in senadores if s.get("sexo") == "Masculino")
    print(f"    {f_count} mulheres, {m_count} homens")

    # 2. Buscar matérias
    print("\n>>> Buscando matérias 2023-2026...")
    all_materias = fetch_materias_keyword(2023, 2026)
    print(f"    Total bruto: {len(all_materias)}")

    # 3. Filtrar por keywords + remover requerimentos (RQS, REQ, INS = procedurais)
    TIPOS_LEGISLATIVOS = {"PL", "PEC", "PLP", "PDL", "PRS"}
    filtered = []
    for m in all_materias:
        sigla = (m.get("SiglaSubtipoMateria") or m.get("Sigla") or "").upper().strip()
        if sigla not in TIPOS_LEGISLATIVOS:
            continue
        ementa = m.get("EmentaMateria") or m.get("Ementa") or ""
        if matches_keywords(ementa):
            filtered.append(m)

    print(f"    Após filtro keywords + só PL/PEC/PLP/PDL/PRS: {len(filtered)}")

    # 4. Classificar
    materias_out = []
    for m in filtered:
        ementa = m.get("EmentaMateria") or m.get("Ementa") or ""
        codigo = m.get("CodigoMateria") or m.get("Codigo")
        sigla = m.get("SiglaSubtipoMateria") or m.get("Sigla") or ""
        numero = m.get("NumeroMateria") or m.get("Numero") or ""
        ano = m.get("AnoMateria") or m.get("Ano") or ""
        data_ap = m.get("DataApresentacao") or ""

        # Classificar forma
        from rebuild_autoria import classify
        categoria = classify(ementa)

        # Classificar postura
        stance = classify_stance(ementa)

        materias_out.append({
            "codigo": codigo,
            "sigla": sigla,
            "numero": numero,
            "ano": ano,
            "ementa": ementa,
            "data": data_ap,
            "categoria": categoria,
            "stance": stance,
            "autor_nome": m.get("NomeAutor") or m.get("AutorPrincipal") or "",
        })

    # Stats
    cats = defaultdict(int)
    stances = defaultdict(int)
    for m in materias_out:
        cats[m["categoria"]] += 1
        stances[m["stance"]] += 1
    print(f"    Categorias: {dict(cats)}")
    print(f"    Posturas: {dict(stances)}")

    # Filtrar regressivos pra contagem final
    protetivos = [m for m in materias_out if m["stance"] != "regressivo"]

    # 5. Buscar autoria de cada matéria
    print(f"\n>>> Buscando autoria de {len(materias_out)} matérias...")
    for i, m in enumerate(materias_out, 1):
        if i % 50 == 0:
            print(f"  [{i}/{len(materias_out)}]")
        codigo = m["codigo"]
        data = fetch_json(f"{API}/materia/autoria/{codigo}.json")
        mat = data.get("AutoriaMateria", {}).get("Materia", {})
        autores = mat.get("Autoria", {}).get("Autor", [])
        if isinstance(autores, dict):
            autores = [autores]
        nomes = []
        ids = []
        for a in autores:
            nomes.append(a.get("NomeAutor", ""))
            ident = a.get("IdentificacaoParlamentar", {})
            if ident.get("CodigoParlamentar"):
                ids.append(int(ident["CodigoParlamentar"]))
        m["autores_nomes"] = nomes
        m["autores_ids"] = ids
        m["autor_nome"] = nomes[0] if nomes else ""
        time.sleep(0.05)

    # 6. Agregar por senador
    print("\n>>> Agregando por senador...")
    por_senador = defaultdict(lambda: {
        "total": 0, "estruturais": 0, "incrementais": 0, "simbolicas": 0,
        "protetivos": 0, "punitivistas": 0, "regressivos": 0, "pls": []
    })
    for m in materias_out:
        for sid in m.get("autores_ids", []):
            s = por_senador[sid]
            s["total"] += 1
            cat_key = {"simbólica": "simbolicas", "incremental": "incrementais", "estrutural": "estruturais"}.get(m["categoria"], "incrementais")
            s[cat_key] += 1
            if m["stance"] == "protetivo": s["protetivos"] += 1
            elif m["stance"] == "punitivista": s["punitivistas"] += 1
            elif m["stance"] == "regressivo": s["regressivos"] += 1
            s["pls"].append({
                "codigo": m["codigo"],
                "sigla": m["sigla"],
                "numero": m["numero"],
                "ano": m["ano"],
                "ementa": m["ementa"],
                "categoria": m["categoria"],
                "stance": m["stance"],
            })

    # Montar ranking
    ranking = []
    for sid, stats in por_senador.items():
        sen = sen_idx.get(sid)
        if not sen:
            continue
        non_regr = stats["total"] - stats["regressivos"]
        score = stats["estruturais"] * 2 + stats["incrementais"] - stats["regressivos"] * 2
        sexo = "F" if sen.get("sexo") == "Feminino" else "M"
        mult = 2.5 if sexo == "F" else 1.0
        ranking.append({
            "id": sid,
            "nome": sen["nome"],
            "partido": sen["partido"],
            "uf": sen["uf"],
            "foto": sen["foto"],
            "sexo": sexo,
            "total": non_regr,
            "estruturais": stats["estruturais"],
            "incrementais": stats["incrementais"],
            "simbolicas": stats["simbolicas"],
            "protetivos": stats["protetivos"],
            "punitivistas": stats["punitivistas"],
            "regressivos": stats["regressivos"],
            "score": score * mult,
            "pls": stats["pls"],
        })
    ranking.sort(key=lambda x: x["score"], reverse=True)

    print(f"    {len(ranking)} senadores com pelo menos 1 matéria")
    print("\n>>> Top 15 senadores:")
    for i, r in enumerate(ranking[:15], 1):
        print(f"  {i:2d}. [{r['sexo']}] {r['nome']:<30} ({r['partido']}/{r['uf']}) "
              f"total={r['total']:2d} estr={r['estruturais']} score={r['score']:.0f}")

    # 7. Salvar
    out = {
        "ranking": ranking,
        "total_senadores": len(senadores),
        "senadores_F": f_count,
        "senadores_M": m_count,
        "total_materias": len(materias_out),
        "total_protetivas": len(protetivos),
        "total_regressivas": stances.get("regressivo", 0),
        "total_punitivistas": stances.get("punitivista", 0),
        "resumo": dict(cats),
        "atualizado": date.today().isoformat(),
    }

    (DATA_DIR / "senado.json").write_text(
        json.dumps(out, ensure_ascii=False), encoding="utf-8"
    )

    print(f"\n>>> senado.json salvo")
    print(f"    {len(senadores)} senadores ({f_count}F, {m_count}M)")
    print(f"    {len(materias_out)} matérias sobre o tema")
    print(f"    {len(protetivos)} protetivas, {stances.get('punitivista',0)} punitivistas, {stances.get('regressivo',0)} regressivas")


if __name__ == "__main__":
    main()
