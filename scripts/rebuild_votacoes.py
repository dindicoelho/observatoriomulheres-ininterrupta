#!/usr/bin/env python3
"""
Pipeline completo de votações:
1. Busca TODAS votações de plenário 2023-2026 por janelas de 3 meses
2. Para cada votação, busca DETALHE pra descobrir a proposição associada
3. Cruza com nosso universo de PLs (autoria.json)
4. Para cada match, busca votos individuais e agrega por partido/gênero
5. Para votações NOVAS (não no votacoes.json existente), gera interpretação via LLM
6. Salva votacoes.json final

Uso:
  export ANTHROPIC_API_KEY=sk-ant-...
  python3 scripts/rebuild_votacoes.py
"""

import json
import re
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
                return {}
            time.sleep(1 + attempt)
    return {}


def date_windows(start, end):
    cur = start
    while cur < end:
        stop = min(cur + timedelta(days=89), end)
        yield cur, stop
        cur = stop + timedelta(days=1)


def fetch_plenary_votes(start, end):
    out = []
    page = 1
    while True:
        url = (
            f"{API}/votacoes?dataInicio={start.isoformat()}"
            f"&dataFim={end.isoformat()}"
            f"&itens=200&pagina={page}"
        )
        data = fetch_json(url)
        dados = data.get("dados", [])
        if not dados:
            break
        for v in dados:
            if (v.get("siglaOrgao") or "").upper() == "PLEN":
                out.append(v)
        if len(dados) < 200:
            break
        page += 1
        time.sleep(0.1)
    return out


def extract_pl_id_from_detail(vote_id):
    """Busca /votacoes/{id} e extrai proposição associada."""
    data = fetch_json(f"{API}/votacoes/{vote_id}")
    dados = data.get("dados", {})
    if not dados:
        return None, None
    # Campo proposicoesAfetadas não existe no detalhe individual.
    # Mas o evento associado tem. Tentar pela uriEvento ou pelo ID.
    # Vote ID format: "XXXXX-YY" onde XXXXX é eventId
    # Na prática, a proposição vem do evento. Buscar evento.
    event_uri = dados.get("uriEvento")
    desc = dados.get("descricao") or ""
    desc_abertura = dados.get("descUltimaAberturaVotacao") or ""
    return desc, desc_abertura


