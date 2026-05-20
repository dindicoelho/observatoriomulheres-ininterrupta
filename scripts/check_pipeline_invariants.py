#!/usr/bin/env python3
"""
Guarda final do pipeline: compara totais críticos do autoria.json atual
com a versão anteriormente commitada (HEAD) e ABORTA se houver queda
desproporcional.

Existe porque já tivemos o seguinte bug: rebuild_autoria.py recriava
autoria.json do zero todo dia e a classify_stance.py (regex) perdia
~35% dos regressivos e ~70% dos punitivistas detectados pela rodada
LLM semanal — durante 6 dias da semana o score nacional ignorava boa
parte do retrocesso até a próxima segunda. Sem esta guarda, dava pra
publicar dado errado sem ninguém notar.

Checagens:
- regressivos (autoria de PLs regressivas) — desconta -7 no score
- votos_regressivos (voto SIM em pauta regressiva)    — desconta -5
- punitivistas (autoria de PLs punitivistas)          — desconta -2
- totalDeputados — proteção contra rebuild quebrado

Política:
- Queda > 10% vs HEAD ⇒ falha
- Total = 0 ⇒ falha
- Subida e quedas pequenas (≤10%) ⇒ ok (variação natural)

Roda no CI antes do commit. Exit 1 aborta o workflow e mantém o JSON
publicado intacto.
"""

import json
import subprocess
import sys
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "src" / "data"
AUTORIA_REL = "src/data/autoria.json"

# % máximo de queda tolerada em relação ao HEAD anterior
MAX_DROP_PCT = 10.0


def totais(autoria: dict) -> dict:
    deps = autoria.get("deputados", [])
    return {
        "regressivos": sum(d.get("regressivos", 0) for d in deps),
        "votos_regressivos": sum(d.get("votos_regressivos", 0) for d in deps),
        "punitivistas": sum(d.get("punitivistas", 0) for d in deps),
        "totalDeputados": len(deps),
    }


def carregar_atual() -> dict:
    return json.loads((DATA_DIR / "autoria.json").read_text(encoding="utf-8"))


def carregar_head() -> dict | None:
    """Versão de autoria.json no HEAD anterior. Retorna None se não houver
    histórico (primeira execução, repo recém-clonado raso, etc)."""
    try:
        out = subprocess.run(
            ["git", "show", f"HEAD:{AUTORIA_REL}"],
            check=True,
            capture_output=True,
            text=True,
        )
        return json.loads(out.stdout)
    except (subprocess.CalledProcessError, json.JSONDecodeError) as exc:
        print(f">>> (sem versão anterior no git pra comparar: {exc})", file=sys.stderr)
        return None


def main() -> int:
    atual = carregar_atual()
    head = carregar_head()

    tot_atual = totais(atual)
    print(">>> Totais atuais:")
    for k, v in tot_atual.items():
        print(f"    {k:20s} = {v}")

    # Checagem 1: nenhum total pode ser zero (sanity)
    erros: list[str] = []
    for campo, valor in tot_atual.items():
        if valor == 0:
            erros.append(
                f"{campo} = 0 — pipeline provavelmente quebrado "
                f"(rebuild_autoria, classify_stance ou compute_vote_penalty)"
            )

    # Checagem 2: queda > MAX_DROP_PCT em relação ao HEAD
    if head is not None:
        tot_head = totais(head)
        print("\n>>> Comparando com HEAD anterior:")
        for k, v_atual in tot_atual.items():
            v_head = tot_head.get(k, 0)
            if v_head == 0:
                pct = "n/a"
            else:
                pct = f"{(v_atual - v_head) / v_head * 100:+.1f}%"
            sinal = "↓" if v_atual < v_head else ("↑" if v_atual > v_head else "=")
            print(f"    {k:20s} {v_head} → {v_atual}  {sinal} {pct}")

            if v_head > 0 and v_atual < v_head:
                queda_pct = (v_head - v_atual) / v_head * 100
                if queda_pct > MAX_DROP_PCT:
                    erros.append(
                        f"{campo_humano(k)} caiu {queda_pct:.1f}% "
                        f"({v_head} → {v_atual}) — acima do limite de "
                        f"{MAX_DROP_PCT}%. Possível regressão do pipeline."
                    )

    if erros:
        print("\n" + "=" * 60, file=sys.stderr)
        print("ABORTANDO: invariantes do pipeline violados", file=sys.stderr)
        print("=" * 60, file=sys.stderr)
        for e in erros:
            print(f"  ✗ {e}", file=sys.stderr)
        print(
            "\nO autoria.json NÃO será commitado. Investigue:\n"
            "  1. stance_llm_cache.json carregou? (classify_stance.py mostra contagem)\n"
            "  2. regressive_votes_seed.json íntegro?\n"
            "  3. API da Câmara devolveu dados válidos no rebuild_autoria?",
            file=sys.stderr,
        )
        return 1

    print("\n>>> ✓ Invariantes do pipeline OK")
    return 0


def campo_humano(k: str) -> str:
    return {
        "regressivos": "Autoria de PLs regressivas",
        "votos_regressivos": "Votos SIM em pauta regressiva",
        "punitivistas": "Autoria de PLs punitivistas",
        "totalDeputados": "Total de deputados",
    }.get(k, k)


if __name__ == "__main__":
    sys.exit(main())
