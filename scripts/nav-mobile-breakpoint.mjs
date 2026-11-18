// The site nav now has six links plus "Let's Talk", which no longer fits on one line below about 960px.
// Each page switches to the hamburger menu at its own breakpoint (600, 768 or 900px), so between that
// breakpoint and 980px the links wrapped onto two rows (this already happened on some pages before).
//
// This script copies each page's existing mobile NAV rules (and only those) into an extra media query
// that covers <page breakpoint + 1>px to 980px. Page content keeps its own layout at those widths.
// Safe to run more than once: pages that already have the block are left alone.
// Run from the repo root: node scripts/nav-mobile-breakpoint.mjs
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const MAX = 980;
const MARK = "/* nav-breakpoint: menu button up to " + MAX + "px (scripts/nav-mobile-breakpoint.mjs) */";
const NAV_SELECTOR = /^(nav|\.nav-links|\.nav-cta|\.mobile-toggle|\.ham-line|nav\s|\.nav-logo)/;

function listHtml(dir) {
  let out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".") || e.name === "node_modules") continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) out = out.concat(listHtml(p));
    else if (e.name.endsWith(".html")) out.push(p);
  }
  return out;
}

// Returns [{ width, body }] for every @media (max-width: Npx) block, with balanced braces.
function mediaBlocks(css) {
  const out = [];
  const re = /@media\s*\(\s*max-width:\s*(\d+)px\s*\)\s*\{/g;
  let m;
  while ((m = re.exec(css))) {
    let depth = 1, i = re.lastIndex;
    while (i < css.length && depth) { if (css[i] === "{") depth++; else if (css[i] === "}") depth--; i++; }
    out.push({ width: +m[1], body: css.slice(re.lastIndex, i - 1) });
  }
  return out;
}

// Splits a block body into top-level "selector{decls}" rules.
function rules(body) {
  const out = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(body))) out.push({ sel: m[1].trim(), decls: m[2].trim() });
  return out;
}

const changed = [], skipped = [];
for (const file of listHtml(ROOT)) {
  const rel = relative(ROOT, file);
  if (rel === "index.html") continue; // own nav (dropdown + mobile panel)
  let html = readFileSync(file, "utf8");
  const nav = html.match(/class="nav-links"[\s\S]*?<\/(div|ul)>/);
  if (!nav || !nav[0].includes('href="/prompts.html"')) continue;
  if (html.includes("nav-breakpoint:")) { skipped.push(rel + " (already done)"); continue; }

  const styles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join("\n");
  // The page's mobile nav block: the media query where .nav-links becomes the slide-in menu
  const block = mediaBlocks(styles)
    .filter((b) => /\.nav-links\s*\{[^}]*(position:\s*fixed|display:\s*none|flex-direction:\s*column)/.test(b.body))
    .sort((a, b) => b.width - a.width)[0];
  if (!block) { skipped.push(rel + " (no mobile nav block found)"); continue; }
  if (block.width >= MAX) { skipped.push(rel + ` (already switches at ${block.width}px)`); continue; }

  const navRules = rules(block.body).filter((r) => r.sel.split(",").every((s) => NAV_SELECTOR.test(s.trim())));
  if (!navRules.some((r) => /\.mobile-toggle/.test(r.sel))) { skipped.push(rel + " (mobile nav rules not recognised)"); continue; }

  const css = `\n    <style>\n      ${MARK}\n      @media (min-width:${block.width + 1}px) and (max-width:${MAX}px){\n` +
    navRules.map((r) => `        ${r.sel}{${r.decls}}`).join("\n") + "\n      }\n    </style>\n  </head>";
  html = html.replace(/\s*<\/head>/, css);
  writeFileSync(file, html);
  changed.push(`${rel} (${block.width + 1} to ${MAX}px, ${navRules.length} rules)`);
}

console.log(`Updated ${changed.length} page(s):`);
changed.forEach((f) => console.log("  " + f));
if (skipped.length) { console.log("Skipped:"); skipped.forEach((f) => console.log("  " + f)); }
