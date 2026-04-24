#!/usr/bin/env python3
"""
Double-check de TODAS as PLs classificadas como regressivas.
Se ambígua, reclassifica como 'nao_classificado' (não conta nem pra mais nem pra menos).
Cada regressiva confirmada recebe justificativa obrigatória.
"""

import json
import time
import os
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "src" / "data"

PROMPT = """Você é especialista em políticas públicas brasileiras. Uma PL foi classificada como REGRESSIVA (contra direitos da mulher). Verifique com rigor:

Ementa: {ementa}

INEQUIVOCAMENTE regressivo (manter):
- Criminalizar/aumentar pena de aborto legal, criar obstáculos ao aborto
- Sustar resoluções protetivas (Conanda, CNDM, CFM)
- Proibir tratamentos trans em menores
- Armar vítima com arma de fogo como resposta à violência
- Exigir provas técnicas pra violência doméstica (esvazia Maria da Penha)
- Criminalizar falsas acusações na Maria da Penha (obstáculo processual)
- Campanhas anti-aborto obrigatórias

AMBÍGUO (marcar nao_classificado):
- Comunicação compulsória por condomínios (intenção protetiva mas viola autonomia)
- Spray de pimenta, eletrochoque (armamentismo leve)
- Mudanças em licença maternidade / estágio gestante
- Exposição pública de agressores (punitivista, não necessariamente regressivo)
- Pulseira identificadora
- Norma culta / escolas sem relação direta com mulheres
- Qualquer PL onde a intenção protetiva é plausível

Se AMBÍGUO ou se há margem razoável pra interpretação protetiva → "nao_classificado".
Se INEQUIVOCAMENTE regressivo → "regressivo" + justificativa obrigatória.

Responda SOMENTE em JSON assim:
{{"resultado": "regressivo", "motivo": "explique em 1 frase"}}
ou
{{"resultado": "ambiguo", "motivo": "explique em 1 frase"}}"""


def main():
    from anthropic import Anthropic
    client = Anthropic()

    autoria = json.loads((DATA_DIR / "autoria.json").read_text(encoding="utf-8"))
    overrides = {}
    ov_path = Path(__file__).parent / "stance_overrides.json"
    if ov_path.exists():
        ov_data = json.loads(ov_path.read_text(encoding="utf-8"))
        overrides = {k for k in ov_data if not k.startswith("_")}

    seen = set()
    regr_pls = []
    for dep in autoria["deputados"]:
        for pl in dep["pls"]:
            if pl.get("stance") == "regressivo" and pl["id"] not in seen:
                if str(pl["id"]) in overrides:
                    continue
                seen.add(pl["id"])
                regr_pls.append(pl)

    print(f">>> Double-checking {len(regr_pls)} PLs regressivas...")

    results = {}
    for i, pl in enumerate(regr_pls, 1):
        if i % 10 == 0:
            print(f"  [{i}/{len(regr_pls)}]")
        try:
            msg = client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=200,
                messages=[{"role": "user", "content": PROMPT.format(ementa=pl["ementa"][:500])}],
            )
            text = msg.content[0].text.strip()
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            r = json.loads(text.strip())
            resultado = r.get("resultado", "")
            motivo = r.get("motivo", "")
            if resultado == "ambiguo":
                results[pl["id"]] = {"stance": "nao_classificado", "justificativa": motivo}
                print(f"  → ambíguo: {pl['tipo']} {pl['numero']}/{pl['ano']}: {motivo[:100]}")
            else:
                results[pl["id"]] = {"stance": "regressivo", "justificativa": motivo or pl.get("llm_justificativa", "Confirmado.")}
        except Exception:
            # Fallback: extrair do texto raw
            tl = (text if text else "").lower()
            if "ambiguo" in tl or "ambíguo" in tl:
                results[pl["id"]] = {"stance": "nao_classificado", "justificativa": "Ambíguo (extração raw)."}
                print(f"  → ambíguo (raw): {pl['tipo']} {pl['numero']}/{pl['ano']}")
            elif "regressivo" in tl:
                results[pl["id"]] = {"stance": "regressivo", "justificativa": pl.get("llm_justificativa", "Confirmado.")}
            else:
                print(f"  erro: {pl['tipo']} {pl['numero']}/{pl['ano']}: {(text or '')[:80]}")
        time.sleep(0.1)

    kept = sum(1 for r in results.values() if r.get("stance") == "regressivo")
    removed = sum(1 for r in results.values() if r.get("stance") == "nao_classificado")
    print(f"\n>>> {kept} confirmados regressivos, {removed} → não classificado")

    # Aplicar
    for dep in autoria["deputados"]:
        for pl in dep["pls"]:
            if str(pl["id"]) in overrides:
                continue
            r = results.get(pl["id"])
            if r and pl.get("stance") == "regressivo":
                if r["stance"] == "nao_classificado":
                    pl["stance"] = "nao_classificado"
                    pl["llm_justificativa"] = f"Ambíguo: {r.get('justificativa', '')}"
                else:
                    pl["llm_justificativa"] = r.get("justificativa", pl.get("llm_justificativa", ""))

        # Recalcular
        dep["protetivos"] = sum(1 for p in dep["pls"] if p.get("stance") == "protetivo")
        dep["punitivistas"] = sum(1 for p in dep["pls"] if p.get("stance") == "punitivista")
        dep["regressivos"] = sum(1 for p in dep["pls"] if p.get("stance") == "regressivo")
        countable = [p for p in dep["pls"] if p.get("stance") not in ("regressivo", "nao_classificado")]
        dep["total"] = len(countable)
        dep["estruturais"] = sum(1 for p in countable if p["categoria"] == "estrutural")
        dep["incrementais"] = sum(1 for p in countable if p["categoria"] == "incremental")
        dep["simbolicas"] = sum(1 for p in countable if p["categoria"] == "simbólica")

    json.dump(autoria, open(DATA_DIR / "autoria.json", "w"), ensure_ascii=False)
    print(">>> autoria.json atualizado")


if __name__ == "__main__":
    main()
