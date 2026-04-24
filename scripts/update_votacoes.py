#!/usr/bin/env python3
"""
Detecta novas votações nominais de plenário nas PLs do universo
e gera interpretação editorial via LLM. Mergea com votacoes.json.

Estratégia: itera PLs com maior score (top 100), busca votações
de cada uma, compara com IDs existentes em votacoes.json. Se há
nova votação nominal, busca votos individuais, agrega, e gera
interpretação com Haiku.

Roda no cron diário. Custo LLM: ~$0.01 por votação nova (raro).
"""

import json
import os
import re
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


def main():
    autoria = json.loads((DATA_DIR / "autoria.json").read_text(encoding="utf-8"))
    votacoes = json.loads((DATA_DIR / "votacoes.json").read_text(encoding="utf-8"))
    coer = json.loads((DATA_DIR / "coerencia.json").read_text(encoding="utf-8"))
    sexo_idx = {d["id"]: d.get("sexo") for d in coer.get("deputados", [])}

    existing_ids = {v["id"] for v in votacoes["votacoes"]}
    print(f">>> {len(existing_ids)} votações existentes")

    # PLs com maior score (top 100 — mais prováveis de ir a plenário)
    deps_sorted = sorted(
        autoria["deputados"],
        key=lambda d: d["estruturais"] * 2 + d["incrementais"],
        reverse=True,
    )
    # Coletar PLs únicas dos top deputados
    pl_ids_to_check = set()
    pl_meta = {}
    for d in deps_sorted[:80]:
        for pl in d["pls"]:
            if pl.get("stance") == "regressivo":
                continue
            if pl["id"] not in pl_meta:
                pl_meta[pl["id"]] = {
                    "tipo": pl["tipo"],
                    "numero": pl["numero"],
                    "ano": pl["ano"],
                    "ementa": pl["ementa"],
                    "categoria": pl["categoria"],
                }
            pl_ids_to_check.add(pl["id"])

    # Também checar todas PLs que já têm votação (pra pegar novas votações delas)
    for v in votacoes["votacoes"]:
        pl_ids_to_check.add(v["pl_id"])

    print(f">>> Checando {len(pl_ids_to_check)} PLs por novas votações...")

    new_votacoes = []
    for i, pl_id in enumerate(sorted(pl_ids_to_check), 1):
        if i % 50 == 0:
            print(f"  [{i}/{len(pl_ids_to_check)}]")
        data = fetch_json(f"{API}/proposicoes/{pl_id}/votacoes")
        vots = data.get("dados", []) or []
        for v in vots:
            if (v.get("siglaOrgao") or "").upper() != "PLEN":
                continue
            if v.get("aprovacao") is None:
                continue
            if v["id"] in existing_ids:
                continue
            # Nova votação!
            v["_pl_id"] = pl_id
            new_votacoes.append(v)
        time.sleep(0.05)

    if not new_votacoes:
        print(">>> Nenhuma votação nova encontrada.")
        return

    print(f"\n>>> {len(new_votacoes)} votações novas encontradas!")

    # Buscar votos individuais e agregar
    enriched = []
    for v in new_votacoes:
        votos_data = fetch_json(f"{API}/votacoes/{v['id']}/votos").get("dados", [])
        partidos = defaultdict(lambda: {"sim": 0, "nao": 0, "outros": 0, "total": 0})
        genero = {
            "F": {"sim": 0, "nao": 0, "outros": 0, "total": 0},
            "M": {"sim": 0, "nao": 0, "outros": 0, "total": 0},
        }
        total_sim = total_nao = 0
        for vt in votos_data:
            tipo_voto = (vt.get("tipoVoto") or "").lower()
            dep = vt.get("deputado_") or {}
            p = dep.get("siglaPartido") or "S/PARTIDO"
            s = sexo_idx.get(dep.get("id"))
            if "sim" in tipo_voto:
                partidos[p]["sim"] += 1
                if s in genero: genero[s]["sim"] += 1
                total_sim += 1
            elif "não" in tipo_voto or "nao" in tipo_voto:
                partidos[p]["nao"] += 1
                if s in genero: genero[s]["nao"] += 1
                total_nao += 1
            else:
                partidos[p]["outros"] += 1
                if s in genero: genero[s]["outros"] += 1
            partidos[p]["total"] += 1
            if s in genero: genero[s]["total"] += 1

        for d in list(partidos.values()) + list(genero.values()):
            valid = d["sim"] + d["nao"]
            d["pctSim"] = (d["sim"] / valid * 100) if valid > 0 else 0

        pid = v["_pl_id"]
        m = pl_meta.get(pid, {})

        enriched.append({
            "id": v["id"],
            "data": v.get("data"),
            "pl_ref": f"{m.get('tipo','PL')} {m.get('numero','?')}/{m.get('ano','?')}",
            "pl_id": pid,
            "projeto_sobre": "",
            "pl_ementa": m.get("ementa", ""),
            "pl_categoria": m.get("categoria", ""),
            "tipo": "",
            "o_que_foi_votado": "",
            "resultado": "",
            "interpretacao_sim": "",
            "interpretacao_nao": "",
            "descricao_camara": v.get("descricao", ""),
            "titulo_curto": "",
            "totalSim": total_sim,
            "totalNao": total_nao,
            "resultado_placar": "aprovado" if v.get("aprovacao") == 1 else "rejeitado",
            "partidos": dict(partidos),
            "genero": genero,
            "autor": None,
            "relator": None,
            "voto_pro_mulher": None,
            "contexto_voto": None,
        })
        time.sleep(0.1)

    # Gerar interpretação com LLM
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if api_key:
        try:
            from anthropic import Anthropic
            client = Anthropic()
            print(f"\nGerando interpretações para {len(enriched)} votações novas...")
            for v in enriched:
                prompt = f"""Você é jornalista especializada em políticas públicas. Preencha os campos sobre esta votação na Câmara. Seja DIDÁTICA.

PL: {v['pl_ref']}
Ementa: {v['pl_ementa']}
Descrição da Câmara: {v['descricao_camara']}
Placar: {v['totalSim']} SIM × {v['totalNao']} NÃO — {v['resultado_placar']}

Responda em JSON:
{{"titulo_curto": "título até 8 palavras",
"projeto_sobre": "2-3 frases explicando o projeto",
"tipo": "mérito ou procedural",
"o_que_foi_votado": "1 frase sobre o que foi votado",
"resultado": "1 frase sobre resultado e consequência",
"interpretacao_sim": "1 frase: quem votou SIM é a favor de...",
"interpretacao_nao": "1 frase: quem votou NÃO é a favor de..."}}"""
                try:
                    msg = client.messages.create(
                        model="claude-haiku-4-5-20251001",
                        max_tokens=500,
                        messages=[{"role": "user", "content": prompt}],
                    )
                    text = msg.content[0].text.strip()
                    if text.startswith("```"):
                        text = text.split("```")[1]
                        if text.startswith("json"):
                            text = text[4:]
                    parsed = json.loads(text.strip())
                    for k in ["titulo_curto", "projeto_sobre", "tipo",
                               "o_que_foi_votado", "resultado",
                               "interpretacao_sim", "interpretacao_nao"]:
                        if k in parsed:
                            v[k] = parsed[k]
                except Exception as exc:
                    print(f"  erro LLM: {exc}")
                time.sleep(0.1)
            print(">>> Interpretações geradas")
        except ImportError:
            print(">>> anthropic não instalado — votações sem interpretação")
    else:
        print(">>> ANTHROPIC_API_KEY não setada — votações sem interpretação")

    # Buscar autor + relator
    for v in enriched:
        pid = v["pl_id"]
        autores = fetch_json(f"{API}/proposicoes/{pid}/autores").get("dados", [])
        if autores:
            principal = min(autores, key=lambda a: a.get("ordemAssinatura") or 999)
            v["autor"] = {"nome": principal.get("nome"), "tipo": principal.get("tipo")}
        tram = fetch_json(f"{API}/proposicoes/{pid}/tramitacoes").get("dados", [])
        for t in tram:
            desp = t.get("despacho", "") or ""
            rm = re.search(
                r"Designad[oa]\s+Relat[oa]r[ae]?,?\s*Dep\.?\s*([^(]+?)\s*\(([^)]+)\)",
                desp, re.IGNORECASE,
            )
            if rm:
                v["relator"] = {
                    "nome": rm.group(1).strip().rstrip("."),
                    "partido_uf": rm.group(2).strip(),
                    "orgao": t.get("siglaOrgao"),
                }
        time.sleep(0.1)

    # Mergear com existentes
    votacoes["votacoes"].extend(enriched)
    # Re-sort por data desc
    votacoes["votacoes"].sort(key=lambda x: x.get("data") or "", reverse=True)

    (DATA_DIR / "votacoes.json").write_text(
        json.dumps(votacoes, ensure_ascii=False), encoding="utf-8"
    )
    print(f"\n>>> votacoes.json atualizado: {len(votacoes['votacoes'])} votações total (+{len(enriched)} novas)")
    for v in enriched:
        print(f"  NOVA: {v['pl_ref']} [{v.get('tipo','')}] {v['totalSim']}x{v['totalNao']} — {v.get('titulo_curto','?')}")


if __name__ == "__main__":
    main()
