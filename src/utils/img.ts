// Build-time responsive images for public/ files (hero, cards, homepage CTA).
// Astro's <Image> only optimises imported files, and our content references public/ paths (images/events/x.webp) that
// must keep working as-is, so variants are generated here with sharp, served by src/pages/img/[...path].webp.ts as
//   /img/<content-hash>/<width>/<name>.webp      (hashed -> cached forever, see public/_headers)
// The original file stays the `src` (fallback, Pagefind, no-JS) and the srcset adds smaller WebP variants.
// Only images referenced from content front matter / homepage data get variants (listImageVariants), so a srcset can
// never point at a file that wasn't generated.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";
import { getCollection, getEntry } from "astro:content";
import { locales, type LangOptions } from "../data/i18n";
import { BESTUUR_RESPONSIVE_IMAGES } from "../data/bestuur";
import { publicPath } from "./seo";

/** Bump to regenerate every variant (changes all URLs). */
const IMG_VERSION = "2";
// Finer steps: a ~394 px card on a DPR 1.75 phone needs ~690 px; with 480/800 it fetched the 800 px original (70 KB).
const WIDTHS = [400, 560, 720, 960, 1200];
const MAX_WIDTH = 1600;
const QUALITY = 74;
const ROOT = process.cwd();
const CACHE_DIR = resolve(ROOT, "node_modules/.cache/ppme-img");

interface SourceMeta {
  rel: string;
  hash: string;
  width: number;
  height: number;
  isWebp: boolean;
}
export interface Variant {
  /** Route param of the endpoint: <hash>/<width>/<name> */
  param: string;
  url: string;
  width: number;
  rel: string;
}
export interface ResponsiveImage {
  src: string;
  srcset?: string;
  width?: number;
  height?: number;
}

const metaCache = new Map<string, Promise<SourceMeta | null>>();
function sourceMeta(relIn: string): Promise<SourceMeta | null> {
  const rel = publicPath(relIn);
  if (!metaCache.has(rel)) {
    metaCache.set(
      rel,
      (async () => {
        const file = resolve(ROOT, "public", rel);
        if (!/\.(jpe?g|png|webp)$/i.test(rel) || !existsSync(file)) return null;
        try {
          const buf = readFileSync(file);
          const m = await sharp(buf).metadata();
          if (!m.width || !m.height || (m.pages ?? 1) > 1) return null; // animated: leave alone
          const hash = createHash("sha1").update(IMG_VERSION).update(buf).digest("hex").slice(0, 10);
          return { rel, hash, width: m.width, height: m.height, isWebp: /\.webp$/i.test(rel) };
        } catch {
          return null;
        }
      })(),
    );
  }
  return metaCache.get(rel)!;
}

const slugName = (rel: string) =>
  (rel.split("/").pop() ?? "img")
    .replace(/\.[^.]+$/, "")
    .normalize("NFKD")
    .replace(/[^\w-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase() || "img";

function variantsOf(m: SourceMeta): Variant[] {
  const widths = WIDTHS.filter((w) => w < m.width * 0.95);
  // Largest candidate: the original when it is already a reasonably sized WebP, otherwise a full-size WebP re-encode.
  if (!m.isWebp || m.width > MAX_WIDTH) widths.push(Math.min(m.width, MAX_WIDTH));
  const name = slugName(m.rel);
  return [...new Set(widths)].map((w) => {
    const param = `${m.hash}/${w}/${name}`;
    return { param, url: `/img/${param}.webp`, width: w, rel: m.rel };
  });
}

let registry: Promise<Map<string, Variant[]>> | undefined;
/** Every image that gets variants, keyed by public/-relative path. */
export function listImageVariants() {
  registry ??= (async () => {
    const rels = new Set<string>();
    for (const name of ["event", "blog", "ibadah", "about", "dakwah"] as const) {
      for (const e of await getCollection(name)) if (e.data.image) rels.add(publicPath(e.data.image));
    }
    for (const rel of BESTUUR_RESPONSIVE_IMAGES) rels.add(publicPath(rel));
    for (const locale of Object.keys(locales) as LangOptions[]) {
      const home = await getEntry(`homepage-${locale}`, "homepage");
      if (home?.data.cta?.img?.src) rels.add(publicPath(home.data.cta.img.src));
    }
    const map = new Map<string, Variant[]>();
    for (const rel of rels) {
      const m = await sourceMeta(rel);
      if (m) map.set(rel, variantsOf(m));
    }
    return map;
  })();
  return registry;
}

/** src + srcset + intrinsic size for a public/ image (srcset only when variants exist for it). */
export async function responsiveImage(relIn: string): Promise<ResponsiveImage> {
  const rel = publicPath(relIn);
  const src = `/${rel}`;
  const m = await sourceMeta(rel);
  if (!m) return { src };
  const variants = (await listImageVariants()).get(rel);
  if (!variants?.length) return { src, width: m.width, height: m.height };
  const parts = variants.map((v) => `${v.url} ${v.width}w`);
  if (m.isWebp && m.width <= MAX_WIDTH) parts.push(`${src} ${m.width}w`);
  return { src, srcset: parts.join(", "), width: m.width, height: m.height };
}

/** Renders (or reads from cache) one WebP variant. */
export async function renderVariant(v: Variant): Promise<Buffer> {
  const cacheFile = resolve(CACHE_DIR, v.param.replace(/\//g, "_") + ".webp");
  if (existsSync(cacheFile)) return readFileSync(cacheFile);
  const buf = await sharp(resolve(ROOT, "public", v.rel))
    .rotate()
    .resize({ width: v.width, withoutEnlargement: true })
    .webp({ quality: QUALITY, effort: 5 })
    .toBuffer();
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(cacheFile, buf);
  return buf;
}