def main():
    autoria = json.loads((DATA_DIR / "autoria.json").read_text(encoding="utf-8"))

    # Build lookup: (tipo, numero, ano) -> pl_id + meta
    pl_ids = set()
    pls_meta = {}
    ref_to_id = {}
    for d in autoria["deputados"]:
        for pl in d["pls"]:
            if pl.get("stance") == "regressivo":
                continue
            pl_ids.add(pl["id"])
            if pl["id"] not in pls_meta:
                pls_meta[pl["id"]] = {
                    "tipo": pl["tipo"],
                    "numero": pl["numero"],
                    "ano": pl["ano"],
                    "ementa": pl["ementa"],
                    "categoria": pl["categoria"],
                    "stance": pl.get("stance", "protetivo"),
                }
                ref_to_id[(pl["tipo"], pl["numero"], pl["ano"])] = pl["id"]
    print(f">>> {len(pl_ids)} PLs no universo")

    # 1. Fetch all plenary votes
    start = date(2023, 1, 1)
    end = date.today()
    print(f"\n>>> Buscando votações PLEN ({start} → {end})...")
    all_vots = []
    for s, e in date_windows(start, end):
        vots = fetch_plenary_votes(s, e)
        print(f"  {s} → {e}: {len(vots)} votações")
        all_vots.extend(vots)
        time.sleep(0.1)
    print(f">>> Total bruto: {len(all_vots)} votações de plenário")

    # 2. Match votes to our PLs via regex on descricao
    # Patterns: "Projeto de Lei nº 3.880, de 2024", "PL 3880/2024", "PL nº 3.880/2024"
    def extract_pl_refs(text):
        matches = []
        for m in re.finditer(
            r"(?:Projeto de Lei|PL|PLP|PDL|PEC|PRC)\s*(?:Complementar\s*)?n[ºo°]?\s*([\d\.]+)[\s,/]*(?:de\s*)?(\d{4})",
            text, re.IGNORECASE
        ):
            num = int(m.group(1).replace(".", ""))
            ano = int(m.group(2))
            # Try all tipos
            for tipo in ["PL", "PLP", "PDL", "PEC", "PRC"]:
                if (tipo, num, ano) in ref_to_id:
                    matches.append(ref_to_id[(tipo, num, ano)])
        return matches

    matched = []
    for v in all_vots:
        desc = (v.get("descricao") or "")
        pl_matches = extract_pl_refs(desc)
        if pl_matches:
            v["_pl_id"] = pl_matches[0]
            matched.append(v)
    print(f"\n>>> {len(matched)} votações cruzam com nosso universo (via regex na descrição)")

    # If low match count, also try fetching event details for unmatched
    if len(matched) < 20:
        print(">>> Tentando match por detalhe de votação...")
        unmatched = [v for v in all_vots if v not in matched]
        for i, v in enumerate(unmatched[:100], 1):
            if i % 20 == 0:
                print(f"  [{i}/100]")
            detail_desc, desc_abert = extract_pl_id_from_detail(v["id"])
            if detail_desc:
                refs = extract_pl_refs(detail_desc)
                if not refs and desc_abert:
                    refs = extract_pl_refs(desc_abert)
                if refs:
                    v["_pl_id"] = refs[0]
                    matched.append(v)
            time.sleep(0.1)
        print(f">>> Após detalhe: {len(matched)} votações")

    # Filter nominal only (aprovacao not None)
    nominal = [v for v in matched if v.get("aprovacao") is not None]
    print(f">>> {len(nominal)} nominais (com placar)")

    # 3. Fetch individual votes + aggregate
    coer = json.loads((DATA_DIR / "coerencia.json").read_text(encoding="utf-8"))
    sexo_idx = {d["id"]: d.get("sexo") for d in coer.get("deputados", [])}

    # Load existing votacoes to preserve editorial content
    try:
        existing = json.loads((DATA_DIR / "votacoes.json").read_text(encoding="utf-8"))
        existing_by_id = {v["id"]: v for v in existing.get("votacoes", [])}
    except Exception:
        existing_by_id = {}

    print(f"\nBuscando votos individuais de {len(nominal)} votações...")
    enriched = []
    for i, v in enumerate(nominal, 1):
        if i % 20 == 0:
            print(f"  [{i}/{len(nominal)}]")
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
        m = pls_meta[pid]

        # Reuse existing editorial if available
        ex = existing_by_id.get(v["id"], {})

        enriched.append({
            "id": v["id"],
            "data": v.get("data"),
            "pl_ref": f"{m['tipo']} {m['numero']}/{m['ano']}",
            "pl_id": pid,
            "projeto_sobre": ex.get("projeto_sobre", ""),
            "pl_ementa": m["ementa"],
            "pl_categoria": m["categoria"],
            "tipo": ex.get("tipo", ""),
            "o_que_foi_votado": ex.get("o_que_foi_votado", ""),
            "resultado": ex.get("resultado", ""),
            "interpretacao_sim": ex.get("interpretacao_sim", ""),
            "interpretacao_nao": ex.get("interpretacao_nao", ""),
            "descricao_camara": v.get("descricao", ""),
            "titulo_curto": ex.get("titulo_curto", ""),
            "totalSim": total_sim,
            "totalNao": total_nao,
            "resultado_placar": "aprovado" if v.get("aprovacao") == 1 else "rejeitado",
            "partidos": dict(partidos),
            "genero": genero,
            "autor": ex.get("autor"),
            "relator": ex.get("relator"),
        })
        time.sleep(0.1)

    # Sort by date desc
    enriched.sort(key=lambda x: x.get("data") or "", reverse=True)

    # Identify new votacoes that need editorial
    needs_editorial = [v for v in enriched if not v.get("projeto_sobre")]
    print(f"\n>>> {len(needs_editorial)} votações precisam de texto editorial")

    # 4. Generate editorial with LLM
    if needs_editorial:
        try:
            from anthropic import Anthropic
            import os
            if os.environ.get("ANTHROPIC_API_KEY"):
                client = Anthropic()
                print("Gerando interpretações com LLM...")
                for i, v in enumerate(needs_editorial, 1):
                    if i % 10 == 0:
                        print(f"  [{i}/{len(needs_editorial)}]")
                    prompt = f"""Você é jornalista especializada em políticas públicas. Preencha os campos abaixo sobre esta votação na Câmara dos Deputados. Seja DIDÁTICA — explique como se a pessoa nunca tivesse ouvido falar do tema.

PL: {v['pl_ref']}
Ementa: {v['pl_ementa']}
Descrição da Câmara: {v['descricao_camara']}
Placar: {v['totalSim']} SIM × {v['totalNao']} NÃO — {"aprovado" if v['resultado_placar'] == 'aprovado' else 'rejeitado'}

Responda em JSON estrito:
{{
  "titulo_curto": "título em até 8 palavras (sem PL/número)",
  "projeto_sobre": "2-3 frases explicando o que o projeto faz, em linguagem acessível",
  "tipo": "mérito ou procedural (mérito = decide conteúdo; procedural = decide rito/destaque/requerimento)",
  "o_que_foi_votado": "1 frase sobre o que exatamente foi votado nesta sessão",
  "resultado": "1 frase sobre o resultado e consequência",
  "interpretacao_sim": "1 frase: quem votou SIM é a favor de...",
  "interpretacao_nao": "1 frase: quem votou NÃO é a favor de..."
}}"""
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
                        print(f"  erro LLM em {v['id']}: {exc}")
                    time.sleep(0.1)
                print(">>> Interpretações geradas")
            else:
                print(">>> ANTHROPIC_API_KEY não setada — pulando LLM")
        except ImportError:
            print(">>> anthropic não instalado — pulando LLM")

    # 5. Fetch autor + relator for new ones
    for v in enriched:
        if v.get("autor"):
            continue
        pid = v["pl_id"]
        # Autor
        autores = fetch_json(f"{API}/proposicoes/{pid}/autores").get("dados", [])
        if autores:
            principal = min(autores, key=lambda a: a.get("ordemAssinatura") or 999)
            v["autor"] = {"nome": principal.get("nome"), "tipo": principal.get("tipo")}
        # Relator
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

    # Save
    (DATA_DIR / "votacoes.json").write_text(
        json.dumps({"votacoes": enriched}, ensure_ascii=False), encoding="utf-8"
    )

    print(f"\n>>> votacoes.json salvo — {len(enriched)} votações")
    por_pl = defaultdict(list)
    for v in enriched:
        por_pl[v["pl_ref"]].append(v)
    merito = [v for v in enriched if v.get("tipo") == "mérito"]
    print(f"    {len(merito)} de mérito, {len(enriched) - len(merito)} procedurais")
    print(f"    {len(por_pl)} PLs distintas")
    for ref, vots in list(por_pl.items())[:15]:
        v0 = vots[0]
        print(f"  {ref} [{v0.get('tipo','')}]: {v0.get('titulo_curto','?')} — {v0['totalSim']}x{v0['totalNao']}")


if __name__ == "__main__":
    main()
