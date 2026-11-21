// Writes src/assets/nl-map.svg (the static part of the "map" page background) from src/data/nl-map.ts.
// Usage: node scripts/build-nl-map-svg.mjs   (also run automatically at the end of scripts/build-nl-map.mjs)
//
// Why a file: inlining the map put ~60 KB of path data into EVERY page's HTML (paths repeated for land, mask and
// outline). As an imported asset it gets a hashed /_astro/ URL, is cached for a year and downloaded once.
// The country is defined once and reused with <use>; only the animated Den Haag marker stays inline
// (components/NetherlandsMap.astro), so it keeps the page font and reduced-motion handling.
import { writeFileSync } from "node:fs";
import { NL_PROVINCES, NL_VIEWBOX } from "../src/data/nl-map.ts";

// Covers IJsselmeer + Markermeer + Randmeren in nl-map.ts coordinates (viewBox 295.8 x 348.4): hides the blocky
// dike/polder edges that the land data cuts out of the lakes.
const LAKES_MASK =
  "M132.2 85.8L155.3 69.8L165.7 88.8L201.2 116.9L190.8 139.1L177.5 153.8L165.7 165.7L153.8 165.7L130.2 159.8L127.2 124.3L130.2 97.6Z";

const { width: W, height: H } = NL_VIEWBOX;
const country = NL_PROVINCES.map((p) => p.d).join("");
const zh = NL_PROVINCES.find((p) => p.name === "Zuid-Holland")?.d ?? "";
// Land tint 3.5 %, Zuid-Holland 8 % in total: an extra layer of a with 1-(1-0.035)(1-a) = 0.08.
const ZH_EXTRA = (1 - 0.92 / 0.965).toFixed(4);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs>
<path id="nl" d="${country}"/>
<mask id="out" maskUnits="userSpaceOnUse" x="-10" y="-10" width="${W + 20}" height="${H + 20}">
<rect x="-10" y="-10" width="${W + 20}" height="${H + 20}" fill="#fff"/>
<use href="#nl" xlink:href="#nl" fill="#000" stroke="#000" stroke-width="0.6"/>
<path d="${LAKES_MASK}" fill="#000"/>
</mask>
</defs>
<use href="#nl" xlink:href="#nl" fill="#034ea2" fill-opacity="0.035"/>
<path d="${zh}" fill="#034ea2" fill-opacity="${ZH_EXTRA}"/>
<g opacity="0.15" fill="none" stroke="#034ea2" stroke-linejoin="round">
<use href="#nl" xlink:href="#nl" mask="url(#out)" stroke-width="1.4"/>
<path d="${zh}" stroke-width="0.7"/>
</g>
</svg>
`;
writeFileSync(new URL("../src/assets/nl-map.svg", import.meta.url), svg);
console.log("src/assets/nl-map.svg", Buffer.byteLength(svg), "bytes");
