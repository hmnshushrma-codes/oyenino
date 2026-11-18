#!/usr/bin/env node
// Checks the Git and GitHub guide page. No dependencies.
// Run from anywhere: node scripts/check-git-github-guide.js
// Exits with code 1 if anything fails.
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { execFileSync } = require("node:child_process");

const ROOT = path.join(__dirname, "..");
const DIR = path.join(ROOT, "content/git-github-guide");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const failures = [];
let passes = 0;
function check(ok, msg) { if (ok) passes++; else failures.push(msg); }

const page = read("git-github-guide.html");
const cfg = JSON.parse(read("content/git-github-guide/config.json"));

// ---------- 1. Build output is up to date ----------
try {
  execFileSync(process.execPath, [path.join(ROOT, "scripts/build-git-github-guide.mjs"), "--check"], { stdio: "pipe" });
  passes++;
} catch (e) {
  failures.push((e.stderr || e.stdout || "").toString().trim() || "Build check failed");
}

// ---------- 2. Config and content files ----------
check(["partial", "full"].includes(cfg.gateMode), 'gateMode must be "partial" or "full"');
check(/^\d{4}-\d{2}-\d{2}$/.test(cfg.version), "version should be a date like 2026-11-18");
check(new RegExp(`var GUIDE_VERSION = "${cfg.version}";`).test(page), "GUIDE_VERSION in the page does not match config.json");
const ids = new Set();
for (const s of cfg.sections) {
  check(!ids.has(s.id), `Duplicate section id ${s.id}`);
  ids.add(s.id);
  check(typeof s.title === "string" && s.title.length > 2, `Section ${s.id} has no title`);
  for (const p of s.parts) check(fs.existsSync(path.join(DIR, p.file)), `Missing content file ${p.file}`);
  if (s.draft) {
    check(!page.includes(`id="${s.id}"`), `Draft section ${s.id} must not be on the page`);
    continue;
  }
  check(page.includes(`<section class="g-section" id="${s.id}"`), `Section ${s.id} is not on the page`);
  check(page.includes(`<li><a href="#${s.id}">`), `Section ${s.id} is not in the contents list`);
  for (const p of s.parts) check(!/^Draft[: ]/m.test(fs.readFileSync(path.join(DIR, p.file), "utf8")), `${p.file} still has draft text but its section is visible`);
}
check(!/Draft: this section|Draft answer/.test(page), "Placeholder text is on the page");
// Every link to a place on this page must have a target (including links inside gated parts once unlocked)
const allIds = new Set([...page.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
check(ids.has(cfg.gateFormIn), "gateFormIn names no section");

// ---------- 3. Gate ----------
check(/formName: "git_github_guide_gate"/.test(page), 'Form name must be "git_github_guide_gate"');
check(/source: "git_github_guide_page"/.test(page), "Form source must be git_github_guide_page");
check(page.includes('<script src="/form-utils.js"></script>'), "Page must use form-utils.js");
check(/class="cf-turnstile[^"]*"[^>]*data-sitekey="/.test(page), "Turnstile widget missing");
check(/<input type="checkbox" id="marketingConsent" name="marketing_consent" value="yes" \/>/.test(page), "Marketing consent checkbox must exist and be unticked");
check(/href="\/privacy-policy\.html">privacy policy<\/a>/.test(page), "Privacy policy link missing next to the form");
check(/18 or older/.test(page), "18+ note missing");
check(/<noscript>[\s\S]*?JavaScript[\s\S]*?<\/noscript>/.test(page), "noscript message missing");
check((page.match(/id="gateForm"/g) || []).length === 1, "Exactly one gate form expected");
check(!/console\.log\(/.test(page.split("<script src=\"/form-utils.js\">")[1] || ""), "Page script must not console.log (could expose form data)");

// Gated content: load it as the browser would, and make sure none of it is in the HTML
let GG;
try {
  const ctx = vm.createContext({});
  vm.runInContext(read("git-github-guide-content.js"), ctx);
  GG = vm.runInContext("GIT_GUIDE", ctx);
} catch (e) { failures.push("git-github-guide-content.js does not load: " + e.message); }
if (GG) {
  check(GG.version === cfg.version, "Content file version does not match config.json");
  const gatedIds = [];
  for (const s of cfg.sections) s.parts.forEach((p, i) => {
    if (p.gated || (cfg.gateMode === "full" && !s.alwaysOpen)) gatedIds.push(p.id || (i ? `${s.id}-${i + 1}` : s.id));
  });
  check(JSON.stringify(Object.keys(GG.parts).sort()) === JSON.stringify(gatedIds.sort()), "Gated parts in the content file do not match config.json");
  for (const id of gatedIds) check(page.includes(`data-part="${id}"`), `No slot on the page for gated part ${id}`);
  // Leak check: every line of gated Markdown longer than 25 characters must be absent from the HTML,
  // except the table rows shown as a teaser preview.
  const previewRows = {};
  for (const s of cfg.sections) for (const p of s.parts) if (p.previewRows) previewRows[p.id] = p.previewRows;
  const R = require(path.join(ROOT, "starter-pack-render.js"));
  const plain = (s) => s.replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
  const pageText = plain(page);
  let leaks = 0;
  for (const [id, part] of Object.entries(GG.parts)) {
    let tableRow = 0;
    for (const line of part.md.split("\n")) {
      const isRow = /^\s*\|/.test(line) && !/^\s*\|?\s*:?-{3,}/.test(line);
      if (isRow) tableRow++;
      if (isRow && previewRows[id] && tableRow <= previewRows[id] + 1) continue; // header + preview rows
      const text = plain(R.renderInline(line.replace(/^[#>\-*\d.|\s]+/, ""), { guide: true })).replace(/\s*\|\s*/g, " ").trim();
      // A bare git command can be taught in the open guide and repeated in a gated list; prose cannot.
      if (/^git\s/.test(text)) continue;
      if (text.length > 25 && pageText.includes(text)) { leaks++; failures.push(`Gated text from ${id} is in the HTML: "${text.slice(0, 60)}"`); }
    }
  }
  if (!leaks) passes++;
  // Ids created when the gated parts render (same renderer and prefixes as the page script)
  const R2 = require(path.join(ROOT, "starter-pack-render.js"));
  for (const [id, part] of Object.entries(GG.parts)) {
    for (const m of R2.render(part.md, { guide: true, headingOffset: 0, idPrefix: id }).matchAll(/\sid="([^"]+)"/g)) allIds.add(m[1]);
    for (const m of R2.render(part.md, { guide: true, headingOffset: 0, idPrefix: id }).matchAll(/href="#([^"]+)"/g)) check(allIds.has(m[1]), `Link to #${m[1]} in gated part ${id} goes nowhere`);
  }
}
for (const m of page.matchAll(/href="#([^"]*)"/g)) check(allIds.has(m[1]), `Link to #${m[1]} goes nowhere`);

// ---------- 4. Nav link on every page with the site nav ----------
function listHtml(dir) {
  let out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".") || e.name === "node_modules") continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out = out.concat(listHtml(p));
    else if (e.name.endsWith(".html")) out.push(p);
  }
  return out;
}
let navPages = 0;
for (const file of listHtml(ROOT)) {
  const rel = path.relative(ROOT, file);
  const src = fs.readFileSync(file, "utf8");
  if (rel === "index.html") {
    const menu = (src.match(/<div class="dd-menu">[\s\S]*?<a href="\/prompts\.html" class="dd-footer"/) || [""])[0];
    const panel = (src.match(/<div class="mob-panel" id="mobPanel">[\s\S]*?class="mp-cta/) || [""])[0];
    check(menu.includes('href="/git-github-guide.html"'), "index.html: Free Resources dropdown has no Git Guide link");
    check(panel.includes('href="/git-github-guide.html"'), "index.html: mobile menu has no Git Guide link");
    navPages++;
    continue;
  }
  const nav = src.match(/class="nav-links"[\s\S]*?<\/(div|ul)>/);
  if (!nav || !nav[0].includes('href="/prompts.html"')) continue;
  navPages++;
  check(nav[0].includes('href="/git-github-guide.html"'), `${rel}: site nav has no Git Guide link`);
}
check(navPages >= 26, `Expected at least 26 pages with the site nav, found ${navPages}`);
check(/<a href="\/git-github-guide\.html" aria-current="page">Git Guide<\/a>/.test(page), 'The guide\'s own nav link needs aria-current="page"');
check(/href="\/git-github-guide\.html" class="prompt-card"/.test(read("prompts.html")), "prompts.html has no card for the guide");

// ---------- 5. SEO ----------
const decode = (s) => s.replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const title = (page.match(/<title>([^<]*)<\/title>/) || [])[1] || "";
const desc = (page.match(/<meta name="description" content="([^"]*)"/) || [])[1] || "";
check(title === cfg.page.title, "Page <title> does not match config.json page.title");
check(desc === cfg.page.description, "Meta description does not match config.json page.description");
check(title.length >= 30 && title.length <= 65, `Title should be 30 to 65 characters, is ${title.length}`);
check(desc.length >= 70 && desc.length <= 160, `Meta description should be 70 to 160 characters, is ${desc.length}`);
check((page.match(/<h1[\s>]/g) || []).length === 1, "Exactly one <h1> expected");
check(page.includes(`<link rel="canonical" href="${cfg.page.url}" />`), "Canonical URL missing or different from config.json");
check(page.includes(`<meta property="og:url" content="${cfg.page.url}" />`), "og:url missing or different from the canonical");
for (const m of page.matchAll(/(?:og:image|twitter:image)" content="https:\/\/(?:www\.)?oyenino\.com(\/[^"]+)"/g)) {
  check(fs.existsSync(path.join(ROOT, m[1])), `Social image ${m[1]} does not exist in the repo`);
}
check(/<meta name="twitter:card" content="summary_large_image" \/>/.test(page), "twitter:card should be summary_large_image");
// Heading order: no skipped levels in the open HTML
const levels = [...page.matchAll(/<h([1-6])[\s>]/g)].map((m) => +m[1]);
let skip = null;
for (let i = 1; i < levels.length; i++) if (levels[i] > levels[i - 1] + 1) { skip = `h${levels[i - 1]} then h${levels[i]}`; break; }
check(!skip, `Heading level skipped: ${skip}`);

let ld = null;
try { ld = JSON.parse((page.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/) || [])[1]); }
catch (e) { failures.push("JSON-LD does not parse: " + e.message); }
if (ld) {
  const raw = JSON.stringify(ld);
  check(!/aggregateRating|"review"|ratingValue|"offers"|"price"|dateModified/.test(raw), "JSON-LD must not contain ratings, reviews, prices or dateModified");
  const nodes = ld["@graph"] || [];
  const art = nodes.find((n) => n["@type"] === "TechArticle");
  check(art && art.author && art.publisher, "JSON-LD needs a TechArticle with author and publisher");
  check(!art || !art.datePublished || /^\d{4}-\d{2}-\d{2}$/.test(art.datePublished), "datePublished must be a real date");
  check(!nodes.some((n) => n["@type"] === "HowTo"), "No HowTo markup (Google dropped those rich results)");
  const faqLd = nodes.find((n) => n["@type"] === "FAQPage");
  const items = [...page.matchAll(/<h3 class="faq-q">([\s\S]*?)<\/h3><p class="faq-a">([\s\S]*?)<\/p>/g)].map((m) => [decode(m[1]), decode(m[2])]);
  check(items.length >= 5 && items.length <= 7, `FAQ should have 5 to 7 questions, has ${items.length}`);
  check(faqLd && faqLd.mainEntity.length === items.length, "FAQPage JSON-LD and the visible FAQ have different numbers of questions");
  if (faqLd) items.forEach(([q, a], i) => {
    const e = faqLd.mainEntity[i] || {};
    check(e.name === q, `FAQ question ${i + 1} differs between page and JSON-LD`);
    check(e.acceptedAnswer && e.acceptedAnswer.text === a, `FAQ answer ${i + 1} differs between page and JSON-LD`);
  });
}

// robots.txt: page crawlable, content file and PDF blocked, in every group (longest match wins)
const groups = {};
let cur = [];
for (const line of read("robots.txt").split("\n")) {
  const m = line.match(/^\s*([A-Za-z-]+)\s*:\s*(.*?)\s*$/);
  if (!m) { if (!line.trim()) cur = []; continue; }
  const k = m[1].toLowerCase(), v = m[2];
  if (k === "user-agent") { cur.push(v); groups[v] = groups[v] || []; }
  else if (k === "allow" || k === "disallow") for (const ua of cur) groups[ua].push([k, v]);
}
function allowed(ua, p) {
  let best = ["allow", ""];
  for (const [k, v] of groups[ua]) if (v && p.startsWith(v) && (v.length > best[1].length || (v.length === best[1].length && k === "allow"))) best = [k, v];
  return best[0] === "allow";
}
for (const ua of Object.keys(groups)) {
  check(allowed(ua, "/git-github-guide.html"), `robots.txt blocks the guide for ${ua}`);
  check(!allowed(ua, "/git-github-guide-content.js"), `robots.txt allows the gated content file for ${ua}`);
  check(!allowed(ua, "/git-github-cheat-sheet.pdf"), `robots.txt allows the PDF for ${ua}`);
}
check(/<loc>https:\/\/oyenino\.com\/git-github-guide\.html<\/loc>\s*<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/.test(read("sitemap.xml")), "sitemap.xml must list the guide with a lastmod");

// ---------- 6. Copy rules: no em dashes in anything written for this page ----------
const written = ["git-github-guide.html", "scripts/templates/git-github-guide-gate.html", "content/git-github-guide/config.json"]
  .concat(fs.readdirSync(DIR).filter((f) => f.endsWith(".md")).map((f) => "content/git-github-guide/" + f));
for (const f of written) check(!read(f).includes("—"), `${f} contains an em dash`);

// ---------- 7. GA: no personal data in events ----------
for (const m of page.matchAll(/track\("([a-z_]+)",\s*(\{[^}]*\}|utm|\{\})/g)) {
  check(!/\b(name|email|phone|ip)\s*:/.test(m[2]), `GA event ${m[1]} sends personal data`);
}
check(!/query:\s*input\.value/.test(page), "The search text must not be sent to GA");

// ---------- Report ----------
console.log(`Git guide: ${cfg.sections.length} sections, gateMode ${cfg.gateMode}, ${GG ? Object.keys(GG.parts).length : 0} gated part(s).`);
console.log(`Pages with the site nav: ${navPages}.`);
if (failures.length) {
  console.error(`\n${failures.length} check(s) FAILED:`);
  for (const f of failures) console.error("  FAIL " + f);
  process.exit(1);
}
console.log(`All ${passes} checks passed.`);
