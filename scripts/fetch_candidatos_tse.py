#!/usr/bin/env python3
"""
Cruza os deputados do nosso dataset com os pedidos de registro de
candidatura de 2026 publicados pelo TSE.

FONTE
-----
Portal de Dados Abertos do TSE, pacote `consulta_cand_<ANO>.zip`:
https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/

Usamos o CSV consolidado (`consulta_cand_<ANO>_BRASIL.csv`, latin-1,
separado por ";") em vez da API REST do DivulgaCand, que exige o
idEleicao de cada pleito e não tem contrato público estável. O pacote
de dados abertos é estático e traz todos os cargos de todas as UFs
numa requisição só.

CHAVE DE CRUZAMENTO
-------------------
CPF. A API da Câmara expõe o CPF de cada deputado em
/deputados/{id} e o TSE traz NR_CPF_CANDIDATO. É join exato: nome de
urna não serve como chave (na eleição de 2026 o casamento por nome
confundia André Ferreira com Anderson Ferreira, Ely Santos com Ney
Santos e Ricardo Salles com Jorge Ricardo Salles Ramos — todos
homônimos parciais na mesma UF e no mesmo partido).

Os CPFs são usados só em memória. O JSON de saída guarda apenas os
IDs da Câmara: não faz sentido este repositório publicar um cadastro
de CPFs, mesmo que cada um deles esteja público na origem.

ACESSO
------
O domínio tse.jus.br fica atrás de Akamai Bot Manager, que devolve 403
para clientes com fingerprint TLS de script (urllib, requests, curl).
Por isso a requisição vai por curl_cffi com impersonação de Chrome.
Leitura de dado público de transparência eleitoral, uma requisição por dia.

FALHA BARULHENTA
----------------
A versão anterior deste script engolia qualquer erro e imprimia
"API do TSE ainda não disponível" — o passo passava verde no CI
enquanto o site prometia um dado que nunca chegava. Agora:
- 404 no arquivo do ano  -> ainda não publicado, sai 0 (silêncio ok)
- 403 / erro de rede     -> exit 1, o workflow falha e aparece
- arquivo publicado mas nenhum deputado casa, ou queda maior que
  MAX_DROP_PCT em relação ao já publicado -> exit 1
"""

import csv
import io
import json
import sys
import urllib.request
import zipfile
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from datetime import date
from pathlib import Path

ANO = 2026
DATA_DIR = Path(__file__).parent.parent / "src" / "data"
SAIDA = DATA_DIR / "candidatos_2026.json"

CDN = "https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand"
URL_ZIP = f"{CDN}/consulta_cand_{ANO}.zip"
CSV_BRASIL = f"consulta_cand_{ANO}_BRASIL.csv"

CAMARA_API = "https://dadosabertos.camara.leg.br/api/v2/deputados"
CARGO_REELEICAO = "DEPUTADO FEDERAL"

# Queda máxima tolerada em relação à contagem já publicada.
MAX_DROP_PCT = 10.0

# Situações que tiram o nome da disputa. Enquanto o registro não foi
# julgado o TSE preenche "#NE", que aqui conta como candidatura válida.
SITUACOES_FORA = {
    "INDEFERIDO",
    "INDEFERIDO COM RECURSO",
    "CANCELADO",
    "CANCELADO COM RECURSO",
    "RENÚNCIA",
    "FALECIDO",
    "NÃO CONHECIMENTO DO PEDIDO",
}


class TSEIndisponivel(Exception):
    """Falha de acesso — diferente de 'ainda não publicado'."""


def baixar_tse(url: str) -> bytes | None:
    """Baixa a URL. Devolve None em 404 (ano ainda não publicado).
    Levanta TSEIndisponivel em qualquer outra falha."""
    try:
        from curl_cffi import requests as cffi
    except ImportError:
        raise TSEIndisponivel(
            "curl_cffi não instalado. O Akamai do TSE responde 403 para "
            "urllib/requests; instale com `pip install curl_cffi`."
        )

    try:
        r = cffi.get(url, impersonate="chrome", timeout=180)
    except Exception as e:
        raise TSEIndisponivel(f"erro de rede em {url}: {type(e).__name__}: {e}")

    if r.status_code == 404:
        return None
    if r.status_code == 403:
        raise TSEIndisponivel(
            f"403 em {url} — Akamai bloqueou o cliente. Conferir se a "
            "impersonação do curl_cffi ainda passa ou se o IP do runner "
            "entrou em bloqueio."
        )
    if r.status_code != 200:
        raise TSEIndisponivel(f"HTTP {r.status_code} em {url}")
    if len(r.content) < 100_000:
        raise TSEIndisponivel(f"resposta curta demais ({len(r.content)} bytes) em {url}")
    return r.content


def so_digitos(cpf: str | None) -> str | None:
    d = "".join(c for c in (cpf or "") if c.isdigit())
    return d.zfill(11) if d else None


def cpf_do_deputado(dep_id: int) -> str | None:
    """CPF do deputado na API da Câmara. Só trafega em memória."""
    req = urllib.request.Request(
        f"{CAMARA_API}/{dep_id}",
        headers={"Accept": "application/json", "User-Agent": "observatoriomulheres/1.0"},
    )
    for _ in range(3):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return so_digitos(json.load(r)["dados"].get("cpf"))
        except Exception:
            continue
    return None


