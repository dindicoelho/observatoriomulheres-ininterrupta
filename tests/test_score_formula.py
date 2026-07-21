"""
Testes unitários da fórmula de score. Não dependem de dados vivos da Câmara —
constroem fichas sintéticas e exercitam score_ranking() / score_mapa().

A fórmula é a fonte única em scripts/score.py. O frontend (RankingDeputados.tsx,
ArticuladoresMap.tsx) replica os mesmos cálculos, e tests/test_pipeline_data.py
faz o cross-check contra dados reais.
"""

import pytest

from score import (
    base_score,
    com_cap,
    ficha_limpa,
    maior_surto,
    producao_efetiva,
    score_mapa,
    score_ranking,
    sem_retrocesso,
)


def pl(dia, categoria="incremental", stance="protetivo"):
    return {"data": dia, "categoria": categoria, "stance": stance}


def deputada(**kwargs):
    """Fábrica de ficha sintética com defaults zerados."""
    return {
        "estruturais": 0,
        "incrementais": 0,
        "simbolicas": 0,
        "punitivistas": 0,
        "regressivos": 0,
        "votos_regressivos": 0,
        "sexo": None,
        **kwargs,
    }


class TestBaseScore:
    def test_base_simples(self):
        d = deputada(estruturais=2, incrementais=3, simbolicas=1)
        assert base_score(d) == 2 * 3 + 3 + 1 == 10

    def test_desconto_punitivismo(self):
        d = deputada(incrementais=10, punitivistas=3)
        assert base_score(d) == 10 - 3 * 2 == 4

    def test_desconto_regressiva(self):
        d = deputada(incrementais=10, regressivos=1)
        assert base_score(d) == 10 - 7 == 3

    def test_desconto_voto_regressivo(self):
        d = deputada(incrementais=10, votos_regressivos=1)
        assert base_score(d) == 10 - 5 == 5

    def test_voto_regressivo_pesa_menos_que_autoria(self):
        # Voto regressivo (−5) é menos pesado que autoria (−7)
        autor = deputada(incrementais=20, regressivos=1)
        votante = deputada(incrementais=20, votos_regressivos=1)
        assert base_score(votante) > base_score(autor)
        # Diferença é exatamente 2 pontos (7 − 5)
        assert base_score(votante) - base_score(autor) == 2

    def test_voto_regressivo_pesa_mais_que_punitivismo(self):
        # Voto regressivo (−5) é mais pesado que punitivismo de autoria (−2)
        votante = deputada(incrementais=20, votos_regressivos=1)
        punitivista = deputada(incrementais=20, punitivistas=1)
        assert base_score(votante) < base_score(punitivista)


class TestCapAntiMutirao:
    def test_ate_5_no_mesmo_dia_contam(self):
        pls = [pl("2026-07-17") for _ in range(5)]
        ef = producao_efetiva(pls)
        assert ef["incrementais"] == 5
        assert ef["descontadas"] == 0

    def test_excedente_do_dia_nao_conta(self):
        # 60 PLs no mesmo dia → só 5 contam, 55 descontadas
        pls = [pl("2026-07-17") for _ in range(60)]
        ef = producao_efetiva(pls)
        assert ef["incrementais"] == 5
        assert ef["descontadas"] == 55

    def test_dias_diferentes_nao_somam_no_cap(self):
        # 5 num dia + 5 noutro = 10, nenhum descontado
        pls = [pl("2026-07-17") for _ in range(5)] + [pl("2026-07-18") for _ in range(5)]
        ef = producao_efetiva(pls)
        assert ef["incrementais"] == 10
        assert ef["descontadas"] == 0

    def test_regressiva_nao_entra_na_producao(self):
        pls = [pl("2026-07-17", stance="regressivo") for _ in range(3)]
        ef = producao_efetiva(pls)
        assert ef["incrementais"] == 0

    def test_categorias_preservadas_no_cap(self):
        pls = (
            [pl("2026-07-17", "estrutural")] * 3
            + [pl("2026-07-17", "incremental")] * 3
        )  # 6 no dia → cap 5
        ef = producao_efetiva(pls)
        assert ef["estruturais"] + ef["incrementais"] == 5
        assert ef["descontadas"] == 1

    def test_com_cap_derruba_mutirao_no_score(self):
        # 60 incrementais num dia vs 60 espalhados
        mutirao = deputada(pls=[pl("2026-07-17") for _ in range(60)])
        espalhado = deputada(
            pls=[pl(f"2026-{(i % 12) + 1:02d}-{(i % 28) + 1:02d}") for i in range(60)]
        )
        assert score_ranking(com_cap(mutirao)) < score_ranking(com_cap(espalhado))
        # mutirão: 5 incrementais efetivas × 1,5 ficha limpa = 7,5
        assert score_ranking(com_cap(mutirao)) == 7.5

    def test_com_cap_sem_pls_passa_inalterado(self):
        d = deputada(estruturais=3, incrementais=2)
        assert com_cap(d) is d

    def test_maior_surto_pega_o_pico(self):
        pls = [pl("2026-07-17") for _ in range(60)] + [pl("2026-01-05") for _ in range(2)]
        s = maior_surto(pls)
        assert s["qtd"] == 60
        assert s["data"] == "2026-07-17"


