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

# Tradução das siglas de órgão da Câmara em nome legível.
# Cobre os ~15 órgãos mais comuns no dataset; fallback usa a sigla.
ORGAO_NOMES = {
    "MESA": "Mesa Diretora",
    "PLEN": "Plenário",
    "CCP": "Comissão de Constituição",
    "CCJC": "Comissão de Constituição e Justiça e de Cidadania (CCJC)",
    "CMULHER": "Comissão de Defesa dos Direitos da Mulher",
    "CPASF": "Comissão de Previdência, Assistência Social, Infância, Adolescência e Família",
    "CSPCCO": "Comissão de Segurança Pública e Combate ao Crime Organizado",
    "CSAUDE": "Comissão de Saúde",
    "CTRAB": "Comissão de Trabalho",
    "CE": "Comissão de Educação",
    "CASP": "Comissão de Administração e Serviço Público",
    "CFT": "Comissão de Finanças e Tributação",
    "CDHMIR": "Comissão de Direitos Humanos e Minorias",
    "CICS": "Comissão de Indústria, Comércio e Serviços",
    "CVT": "Comissão de Viação e Transportes",
}


def orgao_legivel(sigla: str | None) -> str:
    if not sigla:
        return ""
    return ORGAO_NOMES.get(sigla, sigla)


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


