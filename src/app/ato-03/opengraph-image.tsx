import { ImageResponse } from "next/og";
import { loadFont, getOGStats } from "../og-helpers";

export const alt = "Discurso e voto: como cada partido vota sobre direitos das mulheres";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OG() {
  const [bold, regular, stats] = await Promise.all([
    loadFont("ArchivoBlack-Regular.ttf"),
    loadFont("Archivo-Regular.ttf"),
    getOGStats(),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#F7F7F5",
          padding: "60px 72px",
          fontFamily: "Archivo",
        }}
      >
        <div style={{ fontFamily: "Archivo", fontSize: 16, letterSpacing: 4, textTransform: "uppercase", color: "#005FFF" }}>
          [ ATO 03 · DISCURSO E VOTO ]
        </div>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", marginTop: 24 }}>
          <div style={{ fontFamily: "ArchivoBlack", fontSize: 96, lineHeight: 0.92, color: "#0A0A0A", letterSpacing: -3 }}>
            Discurso
          </div>
          <div style={{ fontFamily: "ArchivoBlack", fontSize: 96, lineHeight: 0.92, color: "#005FFF", letterSpacing: -3 }}>
            e voto.
          </div>
          <div style={{ fontFamily: "Archivo", fontSize: 24, lineHeight: 1.3, color: "rgba(10,10,10,0.6)", marginTop: 28, maxWidth: 700 }}>
            Como cada partido votou nas proposições sobre direitos das mulheres no plenário da Câmara.
          </div>
        </div>
        <div style={{ display: "flex", gap: 48, borderTop: "1px solid rgba(0,0,0,0.1)", paddingTop: 24 }}>
          <Stat value={stats.totalVotacoes} label="Votações nominais" />
          <Stat value={stats.plsVotadas} label="PLs em plenário" />
          <Stat value={stats.merito} label="De mérito" color="#005FFF" />
        </div>
      </div>
    ),
    { ...size, fonts: [
      { name: "ArchivoBlack", data: bold, style: "normal", weight: 900 },
      { name: "Archivo", data: regular, style: "normal", weight: 400 },
    ] }
  );
}

function Stat({ value, label, color = "#0A0A0A" }: { value: string; label: string; color?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ fontFamily: "ArchivoBlack", fontSize: 56, lineHeight: 0.95, color, letterSpacing: -2 }}>{value}</div>
      <div style={{ fontFamily: "Archivo", fontSize: 14, letterSpacing: 2, textTransform: "uppercase", color: "rgba(0,0,0,0.5)", marginTop: 6 }}>{label}</div>
    </div>
  );
}
