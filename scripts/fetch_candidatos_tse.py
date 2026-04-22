#!/usr/bin/env python3
"""
Busca lista de candidatos à Câmara dos Deputados em 2026 no TSE.

A API do TSE só fica disponível após o início do período de registro
de candidaturas (geralmente junho-agosto do ano eleitoral). Até lá,
o script retorna silenciosamente sem alterar o JSON.

Endpoints conhecidos do TSE:
- divulgacandcontas.tse.jus.br/divulga/rest/v1/candidatura/listar/{ANO}/{UF}/2/candidatos

O script tenta buscar e, se conseguir, cruza com os IDs dos deputados
em exercício pra produzir candidatos_2026.json com os IDs que estão
no nosso dataset E se candidataram.
"""

import json
import time
import urllib.request
from pathlib import Path
from datetime import date

DATA_DIR = Path(__file__).parent.parent / "src" / "data"

UFS = [
    "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA",
    "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN",
    "RO", "RR", "RS", "SC", "SE", "SP", "TO",
]

TSE_BASE = "https://divulgacandcontas.tse.jus.br/divulga/rest/v1"


def fetch_json(url, retries=2):
    for attempt in range(retries):
        try:
            req = urllib.request.Request(
                url, headers={"User-Agent": "mapa-violencia-mulher/1.0"}
            )
            with urllib.request.urlopen(req, timeout=15) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception:
            if attempt == retries - 1:
                return None
            time.sleep(1)
    return None


def main():
    print(">>> Tentando buscar candidatos 2026 no TSE...")

    # Tentar um UF de teste pra ver se a API já tá no ar
    test = fetch_json(f"{TSE_BASE}/candidatura/listar/2026/SP/2/candidatos")
    if not test or not isinstance(test, dict) or "candidatos" not in test:
        print(">>> API do TSE ainda não disponível pra 2026. Nenhuma alteração.")
        return

    print(">>> API do TSE disponível! Buscando candidatos de todos os estados...")

    # Carregar IDs dos deputados no nosso dataset
    autoria = json.loads((DATA_DIR / "autoria.json").read_text(encoding="utf-8"))
    nossos_ids = {d["id"] for d in autoria["deputados"]}
    nossos_nomes = {d["nome"].strip().upper(): d["id"] for d in autoria["deputados"]}

    candidatos_ids = set()
    for uf in UFS:
        data = fetch_json(f"{TSE_BASE}/candidatura/listar/2026/{uf}/2/candidatos")
        if not data or "candidatos" not in data:
            print(f"  {uf}: sem dados")
            continue

        for cand in data["candidatos"]:
            nome = (cand.get("nomeCompleto") or cand.get("nomeUrna") or "").strip().upper()
            # Tentar match por nome (TSE não usa mesmo ID que Câmara)
            if nome in nossos_nomes:
                candidatos_ids.add(nossos_nomes[nome])

        print(f"  {uf}: {len(data['candidatos'])} candidatos, {len(candidatos_ids)} matches até agora")
        time.sleep(0.2)

    out = {
        "candidatos_ids": sorted(candidatos_ids),
        "atualizado": date.today().isoformat(),
        "fonte": "TSE - Divulgação de Candidaturas e Contas Eleitorais",
        "total_candidatos": len(candidatos_ids),
    }

    (DATA_DIR / "candidatos_2026.json").write_text(
        json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"\n>>> candidatos_2026.json salvo: {len(candidatos_ids)} candidatos à reeleição no nosso dataset")


if __name__ == "__main__":
    main()
