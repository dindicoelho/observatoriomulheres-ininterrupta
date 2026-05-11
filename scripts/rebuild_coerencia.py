#!/usr/bin/env python3
"""
Reconstrói coerencia.json a partir das votações de mérito de plenário.

Estrutura do arquivo:
{
  "merito_vote_ids": [...],
  "deputados": [{id, nome, partido, uf, foto, sexo, sim, nao,
                 ausencias, participacoes, score, votes_by_id}]
}

Score = sim / (sim + nao) × 100. Não usa voto_pro_mulher — o frontend
exibe os votos com aviso editorial de que "o contexto de cada PL
importa" (ver RankingDeputados.tsx no modal de cada deputado).

Os IDs vêm dinamicamente de votacoes.json (campo tipo == "mérito").
Esse arquivo é atualizado pelo update_votacoes.py quando detecta novas
votações nominais no plenário. Resultado: quando aparece uma 5ª votação
de mérito, ela entra automaticamente no modal sem precisar editar
código nem este script.

O frontend lê o mesmo votacoes.json pra montar os labels dinamicamente,
então não há sincronização manual entre duas listas.
"""

import json
import time
import urllib.error
import urllib.request
from pathlib import Path

API = "https://dadosabertos.camara.leg.br/api/v2"
DATA_DIR = Path(__file__).parent.parent / "src" / "data"


def carregar_merito_ids() -> list[str]:
    """Lê votacoes.json e retorna IDs das votações de mérito, ordenadas
    por data desc (mais recentes primeiro)."""
    p = DATA_DIR / "votacoes.json"
    if not p.exists():
        print(">>> votacoes.json não encontrado — sem votações de mérito.")
        return []
    data = json.loads(p.read_text(encoding="utf-8"))
    meritos = [v for v in data.get("votacoes", []) if v.get("tipo") == "mérito"]
    meritos.sort(key=lambda x: x.get("data", ""), reverse=True)
    ids = [v["id"] for v in meritos if v.get("id")]
    return ids


def fetch_json(url: str, retries: int = 4) -> dict:
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "mvm/1.0"})
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.loads(r.read().decode("utf-8"))
        except (urllib.error.URLError, TimeoutError) as exc:
            if attempt == retries - 1:
                print(f"    falhou: {exc}")
                return {}
            time.sleep(2 ** attempt)
    return {}


def fetch_deputados_57() -> list:
    """Lista deputados em exercício na 57ª legislatura."""
    out = []
    pag = 1
    while True:
        page = fetch_json(
            f"{API}/deputados?idLegislatura=57&itens=100&pagina={pag}"
            f"&ordem=ASC&ordenarPor=nome"
        )
        dados = page.get("dados", [])
        if not dados:
            break
        out.extend(dados)
        if len(dados) < 100:
            break
        pag += 1
        if pag > 50:
            break
    return out


def fetch_votos(votacao_id: str) -> dict:
    """Retorna {deputado_id: 'Sim' | 'Não' | 'Outros'} para uma votação."""
    data = fetch_json(f"{API}/votacoes/{votacao_id}/votos")
    out = {}
    for vt in data.get("dados", []) or []:
        dep_id = (vt.get("deputado_") or {}).get("id")
        if not dep_id:
            continue
        tipo = (vt.get("tipoVoto") or "").lower()
        if "sim" in tipo:
            out[dep_id] = "Sim"
        elif "não" in tipo or "nao" in tipo:
            out[dep_id] = "Não"
        else:
            out[dep_id] = "Outros"
    return out


def main():
    print("=" * 60)
    print("Reconstruindo coerencia.json")
    print("=" * 60)

    # Carrega sexo dos deputados a partir de autoria.json (já tem)
    autoria_path = DATA_DIR / "autoria.json"
    sexo_idx: dict = {}
    if autoria_path.exists():
        autoria = json.loads(autoria_path.read_text(encoding="utf-8"))
        sexo_idx = {d["id"]: d.get("sexo") for d in autoria.get("deputados", [])}

    merito_ids = carregar_merito_ids()
    if not merito_ids:
        print(">>> Nenhuma votação de mérito encontrada em votacoes.json — saindo.")
        return
    print(f">>> {len(merito_ids)} votações de mérito carregadas de votacoes.json")

    print(f"\n[1/3] Buscando deputados da 57ª legislatura...")
    deps = fetch_deputados_57()
    print(f">>> {len(deps)} deputados encontrados")

    print(f"\n[2/3] Coletando votos em {len(merito_ids)} votações de mérito...")
    votos_por_votacao: dict = {}
    for i, vid in enumerate(merito_ids, 1):
        print(f"    [{i}/{len(merito_ids)}] {vid}")
        votos_por_votacao[vid] = fetch_votos(vid)
        time.sleep(0.2)

    print(f"\n[3/3] Montando coerencia.json...")
    deputados_out = []
    for d in deps:
        dep_id = d["id"]
        votes_by_id: dict = {}
        sim = nao = ausencias = 0
        for vid in merito_ids:
            voto = votos_por_votacao[vid].get(dep_id)
            if voto == "Sim":
                votes_by_id[vid] = "Sim"
                sim += 1
            elif voto == "Não":
                votes_by_id[vid] = "Não"
                nao += 1
            elif voto == "Outros":
                votes_by_id[vid] = "Outros"
                # Conta como ausência pra fins de score
                ausencias += 1
            else:
                ausencias += 1

        participacoes = sim + nao
        score = (sim / participacoes * 100) if participacoes > 0 else 0.0
        deputados_out.append({
            "id": dep_id,
            "nome": d.get("nome"),
            "partido": d.get("siglaPartido"),
            "uf": d.get("siglaUf"),
            "foto": d.get("urlFoto")
                    or f"https://www.camara.leg.br/internet/deputado/bandep/{dep_id}.jpg",
            "sexo": sexo_idx.get(dep_id),
            "sim": sim,
            "nao": nao,
            "ausencias": ausencias,
            "participacoes": participacoes,
            "score": round(score, 1),
            "votes_by_id": votes_by_id,
        })

    out = {
        "merito_vote_ids": merito_ids,
        "deputados": deputados_out,
    }
    (DATA_DIR / "coerencia.json").write_text(
        json.dumps(out, ensure_ascii=False), encoding="utf-8"
    )
    print(f">>> coerencia.json salvo: {len(deputados_out)} deputados")

    # Preview
    from collections import Counter
    score_dist = Counter(int(d["score"] // 25) for d in deputados_out)
    print("\n>>> Distribuição de scores:")
    for faixa in sorted(score_dist.keys()):
        rotulo = f"{faixa*25}-{faixa*25+24}%" if faixa < 4 else "100%"
        print(f"    {rotulo:>8}: {score_dist[faixa]:3d} deputados")


if __name__ == "__main__":
    main()
