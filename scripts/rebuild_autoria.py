#!/usr/bin/env python3
"""
Reconstrói autoria.json e articuladores_uf.json com keywords expandidas.

Problema anterior: keywords muito restritas (só "feminicídio",
"violência contra mulher", "Maria da Penha", "violência doméstica")
deixavam de fora deputadas como Erika Hilton que trabalham pautas
mais amplas (assédio, violência sexual, aborto, transfeminicídio).

Agora:
- Keywords ampliadas pra capturar o universo real de políticas pró-mulher
- Classificação estrutural/incremental reavaliada
- minPls cai pra 3 no front (menos restritivo)
"""

import json
import re
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from collections import defaultdict

# Câmara API tolera ~10 conexões simultâneas sem reclamar
MAX_WORKERS = 10

API = "https://dadosabertos.camara.leg.br/api/v2"
DATA_DIR = Path(__file__).parent.parent / "src" / "data"

# Keywords ampliadas — capturam o universo real de pautas de gênero/mulher
# Ordenadas por relevância, ementa precisa conter AO MENOS UMA
KEYWORDS = [
    # Violência contra a mulher (núcleo)
    "violência contra mulher",
    "violência contra a mulher",
    "violência contra mulheres",
    "violência contra as mulheres",
    "violência doméstica",
    "violência familiar",
    "violência de gênero",
    "violência política de gênero",
    "violência política contra mulher",
    "violência obstétrica",
    "violência psicológica",
    "violência sexual",
    "violência vicária",
    # Feminicídio e afins
    "feminicídio",
    "transfeminicídio",
    # Leis de referência
    "maria da penha",
    "lei maria da penha",
    "lei do feminicídio",
    "henry borel",
    "lei henry borel",
    "lei carolina dieckmann",
    "lei henrique eduardo alves",
    # Crimes sexuais e correlatos
    "estupro",
    "estuprador",
    "importunação sexual",
    "assédio sexual",
    "assédio moral",
    "assédio",
    "crime sexual",
    "abuso sexual",
    "exploração sexual",
    "pornografia infantil",
    "crimes contra a dignidade sexual",
    # Proteção e políticas
    "proteção à mulher",
    "proteção das mulheres",
    "proteção da mulher",
    "proteção à vítima",
    "medida protetiva",
    "medidas protetivas",
    "monitoramento eletrônico",
    "patrulha maria da penha",
    "casa da mulher brasileira",
    "disque 180",
    "disque denúncia",
    # Saúde e direitos reprodutivos
    "saúde da mulher",
    "saúde materna",
    "mortalidade materna",
    "parto humanizado",
    "licença-maternidade",
    "licença maternidade",
    "licença gestante",
    "gestante",
    "gravidez",
    "aborto",
    "abortamento",
    "interrupção da gravidez",
    "interrupção voluntária",
    "amamentação",
    "aleitamento",
    "câncer de mama",
    "câncer de colo",
    "endometriose",
    "climatério",
    "menopausa",
    # Discriminação e igualdade
    "discriminação de gênero",
    "discriminação contra mulher",
    "discriminação por sexo",
    "igualdade de gênero",
    "igualdade salarial",
    "paridade de gênero",
    "cotas para mulheres",
    "participação política da mulher",
    # Trabalho e economia
    "mãe solo",
    "mães solo",
    "monoparental",
    "pensão alimentícia",
    "guarda compartilhada",
    "mulher chefe de família",
    # Identidade
    "mulher trans",
    "mulheres trans",
    "transexual",
    # Grupos específicos
    "mulher negra",
    "mulher indígena",
    "mulher idosa",
    "mulher com deficiência",
    "meninas e mulheres",
    "meninas",
    # Educação e cultura
    "educação de gênero",
    "escola sem violência",
]

# Para matching: normalizar e comparar com "contém"
def normalize(s: str) -> str:
    # Remove acentos básicos pra matchear sem depender de encoding
    repl = str.maketrans(
        "áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ",
        "aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC",
    )
    return s.translate(repl).lower()

KW_NORMALIZED = [normalize(k) for k in KEYWORDS]


def matches_keywords(ementa: str) -> bool:
    e = normalize(ementa or "")
    return any(kw in e for kw in KW_NORMALIZED)


