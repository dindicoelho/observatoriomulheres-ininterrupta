import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quem representa seu estado — Observatório Político",
  description:
    "Mapa do Brasil com os 3 deputados que mais atuam em políticas de proteção à mulher em cada estado. 5 UFs não elegeram nenhuma deputada.",
  openGraph: {
    title: "Quem representa seu estado?",
    description:
      "Top 3 por UF em políticas de proteção à mulher. 5 estados sem nenhuma deputada eleita na legislatura.",
  },
};

export default function GuiaEstadosPage() {
  redirect("/#guia-estados");
}
