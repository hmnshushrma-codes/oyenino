#!/usr/bin/env node
// Renders the social preview images from scripts/og/template.html with headless Chrome.
//   starter-pack-og.jpg  (starter pack page)
//   og-image.jpg         (sitewide fallback)
//   git-github-guide-og.jpg (Git and GitHub guide)
// Pass variant names to render only some: node scripts/render-og-images.mjs git
// Both are 1200x630 JPG under 300 KB. Fonts load from Google Fonts, so this needs internet.
//
// Needs playwright-core and Chrome. The repo has no package.json on purpose, so point at an
// existing install instead of adding a dependency:
//   PLAYWRIGHT_CORE=/path/to/node_modules/playwright-core node scripts/render-og-images.mjs
// Run node scripts/check-starter-pack.js afterwards; it checks size and dimensions.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const TEMPLATE = pathToFileURL(path.join(ROOT, "scripts/og/template.html")).href;
const MAX_BYTES = 300 * 1024;

const pwPath = process.env.PLAYWRIGHT_CORE;
const { chromium } = await import(pwPath ? pathToFileURL(path.join(pwPath, "index.mjs")).href : "playwright-core").catch((e) => {
  console.error("Could not load playwright-core. Set PLAYWRIGHT_CORE to its folder.\n" + e.message);
  process.exit(1);
});

const images = [
  { variant: "starter", out: "starter-pack-og.jpg" },
  { variant: "site", out: "og-image.jpg" },
  { variant: "git", out: "git-github-guide-og.jpg" },
].filter((img) => process.argv.length <= 2 || process.argv.slice(2).includes(img.variant));

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
let failed = false;

for (const img of images) {
  await page.goto(`${TEMPLATE}?v=${img.variant}`, { waitUntil: "networkidle" });
  // Load every face explicitly: a variant that does not use one would otherwise never fetch it
  await page.evaluate(() => Promise.all(["400 100px 'Playfair Display'", "italic 400 100px 'Playfair Display'",
    "500 40px 'Outfit'", "600 40px 'Outfit'"].map((f) => document.fonts.load(f))));
  await page.evaluate(() => document.fonts.ready);
  // Fail rather than ship an image drawn in fallback fonts
  const fontsOk = await page.evaluate(() =>
    document.fonts.check("400 100px 'Playfair Display'") && document.fonts.check("italic 400 100px 'Playfair Display'") &&
    document.fonts.check("500 40px 'Outfit'") && document.fonts.check("600 40px 'Outfit'"));
  // All text must sit inside the safe area and nothing may wrap unexpectedly or overflow it
  const fit = await page.evaluate(() => {
    const safe = document.getElementById("safe").getBoundingClientRect();
    const bad = [...document.querySelectorAll("#safe *")].filter((el) => {
      const r = el.getBoundingClientRect();
      return r.left < safe.left || r.right > safe.right || r.top < safe.top || r.bottom > safe.bottom;
    }).map((el) => el.textContent);
    return { bad, subLines: Math.round(document.querySelector(".sub").getBoundingClientRect().height / parseFloat(getComputedStyle(document.querySelector(".sub")).lineHeight)) };
  });

  let quality = 90;
  let buf;
  do {
    buf = await page.screenshot({ type: "jpeg", quality, clip: { x: 0, y: 0, width: 1200, height: 630 } });
    quality -= 5;
  } while (buf.length > MAX_BYTES && quality >= 60);
  fs.writeFileSync(path.join(ROOT, img.out), buf);

  const problems = [];
  if (!fontsOk) problems.push("site fonts did not load");
  if (fit.bad.length) problems.push("text outside the safe area: " + fit.bad.join(" / "));
  if (buf.length > MAX_BYTES) problems.push(`too big: ${buf.length} bytes`);
  console.log(`${problems.length ? "FAIL" : "OK  "} ${img.out}  ${(buf.length / 1024).toFixed(1)} KB  quality ${quality + 5}  subline lines ${fit.subLines}${problems.length ? "  " + problems.join("; ") : ""}`);
  if (problems.length) failed = true;
}

await browser.close();
process.exit(failed ? 1 : 0);
