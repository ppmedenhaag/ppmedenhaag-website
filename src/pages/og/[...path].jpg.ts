// Link-preview card for every page: /og/<locale>/<route>.<hash>.jpg (1200x630). See src/utils/og.ts.
import type { APIRoute, GetStaticPaths } from "astro";
import { renderCard, type CardSpec } from "../../utils/og";
import { getSeoRegistry } from "../../utils/seo-registry";

export const getStaticPaths = (async () => {
  const { pages } = await getSeoRegistry();
  const seen = new Set<string>();
  return pages
    .filter((p) => !seen.has(p.cardParam) && seen.add(p.cardParam))
    .map((p) => ({ params: { path: p.cardParam }, props: { card: p.card } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const buf = await renderCard(props.card as CardSpec);
  return new Response(new Uint8Array(buf), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=31536000, immutable" },
  });
};
