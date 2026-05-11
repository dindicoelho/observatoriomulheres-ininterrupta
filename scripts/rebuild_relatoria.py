#!/usr/bin/env python3
"""
Reconstrói relatoria.json a partir das tramitações das PLs em autoria.json.

Estrutura:
{
  "total_designacoes": N,
  "por_sexo": {"F": x, "M": y, "?": z},
  "pls_tipo_relatoria": {"só mulher": a, "só homem": b, "misto": c, "indefinido": d},
  "top_relatores": [{"nome": "X (PART-UF)", "designacoes": n, "sexo": "F|M"}, ...]
}

A relatoria de uma PL é detectada no campo "despacho" das tramitações,
padrão "Designad[oa] Relat[oa]r[ae] Dep. X (PARTIDO/UF)". Uma PL pode
ter múltiplos relatores (comissões diferentes), todos contam.

O sexo do relator vem de autoria.json (que já tem sexo por deputado).
Quando o relator não bate com ninguém em autoria.json (PLs com keywords
periféricas, ou relator fora da legislatura 57), o sexo fica "?".
"""

import json
import re
import time
import unicodedata
import urllib.error
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path

API = "https://dadosabertos.camara.leg.br/api/v2"
DATA_DIR = Path(__file__).parent.parent / "src" / "data"

DESIGN_RE = re.compile(
    r"Designad[oa]\s+Relat[oa]r[ae]?,?\s*Dep\.?\s*([^(]+?)\s*\(([^)]+)\)",
    re.IGNORECASE,
)


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


def normalize(s: str) -> str:
    """Lowercase, sem acento, espaços colapsados."""
    s = unicodedata.normalize("NFKD", s or "")
    s = "".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"\s+", " ", s).strip().lower()


def main():
    print("=" * 60)
    print("Reconstruindo relatoria.json")
    print("=" * 60)

    autoria = json.loads((DATA_DIR / "autoria.json").read_text(encoding="utf-8"))
    deps = autoria["deputados"]

    # Índice de sexo por nome normalizado.
    # Cobertura: autoria.json (deputados com PLs sobre o tema) +
    # coerencia.json (todos da 57ª — fallback pra relatores periféricos).
    sexo_por_nome: dict = {}
    for d in deps:
        sexo_por_nome[normalize(d["nome"])] = d.get("sexo")
    coer_path = DATA_DIR / "coerencia.json"
    if coer_path.exists():
        coer = json.loads(coer_path.read_text(encoding="utf-8"))
        for d in coer.get("deputados", []):
            n = normalize(d["nome"])
            if n not in sexo_por_nome and d.get("sexo"):
                sexo_por_nome[n] = d["sexo"]

    # Universo de PLs: todas as PLs únicas em autoria.json
    pls = {}
    for d in deps:
        for pl in d["pls"]:
            pls[pl["id"]] = pl
    print(f">>> {len(pls)} PLs únicas para varrer tramitações")

    # Pra cada PL, busca tramitações e detecta relatores
    designacoes: list = []
    relatores_por_pl: dict = defaultdict(list)  # pl_id -> [(nome, part_uf)]
    for i, (pid, pl) in enumerate(sorted(pls.items()), 1):
        if i % 50 == 0:
            print(f"    [{i}/{len(pls)}] tramitações coletadas")
        data = fetch_json(f"{API}/proposicoes/{pid}/tramitacoes")
        vistos_nessa_pl = set()
        for t in data.get("dados", []) or []:
            desp = t.get("despacho", "") or ""
            for m in DESIGN_RE.finditer(desp):
                nome = m.group(1).strip().rstrip(".")
                part_uf = m.group(2).strip()
                chave = (normalize(nome), part_uf)
                if chave in vistos_nessa_pl:
                    continue
                vistos_nessa_pl.add(chave)
                designacoes.append({
                    "pl_id": pid,
                    "nome": nome,
                    "part_uf": part_uf,
                })
                relatores_por_pl[pid].append((nome, part_uf))
        time.sleep(0.03)

    print(f"\n>>> {len(designacoes)} designações detectadas em {len(relatores_por_pl)} PLs")

    # Sexo por designação (cruza com nome normalizado)
    por_sexo = Counter()
    for d in designacoes:
        s = sexo_por_nome.get(normalize(d["nome"])) or "?"
        d["sexo"] = s
        por_sexo[s] += 1

    # Tipo de relatoria por PL
    pls_tipo = Counter()
    for pid, lst in relatores_por_pl.items():
        sexos = {sexo_por_nome.get(normalize(n)) for n, _ in lst}
        sexos.discard(None)
        if not sexos:
            pls_tipo["indefinido"] += 1
        elif sexos == {"F"}:
            pls_tipo["só mulher"] += 1
        elif sexos == {"M"}:
            pls_tipo["só homem"] += 1
        elif "F" in sexos and "M" in sexos:
            pls_tipo["misto"] += 1
        else:
            pls_tipo["indefinido"] += 1

    # Top relatores: contagem por (nome + part-uf), pega sexo do primeiro match
    contagem: Counter = Counter()
    sexo_relator: dict = {}
    for d in designacoes:
        chave = f"{d['nome']} ({d['part_uf']})"
        contagem[chave] += 1
        # registra sexo apenas se ainda não temos
        if chave not in sexo_relator:
            sexo_relator[chave] = d["sexo"]

    top_relatores = [
        {"nome": k, "designacoes": v, "sexo": sexo_relator.get(k, "?")}
        for k, v in contagem.most_common(30)
    ]

    out = {
        "total_designacoes": len(designacoes),
        "por_sexo": dict(por_sexo),
        "pls_tipo_relatoria": dict(pls_tipo),
        "top_relatores": top_relatores,
    }

    (DATA_DIR / "relatoria.json").write_text(
        json.dumps(out, ensure_ascii=False), encoding="utf-8"
    )

    print("\n>>> relatoria.json salvo")
    print(f"    total_designacoes: {out['total_designacoes']}")
    print(f"    por_sexo: {out['por_sexo']}")
    print(f"    pls_tipo_relatoria: {out['pls_tipo_relatoria']}")
    print(f"    Top 5 relatoras:")
    for r in top_relatores[:5]:
        print(f"      {r['designacoes']:3d}× {r['nome']} [{r['sexo']}]")


if __name__ == "__main__":
    main()
