import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "O tipo de lei — Observatório Político",
  description:
    "Das mais de mil proposições, 76% estão paradas em comissão. Só 16 viraram lei em 3 anos. Veja o funil legislativo.",
  openGraph: {
    title: "O Congresso está agindo?",
    description:
      "76% paradas em comissão. 79 nunca receberam relator. 16 viraram lei. O funil legislativo da proteção à mulher.",
  },
};

export default function Ato02Page() {
  redirect("/#ato-02");
}
