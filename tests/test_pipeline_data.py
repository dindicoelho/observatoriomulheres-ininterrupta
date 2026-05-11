"""
Os 8 casos de teste obrigatórios do briefing, validados contra os
dados reais em src/data/ depois do pipeline completo.

Estes testes são E2E sobre os JSONs commitados — funcionam como
canário do patch metodológico (penalidade por voto regressivo +
peso_sexo só sem retrocesso). Se algum regredir, o pipeline mudou
algo que afeta o ranking publicado.
"""

import json
from pathlib import Path

import pytest

from score import score_mapa, score_ranking

ROOT = Path(__file__).parent.parent
DATA = ROOT / "src" / "data"


def buscar(deps, nome_parcial):
    """Localiza um deputado pelo trecho do nome (case-insensitive)."""
    for d in deps:
        if nome_parcial.lower() in d["nome"].lower():
            return d
    raise AssertionError(f"deputado(a) '{nome_parcial}' não encontrado(a)")


def posicao_ranking(deps, nome_parcial):
    """Retorna a posição 1-indexed no ranking principal (filtra total>=3)."""
    elegiveis = [d for d in deps if d["total"] >= 3]
    elegiveis.sort(key=score_ranking, reverse=True)
    alvo = buscar(elegiveis, nome_parcial)
    return elegiveis.index(alvo) + 1


@pytest.fixture(scope="module")
def autoria():
    return json.loads((DATA / "autoria.json").read_text(encoding="utf-8"))


@pytest.fixture(scope="module")
def deps(autoria):
    return autoria["deputados"]


@pytest.fixture(scope="module")
def articuladores():
    return json.loads((DATA / "articuladores_uf.json").read_text(encoding="utf-8"))


@pytest.fixture(scope="module")
def alertas():
    raw = json.loads((DATA / "alertas_filiacao.json").read_text(encoding="utf-8"))
    return {a["deputado_id"]: a for a in raw.get("alertas", [])}


# ---------------------------------------------------------------------------
# Casos 1-4: ranking principal — deputadas com voto SIM no PDL Conanda
#            saem do topo do ranking
# ---------------------------------------------------------------------------

def test_caso1_silvye_alves_sai_do_top10(deps):
    d = buscar(deps, "Silvye Alves")
    assert d["votos_regressivos"] >= 1, "Silvye precisa ter voto regressivo registrado"
    pos = posicao_ranking(deps, "Silvye Alves")
    assert pos > 10, f"Silvye Alves deveria estar fora do top 10 (posição atual: #{pos})"


def test_caso2_rogeria_santos_sai_do_top20(deps):
    d = buscar(deps, "Rogéria Santos")
    assert d["votos_regressivos"] >= 1
    pos = posicao_ranking(deps, "Rogéria Santos")
    assert pos > 20, f"Rogéria Santos deveria estar fora do top 20 (#{pos})"


def test_caso3_fred_linhares_sai_do_top20(deps):
    d = buscar(deps, "Fred Linhares")
    assert d["votos_regressivos"] >= 1
    pos = posicao_ranking(deps, "Fred Linhares")
    assert pos > 20, f"Fred Linhares deveria estar fora do top 20 (#{pos})"


def test_caso4_duda_ramos_cai_no_ranking(deps):
    d = buscar(deps, "Duda Ramos")
    assert d["votos_regressivos"] >= 1
    pos = posicao_ranking(deps, "Duda Ramos")
    # Antes do patch estava em #5. Aceita qualquer queda significativa.
    assert pos > 20, f"Duda Ramos deveria cair significativamente (#{pos})"


# ---------------------------------------------------------------------------
# Caso 5: mulheres do PT e PSOL que votaram NÃO mantêm ou sobem
# ---------------------------------------------------------------------------

@pytest.mark.parametrize(
    "nome",
    [
        "Sâmia Bomfim",
        "Erika Hilton",
        "Luciene Cavalcante",
        "Talíria Petrone",
        "Maria do Rosário",
        "Denise Pessôa",
        "Carol Dartora",
        "Fernanda Melchionna",
    ],
)
def test_caso5_progressistas_mantêm_top20(deps, nome):
    d = buscar(deps, nome)
    assert d.get("votos_regressivos", 0) == 0, (
        f"{nome} foi marcada com voto regressivo — checar curadoria do seed"
    )
    pos = posicao_ranking(deps, nome)
    assert pos <= 20, f"{nome} deveria estar no top 20 (#{pos})"


