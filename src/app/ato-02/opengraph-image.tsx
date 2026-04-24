import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import { join } from "path";

export const alt = "O Congresso está agindo? 76% paradas em comissão";
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
        <div style={{ fontFamily: "Archivo", fontSize: 16, letterSpacing: 4, textTransform: "uppercase", color: "#DCFF00" }}>
          [ ATO 02 · O TIPO DE LEI ]
        </div>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", marginTop: 24 }}>
          <div style={{ fontFamily: "ArchivoBlack", fontSize: 104, lineHeight: 0.92, color: "#FFFFFF", letterSpacing: -3 }}>
            O Congresso
          </div>
          <div style={{ fontFamily: "ArchivoBlack", fontSize: 104, lineHeight: 0.92, color: "#DCFF00", letterSpacing: -3 }}>
            está agindo?
          </div>
        </div>
        <div style={{ display: "flex", gap: 56, borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: 24 }}>
          <Stat value="76%" label="Paradas em comissão" color="#D43F3F" />
          <Stat value="16" label="Viraram lei" color="#DCFF00" />
          <Stat value="79" label="Sem relator" />
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
