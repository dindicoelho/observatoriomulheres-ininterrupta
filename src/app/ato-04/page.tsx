import { redirect } from "next/navigation";

// ATO 04 — Quem atua contra — DESPUBLICADO (ano eleitoral)
// A seção segue no projeto (componente ProducaoRegressiva e dados),
// mas a rota redireciona pra home e a metadata foi neutralizada
// pra não gerar preview do conteúdo despublicado em links cacheados.

export default function Ato04Page() {
  redirect("/");
}
