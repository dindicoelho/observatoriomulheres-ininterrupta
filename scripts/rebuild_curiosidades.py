#!/usr/bin/env python3
"""
Gera curiosidades.json a partir dos dados atuais.

Analisa autoria.json, legislativo.json e votacoes.json pra produzir
6 cards de curiosidades dinâmicos. Substituem os hardcoded.

Curiosidades geradas:
1. Votação mais apertada (menor diferença de placar)
2. Tema em ascensão (maior crescimento recente)
3. PL in memoriam ou simbólica mais recente
4. Novo conceito legal (estrutural mais recente aprovada)
5. Fenômeno recente (PL estrutural mais recente)
6. PL com mais co-autores
"""

import json
from pathlib import Path
from collections import defaultdict

DATA_DIR = Path(__file__).parent.parent / "src" / "data"


def main():
    autoria = json.loads((DATA_DIR / "autoria.json").read_text(encoding="utf-8"))
    legislativo = json.loads((DATA_DIR / "legislativo.json").read_text(encoding="utf-8"))
    votacoes = json.loads((DATA_DIR / "votacoes.json").read_text(encoding="utf-8"))

    curiosidades = []

    # 1. Votação mais apertada
    merito = [v for v in votacoes["votacoes"] if v.get("tipo") == "mérito"]
    if merito:
        apertadas = sorted(merito, key=lambda v: abs(v["totalSim"] - v["totalNao"]))
        v = apertadas[0]
        diff = abs(v["totalSim"] - v["totalNao"])
        curiosidades.append({
            "selo": "Decisão mais apertada",
            "pl": v["pl_ref"],
            "titulo": v.get("titulo_curto") or v["pl_ref"],
            "dado": f"{v['totalSim']} × {v['totalNao']}",
            "texto": f"A votação mais disputada de proposições sobre proteção à mulher na legislatura. {'Aprovada' if v['resultado_placar'] == 'aprovado' else 'Rejeitada'} por {diff} votos de diferença em {v['data']}.",
            "link": f"https://www.camara.leg.br/propostas-legislativas/{v['pl_id']}",
        })

    # 2. Tema em ascensão — ano com mais crescimento
    por_ano = legislativo.get("porAno", {})
    anos = sorted(por_ano.keys())
    if len(anos) >= 2:
        ultimo = anos[-1]
        penultimo = anos[-2]
        t_ultimo = sum(por_ano[ultimo].values())
        t_penultimo = sum(por_ano[penultimo].values())
        crescimento = t_ultimo - t_penultimo
        if crescimento > 0:
            curiosidades.append({
                "selo": "Ritmo acelerando",
                "pl": f"{ultimo}",
                "titulo": f"{t_ultimo} proposições em {ultimo}",
                "dado": f"+{crescimento}",
                "texto": f"O ano de {ultimo} já tem {t_ultimo} proposições sobre o tema — {crescimento} a mais que {penultimo} ({t_penultimo}). O Congresso está legislando mais sobre violência contra a mulher.",
                "link": "",
            })
        else:
            curiosidades.append({
                "selo": "Ritmo desacelerando",
                "pl": f"{ultimo}",
                "titulo": f"{t_ultimo} proposições em {ultimo}",
                "dado": f"{crescimento}",
                "texto": f"O ano de {ultimo} tem {t_ultimo} proposições — {abs(crescimento)} a menos que {penultimo} ({t_penultimo}).",
                "link": "",
            })

    # 3. PL simbólica mais recente (in memoriam, dia nacional)
    simbolicas = [p for p in legislativo["proposicoes"] if p["categoria"] == "simbólica"]
    simbolicas.sort(key=lambda p: p.get("data", ""), reverse=True)
    if simbolicas:
        s = simbolicas[0]
        curiosidades.append({
            "selo": "Pauta simbólica mais recente",
            "pl": f"{s['tipo']} {s['numero']}/{s['ano']}",
            "titulo": s["ementa"][:120] + ("…" if len(s["ementa"]) > 120 else ""),
            "dado": s["data"][:10],
            "texto": f"A proposição simbólica mais recente sobre o tema. Simbólicas são datas comemorativas, homenagens e campanhas de conscientização.",
            "link": f"https://www.camara.leg.br/propostas-legislativas/{s['id']}",
        })

    # 4. Estrutural mais recente
    estruturais = [p for p in legislativo["proposicoes"] if p["categoria"] == "estrutural"]
    estruturais.sort(key=lambda p: p.get("data", ""), reverse=True)
    if estruturais:
        e = estruturais[0]
        curiosidades.append({
            "selo": "Estrutural mais recente",
            "pl": f"{e['tipo']} {e['numero']}/{e['ano']}",
            "titulo": e["ementa"][:120] + ("…" if len(e["ementa"]) > 120 else ""),
            "dado": e["data"][:10],
            "texto": "A proposição estrutural mais recente — cria programa, fundo ou política nacional. Estruturais são as que mudam a estrutura, não só ajustam a lei.",
            "link": f"https://www.camara.leg.br/propostas-legislativas/{e['id']}",
        })

    # 5. Destino: quantas viraram lei
    destino = legislativo.get("destino_stats", {}).get("por_categoria", {})
    aprovadas = destino.get("aprovada", 0)
    total = legislativo.get("total", 0)
    if total > 0:
        pct = (aprovadas / total) * 100
        curiosidades.append({
            "selo": "Taxa de aprovação",
            "pl": "",
            "titulo": f"Só {aprovadas} de {total} viraram lei",
            "dado": f"{pct:.1f}%",
            "texto": f"Das {total} proposições da legislatura, apenas {aprovadas} ({pct:.1f}%) se transformaram em norma. {destino.get('arquivada', 0)} foram arquivadas e {destino.get('sem_relator', 0)} nunca receberam relator.",
            "link": "",
        })

    # 6. Deputado(a) com mais PLs estruturais
    top_estr = sorted(autoria["deputados"], key=lambda d: d["estruturais"], reverse=True)
    if top_estr:
        d = top_estr[0]
        curiosidades.append({
            "selo": "Mais estruturais",
            "pl": "",
            "titulo": f"{d['nome']} ({d['partido']}/{d['uf']})",
            "dado": f"{d['estruturais']}",
            "texto": f"O(a) deputado(a) com mais proposições estruturais na legislatura — {d['estruturais']} projetos que criam programas, fundos ou políticas nacionais. Total de {d['total']} PLs sobre o tema.",
            "link": f"https://www.camara.leg.br/deputados/{d['id']}",
        })

    # Limitar a 6
    curiosidades = curiosidades[:6]

    (DATA_DIR / "curiosidades.json").write_text(
        json.dumps({"curiosidades": curiosidades}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f">>> curiosidades.json salvo: {len(curiosidades)} cards")
    for c in curiosidades:
        print(f"  [{c['selo']}] {c['titulo'][:60]}")


if __name__ == "__main__":
    main()
