import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quem propõe as leis — Observatório Político",
  description:
    "Ranking dos deputados que mais apresentam projetos sobre violência contra a mulher. 15 das 20 mais produtivas são mulheres.",
  openGraph: {
    title: "Quem propõe as leis sobre violência contra a mulher?",
    description:
      "389 deputados, 1.059 PLs protetivas, 15 mulheres no top 20. Ranking da 57ª legislatura.",
  },
};

export default function Ato01Page() {
  redirect("/#ato-01");
}
