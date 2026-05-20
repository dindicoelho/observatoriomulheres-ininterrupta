#!/usr/bin/env python3
"""
Classifica cada PL em autoria.json pela *postura* em relação aos direitos da mulher:

- protetivo: amplia direitos / cria política / melhora atendimento / protege vítima
- punitivista: foca em pena ao agressor, sem melhorar proteção material
- regressivo: restringe direitos, controla/pune a vítima, criminaliza aborto,
  sustação de resoluções protetivas, armamentismo, anti-direitos trans

Não é neutro. Reflete a premissa do site: "quem está fazendo algo pra melhorar
a vida das mulheres no Brasil". Evidência: punitivismo não reduz violência
(literatura empírica ampla); criminalização do aborto aumenta morte materna.

Conservador: na dúvida, protetivo. Assim evita acusação de filtro arbitrário.

Ordem de prioridade (do mais permissivo ao mais autoritativo):
1. Regex (este script — conservador, pega só padrões inequívocos)
2. stance_llm_cache.json (Haiku 4.5 semanal — captura casos sutis)
3. stance_overrides.json (curadoria editorial manual — palavra final)

Sem o passo 2, todo dia o rebuild_autoria.py recriava autoria.json do zero
e as classificações LLM eram perdidas até segunda (~-35% regressivos /
-70% punitivistas durante a semana). O cache LLM corrige isso.
"""

import json
import re
import sys
from pathlib import Path
from collections import defaultdict

DATA_DIR = Path(__file__).parent.parent / "src" / "data"
SCRIPTS_DIR = Path(__file__).parent
LLM_CACHE_PATH = SCRIPTS_DIR / "stance_llm_cache.json"
OVERRIDES_PATH = SCRIPTS_DIR / "stance_overrides.json"


def load_llm_cache() -> dict:
    """Cache de classificações LLM (semanal), aplicadas aqui pra sobreviver
    ao rebuild diário. Sem isso, regressivos/punitivistas detectados pelo
    Haiku eram zerados todo dia até a segunda."""
    if not LLM_CACHE_PATH.exists():
        return {}
    try:
        data = json.loads(LLM_CACHE_PATH.read_text(encoding="utf-8"))
    except Exception as exc:
        print(f">>> ERRO lendo {LLM_CACHE_PATH.name}: {exc}", file=sys.stderr)
        return {}
    return data.get("classificacoes", {})


def load_manual_overrides() -> dict:
    """Overrides editoriais manuais. Prioridade máxima sobre regex e LLM."""
    if not OVERRIDES_PATH.exists():
        return {}
    try:
        data = json.loads(OVERRIDES_PATH.read_text(encoding="utf-8"))
    except Exception as exc:
        print(f">>> ERRO lendo {OVERRIDES_PATH.name}: {exc}", file=sys.stderr)
        return {}
    return {k: v for k, v in data.items() if not k.startswith("_")}


def normalize(s: str) -> str:
    repl = str.maketrans(
        "áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ",
        "aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC",
    )
    return s.translate(repl).lower()


