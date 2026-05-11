"""
Fórmulas de score do Observatório. Fonte única para todos os scripts
de pipeline. O frontend (RankingDeputados.tsx) replica a mesma fórmula
e o teste cruzado em tests/ garante que os números batem.

Score do RANKING NACIONAL:
    base = estruturais×3 + incrementais + simbólicas
         − punitivistas×2 − regressivas×7 − votos_regressivos×7
    score = base × 1,5  se ficha 100% protetiva (zero pun/reg/voto_reg)
          = base       caso contrário

Score do MAPA POR ESTADO:
    score_mapa = score_ranking × peso_sexo
    peso_sexo = 5  se mulher E sem retrocesso (zero reg E zero voto_reg)
              = 1  caso contrário

Razão de "sem retrocesso": o peso é compensação editorial pela
sub-representação feminina, não bônus universal. Quem retrocede
direitos da mulher não recebe o multiplicador desenhado para
ampliar voz às mulheres da pauta.
"""

from typing import Mapping


def _g(d: Mapping, k: str, default: int = 0) -> int:
    v = d.get(k, default)
    return v if v is not None else default


def base_score(d: Mapping) -> float:
    """Componente positivo menos descontos. Sem bônus, sem peso."""
    return (
        _g(d, "estruturais") * 3
        + _g(d, "incrementais")
        + _g(d, "simbolicas")
        - _g(d, "punitivistas") * 2
        - _g(d, "regressivos") * 7
        - _g(d, "votos_regressivos") * 7
    )


def ficha_limpa(d: Mapping) -> bool:
    """100% protetiva: nenhuma PL punitivista, regressiva ou voto regressivo."""
    return (
        _g(d, "punitivistas") == 0
        and _g(d, "regressivos") == 0
        and _g(d, "votos_regressivos") == 0
    )


def sem_retrocesso(d: Mapping) -> bool:
    """Sem PL regressiva nem voto SIM em pauta regressiva.
    Punitivismo isolado NÃO descaracteriza (já tem desconto −2)."""
    return _g(d, "regressivos") == 0 and _g(d, "votos_regressivos") == 0


def score_ranking(d: Mapping) -> float:
    """Score do ranking nacional (sem peso_sexo)."""
    base = base_score(d)
    if ficha_limpa(d):
        base *= 1.5
    return base


def score_mapa(d: Mapping, sexo: str | None = None) -> float:
    """Score do mapa por estado: ranking × peso_sexo.

    peso_sexo = 5 se mulher SEM retrocesso, 1 caso contrário.
    """
    sexo = sexo or d.get("sexo")
    base = score_ranking(d)
    peso = 5.0 if (sexo == "F" and sem_retrocesso(d)) else 1.0
    return base * peso
