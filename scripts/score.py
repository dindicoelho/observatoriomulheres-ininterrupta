"""
Fórmulas de score do Observatório. Fonte única para todos os scripts
de pipeline. O frontend (RankingDeputados.tsx) replica a mesma fórmula
e o teste cruzado em tests/ garante que os números batem.

Score do RANKING NACIONAL:
    base = estruturais×3 + incrementais + simbólicas
         − punitivistas×2 − regressivas×7 − votos_regressivos×5
    score = base × 1,5  se ficha 100% protetiva (zero pun/reg/voto_reg)
          = base       caso contrário

Voto SIM em pauta regressiva pesa menos que autoria de PL regressiva
(−5 vs −7). Reconhece que propor é mais ativo politicamente do que
acompanhar uma votação, mas mantém que voto é responsabilidade
direta pela aprovação — pesa mais que punitivismo de autoria (−2).

Score do MAPA POR ESTADO:
    score_mapa = score_ranking × peso_sexo
    peso_sexo = 5  se mulher E sem retrocesso (zero reg E zero voto_reg)
              = 1  caso contrário

Razão de "sem retrocesso": o peso é compensação editorial pela
sub-representação feminina, não bônus universal. Quem retrocede
direitos da mulher não recebe o multiplicador desenhado para
ampliar voz às mulheres da pauta.
"""

from collections import defaultdict
from typing import Mapping, Sequence


# Cap anti-mutirão: no máximo BURST_DAY_CAP PLs de um mesmo autor no mesmo
# dia contam pra produção que pontua. Protocolar dezenas de PLs num único
# dia ("fábrica de PL") é position-taking, não N iniciativas legislativas.
# O frontend (RankingDeputados.tsx) replica o mesmo cap.
BURST_DAY_CAP = 5

# A partir de quantas PLs no mesmo dia sinalizamos "protocolo em massa"
# (selo de alerta). Maior que o cap: o cap corrige o score já a partir de
# 6/dia, mas só marcamos publicamente casos flagrantes (10+).
SURTO_FLAG_MIN = 10


def _g(d: Mapping, k: str, default: int = 0) -> int:
    v = d.get(k, default)
    return v if v is not None else default


def producao_efetiva(pls: Sequence[Mapping]) -> dict:
    """Contagem de produção que efetivamente pontua: só PLs não-regressivas
    (regressivas são penalizadas à parte) e no máx BURST_DAY_CAP por dia."""
    por_dia: dict[str, list] = defaultdict(list)
    for p in pls or []:
        if p.get("stance") == "regressivo":
            continue
        dia = (p.get("data") or "")[:10]
        por_dia[dia].append(p)
    est = inc = sim = desc = 0
    for pls_dia in por_dia.values():
        desc += max(0, len(pls_dia) - BURST_DAY_CAP)
        for p in pls_dia[:BURST_DAY_CAP]:
            cat = p.get("categoria")
            if cat == "estrutural":
                est += 1
            elif cat == "simbólica":
                sim += 1
            else:
                inc += 1
    return {"estruturais": est, "incrementais": inc, "simbolicas": sim, "descontadas": desc}


def maior_surto(pls: Sequence[Mapping]) -> dict:
    """Maior nº de PLs protocoladas num único dia + a data (pra sinalizar
    'protocolo em massa'). Considera todas as PLs, inclusive regressivas."""
    por_dia: dict[str, int] = defaultdict(int)
    for p in pls or []:
        dia = (p.get("data") or "")[:10]
        if dia:
            por_dia[dia] += 1
    if not por_dia:
        return {"qtd": 0, "data": None}
    dia, qtd = max(por_dia.items(), key=lambda kv: kv[1])
    return {"qtd": qtd, "data": dia}


def com_cap(d: Mapping) -> Mapping:
    """Cópia de d com estruturais/incrementais/simbolicas substituídos pela
    produção efetiva (cap anti-mutirão). Fichas sem 'pls' (testes sintéticos)
    passam inalteradas."""
    pls = d.get("pls")
    if not pls:
        return d
    ef = producao_efetiva(pls)
    return {
        **d,
        "estruturais": ef["estruturais"],
        "incrementais": ef["incrementais"],
        "simbolicas": ef["simbolicas"],
    }


def base_score(d: Mapping) -> float:
    """Componente positivo menos descontos. Sem bônus, sem peso."""
    return (
        _g(d, "estruturais") * 3
        + _g(d, "incrementais")
        + _g(d, "simbolicas")
        - _g(d, "punitivistas") * 2
        - _g(d, "regressivos") * 7
        - _g(d, "votos_regressivos") * 5
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
