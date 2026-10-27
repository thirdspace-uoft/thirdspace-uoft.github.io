import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/**
 * The 1200×630 PNG share card for a post (or the blog), drawn at build time.
 * Fonts and the logo are read from assets/og/ because the image renderer
 * can't use system fonts or WebP.
 */
export async function renderShareCard({ title, eyebrow, footer }: { title: string; eyebrow: string; footer?: string }) {
  const dir = join(process.cwd(), "assets", "og");
  const [bold, regular, logo] = await Promise.all([
    readFile(join(dir, "NotoSans-Bold.ttf")),
    readFile(join(dir, "NotoSans-Regular.ttf")),
    readFile(join(dir, "logo.png"), "base64"),
  ]);
  const size = title.length > 90 ? 52 : title.length > 55 ? 60 : 68;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#FBFAF8", fontFamily: "Noto Sans" }}>
        <div style={{ width: 18, height: "100%", background: "#B21F2D" }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "60px 72px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- rendered to PNG, not HTML */}
            <img src={`data:image/png;base64,${logo}`} width={72} height={72} alt="" />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 30, fontWeight: 700, color: "#B21F2D" }}>ThirdSpace</span>
              <span style={{ fontSize: 22, color: "#6B5F61" }}>{eyebrow}</span>
            </div>
          </div>
          <div style={{ display: "flex", fontSize: size, fontWeight: 700, lineHeight: 1.12, color: "#1E1718", letterSpacing: -1 }}>
            {title}
          </div>
          <div style={{ display: "flex", fontSize: 26, color: "#6B5F61" }}>{footer ?? "thirdspace-uoft.github.io"}</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Noto Sans", data: bold, weight: 700, style: "normal" },
        { name: "Noto Sans", data: regular, weight: 400, style: "normal" },
      ],
    },
  );
}