class TestFichaLimpa:
    def test_ficha_limpa_pura(self):
        assert ficha_limpa(deputada(estruturais=5)) is True

    def test_ficha_suja_por_punitivismo(self):
        assert ficha_limpa(deputada(punitivistas=1)) is False

    def test_ficha_suja_por_regressiva(self):
        assert ficha_limpa(deputada(regressivos=1)) is False

    def test_ficha_suja_por_voto_regressivo(self):
        assert ficha_limpa(deputada(votos_regressivos=1)) is False


class TestSemRetrocesso:
    def test_so_punitivismo_nao_descaracteriza(self):
        # Punitivismo isolado mantém o peso_sexo — já tem desconto de −2.
        assert sem_retrocesso(deputada(punitivistas=3)) is True

    def test_regressiva_descaracteriza(self):
        assert sem_retrocesso(deputada(regressivos=1)) is False

    def test_voto_regressivo_descaracteriza(self):
        assert sem_retrocesso(deputada(votos_regressivos=1)) is False


class TestScoreRanking:
    def test_bonus_ficha_limpa(self):
        # Mesma base, com e sem ficha limpa
        limpa = deputada(estruturais=2, incrementais=4)
        suja = deputada(estruturais=2, incrementais=4, punitivistas=1)
        # base limpa = 10; base suja = 10 - 2 = 8
        assert score_ranking(limpa) == 10 * 1.5 == 15.0
        assert score_ranking(suja) == 8.0

    def test_voto_regressivo_paga_caro(self):
        # 5 incrementais (5pt) − 1 voto regressivo (5pt) = 0
        d = deputada(incrementais=5, votos_regressivos=1)
        assert score_ranking(d) == 0.0

    def test_voto_regressivo_nao_iguala_pl_regressiva(self):
        # Voto regressivo pesa menos: −5 vs −7
        autor = deputada(incrementais=10, regressivos=1)       # 10 − 7 = 3
        votante = deputada(incrementais=10, votos_regressivos=1)  # 10 − 5 = 5
        assert score_ranking(votante) > score_ranking(autor)


class TestScoreMapa:
    def test_mulher_ficha_limpa_recebe_peso(self):
        # 4 incrementais, ficha limpa, mulher: 4 × 1,5 × 5 = 30
        d = deputada(incrementais=4, sexo="F")
        assert score_mapa(d) == 30.0

    def test_homem_ficha_limpa_sem_peso(self):
        d = deputada(incrementais=4, sexo="M")
        assert score_mapa(d) == 6.0  # 4 × 1,5

    def test_mulher_com_voto_regressivo_perde_peso(self):
        # 19 incr + 1 estr − 2 pun − 1 vreg×5 = 3+19−4−5 = 13; sem ficha limpa, sem peso
        # → 13 (era 65 se ainda tivesse ×5)
        d = deputada(
            estruturais=1,
            incrementais=19,
            punitivistas=2,
            votos_regressivos=1,
            sexo="F",
        )
        assert score_mapa(d) == 13.0

    def test_mulher_com_so_punitivismo_mantem_peso(self):
        # Punitivismo isolado não descaracteriza — peso×5 mantém
        d = deputada(incrementais=10, punitivistas=2, sexo="F")
        # base = 10 − 4 = 6; sem ficha limpa; ×5 = 30
        assert score_mapa(d) == 30.0

    def test_mulher_com_pl_regressiva_perde_peso(self):
        d = deputada(incrementais=10, regressivos=1, sexo="F")
        # base = 10 − 7 = 3; sem peso
        assert score_mapa(d) == 3.0

    def test_score_mapa_decompõe_em_ranking_x_peso(self):
        # Invariante: score_mapa = score_ranking × peso_sexo
        d = deputada(estruturais=3, incrementais=7, sexo="F")
        assert score_mapa(d) == score_ranking(d) * 5

    def test_score_mapa_pra_mulher_com_retrocesso(self):
        # Invariante: quando há retrocesso, score_mapa == score_ranking
        d = deputada(incrementais=20, regressivos=1, sexo="F")
        assert score_mapa(d) == score_ranking(d)
