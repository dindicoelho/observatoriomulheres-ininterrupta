import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import { join } from "path";

export const alt = "Mapa: quem representa seu estado em políticas de proteção à mulher";
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
          backgroundColor: "#FFFFFF",
          padding: "60px 72px",
          fontFamily: "Archivo",
        }}
      >
        <div style={{ fontFamily: "Archivo", fontSize: 16, letterSpacing: 4, textTransform: "uppercase", color: "#005FFF" }}>
          [ GUIA ELEITORAL POR ESTADO ]
        </div>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", marginTop: 24 }}>
          <div style={{ fontFamily: "ArchivoBlack", fontSize: 96, lineHeight: 0.92, color: "#0A0A0A", letterSpacing: -3 }}>
            Quem representa
          </div>
          <div style={{ fontFamily: "ArchivoBlack", fontSize: 96, lineHeight: 0.92, color: "#005FFF", letterSpacing: -3 }}>
            o seu estado?
          </div>
          <div style={{ fontFamily: "Archivo", fontSize: 24, lineHeight: 1.3, color: "rgba(10,10,10,0.6)", marginTop: 28, maxWidth: 750 }}>
            Top 3 deputados por estado em políticas de proteção à mulher. Quem atua, quem não atua, e onde não tem mulher eleita.
          </div>
        </div>
        <div style={{ display: "flex", gap: 48, borderTop: "1px solid rgba(0,0,0,0.1)", paddingTop: 24 }}>
          <Stat value="27" label="Estados" />
          <Stat value="5" label="Sem deputada" color="#D43F3F" />
          <Stat value="2,5×" label="Peso mulheres" color="#005FFF" />
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