# ----------------------------------------------------------------------------
# REGRESSIVO — restringe direitos, controla/pune a vítima, armamentismo, anti-trans
# CONSERVADOR: só marca quando o padrão é inequívoco. Na dúvida, protetivo.
# ----------------------------------------------------------------------------
REGRESSIVO_PATTERNS = [
    # Criminalização / dificultação do aborto legal (sem contexto de "para assegurar direito a")
    r"aumenta.*pena.*(\baborto\b|interrup[cç]ao da gravidez)",
    r"aumento.*pena.*(\baborto\b|interrup[cç]ao da gravidez)",
    r"majora[cç]ao.*pena.*(\baborto\b|interrup[cç]ao da gravidez)",
    r"aumentar.*penas.*crimes de aborto",
    # Obrigatoriedade de notificação à polícia em caso de aborto (controle sobre vítima de estupro)
    r"obrigatoriedade.*notifica[cç]ao.*polici.*(\baborto\b|interrup[cç]ao.*gesta|interrup[cç]ao.*gravid)",
    r"notifica[cç]ao.*autoridade policial.*(\baborto\b|interrup[cç]ao.*gesta|interrup[cç]ao.*gravid)",
    # Veto a recursos públicos para pautas de direito reprodutivo
    r"(veda|vedar|proibir).*(incentivo|recurso|verba|rouanet|subven).*\baborto\b",
    r"proibe.*publica[cç]ao.*\baborto\b",
    # Sustação de resoluções protetivas (Conanda, CNDM)
    r"susta.*resolu[cç]ao.*conanda.*258",
    r"susta.*resolu[cç]ao conanda n.*258",
    r"susta.*resolu[cç]ao.*(conanda|cndm)",
    # Enfraquecer Maria da Penha (contraditório/ampla defesa pra agressor)
    r"contraditorio.*ampla defesa.*(maria da penha|viol[eê]ncia dom[eé]stica)",
    r"ampla defesa.*contraditorio.*(maria da penha|medida protetiva)",
    # Anti direitos trans
    r"proib(e|i[cç]ao).*bloqueio puberal",
    r"proib(e|i[cç]ao).*terapia hormonal.*(crianca|adolescente)",
    r"proib(e|i[cç]ao).*(transicao|redesignacao|transexualiz).*(crianca|adolescente|menor)",
    # Armamentismo como "solução" à vítima de violência
    r"direito.*porte.*arma.*(v[ií]tima|mulher.*viol|mulher.*domest)",
    r"autoriza.*porte.*arma.*(v[ií]tima|mulher.*viol)",
    # Controle sobre a vítima (criminaliza reaproximação com consentimento)
    r"aproxima[cç]ao volunt[aá]ria.*consentimento.*configur",
    r"consentimento expresso.*v[ií]tima.*configur.*crime",
    # Moção de repúdio contra parlamentar (quando cabível)
    r"repudio.*indica[cç]ao.*erika hilton",
    r"repudio.*(erika hilton|marielle franco) à presid",
]

# ----------------------------------------------------------------------------
# PUNITIVISTA — foco em aumentar pena sem melhorar proteção material
# ----------------------------------------------------------------------------
PUNITIVISTA_PATTERNS = [
    r"castra[cç]ao (qu[ií]mica|cirurgica)",
    r"aumenta.*pena.*feminic[ií]dio",
    r"aumento.*pena.*feminic[ií]dio",
    r"aumento.*pena.*(viol[eê]ncia dom[eé]stica|viol[eê]ncia contra.*mulher)",
    r"aumenta.*pena.*(estupro|assedio|import)",
    r"aumento.*pena.*(estupro|assedio|import)",
    r"torna.*hediondo",
    r"crime hediondo",
    r"majora[cç]ao da pena",
    r"pena m[ií]nima.*aumenta",
    r"perda.*cargo|perda.*mandato|perda.*fun[cç]ao.*publica",
    r"pris[aã]o preventiva.*obrigatoria",
    r"regime fechado.*obrigatorio",
    r"proibe.*visita.*intima.*(preso|condenado)",
    r"banco.*dados.*condenados",
    r"cadastro.*condenados",
    r"cadastro.*agressor",
]

# Nome curto pro destino / categoria (mapear ementa -> stance)
def classify_stance(ementa: str) -> str:
    e = normalize(ementa or "")

    # Regressivo tem prioridade (mais específico)
    for pat in REGRESSIVO_PATTERNS:
        if re.search(pat, e):
            return "regressivo"

    for pat in PUNITIVISTA_PATTERNS:
        if re.search(pat, e):
            return "punitivista"

    return "protetivo"


