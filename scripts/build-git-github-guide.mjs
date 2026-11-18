#!/usr/bin/env node
// Builds the Git and GitHub guide from content/git-github-guide/.
//   node scripts/build-git-github-guide.mjs          writes the files
//   node scripts/build-git-github-guide.mjs --check  exits 1 if the files are out of date (used by the checks)
//
// Writes:
//   git-github-guide.html        the open sections, contents list and JSON-LD, between BUILD marker comments
//   git-github-guide-content.js  the gated parts (loaded by the page only after unlock)
//
// config.json "gateMode":
//   "partial"  only parts marked "gated": true are locked
//   "full"     every section is locked except the ones marked "alwaysOpen": true
// No dependencies. Markdown is rendered with starter-pack-render.js (escape-first).

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ROOT = new URL("../", import.meta.url).pathname;
const DIR = ROOT + "content/git-github-guide/";
const PAGE = ROOT + "git-github-guide.html";
const OUT_JS = ROOT + "git-github-guide-content.js";
const R = require(ROOT + "starter-pack-render.js");
const CHECK = process.argv.includes("--check");

const cfg = JSON.parse(readFileSync(DIR + "config.json", "utf8"));
if (!["partial", "full"].includes(cfg.gateMode)) throw new Error('gateMode must be "partial" or "full"');
const esc = R.escapeHtml;
const read = (f) => readFileSync(DIR + f, "utf8").replace(/\r\n?/g, "\n").trim() + "\n";

// Trusted SVG diagrams from the repo, used as {{diagram:name}} in the Markdown
const diagrams = {};
if (existsSync(DIR + "diagrams")) {
  for (const f of readdirSync(DIR + "diagrams")) {
    if (f.endsWith(".svg")) diagrams[f.slice(0, -4)] = readFileSync(DIR + "diagrams/" + f, "utf8").trim();
  }
}

const usedIds = {};
const gated = {};
const toc = [];
const faq = [];
let sectionsHtml = "";

function addAnchors(html) {
  // Link icon after every h3 and h4 the renderer gave an id to
  return html.replace(/<(h[34]) id="([^"]+)">([\s\S]*?)<\/\1>/g, (all, tag, id, inner) =>
    `<${tag} id="${id}">${inner} <a class="h-anchor" href="#${id}" aria-label="Link to this heading">#</a></${tag}>`);
}

function render(md, idPrefix) {
  return addAnchors(R.render(md, { guide: true, headingOffset: 0, idPrefix, usedIds, diagrams }));
}

function teaserHtml(part, section) {
  const text = part.teaser || section.summary || "";
  let preview = "";
  if (part.previewRows) {
    // Header plus the first few rows of the gated table, faded out. Only these rows are public.
    const lines = read(part.file).split("\n").filter((l) => /^\s*\|/.test(l));
    preview = '<div class="teaser-preview" aria-hidden="true">' +
      R.render(lines.slice(0, 2 + part.previewRows).join("\n"), { guide: true, headingOffset: 0 }) + "</div>";
  }
  return `<div class="gated-teaser">${preview}<p class="gated-label">Free with sign-up</p><p class="gated-text">${esc(text)}</p>` +
    `<a class="btn-unlock-link" href="#unlock">Unlock it free</a></div>`;
}

const gateForm = readFileSync(ROOT + "scripts/templates/git-github-guide-gate.html", "utf8").trim();

