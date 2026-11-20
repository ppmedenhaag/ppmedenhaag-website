// One-off: derives PNG icons from public/favicon.svg (the logo mark). Outputs are committed; rerun only if the logo changes.
//   node scripts/build-icons.mjs
import { writeFileSync } from "node:fs";
import sharp from "sharp";

const svg = "public/favicon.svg";
const render = (size, background) =>
  sharp(svg, { density: 300 })
    .resize(size, size, { fit: "contain", background: background ?? { r: 255, g: 255, b: 255, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();

writeFileSync("public/favicon-32.png", await render(32));
writeFileSync("public/favicon.ico", await render(48)); // PNG payload: accepted by every current browser for /favicon.ico
writeFileSync("public/apple-touch-icon.png", await render(180, { r: 255, g: 255, b: 255, alpha: 1 }));
writeFileSync("public/icon-192.png", await render(192, { r: 255, g: 255, b: 255, alpha: 1 }));
writeFileSync("public/icon-512.png", await render(512, { r: 255, g: 255, b: 255, alpha: 1 }));
console.log("icons written");
