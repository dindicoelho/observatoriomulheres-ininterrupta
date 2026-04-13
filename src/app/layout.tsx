import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mapa da Violência contra a Mulher no Brasil",
  description:
    "A Lei Maria da Penha protegeu metade das mulheres. Dados reais do Atlas da Violência revelam a divergência racial nos homicídios de mulheres no Brasil.",
  openGraph: {
    title: "Mapa da Violência contra a Mulher no Brasil",
    description:
      "3.903 mulheres assassinadas em 2023. 68,2% eram negras. A mesma lei, resultados opostos.",
    type: "website",
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mapa da Violência contra a Mulher no Brasil",
    description:
      "3.903 mulheres assassinadas em 2023. 68,2% eram negras. A mesma lei, resultados opostos.",
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
    </html>
  );
}