let missionCount = 0;
const visible = cfg.sections.filter((s) => !s.draft); // drafts stay off the page until written
for (const s of visible) {
  if (!/^[a-z0-9-]+$/.test(s.id)) throw new Error("Bad section id " + s.id);
  if (usedIds[s.id] || usedIds[s.id + "-title"]) throw new Error("Duplicate id " + s.id);
  usedIds[s.id] = usedIds[s.id + "-title"] = true;
  const num = s.mission ? String(++missionCount).padStart(2, "0") : "";
  toc.push(`<li><a href="#${s.id}">${num ? `<span class="toc-num">${num}</span>` : ""}<span class="toc-text">${esc(s.title)}</span></a></li>`);

  let body = "";
  s.parts.forEach((part, i) => {
    const locked = part.gated || (cfg.gateMode === "full" && !s.alwaysOpen);
    const partId = part.id || (i ? `${s.id}-${i + 1}` : s.id);
    if (locked) {
      gated[partId] = { md: read(part.file), section: s.id, filter: !!part.filter, print: !!part.print };
      body += `<div class="gated-slot" id="part-${partId}" data-part="${partId}"${part.filter ? ' data-filter="1"' : ""}${part.print ? ' data-print="1"' : ""}>` +
        teaserHtml(part, s) + "</div>\n";
    } else if (s.id === "faq") {
      // "### Question" then the answer paragraph(s). Visible text and FAQPage JSON-LD come from the same source.
      const md = read(part.file);
      const blocks = md.split(/^###\s+/m).slice(1);
      for (const b of blocks) {
        const [q, ...rest] = b.split("\n");
        const answer = rest.join("\n").trim();
        const aHtml = R.renderInline(answer.replace(/\s*\n\s*/g, " "), { guide: true });
        faq.push({ q: q.trim(), a: aHtml.replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&") });
        body += `<div class="faq-item"><h3 class="faq-q">${esc(q.trim())}</h3><p class="faq-a">${aHtml}</p></div>\n`;
      }
    } else {
      body += `<div class="md">${render(read(part.file), s.id)}</div>\n`;
    }
  });
  if (s.id === cfg.gateFormIn) body += gateForm + "\n";

  sectionsHtml +=
    `<section class="g-section" id="${s.id}" aria-labelledby="${s.id}-title">\n` +
    (num ? `<p class="mission-label">Mission ${num}</p>\n` : "") +
    `<h2 id="${s.id}-title">${esc(s.title)} <a class="h-anchor" href="#${s.id}" aria-label="Link to this section">#</a></h2>\n` +
    body + "</section>\n";
}
if (!visible.some((s) => s.id === cfg.gateFormIn)) throw new Error("gateFormIn names no visible section");
if (!Object.keys(gated).length) throw new Error("Nothing is gated, but the page has a gate form");

// A div with role="navigation", not <nav>: the page styles every <nav> as the fixed site header.
const tocHtml = `<div class="toc-wrap" role="navigation" aria-label="On this page"><details class="toc" id="toc"><summary>On this page</summary><ol>\n${toc.join("\n")}\n</ol></details></div>`;

// JSON-LD: Organization (same node as the other pages), TechArticle, FAQPage. No ratings, prices or invented dates.
const p = cfg.page;
const graph = [
  { "@type": "Organization", "@id": "https://oyenino.com/#oyenino", name: "Oye Nino", url: "https://oyenino.com/",
    sameAs: ["https://www.instagram.com/oye.nino", "https://youtube.com/@oye_nino"] },
  Object.assign({ "@type": "TechArticle", "@id": p.url + "#article", url: p.url, mainEntityOfPage: p.url,
    headline: p.headline, description: p.description, inLanguage: "en-IN",
    about: [{ "@type": "Thing", name: "Git" }, { "@type": "Thing", name: "GitHub" }],
    isPartOf: { "@type": "WebSite", url: "https://oyenino.com/", name: "Oye Nino" },
    author: { "@id": "https://oyenino.com/#oyenino" }, publisher: { "@id": "https://oyenino.com/#oyenino" } },
    p.datePublished ? { datePublished: p.datePublished } : {}),
];
if (faq.length) {
  graph.push({ "@type": "FAQPage", "@id": p.url + "#faq", isPartOf: { "@id": p.url + "#article" },
    mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) });
}
const ld = `<script type="application/ld+json">\n${JSON.stringify({ "@context": "https://schema.org", "@graph": graph }, null, 2).replace(/<\//g, "<\\/")}\n</script>`;

function between(html, name, content) {
  const re = new RegExp(`(<!-- BUILD:${name}:START -->)[\\s\\S]*?(<!-- BUILD:${name}:END -->)`);
  if (!re.test(html)) throw new Error(`Marker BUILD:${name} missing in git-github-guide.html`);
  return html.replace(re, (all, a, b) => `${a}\n${content}\n${b}`);
}

let html = readFileSync(PAGE, "utf8");
html = between(html, "LD", ld);
html = between(html, "TOC", tocHtml);
html = between(html, "GUIDE", sectionsHtml.trim());
html = html.replace(/var GUIDE_VERSION = "[^"]*";/, `var GUIDE_VERSION = "${cfg.version}";`);

const js =
  "/* Git and GitHub guide: gated parts. Generated by scripts/build-git-github-guide.mjs.\n" +
  "   Edit content/git-github-guide/ and run the build script again. Do not edit this file by hand. */\n" +
  "var GIT_GUIDE = " + JSON.stringify({ version: cfg.version, parts: gated }, null, 2) + ";\n";

if (CHECK) {
  const stale = [];
  if (readFileSync(PAGE, "utf8") !== html) stale.push("git-github-guide.html");
  if (!existsSync(OUT_JS) || readFileSync(OUT_JS, "utf8") !== js) stale.push("git-github-guide-content.js");
  if (stale.length) { console.error("Out of date: " + stale.join(", ") + ". Run node scripts/build-git-github-guide.mjs"); process.exit(1); }
  console.log("Git guide build is up to date.");
} else {
  writeFileSync(PAGE, html);
  writeFileSync(OUT_JS, js);
  console.log(`Built: ${visible.length} of ${cfg.sections.length} sections (${cfg.sections.length - visible.length} drafts hidden), ${Object.keys(gated).length} gated part(s), ${faq.length} FAQ, gateMode ${cfg.gateMode}.`);
}
