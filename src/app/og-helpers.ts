import { readFile } from "fs/promises";
import { join } from "path";

export async function loadFont(name: string) {
  return readFile(join(process.cwd(), "public", "fonts", name));
}

export async function loadJSON(path: string) {
  const raw = await readFile(join(process.cwd(), "src", "data", path), "utf-8");
  return JSON.parse(raw);
}

export async function getOGStats() {
  const [autoria, legislativo, votacoes] = await Promise.all([
    loadJSON("autoria.json"),
    loadJSON("legislativo.json"),
    loadJSON("votacoes.json"),
  ]);

  const totalPls = autoria.totalPls ?? 0;
  const totalDeps = autoria.totalDeputados ?? 0;
  const totalRegr = (autoria.deputados ?? []).reduce(
    (s: number, d: { regressivos?: number }) => s + (d.regressivos ?? 0), 0
  );
  const totalPunit = (autoria.deputados ?? []).reduce(
    (s: number, d: { punitivistas?: number }) => s + (d.punitivistas ?? 0), 0
  );
  const depsComRegr = (autoria.deputados ?? []).filter(
    (d: { regressivos?: number }) => (d.regressivos ?? 0) > 0
  ).length;

  // Top 20 mulheres
  const deps = (autoria.deputados ?? []).filter((d: { total: number }) => d.total >= 3);
  deps.sort((a: Record<string, number>, b: Record<string, number>) => b.total - a.total);
  const top20F = deps.slice(0, 20).filter((d: { sexo?: string }) => d.sexo === "F").length;

  // Legislativo
  const destino = legislativo.destino_stats?.por_categoria ?? {};
  const aprovadas = destino.aprovada ?? 0;
  const semRelator = destino.sem_relator ?? 0;
  const tramitando = destino.tramitando ?? 0;
  const pctTramitando = legislativo.total > 0
    ? Math.round((tramitando / legislativo.total) * 100)
    : 0;

  // Votações
  const merito = (votacoes.votacoes ?? []).filter(
    (v: { tipo: string }) => v.tipo === "mérito"
  ).length;
  const totalVotacoes = (votacoes.votacoes ?? []).length;
  const plsVotadas = new Set(
    (votacoes.votacoes ?? []).map((v: { pl_ref: string }) => v.pl_ref)
  ).size;

  return {
    totalPls: totalPls.toLocaleString("pt-BR"),
    totalDeps: String(totalDeps),
    totalRegr: String(totalRegr),
    totalPunit: String(totalPunit),
    depsComRegr: String(depsComRegr),
    top20F: `${top20F}/20`,
    aprovadas: String(aprovadas),
    semRelator: String(semRelator),
    pctTramitando: `${pctTramitando}%`,
    merito: String(merito),
    totalVotacoes: String(totalVotacoes),
    plsVotadas: String(plsVotadas),
  };
}
