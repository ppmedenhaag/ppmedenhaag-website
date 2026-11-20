// Build-time link-preview ("Open Graph") card generation. Plan: docs/seo/SEO-PLAN.md Phase 3.
// Every page gets a 1200x630 JPEG: either its hero image (whole image, never cropped, over a blurred copy of itself)
// or a generated brand title card. Node-only (sharp + satori); used by src/pages/og/[...path].jpg.ts and the registry.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";
import satori from "satori";
import { OG_HEIGHT, OG_WIDTH } from "../data/seo";
import { publicPath } from "./seo";

/** Bump to invalidate every card (changes all hashes + cache). */
export const CARD_VERSION = "3";
const MAX_BYTES = 250 * 1024;
const ROOT = process.cwd();
const CACHE_DIR = resolve(ROOT, "node_modules/.cache/ppme-og");

export interface ImageInfo {
  rel: string;
  width: number;
  height: number;
  /** "ok" ≥600px wide, "low" 400–599px (used at natural size, flagged in the build report). */
  quality: "ok" | "low";
}

export interface CardSpec {
  mode: "image" | "title";
  image?: ImageInfo;
  title: string;
  subtitle: string;
  eyebrow: string;
  hash: string;
}

const infoCache = new Map<string, ImageInfo | null>();

/** Reads real pixel size; applies the quality gate (see plan). Returns null when the file can't be used as a social image. */
export async function inspectImage(rel: string | undefined): Promise<ImageInfo | null> {
  if (!rel) return null;
  const p = publicPath(rel);
  if (infoCache.has(p)) return infoCache.get(p)!;
  let result: ImageInfo | null = null;
  const file = resolve(ROOT, "public", p);
  if (/\.(jpe?g|png|webp|gif|avif)$/i.test(p) && existsSync(file)) {
    try {
      const m = await sharp(file).metadata();
      const w = m.width ?? 0;
      const h = m.height ?? 0; // for animated gifs `pageHeight` is the frame height
      const frameH = m.pageHeight ?? h;
      const ratio = w / frameH;
      if (w >= 400 && frameH > 0 && ratio <= 2.4 && ratio >= 0.5) {
        result = { rel: p, width: w, height: frameH, quality: w >= 600 ? "ok" : "low" };
      }
    } catch {
      result = null;
    }
  }
  infoCache.set(p, result);
  return result;
}

const dimsCache = new Map<string, { width: number; height: number } | null>();
/** True pixel size of a public/ image (no quality gate): for <img width height> so the page doesn't shift while loading. */
export async function imageDims(rel: string | undefined) {
  if (!rel) return null;
  const p = publicPath(rel);
  if (!dimsCache.has(p)) {
    let d: { width: number; height: number } | null = null;
    const file = resolve(ROOT, "public", p);
    if (existsSync(file)) {
      try {
        const m = await sharp(file).metadata();
        if (m.width && (m.pageHeight ?? m.height)) d = { width: m.width, height: (m.pageHeight ?? m.height)! };
      } catch {
        d = null;
      }
    }
    dimsCache.set(p, d);
  }
  return dimsCache.get(p)!;
}

/** First local image in a Markdown/HTML body that passes the gate. */
export async function firstBodyImage(body: string | undefined): Promise<ImageInfo | null> {
  if (!body) return null;
  const re = /!\[[^\]]*\]\(\s*<?([^)\s>]+)|<img[^>]+src=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) {
    const src = (m[1] ?? m[2] ?? "").trim();
    if (!src || /^(https?:)?\/\//i.test(src)) continue;
    const info = await inspectImage(src);
    if (info) return info;
  }
  return null;
}

const hashCache = new Map<string, string>();
function fileHash(rel: string): string {
  if (!hashCache.has(rel)) {
    hashCache.set(rel, createHash("sha1").update(readFileSync(resolve(ROOT, "public", rel))).digest("hex"));
  }
  return hashCache.get(rel)!;
}

export function makeSpec(args: {
  image: ImageInfo | null;
  title: string;
  subtitle: string;
  eyebrow: string;
}): CardSpec {
  const mode = args.image ? "image" : "title";
  const h = createHash("sha1");
  h.update(`${CARD_VERSION}|${mode}|`);
  if (args.image) h.update(fileHash(args.image.rel));
  else h.update(`${args.title}|${args.subtitle}|${args.eyebrow}`);
  return { mode, image: args.image ?? undefined, title: args.title, subtitle: args.subtitle, eyebrow: args.eyebrow, hash: h.digest("hex").slice(0, 8) };
}

// ---------------------------------------------------------------------------------------------------------------------
// Rendering

let fonts: { name: string; data: Buffer; weight: 400 | 700; style: "normal" }[] | undefined;
function loadFonts() {
  fonts ??= [400, 700].map((weight) => ({
    name: "Inter",
    weight: weight as 400 | 700,
    style: "normal" as const,
    data: readFileSync(resolve(ROOT, `node_modules/@fontsource/inter/files/inter-latin-${weight}-normal.woff`)),
  }));
  return fonts;
}

