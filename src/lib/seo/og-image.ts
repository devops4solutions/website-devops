import { readFileSync } from "node:fs";
import satori from "satori";
import sharp from "sharp";

// Build-time Open Graph image renderer (1200×630 PNG).
// Satori converts text to vector paths, so output does not depend on fonts installed on the build machine.

const fontFile = (weight: 400 | 700) =>
  readFileSync(`node_modules/@fontsource/inter/files/inter-latin-${weight}-normal.woff`);

const fonts = [
  { name: "Inter", data: fontFile(400), weight: 400 as const, style: "normal" as const },
  { name: "Inter", data: fontFile(700), weight: 700 as const, style: "normal" as const },
];

type Node = { type: string; props: { style?: Record<string, unknown>; children?: unknown } };
const el = (type: string, style: Record<string, unknown>, children?: unknown): Node => ({ type, props: { style, children } });

export interface OgImageOptions {
  title: string;
  eyebrow?: string;
}

export async function renderOgImage({ title, eyebrow }: OgImageOptions): Promise<Buffer> {
  const titleSize = title.length > 70 ? 52 : title.length > 40 ? 62 : 72;

  const tree = el(
    "div",
    {
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "72px 80px",
      backgroundImage: "linear-gradient(135deg, #eff6ff 0%, #ffffff 60%, #dbeafe 100%)",
      fontFamily: "Inter",
    },
    [
      el("div", { display: "flex", fontSize: 34, fontWeight: 700, color: "#05306e" }, "DevOps4Solutions"),
      el("div", { display: "flex", flexDirection: "column" }, [
        eyebrow
          ? el("div", { display: "flex", fontSize: 26, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: "#2563eb", marginBottom: 20 }, eyebrow)
          : null,
        el("div", { display: "flex", fontSize: titleSize, fontWeight: 700, lineHeight: 1.15, color: "#0f172a" }, title),
      ].filter(Boolean)),
      el("div", { display: "flex", justifyContent: "space-between", fontSize: 26, color: "#475569", borderTop: "2px solid #bfdbfe", paddingTop: 28 }, [
        el("div", { display: "flex" }, "devops4solutions.com"),
        el("div", { display: "flex" }, "Enterprise AWS & DevOps · Nidhi Gupta"),
      ]),
    ],
  );

  const svg = await satori(tree as Parameters<typeof satori>[0], { width: 1200, height: 630, fonts });
  return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}
