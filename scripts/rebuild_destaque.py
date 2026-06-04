#!/usr/bin/env python3
"""
Gera src/data/destaque.json: 1 fato grande e recente sobre o tema
(violência contra a mulher / direitos das mulheres na Câmara).

Cascata de seleção (escolhe o primeiro tier que tiver material):
  1. Votação real (≥ 50 votos totais) nos últimos 14 dias.
  2. PL punitivista/regressiva nova OU em movimento nos últimos 14 dias.
  3. PL com co-autoria expressiva (≥ 20 deputados) nos últimos 14 dias.
  4. Fallback panorama: estatística agregada dos últimos 30 dias.

Headline + contexto são gerados pelo Claude Haiku 4.5, com cache por
signature do evento — se a signature não mudou desde a última rodada,
não chama LLM (economia de custo nos dias em que nada relevante
aconteceu).
"""

from __future__ import annotations

import json
import os
import sys
from collections import Counter
from datetime import date, datetime, timedelta
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "src" / "data"
CACHE_PATH = Path(__file__).parent / "destaque_llm_cache.json"
DESTAQUE_PATH = DATA_DIR / "destaque.json"

# Janelas (dias)
JANELA_RECENTE = 14
JANELA_PUNITIVISTA = 21  # alarme tem memória mais longa
JANELA_PANORAMA = 30
COAUTORIA_MINIMA = 10
VOTOS_MINIMOS = 50

MESES_PT = [
    "jan", "fev", "mar", "abr", "mai", "jun",
    "jul", "ago", "set", "out", "nov", "dez",
]


def fmt_data_br(iso: str) -> str:
    """2026-06-04 → 04 jun 2026"""
    try:
        d = datetime.fromisoformat(iso[:10]).date()
        return f"{d.day:02d} {MESES_PT[d.month - 1]} {d.year}"
    except Exception:
        return iso


def dias_atras(n: int) -> str:
    return (date.today() - timedelta(days=n)).isoformat()


# ---------- Tier selectors ----------

def tier_votacao(votacoes_data: dict) -> dict | None:
    cutoff = dias_atras(JANELA_RECENTE)
    # Só votações de mérito com placar real — evita headlinar votos
    # procedurais (urgência, alteração de regime) como decisão de conteúdo.
    candidatas = [
        v for v in votacoes_data["votacoes"]
        if v.get("data", "") >= cutoff
        and v.get("tipo") == "mérito"
        and (v.get("totalSim", 0) + v.get("totalNao", 0)) >= VOTOS_MINIMOS
    ]
    if not candidatas:
        return None
    candidatas.sort(key=lambda v: v["data"], reverse=True)
    v = candidatas[0]
    return {"tier": "votacao", "evento": v}


def tier_punitivista(legislativo: dict) -> dict | None:
    """Punitivista NOVA ou que MOVIMENTOU nos últimos 14 dias.
    Movimentação (mudança de fase/órgão) costuma ser sinal mais forte
    de risco real do que mera apresentação.
    """
    cutoff = dias_atras(JANELA_PUNITIVISTA)
    candidatas = []
    for p in legislativo["proposicoes"]:
        if p.get("stance") not in ("punitivista", "regressivo"):
            continue
        data_pl = p.get("data", "")
        data_mov = (p.get("destino") or {}).get("data_hora", "") or ""
        # 'data_hora' vem em ISO; comparação lexicográfica funciona
        # como prefixo de data já que ambos começam com YYYY-MM-DD.
        if data_pl >= cutoff or data_mov[:10] >= cutoff:
            ref_data = max(data_pl, data_mov[:10])
            candidatas.append((ref_data, p))
    if not candidatas:
        return None
    candidatas.sort(key=lambda x: x[0], reverse=True)
    _, p = candidatas[0]
    return {"tier": "punitivista", "evento": p}


def tier_coautoria(autoria: dict, legislativo: dict) -> dict | None:
    cutoff = dias_atras(JANELA_RECENTE)
    contador: Counter = Counter()
    for dep in autoria["deputados"]:
        for pl in dep.get("pls", []):
            if pl.get("data", "") >= cutoff:
                contador[pl["id"]] += 1

    candidatos = [
        (pl_id, total) for pl_id, total in contador.items()
        if total >= COAUTORIA_MINIMA
    ]
    if not candidatos:
        return None

    candidatos.sort(key=lambda x: x[1], reverse=True)
    pl_id, total = candidatos[0]

    prop = next(
        (p for p in legislativo["proposicoes"] if p["id"] == pl_id),
        None,
    )
    if not prop:
        return None

    return {
        "tier": "mobilizacao",
        "evento": {**prop, "total_coautores": total},
    }


