#!/usr/bin/env python3
"""
Segunda camada de classificação de stance usando Claude Haiku 4.5.

A regex em classify_stance.py é conservadora — só marca regressivo/punitivista
quando o padrão é inequívoco. Isso deixa passar casos sutis:

- Ementas longas com verniz "proteção" mas conteúdo restritivo
- PLs que defendem "família tradicional" pra limitar direitos
- "Dignidade da maternidade" como pretexto pra dificultar aborto
- Exceções a direitos já conquistados

Estratégia: só revisamos PLs que a regex marcou como PROTETIVO. Se LLM
marcar com alta confiança (>=0.8) como punitivista/regressivo, sobrescreve.
Mantém a regex como garantia contra falsos positivos do LLM.

Uso:
  export ANTHROPIC_API_KEY=sk-ant-...
  python3 scripts/classify_stance_llm.py [--dry-run] [--limit N]
"""

import argparse
import json
import sys
import time
from collections import defaultdict
from datetime import date
from pathlib import Path

try:
    from anthropic import Anthropic
except ImportError:
    print("Requer: pip install anthropic --break-system-packages")
    sys.exit(1)

DATA_DIR = Path(__file__).parent.parent / "src" / "data"
LLM_CACHE_PATH = Path(__file__).parent / "stance_llm_cache.json"

SYSTEM_PROMPT = """Você é um especialista em políticas públicas brasileiras com foco em direitos das mulheres.

Classifique proposições legislativas em uma de três categorias:

PROTETIVA — amplia direitos, cria política pública, melhora atendimento, protege a vítima, combate discriminação. Padrão na ausência de sinais contrários.

PUNITIVISTA — foca em aumentar pena, criar cadastros de condenados, rigor penal, castração química, perda de cargo automática. Não melhora necessariamente a proteção material.

REGRESSIVA — restringe direitos, controla ou pune a vítima, criminaliza aborto legal, obriga notificação à polícia de interrupção de gestação, susta resoluções protetivas, autoriza armamentismo "pra vítima", limita direitos trans, ataca políticas afirmativas, impõe "família tradicional" pra restringir direitos reprodutivos. Mesmo mencionando "mulher" na ementa, atua contra direitos.

Seja conservador: na dúvida, escolha PROTETIVA. Classifique como punitivista/regressiva só com alta confiança.

Responda estritamente em JSON:
{"stance": "protetiva|punitivista|regressiva", "confianca": 0.0-1.0, "justificativa": "máximo 2 frases"}"""


def classify_pl(client, ementa, model="claude-haiku-4-5-20251001"):
    msg = client.messages.create(
        model=model,
        max_tokens=300,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": f"Ementa:\n{ementa}"}],
    )
    text = msg.content[0].text.strip()
    # Tentar extrair JSON
    try:
        # Remover markdown se houver
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        return json.loads(text.strip())
    except Exception:
        return None


def load_overrides():
    """Carrega overrides manuais que têm prioridade sobre o LLM."""
    p = Path(__file__).parent / "stance_overrides.json"
    if p.exists():
        data = json.loads(p.read_text(encoding="utf-8"))
        return {k: v["stance"] for k, v in data.items() if not k.startswith("_")}
    return {}


