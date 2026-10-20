/**
 * PWA ikonlarını (SVG burger) PNG olarak üretir:  node scripts/make-icons.mjs
 * Çıktılar public/icons/ altına yazılır ve depoya eklenir; yeniden üretmek gerekmedikçe çalıştırmayın.
 */
import { chromium } from "@playwright/test";
import { mkdirSync, copyFileSync } from "node:fs";

const SEEDS = [
  [200, 168, -20], [250, 152, 5], [300, 162, 20], [340, 190, 35], [215, 205, -10], [285, 200, 10],
];

const burger = `
  <path d="M130 252 C130 164 190 132 256 132 C322 132 382 164 382 252 Z" fill="#d98a2b"/>
  <path d="M158 222 C166 188 196 168 226 164" stroke="#f2b25a" stroke-width="8" stroke-linecap="round" fill="none" opacity=".8"/>
  ${SEEDS.map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="9" ry="4.5" fill="#fff1d6" transform="rotate(${r} ${x} ${y})"/>`).join("")}
  <path d="M120 270 Q143 246 166 268 T212 268 T258 268 T304 268 T350 268 T392 270 L392 284 Q392 292 372 290 L140 290 Q120 292 120 270Z" fill="#6bbf3a"/>
  <rect x="136" y="292" width="240" height="16" rx="8" fill="#e8392b"/>
  <rect x="122" y="312" width="268" height="38" rx="19" fill="#4a2a1a"/>
  <path d="M132 356 H380 Q384 356 384 364 Q384 402 346 402 H166 Q128 402 128 364 Q128 356 132 356Z" fill="#c97a1f"/>`;

const svg = (size, { rounded, scale }) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <rect width="512" height="512" ${rounded ? 'rx="112"' : ""} fill="#ffb81c"/>
  <g transform="translate(256 262) scale(${scale}) translate(-256 -262)">${burger}</g>
</svg>`;

const targets = [
  { file: "icon-192.png", size: 192, rounded: true, scale: 1 },
  { file: "icon-512.png", size: 512, rounded: true, scale: 1 },
  // maskable: tam kenara taşan arka plan, içerik güvenli bölgede (%80)
  { file: "icon-maskable-512.png", size: 512, rounded: false, scale: 0.78 },
  { file: "apple-touch-icon.png", size: 180, rounded: false, scale: 0.9 },
];

mkdirSync("public/icons", { recursive: true });
const browser = await chromium.launch({ channel: process.env.CI ? undefined : "msedge" });
for (const t of targets) {
  const page = await browser.newPage({ viewport: { width: t.size, height: t.size } });
  await page.setContent(`<body style="margin:0;background:transparent">${svg(t.size, t)}</body>`);
  await page.screenshot({ path: `public/icons/${t.file}`, omitBackground: true });
  await page.close();
  console.log("yazıldı:", t.file);
}
await browser.close();
copyFileSync("public/icons/icon-512.png", "app/icon.png");
copyFileSync("public/icons/apple-touch-icon.png", "app/apple-icon.png");
