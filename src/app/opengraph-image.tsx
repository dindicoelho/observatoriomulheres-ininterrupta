import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import { join } from "path";

export const alt =
  "Observatório político da violência contra a mulher — quem está fazendo algo?";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function loadFont(name: string) {
  const p = join(process.cwd(), "public", "fonts", name);
  return readFile(p);
}

export default async function OpengraphImage() {
  const [archivoBlack, archivo] = await Promise.all([
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
          position: "relative",
          fontFamily: "Archivo",
        }}
      >
        {/* Top meta row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
          }}
        >
          <div
            style={{
              fontFamily: "Archivo",
              fontSize: 18,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "#DCFF00",
            }}
          >
            [ Observatório Político · Ininterrupta ]
          </div>
          <div
            style={{
              fontFamily: "Archivo",
              fontSize: 14,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            mapa-violencia-mulher.vercel.app
          </div>
        </div>

        {/* Center: big headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
            marginTop: 32,
          }}
        >
          <div
            style={{
              fontFamily: "ArchivoBlack",
              fontSize: 88,
              lineHeight: 0.95,
              color: "#FFFFFF",
              letterSpacing: -2,
              maxWidth: 1050,
            }}
          >
            Todo mundo sabe que
          </div>
          <div
            style={{
              fontFamily: "ArchivoBlack",
              fontSize: 88,
              lineHeight: 0.95,
              color: "#FFFFFF",
              letterSpacing: -2,
              maxWidth: 1050,
            }}
          >
            é grave.
          </div>
          <div
            style={{
              fontFamily: "ArchivoBlack",
              fontSize: 104,
              lineHeight: 0.95,
              color: "#005FFF",
              letterSpacing: -3,
              marginTop: 16,
              maxWidth: 1050,
            }}
          >
            Quem está fazendo algo?
          </div>
        </div>

        {/* Bottom: stat row */}
        <div
          style={{
            display: "flex",
            gap: 56,
            alignItems: "flex-end",
            paddingTop: 32,
            borderTop: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          <StatBlock value="1.142" label="Proposições" />
          <StatBlock value="389" label="Deputados atuantes" />
          <StatBlock value="62" label="Com PLs regressivas" color="#D43F3F" />
          <StatBlock value="5" label="UFs sem deputada" color="#D43F3F" />
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "ArchivoBlack", data: archivoBlack, style: "normal", weight: 900 },
        { name: "Archivo", data: archivo, style: "normal", weight: 400 },
      ],
    }
  );
}

function StatBlock({
  value,
  label,
  color = "#FFFFFF",
}: {
  value: string;
  label: string;
  color?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div
        style={{
          fontFamily: "ArchivoBlack",
          fontSize: 64,
          lineHeight: 0.95,
          color,
          letterSpacing: -2,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: "Archivo",
          fontSize: 14,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.6)",
          marginTop: 6,
        }}
      >
        {label}
      </div>
    </div>
  );
}
