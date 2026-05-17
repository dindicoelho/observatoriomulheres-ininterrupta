import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quem propõe as leis — Observatório Político",
  description:
    "Ranking dos deputados que mais apresentam projetos sobre direitos das mulheres. 15 das 20 mais produtivas são mulheres.",
  openGraph: {
    title: "Quem propõe as leis sobre direitos das mulheres?",
    description:
      "389 deputados que propuseram proposições sobre direitos das mulheres. Ranking da 57ª legislatura.",
  },
};

export default function Ato01Page() {
  redirect("/#ato-01");
}
