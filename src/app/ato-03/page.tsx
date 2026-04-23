import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nem toda lei é proteção — Observatório Político",
  description:
    "62 deputados assinam proposições regressivas: criminalização do aborto legal, armamentismo, sustação de resoluções protetivas. Veja quem são.",
  openGraph: {
    title: "Nem toda lei é proteção.",
    description:
      "171 PLs regressivas identificadas. 62 deputados que assinam. Criminalização do aborto, armamentismo, sustação do Conanda.",
  },
};

export default function Ato03Page() {
  redirect("/#ato-03");
}