# Classificação estrutural / incremental / simbólica
# Estrutural = cria nova política / programa / sistema / instituto / plano nacional
# Incremental = altera lei existente pra melhorar proteção
# Simbólica = homenagem, data comemorativa, denominação
def classify(ementa: str) -> str:
    e = normalize(ementa or "")

    simbolica_patterns = [
        r"institui.*(dia|semana|m[eê]s) (nacional|mundial|internacional|estadual|municipal|do|da|de)",
        r"denomin(a|ar)",
        r"altera.*denomina",
        r"homenage",
        r"declara.*(patrimonio|utilidade publica)",
        r"concede.*(titulo|medalha|honraria)",
    ]
    for pat in simbolica_patterns:
        if re.search(pat, e):
            return "simbólica"

    estrutural_patterns = [
        r"institui.*(politica|programa|plano|sistema|fundo|comite|conselho|observatorio|rede) nacional",
        r"cria.*(politica|programa|plano|sistema|fundo|comite|conselho|observatorio|rede) nacional",
        r"institui.*(politica|programa|plano|sistema) (publico|publica)",
        r"cria o (instituto|sistema|programa|fundo|observatorio|conselho|comite)",
        r"institui o (instituto|sistema|programa|fundo|observatorio|conselho|comite)",
        r"estabelece (diretrizes|normas gerais).*(politica|sistema|proteção|enfrentamento)",
        r"dispoe sobre o sistema nacional",
        r"dispoe sobre a politica nacional",
        r"institui.*licença",
        r"institui.*pensao especial",
        r"institui.*auxilio",
        r"institui.*beneficio",
        r"institui.*subsidio",
        r"cria.*programa",
    ]
    for pat in estrutural_patterns:
        if re.search(pat, e):
            return "estrutural"

    return "incremental"


def fetch_json(url: str, retries: int = 4) -> dict:
    for attempt in range(retries):
        try:
            req = urllib.request.Request(
                url, headers={"User-Agent": "mapa-violencia-mulher/1.0"}
            )
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception as exc:
            if attempt == retries - 1:
                raise
            sleep_s = 2 ** attempt
            print(f"    retry {attempt+1}/{retries} em {sleep_s}s: {exc}")
            time.sleep(sleep_s)


def fetch_proposicoes_page(ano: int, pagina: int) -> dict:
    # tipos: PL (proj lei), PLP (proj lei compl), PEC (emenda const), PRC (proj res câmara), PDL (proj dec leg)
    params = {
        "ano": ano,
        "siglaTipo": "PL,PLP,PEC,PRC,PDL",
        "itens": 100,
        "pagina": pagina,
        "ordem": "ASC",
        "ordenarPor": "id",
    }
    url = f"{API}/proposicoes?{urllib.parse.urlencode(params)}"
    return fetch_json(url)


def fetch_all_proposicoes_year(ano: int) -> list:
    out = []
    pag = 1
    while True:
        page = fetch_proposicoes_page(ano, pag)
        dados = page.get("dados", [])
        if not dados:
            break
        out.extend(dados)
        if len(dados) < 100:
            break
        pag += 1
        if pag > 500:  # safety
            break
    return out


def fetch_autores(prop_id: int) -> list:
    url = f"{API}/proposicoes/{prop_id}/autores"
    return fetch_json(url).get("dados", [])


def fetch_deputados_ativos() -> list:
    # Deputados em exercício na 57ª legislatura (2023-2026)
    all_deps = []
    pag = 1
    while True:
        url = f"{API}/deputados?idLegislatura=57&itens=100&pagina={pag}&ordem=ASC&ordenarPor=nome"
        page = fetch_json(url)
        dados = page.get("dados", [])
        if not dados:
            break
        all_deps.extend(dados)
        if len(dados) < 100:
            break
        pag += 1
        if pag > 50:
            break
    return all_deps


def fetch_deputado_detalhe(dep_id: int) -> dict:
    url = f"{API}/deputados/{dep_id}"
    return fetch_json(url).get("dados", {})


