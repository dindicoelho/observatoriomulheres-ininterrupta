import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import autoriaData from "../data/autoria.json";

const GA_MEASUREMENT_ID = "G-ZK2V1MCDPL";

const TOTAL_PLS = (autoriaData as { totalPls: number }).totalPls;
const TOTAL_DEPS = (autoriaData as { totalDeputados: number }).totalDeputados;
const TOTAL_REGR = (autoriaData as { totalRegressivas?: number }).totalRegressivas ?? 0;

const TOTAL_PLS_FMT = TOTAL_PLS.toLocaleString("pt-BR");

const DESCRIPTION_FULL = `Direitos das mulheres já são lei. Esse observatório rastreia o que a Câmara faz — quem propõe, quem vota, quem relata, quem atua contra. ${TOTAL_DEPS} deputados · ${TOTAL_PLS_FMT} PLs · ${TOTAL_REGR} proposições regressivas expostas.`;
const DESCRIPTION_SHORT = `Observatório político da 57ª legislatura. ${TOTAL_DEPS} deputados, ${TOTAL_PLS_FMT} PLs, ${TOTAL_REGR} proposições regressivas. Pra votar consciente em 2026.`;

export const metadata: Metadata = {
  metadataBase: new URL("https://mapa-violencia-mulher.vercel.app"),
  title: "Quem está fazendo algo? — Observatório Político dos Direitos das Mulheres",
  description: DESCRIPTION_FULL,
  openGraph: {
    title: "Quem está fazendo algo?",
    description: DESCRIPTION_SHORT,
    type: "website",
    locale: "pt_BR",
    siteName: "Observatório · Ininterrupta",
  },
  twitter: {
    card: "summary_large_image",
    title: "Quem está fazendo algo?",
    description: DESCRIPTION_SHORT,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
      <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />
    </html>
  );
}