/** satori can't draw glyphs missing from the Latin subset (e.g. Arabic): drop them rather than print boxes. */
const latinOnly = (s: string) =>
  s.replace(/[^ -ɏ–—‘-‟…·]/g, "").replace(/\s+/g, " ").trim();

const el = (type: string, style: Record<string, unknown>, children?: unknown) => ({
  type,
  props: { style: { display: "flex", ...style }, children },
});

async function titleCard(spec: CardSpec): Promise<Buffer> {
  // The brand is already in the logo + eyebrow: don't repeat it in the headline ("PPME Den Haag | Foo" -> "Foo").
  const title = latinOnly(spec.title).replace(/^PPME Den Haag\s*\|\s*/i, "") || "PPME Den Haag";
  const size = title.length <= 30 ? 72 : title.length <= 56 ? 60 : 48;
  const tree = el(
    "div",
    {
      width: OG_WIDTH,
      height: OG_HEIGHT,
      flexDirection: "column",
      justifyContent: "flex-start",
      padding: "72px 88px 0 88px",
      color: "#ffffff",
      backgroundImage: "linear-gradient(135deg, #034ea2 0%, #022f63 100%)",
      fontFamily: "Inter",
      position: "relative",
    },
    [
      el("div", {
        position: "absolute",
        right: -160,
        top: -160,
        width: 560,
        height: 560,
        borderRadius: 280,
        backgroundColor: "rgba(255,255,255,0.07)",
      }),
      el("div", {
        position: "absolute",
        right: 120,
        bottom: -220,
        width: 420,
        height: 420,
        borderRadius: 210,
        backgroundColor: "rgba(255,255,255,0.05)",
      }),
      el(
        "div",
        { fontSize: 26, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase", color: "#9ec3f0", marginBottom: 26 },
        latinOnly(spec.eyebrow).toUpperCase(),
      ),
      el(
        "div",
        { fontSize: size, fontWeight: 700, lineHeight: 1.12, letterSpacing: -1.5, lineClamp: 3, maxWidth: 1000 },
        title,
      ),
      el("div", { height: 6, width: 96, backgroundColor: "#6ea5e6", marginTop: 34, marginBottom: 28 }),
      el("div", { fontSize: 31, fontWeight: 400, color: "#d6e6fa", maxWidth: 1000 }, latinOnly(spec.subtitle)),
    ],
  );
  const svg = await satori(tree as never, { width: OG_WIDTH, height: OG_HEIGHT, fonts: loadFonts() });
  const logo = await sharp(resolve(ROOT, "public/images/logo/white.png")).resize({ width: 190 }).png().toBuffer();
  const logoMeta = await sharp(logo).metadata();
  return sharp(Buffer.from(svg))
    .composite([{ input: logo, left: 88, top: OG_HEIGHT - 44 - (logoMeta.height ?? 98) }])
    .jpeg({ quality: 88, mozjpeg: true, progressive: true })
    .toBuffer();
}

async function imageCard(spec: CardSpec): Promise<Buffer> {
  const img = spec.image!;
  const file = resolve(ROOT, "public", img.rel);
  // Whole image inside the frame; upscale capped at 1.5x (natural size for 400–599 px sources).
  const cap = img.quality === "low" ? 1 : 1.5;
  const scale = Math.min(OG_WIDTH / img.width, OG_HEIGHT / img.height, cap);
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const backdrop = await sharp(file)
    .resize(OG_WIDTH, OG_HEIGHT, { fit: "cover" })
    .blur(28)
    .modulate({ brightness: 0.62, saturation: 1.1 })
    .toBuffer();
  const fg = await sharp(file).resize(w, h, { fit: "fill" }).toBuffer();
  const base = sharp(backdrop).composite([
    { input: fg, left: Math.round((OG_WIDTH - w) / 2), top: Math.round((OG_HEIGHT - h) / 2) },
  ]);
  let quality = 84;
  let out = await base.clone().jpeg({ quality, mozjpeg: true, progressive: true }).toBuffer();
  while (out.length > MAX_BYTES && quality > 52) {
    quality -= 8;
    out = await base.clone().jpeg({ quality, mozjpeg: true, progressive: true }).toBuffer();
  }
  return out;
}

/** Renders (or returns the cached) JPEG for a card. */
export async function renderCard(spec: CardSpec): Promise<Buffer> {
  const cacheFile = resolve(CACHE_DIR, `${spec.hash}.jpg`);
  if (existsSync(cacheFile)) return readFileSync(cacheFile);
  const buf = spec.mode === "image" ? await imageCard(spec) : await titleCard(spec);
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(cacheFile, buf);
  return buf;
}
