import { redirect } from "next/navigation";

// Rota redireciona pro anchor na home. Metadata e OG image seguem
// desativados (opengraph-image.tsx.disabled) para que links cacheados
// não exibam preview com nomes/números individuais — a seção foi
// redesenhada sem ranking de top regressivos.

export default function Ato04Page() {
  redirect("/#ato-04");
}