def persistir_cache_llm(autoria: dict, novos_resultados: dict) -> None:
    """Atualiza scripts/stance_llm_cache.json com todas as classificações
    LLM não-protetivas. Esse cache é lido por classify_stance.py no pipeline
    diário pra que as classificações sobrevivam ao rebuild_autoria.

    Estratégia cumulativa:
    - Lê o cache anterior (se existir)
    - Atualiza com classificações novas vindas desta rodada
    - Re-extrai do autoria.json todas as PLs que têm llm_confianca, pra
      cobrir entradas que vieram via stance_overrides.json ou que já
      estavam marcadas em rodadas anteriores
    """
    if LLM_CACHE_PATH.exists():
        try:
            cache = json.loads(LLM_CACHE_PATH.read_text(encoding="utf-8"))
        except Exception:
            cache = {"classificacoes": {}}
    else:
        cache = {"classificacoes": {}}

    classificacoes = cache.get("classificacoes", {})
    hoje = str(date.today())

    # 1) Atualizar com resultados novos desta rodada
    pl_meta = {}
    for d in autoria["deputados"]:
        for pl in d["pls"]:
            pl_meta.setdefault(pl["id"], pl)

    for pid, r in novos_resultados.items():
        meta = pl_meta.get(pid, {})
        classificacoes[str(pid)] = {
            "stance": r["new_stance"],
            "confianca": r["confianca"],
            "justificativa": r["justificativa"],
            "ementa_preview": (meta.get("ementa") or "")[:200],
            "pl_ref": f"{meta.get('tipo','?')} {meta.get('numero','?')}/{meta.get('ano','?')}",
            "classified_at": hoje,
        }

    # 2) Re-extrair do autoria.json todas as PLs já marcadas como
    #    não-protetivas com llm_confianca — cobre entradas legadas
    seen = set()
    for d in autoria["deputados"]:
        for pl in d["pls"]:
            pid = pl["id"]
            if pid in seen:
                continue
            seen.add(pid)
            if pl.get("stance") in ("regressivo", "punitivista") and pl.get("llm_confianca"):
                pid_str = str(pid)
                if pid_str not in classificacoes:
                    classificacoes[pid_str] = {
                        "stance": pl["stance"],
                        "confianca": pl["llm_confianca"],
                        "justificativa": pl.get("llm_justificativa", ""),
                        "ementa_preview": (pl.get("ementa") or "")[:200],
                        "pl_ref": f"{pl['tipo']} {pl['numero']}/{pl['ano']}",
                        "classified_at": hoje,
                    }

    cache_out = {
        "_nota": "Cache de classificações LLM. Alimentado por scripts/classify_stance_llm.py (rotina semanal), lido por scripts/classify_stance.py como override sobre a regex no pipeline diário. Sem isso, as classificações LLM (regressivo/punitivista) eram perdidas todo dia quando rebuild_autoria.py recriava o autoria.json do zero, e só voltavam na segunda. Manual editorial: stance_overrides.json tem prioridade ainda maior.",
        "atualizado_em": hoje,
        "classificacoes": dict(sorted(classificacoes.items(), key=lambda kv: int(kv[0]))),
    }
    LLM_CACHE_PATH.write_text(
        json.dumps(cache_out, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    by_stance = defaultdict(int)
    for v in classificacoes.values():
        by_stance[v["stance"]] += 1
    print(f">>> stance_llm_cache.json atualizado: {len(classificacoes)} entradas ({dict(by_stance)})")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="Não escreve no autoria.json")
    ap.add_argument("--limit", type=int, default=None, help="Max PLs a classificar")
    ap.add_argument(
        "--min-confidence",
        type=float,
        default=0.8,
        help="Só sobrescreve se LLM tiver confiança >= esse valor",
    )
    ap.add_argument(
        "--model",
        default="claude-haiku-4-5-20251001",
        help="Claude model id",
    )
    args = ap.parse_args()

    client = Anthropic()  # usa ANTHROPIC_API_KEY

    autoria = json.loads((DATA_DIR / "autoria.json").read_text(encoding="utf-8"))
    overrides = load_overrides()
    if overrides:
        print(f">>> {len(overrides)} overrides manuais carregados (pulados pelo LLM)")

    # Aplicar overrides primeiro
    for d in autoria["deputados"]:
        for pl in d["pls"]:
            ov = overrides.get(str(pl["id"]))
            if ov:
                pl["stance"] = ov
                pl["llm_justificativa"] = "Override manual — verificado editorialmente."

    # Coletar PLs únicas marcadas como protetivas (candidatas a reclassificação)
    seen = set()
    candidates = []
    for d in autoria["deputados"]:
        for pl in d["pls"]:
            if pl["id"] in seen:
                continue
            if str(pl["id"]) in overrides:
                seen.add(pl["id"])
                continue  # já tem override, pular
            if pl.get("stance") == "protetivo":
                seen.add(pl["id"])
                candidates.append(pl)

    print(f">>> {len(candidates)} PLs protetivas a revisar com {args.model}")

    if args.limit:
        candidates = candidates[: args.limit]
        print(f"    (limit: primeiras {len(candidates)})")

    # Cache de resultados por pl_id pra aplicar a todas as cópias
    results = {}
    overrides = {"punitivista": 0, "regressivo": 0, "confirmados": 0, "erros": 0}

    for i, pl in enumerate(candidates, 1):
        ementa = pl.get("ementa", "")[:1500]  # truncar se muito longo
        try:
            r = classify_pl(client, ementa, model=args.model)
        except Exception as exc:
            print(f"  erro em {pl['id']}: {exc}")
            overrides["erros"] += 1
            time.sleep(2)
            continue

        if not r:
            overrides["erros"] += 1
            continue

        stance_map = {"protetiva": "protetivo", "punitivista": "punitivista", "regressiva": "regressivo"}
        new_stance = stance_map.get(r.get("stance"))
        conf = r.get("confianca", 0)
        just = r.get("justificativa", "")

        if new_stance and new_stance != "protetivo" and conf >= args.min_confidence:
            results[pl["id"]] = {
                "new_stance": new_stance,
                "confianca": conf,
                "justificativa": just,
            }
            overrides[new_stance] += 1
            print(
                f"  [{i}/{len(candidates)}] {pl['tipo']} {pl['numero']}/{pl['ano']} "
                f"→ {new_stance.upper()} ({conf:.2f}): {just[:120]}"
            )
        else:
            overrides["confirmados"] += 1

        if i % 50 == 0:
            print(f"  progresso: {i}/{len(candidates)} — punitivista={overrides['punitivista']} regressivo={overrides['regressivo']}")

    print(f"\n>>> Resumo:")
    print(f"    confirmados protetivos: {overrides['confirmados']}")
    print(f"    novos punitivistas: {overrides['punitivista']}")
    print(f"    novos regressivos: {overrides['regressivo']}")
    print(f"    erros: {overrides['erros']}")

    if args.dry_run:
        print("\n[dry-run] não modificando autoria.json")
        return

    # Aplicar overrides
    for d in autoria["deputados"]:
        for pl in d["pls"]:
            if pl["id"] in results:
                r = results[pl["id"]]
                pl["stance"] = r["new_stance"]
                pl["llm_confianca"] = r["confianca"]
                pl["llm_justificativa"] = r["justificativa"]

    # Persistir cache LLM — sem isso, classify_stance.py (rodada diária)
    # perde essas classificações no próximo rebuild_autoria. O cache é
    # cumulativo: classificações antigas que não voltaram a ser revistas
    # nesta rodada (ex.: a PL não foi mais marcada como protetiva pela
    # regex) ficam preservadas. Quando o LLM revisar de novo e mudar de
    # ideia, a nova entrada sobrescreve a antiga.
    persistir_cache_llm(autoria, results)

    # Recalcular totais por deputado (já considerando regressivos=fora)
    for d in autoria["deputados"]:
        pls = d["pls"]
        d["protetivos"] = sum(1 for p in pls if p.get("stance") == "protetivo")
        d["punitivistas"] = sum(1 for p in pls if p.get("stance") == "punitivista")
        d["regressivos"] = sum(1 for p in pls if p.get("stance") == "regressivo")

        non_regr = [p for p in pls if p.get("stance") != "regressivo"]
        d["total"] = len(non_regr)
        d["estruturais"] = sum(1 for p in non_regr if p["categoria"] == "estrutural")
        d["incrementais"] = sum(1 for p in non_regr if p["categoria"] == "incremental")
        d["simbolicas"] = sum(1 for p in non_regr if p["categoria"] == "simbólica")

    autoria["deputados"].sort(
        key=lambda d: d["estruturais"] * 3 + d["incrementais"] - d.get("regressivos", 0) * 2,
        reverse=True,
    )

    # Recalcular totalPls (únicos não-regressivos)
    total_pls_set = set()
    for d in autoria["deputados"]:
        for pl in d["pls"]:
            if pl.get("stance") != "regressivo":
                total_pls_set.add(pl["id"])
    autoria["totalPls"] = len(total_pls_set)

    (DATA_DIR / "autoria.json").write_text(
        json.dumps(autoria, ensure_ascii=False), encoding="utf-8"
    )
    print("\n>>> autoria.json atualizado")


if __name__ == "__main__":
    main()
