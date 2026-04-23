import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import { join } from "path";

export const alt = "Nem toda lei é proteção — 171 PLs regressivas identificadas";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function loadFont(name: string) {
  return readFile(join(process.cwd(), "public", "fonts", name));
}

export default async function OG() {
  const [bold, regular] = await Promise.all([
    loadFont("ArchivoBlack-Regular.ttf"),
    loadFont("Archivo-Regular.ttf"),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0A0A0A",
          padding: "60px 72px",
          fontFamily: "Archivo",
        }}
      >
        <div style={{ fontFamily: "Archivo", fontSize: 16, letterSpacing: 4, textTransform: "uppercase", color: "#D43F3F" }}>
          [ ATO 04 · QUEM ATUA CONTRA ]
        </div>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", marginTop: 24 }}>
          <div style={{ fontFamily: "ArchivoBlack", fontSize: 104, lineHeight: 0.92, color: "#FFFFFF", letterSpacing: -3 }}>
            Nem toda lei
          </div>
          <div style={{ fontFamily: "ArchivoBlack", fontSize: 104, lineHeight: 0.92, color: "#D43F3F", letterSpacing: -3 }}>
            é proteção.
          </div>
        </div>
        <div style={{ display: "flex", gap: 56, borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: 24 }}>
          <Stat value="171" label="PLs regressivas" color="#D43F3F" />
          <Stat value="62" label="Deputados envolvidos" color="#FF8080" />
          <Stat value="152" label="PLs punitivistas" color="#F59E0B" />
        </div>
      </div>
    ),
    { ...size, fonts: [
      { name: "ArchivoBlack", data: bold, style: "normal", weight: 900 },
      { name: "Archivo", data: regular, style: "normal", weight: 400 },
    ] }
  );
}

function Stat({ value, label, color = "#FFFFFF" }: { value: string; label: string; color?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ fontFamily: "ArchivoBlack", fontSize: 64, lineHeight: 0.95, color, letterSpacing: -2 }}>{value}</div>
      <div style={{ fontFamily: "Archivo", fontSize: 14, letterSpacing: 2, textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginTop: 6 }}>{label}</div>
    </div>
  );
}
