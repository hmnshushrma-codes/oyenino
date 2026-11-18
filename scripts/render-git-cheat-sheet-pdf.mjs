#!/usr/bin/env node
// Renders git-github-cheat-sheet.pdf (A4) from the same Markdown as the page's command table:
//   content/git-github-guide/pdf-intro.md, 22b-cheat-sheet-table.md, pdf-outro.md
// Uses headless Chrome through an existing playwright-core install (no dependency in this repo):
//   PLAYWRIGHT_CORE=/path/to/node_modules/playwright-core node scripts/render-git-cheat-sheet-pdf.mjs
// Fonts load from Google Fonts, so this needs internet. Rerun after changing the table.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(ROOT, "content/git-github-guide");
const require = createRequire(import.meta.url);
const R = require(path.join(ROOT, "starter-pack-render.js"));
const md = (f) => R.render(fs.readFileSync(path.join(DIR, f), "utf8"), { guide: true, headingOffset: 0 });
const OUT = path.join(ROOT, "git-github-cheat-sheet.pdf");

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400&family=Outfit:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=block" rel="stylesheet">
<style>
@page{size:A4;margin:12mm 12mm 14mm}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Outfit,system-ui,sans-serif;color:#111;font-size:9.4pt;line-height:1.4}
header{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #00a870;padding-bottom:6pt;margin-bottom:8pt}
h1{font-family:'Playfair Display',Georgia,serif;font-weight:400;font-size:21pt;line-height:1.1}
.brand{text-align:right;font-size:9pt;color:#444}.brand b{color:#111;font-weight:600}
p{margin-bottom:5pt}
h3{font-size:10.5pt;font-weight:600;margin:9pt 0 4pt;color:#0a6b4a;break-after:avoid}
table{width:100%;border-collapse:collapse;break-inside:auto;margin-bottom:2pt}
.table-wrap{break-inside:auto}
tr{break-inside:avoid}
th{text-align:left;font-weight:600;font-size:8.6pt;background:#eef7f3;padding:3pt 5pt;border-bottom:1px solid #b9dccd}
td{padding:2.6pt 5pt;border-bottom:1px solid #e3e3e3;vertical-align:top}
td:nth-child(1){width:30%}td:nth-child(2){width:40%}
code{font-family:'JetBrains Mono',monospace;font-size:8.2pt;background:#f2f2f2;padding:0 2pt;border-radius:2pt;white-space:pre-wrap;word-break:break-word}
mark.ph{background:#fff1b8;color:#5a4600;border-radius:2pt}
strong{font-weight:600}
ul{margin:0 0 4pt 12pt}li{margin-bottom:2pt}
.intro{background:#f6fbf9;border:1px solid #cfe9de;border-radius:4pt;padding:5pt 7pt;margin-bottom:4pt}
.outro{break-inside:avoid;margin-top:4pt}
footer{margin-top:10pt;padding-top:6pt;border-top:1px solid #ccc;font-size:8.4pt;color:#444;display:flex;justify-content:space-between;gap:10pt}
a{color:#0a6b4a;text-decoration:none}
</style></head><body>
<header><h1>Git and GitHub cheat sheet</h1><div class="brand"><b>Oye Nino</b><br>oyenino.com &middot; @oye.nino</div></header>
<div class="intro">${md("pdf-intro.md")}</div>
${md("22b-cheat-sheet-table.md")}
<div class="outro">${md("pdf-outro.md")}</div>
<footer><span>Full guide with examples: <a href="https://oyenino.com/git-github-guide.html">oyenino.com/git-github-guide.html</a></span><span>Official docs: <a href="https://git-scm.com/docs">git-scm.com/docs</a> &middot; <a href="https://docs.github.com">docs.github.com</a></span></footer>
</body></html>`;

const pwPath = process.env.PLAYWRIGHT_CORE;
const { chromium } = await import(pwPath ? pathToFileURL(path.join(pwPath, "index.mjs")).href : "playwright-core").catch((e) => {
  console.error("Could not load playwright-core. Set PLAYWRIGHT_CORE to its folder.\n" + e.message);
  process.exit(1);
});
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage();
await page.setContent(html, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
const fontsOk = await page.evaluate(() => document.fonts.check("400 12px 'Outfit'") && document.fonts.check("400 12px 'JetBrains Mono'"));
// Nothing may be clipped: every cell must fit its column
const clipped = await page.evaluate(() => [...document.querySelectorAll("td,th")].filter((c) => c.scrollWidth > c.clientWidth + 1).length);
await page.pdf({ path: OUT, format: "A4", printBackground: true, preferCSSPageSize: true, tagged: true,
  displayHeaderFooter: true, headerTemplate: "<span></span>",
  footerTemplate: '<div style="font-size:7pt;color:#777;width:100%;text-align:center;font-family:sans-serif">Oye Nino Git and GitHub cheat sheet &middot; page <span class="pageNumber"></span> of <span class="totalPages"></span></div>' });
await browser.close();
const pdf = fs.readFileSync(OUT);
const pages = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;
const problems = [];
if (!fontsOk) problems.push("fonts did not load");
if (clipped) problems.push(clipped + " table cells clipped");
if (pages < 2 || pages > 4) problems.push(pages + " pages (want 2 to 4)");
console.log(`${problems.length ? "FAIL" : "OK  "} git-github-cheat-sheet.pdf  ${(pdf.length / 1024).toFixed(0)} KB  ${pages} pages${problems.length ? "  " + problems.join("; ") : ""}`);
process.exit(problems.length ? 1 : 0);