# ---------------------------------------------------------------------------
# Caso 6: Amom Mandel — não votou SIM (ausente), mantém score,
#         mas tem o selo de filiação
# ---------------------------------------------------------------------------

def test_caso6_amom_mandel_sem_penalidade_de_voto_e_com_selo(deps, alertas):
    d = buscar(deps, "Amom Mandel")
    # Ausência não conta como voto SIM
    assert d.get("votos_regressivos", 0) == 0, "Ausência não pode contar como voto regressivo"
    # Mas ele deve aparecer no selo factual de filiação/promoção
    assert d["id"] in alertas, "Amom Mandel precisa de selo de filiação/promoção partidária"
    alerta = alertas[d["id"]]
    assert "republicanos" in alerta["partido"].lower()


# ---------------------------------------------------------------------------
# Caso 7: GO — Adriana Accorsi no topo, Silvye Alves fora do top 3
# ---------------------------------------------------------------------------

def test_caso7_goias_top3(articuladores):
    go = articuladores["ufs"]["GO"]["top3"]
    nomes = [t["nome"] for t in go]
    assert any("Adriana Accorsi" in n for n in nomes), (
        "Adriana Accorsi deveria estar no top 3 de Goiás"
    )
    assert nomes[0].endswith("Adriana Accorsi") or "Adriana Accorsi" in nomes[0], (
        f"Adriana Accorsi deveria liderar GO (top 3: {nomes})"
    )
    assert not any("Silvye Alves" in n for n in nomes), (
        f"Silvye Alves não deveria estar no top 3 de GO (atual: {nomes})"
    )


# ---------------------------------------------------------------------------
# Caso 8: BA — Rogéria Santos fora do top 3
# ---------------------------------------------------------------------------

def test_caso8_bahia_sem_rogeria_no_top3(articuladores):
    ba = articuladores["ufs"]["BA"]["top3"]
    nomes = [t["nome"] for t in ba]
    assert not any("Rogéria Santos" in n for n in nomes), (
        f"Rogéria Santos não deveria estar no top 3 da BA (atual: {nomes})"
    )


# ---------------------------------------------------------------------------
# Smoke checks adicionais
# ---------------------------------------------------------------------------

def test_pdl_conanda_no_seed_e_propagado(deps):
    """O PDL 3/2025 deve aparecer nos detalhes de pelo menos 100 deputados."""
    contador = sum(
        1
        for d in deps
        if any(
            v.get("votacao_id") == "2482078-57"
            for v in d.get("votos_regressivos_detalhe", []) or []
        )
    )
    assert contador >= 100, (
        f"PDL 3/2025 deveria aparecer em 100+ deputados, encontrado em {contador}"
    )


def test_lêda_borges_tem_selo_de_filiacao(deps, alertas):
    d = buscar(deps, "Lêda Borges")
    assert d["id"] in alertas, "Lêda Borges precisa de selo de filiação 2026"


def test_peso_sexo_so_aplica_com_ficha_sem_retrocesso(deps):
    """Cross-check: para cada mulher do top 3 do mapa, ela deve ter
    sem_retrocesso ou o peso não foi aplicado."""
    from score import sem_retrocesso, score_ranking
    import json

    art = json.loads((DATA / "articuladores_uf.json").read_text(encoding="utf-8"))
    dep_idx = {d["id"]: d for d in deps}
    for uf, info in art["ufs"].items():
        for t in info.get("top3", []):
            d = dep_idx.get(t["id"])
            if not d or d.get("sexo") != "F":
                continue
            score_apenas_ranking = score_ranking(d)
            # Se foi multiplicado por 5, ela precisa estar sem retrocesso
            if t["score_articulador"] > score_apenas_ranking + 0.001:
                assert sem_retrocesso(d), (
                    f"{d['nome']} ({uf}) recebeu peso×5 mas tem retrocesso na ficha"
                )