def publicado_antes() -> int:
    if not SAIDA.exists():
        return 0
    try:
        dados = json.loads(SAIDA.read_text(encoding="utf-8"))
        return len(dados.get("candidatos_ids") or [])
    except Exception:
        return 0


def main() -> int:
    print(f">>> Buscando candidaturas {ANO} nos dados abertos do TSE...")
    anterior = publicado_antes()

    try:
        blob = baixar_tse(URL_ZIP)
    except TSEIndisponivel as e:
        print(f"!!! ERRO: {e}", file=sys.stderr)
        return 1

    if blob is None:
        print(f">>> {URL_ZIP} ainda não publicado (404). Nenhuma alteração.")
        if anterior:
            print(
                f"!!! ERRO: o arquivo sumiu do TSE, mas já havia {anterior} "
                "candidatos publicados. Mantendo o JSON e falhando.",
                file=sys.stderr,
            )
            return 1
        return 0

    z = zipfile.ZipFile(io.BytesIO(blob))
    if CSV_BRASIL not in z.namelist():
        print(
            f"!!! ERRO: {CSV_BRASIL} não veio no zip. Conteúdo: {z.namelist()[:6]}",
            file=sys.stderr,
        )
        return 1

    linhas = list(
        csv.DictReader(
            io.StringIO(z.read(CSV_BRASIL).decode("latin-1")),
            delimiter=";",
            quotechar='"',
        )
    )
    print(f">>> {len(linhas)} candidaturas no pacote do TSE")

    por_cpf = defaultdict(list)
    for r in linhas:
        if (r.get("DS_SITUACAO_CANDIDATURA") or "").strip().upper() in SITUACOES_FORA:
            continue
        cpf = so_digitos(r.get("NR_CPF_CANDIDATO"))
        if cpf:
            por_cpf[cpf].append(r)

    deputados = json.loads(
        (DATA_DIR / "autoria.json").read_text(encoding="utf-8")
    )["deputados"]
    print(f">>> {len(deputados)} deputados no dataset — buscando CPF na API da Câmara")

    with ThreadPoolExecutor(max_workers=8) as pool:
        cpfs = list(pool.map(lambda d: cpf_do_deputado(d["id"]), deputados))

    sem_cpf = [d["nome"] for d, c in zip(deputados, cpfs) if not c]
    if len(sem_cpf) > len(deputados) * 0.1:
        print(
            f"!!! ERRO: {len(sem_cpf)} deputados sem CPF na API da Câmara. "
            "Cruzamento não é confiável.",
            file=sys.stderr,
        )
        return 1

    candidatos_ids: list[int] = []
    outros_cargos: dict[str, str] = {}
    sem_candidatura: list[str] = []

    for dep, cpf in zip(deputados, cpfs):
        registros = por_cpf.get(cpf or "", [])
        cargos = {r["DS_CARGO"] for r in registros}
        if CARGO_REELEICAO in cargos:
            candidatos_ids.append(dep["id"])
        elif cargos:
            outros_cargos[str(dep["id"])] = sorted(cargos)[0]
        else:
            sem_candidatura.append(f'{dep["nome"]} ({dep["uf"]}/{dep["partido"]})')

    candidatos_ids.sort()
    total = len(candidatos_ids)

    if total == 0:
        print(
            "!!! ERRO: pacote do TSE baixado, mas nenhum deputado casou por CPF. "
            "Provável mudança de layout do CSV.",
            file=sys.stderr,
        )
        return 1

    if anterior and total < anterior * (1 - MAX_DROP_PCT / 100):
        print(
            f"!!! ERRO: queda de {anterior} para {total} candidatos "
            f"(mais de {MAX_DROP_PCT}%). Mantendo o JSON publicado.",
            file=sys.stderr,
        )
        return 1

    amostra = linhas[0] if linhas else {}
    julgados = any(
        (r.get("DS_SITUACAO_CANDIDATURA") or "").strip().upper() not in ("", "#NE")
        for r in linhas
    )

    saida = {
        "candidatos_ids": candidatos_ids,
        "outros_cargos": dict(sorted(outros_cargos.items(), key=lambda kv: int(kv[0]))),
        "atualizado": date.today().isoformat(),
        "geracao_tse": " ".join(
            filter(None, [amostra.get("DT_GERACAO"), amostra.get("HH_GERACAO")])
        ),
        "fonte": "TSE — Portal de Dados Abertos, consulta_cand",
        "url_fonte": URL_ZIP,
        "chave_cruzamento": "CPF (API da Câmara × NR_CPF_CANDIDATO do TSE)",
        "registros_julgados": julgados,
        "total_candidatos": total,
        "total_outros_cargos": len(outros_cargos),
        "total_deputados_analisados": len(deputados),
        "sem_candidatura": len(sem_candidatura),
    }
    SAIDA.write_text(json.dumps(saida, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"\n>>> {total} deputados pediram registro à reeleição")
    print(f">>> {len(outros_cargos)} concorrem a outro cargo")
    print(f">>> {len(sem_candidatura)} sem candidatura registrada")
    if sem_cpf:
        print(f">>> {len(sem_cpf)} sem CPF na Câmara (ficaram de fora): {', '.join(sem_cpf[:10])}")
    print(
        f">>> candidatos_2026.json salvo — geração TSE {saida['geracao_tse']}, "
        f"registros {'julgados' if julgados else 'ainda em julgamento'}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