def tier_panorama(legislativo: dict) -> dict:
    cutoff = dias_atras(JANELA_PANORAMA)
    recentes = [
        p for p in legislativo["proposicoes"]
        if p.get("data", "") >= cutoff
    ]
    total = len(recentes)
    por_categoria = Counter(p.get("categoria", "?") for p in recentes)
    por_stance = Counter(p.get("stance", "?") for p in recentes)

    return {
        "tier": "panorama",
        "evento": {
            "janela_dias": JANELA_PANORAMA,
            "total": total,
            "simbolicas": por_categoria.get("simbólica", 0),
            "incrementais": por_categoria.get("incremental", 0),
            "estruturais": por_categoria.get("estrutural", 0),
            "punitivistas": (
                por_stance.get("punitivista", 0)
                + por_stance.get("regressivo", 0)
            ),
            "protetivas": por_stance.get("protetivo", 0),
            "desde": cutoff,
        },
    }


def selecionar_evento(autoria, legislativo, votacoes) -> dict:
    for selector in (
        lambda: tier_votacao(votacoes),
        lambda: tier_punitivista(legislativo),
        lambda: tier_coautoria(autoria, legislativo),
    ):
        out = selector()
        if out:
            return out
    return tier_panorama(legislativo)


# ---------- Signature ----------

def build_signature(sel: dict) -> str:
    tier = sel["tier"]
    e = sel["evento"]
    if tier == "votacao":
        return f"votacao:{e['pl_ref']}:{e['data']}:{e.get('totalSim',0)}-{e.get('totalNao',0)}"
    if tier == "punitivista":
        return f"punitivista:{e['tipo']}{e['numero']}/{e['ano']}:{e['data']}"
    if tier == "mobilizacao":
        return (
            f"mobilizacao:{e['tipo']}{e['numero']}/{e['ano']}"
            f":{e['total_coautores']}"
        )
    if tier == "panorama":
        return (
            f"panorama:{e['desde']}:{e['total']}"
            f":pun{e['punitivistas']}:sim{e['simbolicas']}"
        )
    return "desconhecido"


# ---------- LLM ----------

SYSTEM_PROMPT = """Você escreve manchetes editoriais para um observatório político brasileiro sobre direitos das mulheres na Câmara dos Deputados.

REGRAS DE TOM:
- Manchete com força de impacto, MAS sem sensacionalismo.
- Fato primeiro, julgamento depois (e julgamento curtíssimo).
- Sempre baseada no dado bruto fornecido — NUNCA invente número, data ou nome.
- Português brasileiro, jornalístico, frase ativa.
- Evite adjetivos vagos ("importante", "histórico"). Use o número como ancoragem.

REGRAS DE FORMATO:
Responda APENAS com um JSON válido (sem markdown, sem ```), com estes campos:
{
  "headline": "1 frase, até 110 caracteres. Manchete. Sem ponto final.",
  "anchor": "Dados-chave separados por ' · '. Ex: 'PL 6415/2025 · Aprovado · 11/03/2026'. Curto.",
  "contexto": "2 a 3 frases curtas explicando por que esse fato importa, em até 320 caracteres totais. Sem editorializar pesado — diga o que aconteceu e qual a implicação prática.",
  "link_label": "Texto curto pro botão de saída. Ex: 'Ver na Câmara' ou 'Ver projeto'."
}
"""


def chamar_llm(sel: dict) -> dict:
    try:
        from anthropic import Anthropic
    except ImportError:
        print("anthropic não instalado — usando fallback estático")
        return fallback_estatico(sel)

    client = Anthropic()
    user_payload = {
        "tier": sel["tier"],
        "evento": sel["evento"],
    }
    msg = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=600,
        system=SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": (
                    f"Dado bruto do evento a ser destacado:\n"
                    f"{json.dumps(user_payload, ensure_ascii=False, indent=2)}\n\n"
                    "Gere o destaque."
                ),
            },
        ],
    )
    text = msg.content[0].text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip().rstrip("`").strip()

    try:
        return json.loads(text)
    except Exception as exc:
        print(f"!! LLM retornou JSON inválido: {exc}")
        print(f"   texto bruto: {text[:300]}")
        return fallback_estatico(sel)


