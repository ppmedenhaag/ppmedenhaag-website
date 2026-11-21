// Responsive WebP variants of public/ images: /img/<hash>/<width>/<name>.webp. See src/utils/img.ts.
import type { APIRoute, GetStaticPaths } from "astro";
import { listImageVariants, renderVariant, type Variant } from "../../utils/img";

export const getStaticPaths = (async () => {
  const all = [...(await listImageVariants()).values()].flat();
  return all.map((v) => ({ params: { path: v.param }, props: { variant: v } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const buf = await renderVariant(props.variant as Variant);
  return new Response(new Uint8Array(buf), {
    headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=31536000, immutable" },
  });
};
