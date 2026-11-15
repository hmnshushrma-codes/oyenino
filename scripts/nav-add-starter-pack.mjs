// Adds a "Starter Pack" link to the copied-per-page site nav, just before the "Let's Talk" button.
// Safe to run more than once: pages that already have the link are left alone.
// Run from the repo root: node scripts/nav-add-starter-pack.mjs
// index.html has its own dropdown and mobile panel and is edited by hand.
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const HREF = "/starter-pack.html";

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

const changed = [], skipped = [];
for (const file of listHtml(ROOT)) {
  const rel = relative(ROOT, file);
  if (rel === "index.html") continue;
  const lines = readFileSync(file, "utf8").split("\n");
  const start = lines.findIndex((l) => /class="nav-links"/.test(l));
  if (start === -1) continue;
  // The nav block ends at the first closing </div> or </ul> after it starts
  let end = start;
  while (end < lines.length && !/<\/(div|ul)>/.test(lines[end])) end++;
  const block = lines.slice(start, end + 1).join("\n");
  if (!block.includes('href="/prompts.html"')) { skipped.push(rel + " (demo or local nav)"); continue; }
  if (block.includes(`href="${HREF}"`)) { skipped.push(rel + " (already has the link)"); continue; }

  const cta = lines.findIndex((l, i) => i > start && i <= end && /class="nav-cta"/.test(l));
  if (cta === -1) { skipped.push(rel + " (no nav-cta found)"); continue; }
  const current = rel === "starter-pack.html" ? ' aria-current="page"' : "";
  const isList = /<ul/.test(lines[start]);
  let at = cta;
  let indent = lines[cta].match(/^\s*/)[0];
  if (isList) {
    // CTA is either "<li><a ... nav-cta>...</a></li>" on one line, or "<li>" then the <a> on the next line
    if (!/<li/.test(lines[cta]) && /^\s*<li>\s*$/.test(lines[cta - 1])) at = cta - 1;
    indent = lines[at].match(/^\s*/)[0];
    lines.splice(at, 0, `${indent}<li><a href="${HREF}"${current}>Starter Pack</a></li>`);
  } else {
    lines.splice(at, 0, `${indent}<a href="${HREF}"${current}>Starter Pack</a>`);
  }
  writeFileSync(file, lines.join("\n"));
  changed.push(rel);
}

console.log(`Added the link to ${changed.length} page(s):`);
changed.forEach((f) => console.log("  " + f));
if (skipped.length) {
  console.log("Skipped:");
  skipped.forEach((f) => console.log("  " + f));
}