def fallback_estatico(sel: dict) -> dict:
    """Plano B determinístico caso o LLM falhe ou não esteja disponível.
    Mantém a seção viva mesmo offline.
    """
    tier = sel["tier"]
    e = sel["evento"]
    if tier == "votacao":
        verbo = {
            "aprovado": "aprovou",
            "rejeitado": "rejeitou",
        }.get(e.get("resultado_placar", ""), "votou")
        return {
            "headline": (
                f"Câmara {verbo} {e.get('titulo_curto') or e['pl_ref']} "
                f"por {e.get('totalSim',0)} a {e.get('totalNao',0)}"
            )[:110],
            "anchor": (
                f"{e['pl_ref']} · "
                f"{(e.get('resultado_placar') or '').capitalize()} · "
                f"{fmt_data_br(e['data'])}"
            ),
            "contexto": (
                e.get("o_que_foi_votado")
                or e.get("pl_ementa", "")[:300]
            )[:320],
            "link_label": "Ver na Câmara",
        }
    if tier == "punitivista":
        return {
            "headline": (
                f"Nova proposição punitivista entrou na Câmara: "
                f"{e['tipo']} {e['numero']}/{e['ano']}"
            )[:110],
            "anchor": (
                f"{e['tipo']} {e['numero']}/{e['ano']} · "
                f"{e.get('categoria','?')} · {fmt_data_br(e['data'])}"
            ),
            "contexto": (e.get("ementa") or "")[:320],
            "link_label": "Ver projeto",
        }
    if tier == "mobilizacao":
        return {
            "headline": (
                f"{e['total_coautores']} deputados assinam juntos "
                f"{e['tipo']} {e['numero']}/{e['ano']}"
            )[:110],
            "anchor": (
                f"{e['tipo']} {e['numero']}/{e['ano']} · "
                f"{e['total_coautores']} coautores · "
                f"{fmt_data_br(e['data'])}"
            ),
            "contexto": (e.get("ementa") or "")[:320],
            "link_label": "Ver projeto",
        }
    # panorama
    return {
        "headline": (
            f"{e['total']} novas proposições sobre o tema "
            f"em {e['janela_dias']} dias"
        )[:110],
        "anchor": (
            f"{e['simbolicas']} simbólicas · "
            f"{e['incrementais']} incrementais · "
            f"{e['estruturais']} estruturais · "
            f"{e['punitivistas']} punitivistas"
        ),
        "contexto": (
            f"Nos últimos {e['janela_dias']} dias, a Câmara apresentou "
            f"{e['total']} proposições relacionadas a direitos das mulheres. "
            f"Categorias mostram onde o esforço legislativo está concentrado."
        )[:320],
        "link_label": "Ver acervo completo",
    }


# ---------- Cache ----------

def load_cache() -> dict:
    if CACHE_PATH.exists():
        try:
            return json.loads(CACHE_PATH.read_text(encoding="utf-8"))
        except Exception:
            return {}
    return {}


def save_cache(cache: dict) -> None:
    CACHE_PATH.write_text(
        json.dumps(cache, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


# ---------- Render → JSON ----------

def link_evento(sel: dict) -> str:
    tier = sel["tier"]
    e = sel["evento"]
    if tier == "votacao":
        return f"https://www.camara.leg.br/propostas-legislativas/{e['pl_id']}"
    if tier in ("punitivista", "mobilizacao"):
        return f"https://www.camara.leg.br/propostas-legislativas/{e['id']}"
    return "https://www.camara.leg.br/buscaProposicoesWeb"


def pl_ref_evento(sel: dict) -> str:
    tier = sel["tier"]
    e = sel["evento"]
    if tier == "votacao":
        return e["pl_ref"]
    if tier in ("punitivista", "mobilizacao"):
        return f"{e['tipo']} {e['numero']}/{e['ano']}"
    return ""


def main() -> None:
    autoria = json.loads((DATA_DIR / "autoria.json").read_text(encoding="utf-8"))
    legislativo = json.loads((DATA_DIR / "legislativo.json").read_text(encoding="utf-8"))
    votacoes = json.loads((DATA_DIR / "votacoes.json").read_text(encoding="utf-8"))

    sel = selecionar_evento(autoria, legislativo, votacoes)
    sig = build_signature(sel)
    print(f">>> tier={sel['tier']}  signature={sig}")

    cache = load_cache()
    if cache.get("signature") == sig and "render" in cache:
        print("    cache hit — não chama LLM")
        render = cache["render"]
    elif os.environ.get("ANTHROPIC_API_KEY"):
        print("    cache miss — chamando Claude Haiku")
        render = chamar_llm(sel)
        cache = {
            "signature": sig,
            "render": render,
            "generated_at": date.today().isoformat(),
            "tier": sel["tier"],
        }
        save_cache(cache)
    else:
        print("    sem ANTHROPIC_API_KEY — usando fallback estático")
        render = fallback_estatico(sel)

    hoje = date.today().isoformat()
    payload = {
        "destaque": {
            "categoria": sel["tier"],
            "selo": f"DESTAQUE — {fmt_data_br(hoje)}",
            "headline": render["headline"],
            "anchor": render.get("anchor", ""),
            "contexto": render.get("contexto", ""),
            "pl_ref": pl_ref_evento(sel),
            "link": link_evento(sel),
            "link_label": render.get("link_label", "Ver fonte"),
            "updated_at": hoje,
        }
    }

    DESTAQUE_PATH.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f">>> destaque.json salvo ({sel['tier']})")
    print(f"    headline: {render['headline']}")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"!! erro fatal: {exc}", file=sys.stderr)
        sys.exit(1)
