import { ImageResponse } from "next/og";
import { loadFont, getOGStats } from "../og-helpers";

export const alt = "Ranking: quem propõe as leis sobre direitos das mulheres";
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
          backgroundColor: "#FFFFFF",
          padding: "60px 72px",
          fontFamily: "Archivo",
        }}
      >
        <div style={{ fontFamily: "Archivo", fontSize: 16, letterSpacing: 4, textTransform: "uppercase", color: "#005FFF" }}>
          [ ATO 01 · QUEM FAZ AS LEIS ]
        </div>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", marginTop: 24 }}>
          <div style={{ fontFamily: "ArchivoBlack", fontSize: 96, lineHeight: 0.92, color: "#0A0A0A", letterSpacing: -3 }}>
            Quem propõe
          </div>
          <div style={{ fontFamily: "ArchivoBlack", fontSize: 96, lineHeight: 0.92, color: "#005FFF", letterSpacing: -3 }}>
            o quê?
          </div>
        </div>
        <div style={{ display: "flex", gap: 48, borderTop: "1px solid rgba(0,0,0,0.1)", paddingTop: 24 }}>
          <Stat value={stats.totalDeps} label="Deputados" />
          <Stat value={stats.totalPls} label="PLs sobre o tema" />
          <Stat value={stats.top20F} label="Mulheres no top" color="#1DB389" />
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