def enriquecer_status(proposicao: dict, legislativo: dict) -> dict:
    """Monta um sub-dict 'status_agora' interpretado a partir do destino.
    O label da fase vem do próprio JSON (categorias_labels), pra manter
    coerência com o resto do site.
    """
    destino = proposicao.get("destino") or {}
    fase = destino.get("categoria") or "desconhecida"
    labels = (legislativo.get("destino_stats") or {}).get(
        "categorias_labels", {}
    )
    sigla = destino.get("orgao")
    return {
        "fase": fase,
        "fase_label": labels.get(fase, fase),
        "orgao_sigla": sigla,
        "orgao_nome": orgao_legivel(sigla),
        "situacao": destino.get("situacao"),
        "ultima_movimentacao": destino.get("data_hora"),
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


def enriquecer_evento(sel: dict, legislativo: dict) -> None:
    """Adiciona 'status_agora' (interpretado) no evento, in-place.
    O LLM precisa disso pra escrever 'onde está' com precisão."""
    tier = sel["tier"]
    evento = sel["evento"]

    if tier in ("punitivista", "mobilizacao"):
        evento["status_agora"] = enriquecer_status(evento, legislativo)
    elif tier == "votacao":
        # Acha a PL associada pra puxar status pós-votação
        pl_id = evento.get("pl_id")
        prop = next(
            (p for p in legislativo["proposicoes"] if p["id"] == pl_id),
            None,
        )
        if prop:
            evento["status_agora"] = enriquecer_status(prop, legislativo)


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

SYSTEM_PROMPT = """Você escreve destaques editoriais para um observatório político brasileiro sobre direitos das mulheres na Câmara dos Deputados. Seu trabalho é deixar QUALQUER leitor entender, em segundos: o que está sendo decidido, em que pé está, e o que está em jogo.

REGRAS DE TOM:
- Linguagem clara, jornalística, frase ativa, sem juridiquês.
- Fato primeiro, julgamento depois (e julgamento curtíssimo).
- NUNCA invente número, data, sigla de comissão ou nome. Use só o que está no dado bruto.
- Evite adjetivos vagos ("importante", "histórico"). Use o concreto.
- Trate o leitor como inteligente, mas sem assumir que ele sabe como o Congresso funciona.

REGRAS DE FORMATO:
Responda APENAS com um JSON válido (sem markdown, sem ```), com EXATAMENTE estes campos:

{
  "headline": "1 frase ATIVA até 110 caracteres dizendo O QUE essa proposição/votação faz ou propõe. Manchete. Sem ponto final. Ex: 'Aumento de pena para feminicídio com mutilação chega à Câmara' ou 'Câmara aprovou por 213×152 obrigar advogados públicos para vítimas'.",

  "o_que_propoe": "1-2 frases (até 240 chars) explicando o conteúdo CONCRETO da proposta, sem juridiquês. O que muda na vida real. Use 'A proposta...' ou 'O projeto...'. Para votações, descreva o que está sendo votado.",

  "onde_esta": "1 frase (até 160 chars) dizendo em que fase de tramitação está AGORA. Use o status_agora fornecido (fase_label + orgao_nome + situacao). Seja específico: 'Apresentado em [data], aguardando designação de relator na Comissão X' ou 'Aprovado no plenário em [data], segue pro Senado'. Se for status_agora ausente (panorama), escreva o recorte temporal.",

  "o_que_se_decide": "1 frase (até 200 chars) explicando o ponto em jogo NESSE passo específico: qual a tensão, o que muda na prática se avançar, qual o dilema. Para PL nova: o trade-off da proposta. Para votação: o que aquela votação decidia. NUNCA editorialize partido; descreva a decisão.",

  "link_label": "Texto curto pro botão. Ex: 'Ver na Câmara' ou 'Ver projeto'."
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


def _onde_esta_humano(status: dict | None) -> str:
    """Compõe 'Apresentado em DD/MM, aguardando relator na Comissão X' etc.
    a partir do status_agora estruturado."""
    if not status:
        return ""
    fase_label = status.get("fase_label") or status.get("fase") or ""
    orgao = status.get("orgao_nome") or ""
    sit = status.get("situacao") or ""
    data_mov = (status.get("ultima_movimentacao") or "")[:10]
    partes = []
    if fase_label:
        partes.append(fase_label)
    if orgao:
        partes.append(f"em {orgao}")
    if sit:
        partes.append(f"— {sit.lower()}")
    if data_mov:
        partes.append(f"(desde {fmt_data_br(data_mov)})")
    return " ".join(partes).strip()


def fallback_estatico(sel: dict) -> dict:
    """Plano B determinístico caso o LLM falhe ou não esteja disponível."""
    tier = sel["tier"]
    e = sel["evento"]
    status = e.get("status_agora")

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
            "o_que_propoe": (
                e.get("projeto_sobre")
                or e.get("pl_ementa", "")
            )[:240],
            "onde_esta": _onde_esta_humano(status) or f"Votado em {fmt_data_br(e['data'])}.",
            "o_que_se_decide": (
                e.get("o_que_foi_votado") or ""
            )[:200],
            "link_label": "Ver na Câmara",
        }
    if tier == "punitivista":
        return {
            "headline": (
                f"Nova proposta punitivista chega à Câmara: "
                f"{e['tipo']} {e['numero']}/{e['ano']}"
            )[:110],
            "o_que_propoe": (e.get("ementa") or "")[:240],
            "onde_esta": (
                _onde_esta_humano(status)
                or f"Apresentada em {fmt_data_br(e['data'])}."
            ),
            "o_que_se_decide": (
                "Endurecimento penal sem alterar estrutura de proteção — "
                "punição como resposta, não prevenção."
            ),
            "link_label": "Ver projeto",
        }
    if tier == "mobilizacao":
        return {
            "headline": (
                f"{e['total_coautores']} deputados assinam juntos "
                f"{e['tipo']} {e['numero']}/{e['ano']}"
            )[:110],
            "o_que_propoe": (e.get("ementa") or "")[:240],
            "onde_esta": (
                _onde_esta_humano(status)
                or f"Apresentada em {fmt_data_br(e['data'])}."
            ),
            "o_que_se_decide": (
                f"Mobilização legislativa coletiva — {e['total_coautores']} "
                "deputados como co-autores sinalizam força política da pauta."
            ),
            "link_label": "Ver projeto",
        }
    # panorama
    return {
        "headline": (
            f"{e['total']} novas proposições sobre o tema "
            f"em {e['janela_dias']} dias"
        )[:110],
        "o_que_propoe": (
            f"Apresentadas: {e['simbolicas']} simbólicas, "
            f"{e['incrementais']} incrementais, "
            f"{e['estruturais']} estruturais."
        ),
        "onde_esta": f"Recorte das últimas {e['janela_dias']} datas de apresentação.",
        "o_que_se_decide": (
            f"{e['punitivistas']} dessas proposições têm postura "
            "punitivista (aumento de pena sem mudar estrutura) — "
            "o resto é protetivo ou neutro."
        ),
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


def anchor_derivado(sel: dict) -> str:
    """Anchor é derivado em Python, não pelo LLM — garante que PL ref,
    data e fase ficam sempre exatos."""
    tier = sel["tier"]
    e = sel["evento"]
    if tier == "votacao":
        status = (e.get("resultado_placar") or "").capitalize() or "Votado"
        return f"{e['pl_ref']} · {status} · {fmt_data_br(e['data'])}"
    if tier == "punitivista":
        return (
            f"{e['tipo']} {e['numero']}/{e['ano']} · "
            f"Apresentada em {fmt_data_br(e['data'])}"
        )
    if tier == "mobilizacao":
        return (
            f"{e['tipo']} {e['numero']}/{e['ano']} · "
            f"{e['total_coautores']} coautores · "
            f"{fmt_data_br(e['data'])}"
        )
    # panorama
    return (
        f"{e['total']} proposições · {e['janela_dias']} dias · "
        f"desde {fmt_data_br(e['desde'])}"
    )


def main() -> None:
    autoria = json.loads((DATA_DIR / "autoria.json").read_text(encoding="utf-8"))
    legislativo = json.loads((DATA_DIR / "legislativo.json").read_text(encoding="utf-8"))
    votacoes = json.loads((DATA_DIR / "votacoes.json").read_text(encoding="utf-8"))

    sel = selecionar_evento(autoria, legislativo, votacoes)
    enriquecer_evento(sel, legislativo)
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
            "anchor": anchor_derivado(sel),
            "o_que_propoe": render.get("o_que_propoe", ""),
            "onde_esta": render.get("onde_esta", ""),
            "o_que_se_decide": render.get("o_que_se_decide", ""),
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
