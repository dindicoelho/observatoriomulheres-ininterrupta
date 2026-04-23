import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Senado Federal — Observatório Político",
  description:
    "81 senadores, 15 mulheres. As 11 primeiras posições do ranking de produção legislativa sobre violência contra a mulher são todas de senadoras.",
  openGraph: {
    title: "E no Senado?",
    description:
      "11 das 15 primeiras posições são mulheres. 487 matérias sobre violência contra a mulher na legislatura 2023-2026.",
  },
};

export default function SenadoPage() {
  redirect("/#senado");
}
