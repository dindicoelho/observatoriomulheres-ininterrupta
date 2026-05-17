import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://mapa-violencia-mulher.vercel.app"),
  title: "Quem está fazendo algo? — Observatório Político dos Direitos das Mulheres",
  description:
    "Direitos das mulheres já são lei. Esse observatório rastreia o que a Câmara faz — quem propõe, quem vota, quem relata, quem atua contra. 389 deputados · 1.142 PLs · 62 parlamentares com proposições regressivas.",
  openGraph: {
    title: "Quem está fazendo algo?",
    description:
      "Observatório político da 57ª legislatura. 389 deputados, 1.142 PLs, 15 mulheres no top 20 de produção. Pra votar consciente em 2026.",
    type: "website",
    locale: "pt_BR",
    siteName: "Observatório · Ininterrupta",
  },
  twitter: {
    card: "summary_large_image",
    title: "Quem está fazendo algo?",
    description:
      "Observatório político da 57ª legislatura. 389 deputados, 1.142 PLs, 62 com proposições regressivas.",
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
