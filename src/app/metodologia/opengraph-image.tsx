import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import { join } from "path";

export const alt = "Metodologia do Observatório — fontes, classificação e limitações";
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
          backgroundColor: "#FFFFFF",
          padding: "60px 72px",
          fontFamily: "Archivo",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontFamily: "Archivo",
              fontSize: 16,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "#005FFF",
            }}
          >
            [ Metodologia · Observatório Político ]
          </div>
          <div
            style={{
              fontFamily: "Archivo",
              fontSize: 13,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: "rgba(10,10,10,0.5)",
            }}
          >
            Ininterrupta
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
            marginTop: 48,
          }}
        >
          <div
            style={{
              fontFamily: "ArchivoBlack",
              fontSize: 140,
              lineHeight: 0.92,
              color: "#0A0A0A",
              letterSpacing: -4,
            }}
          >
            Como isso
          </div>
          <div
            style={{
              fontFamily: "ArchivoBlack",
              fontSize: 140,
              lineHeight: 0.92,
              color: "#005FFF",
              letterSpacing: -4,
            }}
          >
            foi feito.
          </div>
          <div
            style={{
              fontFamily: "Archivo",
              fontSize: 24,
              lineHeight: 1.3,
              color: "rgba(10,10,10,0.7)",
              marginTop: 28,
              maxWidth: 820,
            }}
          >
            Fontes, critérios de classificação e limitações do
            observatório. Todos os dados são públicos, todo o código é
            aberto.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 32,
            alignItems: "center",
            paddingTop: 24,
            borderTop: "1px solid rgba(10,10,10,0.12)",
            fontFamily: "Archivo",
            fontSize: 13,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: "rgba(10,10,10,0.5)",
          }}
        >
          <span>API Dados Abertos · Câmara</span>
          <span>·</span>
          <span>IBGE Censo 2022</span>
          <span>·</span>
          <span>Atlas da Violência</span>
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
