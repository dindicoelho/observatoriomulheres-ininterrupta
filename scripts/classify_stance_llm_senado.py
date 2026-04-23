#!/usr/bin/env python3
"""
Classificação LLM das matérias do Senado. Mesmo princípio do
classify_stance_llm.py da Câmara: revisa PLs marcadas como
"protetivas" pela regex pra detectar regressivas sutis.

Foco especial: framing conservador ("fortalecimento da família",
"proteção à gestante" como anti-aborto, Consenso de Genebra, etc).
"""

import json
import sys
import time
from pathlib import Path

try:
    from anthropic import Anthropic
except ImportError:
    print("Requer: pip install anthropic")
    sys.exit(1)

DATA_DIR = Path(__file__).parent.parent / "src" / "data"

SYSTEM_PROMPT = """Você é especialista em políticas públicas brasileiras com foco em direitos das mulheres.

Classifique matérias legislativas do Senado Federal em:

PROTETIVA — amplia direitos, cria política pública, protege a vítima.

PUNITIVISTA — foca em pena, rigor penal, cadastros de condenados.

REGRESSIVA — restringe direitos, controla/pune a vítima, dificulta aborto legal, usa framing conservador ("fortalecimento da família", "proteção à gestante", "Consenso de Genebra") pra limitar direitos reprodutivos, propõe plebiscito sobre aborto (tática pra constitucionalizar proibição), cria obstáculos ao acesso a serviços de saúde reprodutiva, instrumentaliza "proteção à mulher" pra agenda conservadora.

ATENÇÃO: no Senado, muitas proposições usam linguagem de "proteção" mas na prática restringem direitos. "Proteção à gestante" pode significar "alternativas ao aborto". "Fortalecimento da família" pode significar oposição a direitos LGBT+ e reprodutivos. Avalie a intenção real, não o verniz.

Seja conservador: na dúvida, PROTETIVA.

Responda em JSON:
{"stance": "protetiva|punitivista|regressiva", "confianca": 0.0-1.0, "justificativa": "máximo 2 frases"}"""


def main():
    client = Anthropic()
    senado = json.loads((DATA_DIR / "senado.json").read_text(encoding="utf-8"))

    # Coletar PLs únicas protetivas
    seen = set()
    candidates = []
    for s in senado["ranking"]:
        for pl in s["pls"]:
            if pl["codigo"] in seen or pl.get("stance") != "protetivo":
                continue
            seen.add(pl["codigo"])
            candidates.append(pl)

    print(f">>> {len(candidates)} PLs protetivas do Senado a revisar")

    results = {}
    overrides = {"punitivista": 0, "regressivo": 0, "confirmados": 0, "erros": 0}

    for i, pl in enumerate(candidates, 1):
        ementa = pl.get("ementa", "")[:1500]
        try:
            msg = client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=300,
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": f"Ementa:\n{ementa}"}],
            )
            text = msg.content[0].text.strip()
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            r = json.loads(text.strip())
        except Exception as exc:
            print(f"  erro: {exc}")
            overrides["erros"] += 1
            time.sleep(1)
            continue

        stance_map = {"protetiva": "protetivo", "punitivista": "punitivista", "regressiva": "regressivo"}
        new_stance = stance_map.get(r.get("stance"))
        conf = r.get("confianca", 0)
        just = r.get("justificativa", "")

        if new_stance and new_stance != "protetivo" and conf >= 0.8:
            results[pl["codigo"]] = {"new_stance": new_stance, "confianca": conf, "justificativa": just}
            overrides[new_stance] += 1
            print(f"  [{i}/{len(candidates)}] {pl['sigla']} {pl['numero']}/{pl['ano']} → {new_stance.upper()} ({conf:.2f}): {just[:120]}")
        else:
            overrides["confirmados"] += 1

        if i % 30 == 0:
            print(f"  progresso: {i}/{len(candidates)} — punit={overrides['punitivista']} regr={overrides['regressivo']}")

    print(f"\n>>> Resumo: confirmados={overrides['confirmados']} punit={overrides['punitivista']} regr={overrides['regressivo']} erros={overrides['erros']}")

    # Aplicar
    for s in senado["ranking"]:
        for pl in s["pls"]:
            if pl["codigo"] in results:
                r = results[pl["codigo"]]
                pl["stance"] = r["new_stance"]
                pl["llm_justificativa"] = r["justificativa"]

        # Recalcular contagens
        s["protetivos"] = sum(1 for p in s["pls"] if p.get("stance") == "protetivo")
        s["punitivistas"] = sum(1 for p in s["pls"] if p.get("stance") == "punitivista")
        s["regressivos"] = sum(1 for p in s["pls"] if p.get("stance") == "regressivo")
        non_regr = [p for p in s["pls"] if p.get("stance") != "regressivo"]
        s["total"] = len(non_regr)
        s["estruturais"] = sum(1 for p in non_regr if p["categoria"] == "estrutural")
        s["incrementais"] = sum(1 for p in non_regr if p["categoria"] == "incremental")
        s["simbolicas"] = sum(1 for p in non_regr if p["categoria"] == "simbólica")
        sexo_mult = 2.5 if s.get("sexo") == "F" else 1.0
        s["score"] = (s["estruturais"] * 2 + s["incrementais"] - s["regressivos"] * 2) * sexo_mult

    senado["ranking"].sort(key=lambda x: x["score"], reverse=True)

    # Recalcular totais
    all_stances = {"protetivo": 0, "punitivista": 0, "regressivo": 0}
    for s in senado["ranking"]:
        all_stances["protetivo"] += s["protetivos"]
        all_stances["punitivista"] += s["punitivistas"]
        all_stances["regressivo"] += s["regressivos"]
    senado["total_protetivas"] = all_stances["protetivo"]
    senado["total_punitivistas"] = all_stances["punitivista"]
    senado["total_regressivas"] = all_stances["regressivo"]

    (DATA_DIR / "senado.json").write_text(json.dumps(senado, ensure_ascii=False), encoding="utf-8")

    print("\n>>> senado.json atualizado")
    print(">>> Novo top 10:")
    for i, s in enumerate(senado["ranking"][:10], 1):
        print(f"  {i:2d}. [{s['sexo']}] {s['nome']:<30} prot={s['protetivos']} punit={s['punitivistas']} regr={s['regressivos']} score={s['score']:.0f}")


if __name__ == "__main__":
    main()