def main():
    print("=" * 60)
    print("Reconstruindo autoria.json com keywords expandidas")
    print("=" * 60)

    # 1. Buscar todos os PLs dos anos 2023-2026
    all_props = []
    for ano in [2023, 2024, 2025, 2026]:
        print(f"\n[{ano}] buscando proposições...")
        props = fetch_all_proposicoes_year(ano)
        print(f"  {len(props)} proposições no ano")
        all_props.extend(props)
        time.sleep(0.3)

    print(f"\n>>> Total de proposições 2023-2026: {len(all_props)}")

    # 2. Filtrar por keywords
    filtered = [p for p in all_props if matches_keywords(p.get("ementa", ""))]
    print(f">>> Após filtro de keywords: {len(filtered)} proposições relevantes")

    # 3. Classificar
    for p in filtered:
        p["categoria"] = classify(p.get("ementa", ""))

    cats = defaultdict(int)
    for p in filtered:
        cats[p["categoria"]] += 1
    print(f">>> Categorias: {dict(cats)}")

    # 4. Para cada proposição, buscar autores (paralelo)
    print(f"\nBuscando autores de {len(filtered)} proposições (paralelo, {MAX_WORKERS} workers)...")
    por_autor = defaultdict(list)
    done = 0
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        future_to_prop = {
            executor.submit(fetch_autores, p["id"]): p for p in filtered
        }
        for future in as_completed(future_to_prop):
            p = future_to_prop[future]
            done += 1
            if done % 100 == 0:
                print(f"  [{done}/{len(filtered)}]")
            try:
                autores = future.result()
            except Exception as exc:
                print(f"  erro em {p['id']}: {exc}")
                continue

            for a in autores:
                uri = a.get("uri") or ""
                # só deputados (uri /deputados/<id>)
                m = re.search(r"/deputados/(\d+)", uri)
                if not m:
                    continue
                dep_id = int(m.group(1))
                por_autor[dep_id].append(
                    {
                        "id": p["id"],
                        "tipo": p["siglaTipo"],
                        "numero": p["numero"],
                        "ano": p["ano"],
                        "ementa": p["ementa"],
                        "data": p.get("dataApresentacao", "")[:10],
                        "categoria": p["categoria"],
                        "autor_nome": a.get("nome"),
                    }
                )

    print(f">>> {len(por_autor)} autores distintos encontrados")

    # 5. Buscar dados dos deputados ativos (57ª legislatura)
    print("\nBuscando deputados da 57ª legislatura...")
    deps_ativos = fetch_deputados_ativos()
    deps_idx = {d["id"]: d for d in deps_ativos}
    print(f">>> {len(deps_ativos)} deputados na 57ª legislatura")

    # 6. Enriquecer com situação (Exercício vs Afastado) — paralelo
    print(f"\nBuscando situação detalhada (paralelo, {MAX_WORKERS} workers)...")
    deps_detalhe = {}
    done = 0
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        future_to_dep = {
            executor.submit(fetch_deputado_detalhe, d["id"]): d for d in deps_ativos
        }
        for future in as_completed(future_to_dep):
            d = future_to_dep[future]
            done += 1
            if done % 100 == 0:
                print(f"  [{done}/{len(deps_ativos)}]")
            try:
                deps_detalhe[d["id"]] = future.result()
            except Exception as exc:
                print(f"  erro em {d['id']}: {exc}")

    # 7. Montar autoria.json
    deputados_out = []
    for dep_id, pls in por_autor.items():
        # Preferir deputado da 57ª ativo; se não estiver, pular (fora do escopo)
        base = deps_idx.get(dep_id)
        if not base:
            continue
        det = deps_detalhe.get(dep_id, {})
        status = det.get("ultimoStatus", {}) or {}

        total = len(pls)
        simbolicas = sum(1 for p in pls if p["categoria"] == "simbólica")
        incrementais = sum(1 for p in pls if p["categoria"] == "incremental")
        estruturais = sum(1 for p in pls if p["categoria"] == "estrutural")

        # Ordenar PLs por data desc (mais recentes primeiro)
        pls_sorted = sorted(pls, key=lambda p: p.get("data", ""), reverse=True)
        # Limpar autor_nome da saída (já é do próprio deputado)
        pls_clean = [
            {k: v for k, v in p.items() if k != "autor_nome"}
            for p in pls_sorted
        ]

        deputados_out.append(
            {
                "id": dep_id,
                "nome": base.get("nome"),
                "partido": base.get("siglaPartido") or status.get("siglaPartido"),
                "uf": base.get("siglaUf") or status.get("siglaUf"),
                "foto": base.get("urlFoto")
                or f"https://www.camara.leg.br/internet/deputado/bandep/{dep_id}.jpg",
                "situacao": status.get("situacao") or "Exercício",
                "total": total,
                "simbolicas": simbolicas,
                "incrementais": incrementais,
                "estruturais": estruturais,
                "pls": pls_clean,
            }
        )

    # Ordenar por score (estr*2 + incr*1) desc
    deputados_out.sort(
        key=lambda d: d["estruturais"] * 3 + d["incrementais"] * 1,
        reverse=True,
    )

    out_path = DATA_DIR / "autoria.json"
    out_path.write_text(
        json.dumps({"deputados": deputados_out}, ensure_ascii=False),
        encoding="utf-8",
    )
    print(f"\n>>> autoria.json salvo: {len(deputados_out)} deputados")
    print(f"    path: {out_path}")

    # Preview do top 20
    print("\n>>> TOP 20 (por estr*2 + incr):")
    for i, d in enumerate(deputados_out[:20], 1):
        score = d["estruturais"] * 3 + d["incrementais"]
        print(
            f"  {i:2d}. {d['nome']:<35} ({d['partido']}/{d['uf']}) "
            f"total={d['total']:3d} estr={d['estruturais']:2d} "
            f"incr={d['incrementais']:2d} score={score}"
        )

    # Checar Erika Hilton especificamente
    erika = next((d for d in deputados_out if "Erika Hilton" in d["nome"]), None)
    if erika:
        pos = deputados_out.index(erika) + 1
        score = erika["estruturais"] * 2 + erika["incrementais"]
        print(
            f"\n>>> Erika Hilton: posição #{pos}, total={erika['total']}, "
            f"estr={erika['estruturais']}, incr={erika['incrementais']}, score={score}"
        )


if __name__ == "__main__":
    main()
