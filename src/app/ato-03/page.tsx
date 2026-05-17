import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Discurso e voto — Observatório Político",
  description:
    "Como cada partido vota nas proposições sobre direitos das mulheres. Placar por partido e gênero nas votações de mérito do plenário.",
  openGraph: {
    title: "Discurso e voto: como cada partido vota?",
    description:
      "Votações de mérito no plenário da Câmara sobre direitos das mulheres. Placar, partidos, gênero.",
  },
};

export default function Ato03Page() {
  redirect("/#ato-03");
}