def main():
    autoria = json.loads((DATA_DIR / "autoria.json").read_text(encoding="utf-8"))
    deps = autoria["deputados"]

    llm_cache = load_llm_cache()
    manual_overrides = load_manual_overrides()
    print(f">>> {len(llm_cache)} classificações LLM em cache · {len(manual_overrides)} overrides manuais")

    total_counts = defaultdict(int)
    flagged_examples = defaultdict(list)
    aplicados_llm = 0
    aplicados_manual = 0

    for d in deps:
        stance_counts = defaultdict(int)
        for pl in d["pls"]:
            # 1) Regex (default, conservador)
            st = classify_stance(pl["ementa"])
            origem = "regex"

            # 2) LLM cache — sobrescreve se foi marcado regressivo/punitivista
            #    com confiança >=0.8 na rodada semanal. Garante que essas
            #    classificações sobrevivam ao rebuild_autoria diário.
            pid_str = str(pl["id"])
            llm_entry = llm_cache.get(pid_str)
            if llm_entry and llm_entry.get("stance") in ("regressivo", "punitivista"):
                st = llm_entry["stance"]
                pl["llm_confianca"] = llm_entry.get("confianca")
                pl["llm_justificativa"] = llm_entry.get("justificativa", "")
                origem = "llm"
                aplicados_llm += 1

            # 3) Override manual — prioridade máxima
            mo = manual_overrides.get(pid_str)
            if mo:
                st = mo["stance"]
                pl["llm_justificativa"] = mo.get(
                    "justificativa", "Override manual — verificado editorialmente."
                )
                origem = "manual"
                aplicados_manual += 1

            pl["stance"] = st
            stance_counts[st] += 1
            total_counts[st] += 1
            if st != "protetivo" and len(flagged_examples[st]) < 12:
                flagged_examples[st].append(
                    f"[{origem}] {d['nome']} ({d['partido']}/{d['uf']}) — {pl['tipo']} {pl['numero']}/{pl['ano']}: {pl['ementa'][:130]}"
                )
        d["protetivos"] = stance_counts["protetivo"]
        d["punitivistas"] = stance_counts["punitivista"]
        d["regressivos"] = stance_counts["regressivo"]

    print(f">>> Aplicados: {aplicados_llm} LLM cache · {aplicados_manual} overrides manuais")

    # Recalcular total/estruturais/incrementais CONSIDERANDO SÓ PROTETIVOS E PUNITIVISTAS
    # (regressivos não contam como produção em prol da mulher)
    # Score final = estruturais_prot × 2 + incrementais_prot × 1 - regressivos × 2
    for d in deps:
        pls_prot = [p for p in d["pls"] if p["stance"] != "regressivo"]
        d["total"] = len(pls_prot)
        d["estruturais"] = sum(1 for p in pls_prot if p["categoria"] == "estrutural")
        d["incrementais"] = sum(1 for p in pls_prot if p["categoria"] == "incremental")
        d["simbolicas"] = sum(1 for p in pls_prot if p["categoria"] == "simbólica")

    # Re-sort por score (estr*2 + incr - regressivos*2)
    def score(d):
        return d["estruturais"] * 3 + d["incrementais"] - d["regressivos"] * 2

    deps.sort(key=score, reverse=True)

    # Recalcular totalPls (únicos protetivos + punitivistas — regressivos removidos)
    total_pls_set = set()
    for d in deps:
        for pl in d["pls"]:
            if pl["stance"] != "regressivo":
                total_pls_set.add(pl["id"])
    autoria["totalPls"] = len(total_pls_set)
    autoria["totalDeputados"] = len(deps)

    # Gender stats recalculada com valores filtrados
    gender = {
        "F": {"total": 0, "estruturais": 0, "incrementais": 0, "simbolicas": 0, "deputados": 0},
        "M": {"total": 0, "estruturais": 0, "incrementais": 0, "simbolicas": 0, "deputados": 0},
    }
    for d in deps:
        s = d.get("sexo")
        if s in gender:
            gender[s]["total"] += d["total"]
            gender[s]["estruturais"] += d["estruturais"]
            gender[s]["incrementais"] += d["incrementais"]
            gender[s]["simbolicas"] += d["simbolicas"]
            if d["total"] + d["regressivos"] > 0:  # contagem só se tem alguma PL
                gender[s]["deputados"] += 1
    autoria["gender_stats"] = gender

    (DATA_DIR / "autoria.json").write_text(
        json.dumps(autoria, ensure_ascii=False), encoding="utf-8"
    )

    print(f">>> Classificação de stance concluída:")
    print(f"    protetivos: {total_counts['protetivo']}")
    print(f"    punitivistas: {total_counts['punitivista']}")
    print(f"    regressivos: {total_counts['regressivo']}")
    print(f"    total PLs únicos (sem regressivos): {autoria['totalPls']}")

    print("\n>>> Exemplos de REGRESSIVOS flagrados:")
    for ex in flagged_examples["regressivo"]:
        print(f"    {ex}")

    print("\n>>> Exemplos de PUNITIVISTAS flagrados:")
    for ex in flagged_examples["punitivista"]:
        print(f"    {ex}")

    # Top 20 after reclassification
    print("\n>>> NOVO TOP 20 (estr*2 + incr - regressivos*2):")
    for i, d in enumerate(deps[:20], 1):
        s = score(d)
        print(
            f"  {i:2d}. [{d.get('sexo','?')}] {d['nome']:<35} ({d['partido']}/{d['uf']:<2}) "
            f"prot={d['total']:2d} (estr={d['estruturais']:2d} incr={d['incrementais']:2d}) "
            f"punit={d['punitivistas']:2d} regr={d['regressivos']:2d} score={s}"
        )


if __name__ == "__main__":
    main()
