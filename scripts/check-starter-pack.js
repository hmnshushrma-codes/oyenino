#!/usr/bin/env node
// Checks the Home Server Starter Pack content and renderer. No dependencies.
// Run from anywhere: node scripts/check-starter-pack.js
// Exits with code 1 if anything fails.
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.join(__dirname, "..");
const md = require(path.join(ROOT, "starter-pack-render.js"));

const failures = [];
let passes = 0;
function check(ok, msg) {
  if (ok) passes++;
  else failures.push(msg);
}

// ---------- 1. Load the content file the same way a browser would ----------
let PACK;
try {
  const src = fs.readFileSync(path.join(ROOT, "starter-pack-content.js"), "utf8");
  const ctx = vm.createContext({});
  vm.runInContext(src, ctx, { filename: "starter-pack-content.js" });
  PACK = vm.runInContext("STARTER_PACK", ctx);
} catch (e) {
  console.error("FAIL could not load starter-pack-content.js: " + e.message);
  process.exit(1);
}

check(typeof PACK.version === "string" && PACK.version.length > 0, "STARTER_PACK.version is missing");
check(typeof PACK.intro === "string" && PACK.intro.length > 0, "STARTER_PACK.intro is missing");
const expectedIds = ["beginner", "tech", "prompts", "cheatsheet"];
check(
  Array.isArray(PACK.docs) && PACK.docs.map((d) => d.id).join() === expectedIds.join(),
  "STARTER_PACK.docs ids should be " + expectedIds.join(", ")
);

// ---------- 2. Page and content versions must match ----------
const page = fs.readFileSync(path.join(ROOT, "starter-pack.html"), "utf8");
const pv = page.match(/var STARTER_PACK_VERSION = "([^"]+)"/);
check(!!pv, "starter-pack.html must define var STARTER_PACK_VERSION");
check(
  pv && pv[1] === PACK.version,
  `Version mismatch: starter-pack.html has "${pv && pv[1]}", starter-pack-content.js has "${PACK.version}"`
);
check(
  !/<script[^>]+src="\/starter-pack-content\.js/.test(page),
  "starter-pack.html must not load starter-pack-content.js with a static <script> tag"
);
check(!/—|&mdash;/.test(page), "starter-pack.html contains an em dash");

// ---------- 3. Render everything ----------
const rendered = {};
function renderDoc(id, source, opts) {
  try {
    rendered[id] = md.render(source, opts);
    check(rendered[id].length > 0, `${id}: rendered output is empty`);
  } catch (e) {
    failures.push(`${id}: renderer threw: ${e.stack}`);
    rendered[id] = "";
  }
}
renderDoc("intro", PACK.intro, { linkPrompts: true, docId: "intro" });
for (const d of PACK.docs) {
  const isPrompts = d.id === "prompts";
  renderDoc(d.id, d.md, { promptDoc: isPrompts, linkPrompts: !isPrompts, docId: d.id });
  check(!/—/.test(d.md), `${d.id}: contains an em dash`);
}
check(!/—/.test(PACK.intro), "intro: contains an em dash");

// ---------- 4. Prompt index and P links ----------
const promptsDoc = PACK.docs.find((d) => d.id === "prompts");
const index = md.promptIndex(promptsDoc ? promptsDoc.md : "");
const indexIds = index.map((p) => p.id);
for (let n = 1; n <= md.P_MAX; n++) {
  check(indexIds.includes("p" + n), `Prompt index is missing P${n}`);
}
check(indexIds.length === new Set(indexIds).size, "Prompt index has duplicate P numbers");
const promptHtml = rendered.prompts || "";
for (const id of indexIds) {
  check(promptHtml.includes(`id="${id}"`), `Rendered prompt library has no element with id="${id}"`);
}
const indexHtml = md.renderPromptIndex(promptsDoc.md);
check((indexHtml.match(/class="p-ref"/g) || []).length === md.P_MAX, "Prompt index does not have 16 links");

let refCount = 0;
for (const [id, html] of Object.entries(rendered)) {
  for (const m of html.matchAll(/data-prompt="(p\d+)"/g)) {
    refCount++;
    check(indexIds.includes(m[1]), `${id}: link to ${m[1]} has no matching prompt`);
  }
  // No P links inside code
  for (const m of html.matchAll(/<(code|pre)[\s>][\s\S]*?<\/\1>/g)) {
    check(!/class="p-ref"/.test(m[0]), `${id}: a P link was created inside a code block`);
  }
}
check(refCount > 0, "No P references were linked in the guides");

// Every P reference written in the guides became a link
for (const d of [{ id: "intro", md: PACK.intro }, ...PACK.docs.filter((d) => d.id !== "prompts")]) {
  const outsideCode = d.md.replace(/```[\s\S]*?```/g, "").replace(/`[^`]*`/g, "");
  const written = (outsideCode.match(/\bP(1[0-6]|[1-9])\b/g) || []).length;
  const linked = (rendered[d.id].match(/class="p-ref"/g) || []).length;
  check(written === linked, `${d.id}: ${written} P references in the Markdown but ${linked} links`);
}

// ---------- 5. Code blocks and placeholders ----------
for (const d of [{ id: "intro", md: PACK.intro }, ...PACK.docs]) {
  const fences = (d.md.match(/^\s*```/gm) || []).length / 2;
  const buttons = (rendered[d.id].match(/class="copy-btn"/g) || []).length;
  check(fences === buttons, `${d.id}: ${fences} code blocks but ${buttons} Copy buttons`);
}
check(/<mark class="ph">\[/.test(promptHtml), "Prompt placeholders are not highlighted");
check(!/<mark/.test(rendered.tech), "Placeholders were highlighted outside the prompt library");

// ---------- 6. Renderer behaviour and safety fixtures ----------
const r = (s, o) => md.render(s, o || {});
const xss = r(
  '<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\n[a](javascript:alert(1)) [b](data:text/html,x) [ok](https://example.com/?a=1&b="2")\n\n' +
    "| h |\n| --- |\n| <b onmouseover=x>t</b> |\n\n```html\n<script>bad()</script>\n```\n\n**<i>x</i>** `<u>y</u>`"
);
check(!/<script/i.test(xss), "Safety: <script> was not escaped");
check(!/<img/i.test(xss), "Safety: <img> was not escaped");
check(!/<b /.test(xss) && !/<i>/.test(xss) && !/<u>/.test(xss), "Safety: raw inline HTML was not escaped");
check(!/href="javascript:/i.test(xss) && !/href="data:/i.test(xss), "Safety: non-http link was allowed");
check(/href="https:\/\/example\.com\/\?a=1&amp;b=&quot;2&quot;"/.test(xss), "Safety: https link was not kept and escaped");

const tbl = r("| A | B |\n| --- | --- |\n| `a \\| b` | x \\| y |");
check(/<code>a \| b<\/code>/.test(tbl) && /<td>x \| y<\/td>/.test(tbl), "Tables: escaped pipes were not handled");
check(/class="table-wrap"/.test(tbl), "Tables: missing scroll wrapper");

const task = r("- [ ] one\n- [x] two");
check((task.match(/type="checkbox" disabled/g) || []).length === 2 && /disabled checked/.test(task), "Task lists not rendered as disabled checkboxes");

const ol = r("3. c\n4. d");
check(/<ol start="3">/.test(ol), "Numbered lists: start number lost");

const heads = r("# A\n## B\n### C");
check(/<h2>A<\/h2>/.test(heads) && /<h3>B<\/h3>/.test(heads) && /<h4>C<\/h4>/.test(heads), "Headings: levels wrong");

const refs = md.render("See P1, P4 and P16. Not P0, P17, P1x, `P7` or [P9](https://x.io).", { linkPrompts: true });
check((refs.match(/class="p-ref"/g) || []).length === 3, "P refs: wrong links for edge cases: " + refs);

const fenceLang = r("```yaml\na: 1\n```");
check(/<span class="code-lang">yaml<\/span>/.test(fenceLang), "Code blocks: language label missing");

try {
  r("```\nunclosed fence");
  r("| only | header |");
  r("");
  r(null);
  passes++;
} catch (e) {
  failures.push("Renderer threw on odd input: " + e.message);
}

// ---------- 7. No personal data in GA events (whole site) ----------
// Rule from guide.md: never send name, email, phone or IP (or anything else that identifies a person) to GA.
// Scans every GA call in form-utils.js and every .html page.
const PII_KEY = /(^|[\s{,])(visitor_name|name|full_name|first_name|last_name|email|email_address|user_email|phone|phone_formatted|mobile|ip|ip_address|user_agent|lat|lon|latitude|longitude|postal|address|domain|email_domain|corrected_to)\s*:/;
// "!!payload.name" (a true/false flag) is allowed. Email domains (split("@")) count as personal data.
const PII_VALUE = /(?<!!!)payload\.(name|email|phone|phone_formatted)\b|\b(name|email|phone)Input\.value|locationData|deviceData\.user_agent|getLocationInfo|\.ip\b|split\(\s*["']@["']\s*\)/;
// Known cases waiting for the owner's decision. Each one is printed as a warning on every run.
// Remove an entry once the code is fixed, or once it is decided to be acceptable.
const GA_EXCEPTIONS = [
  { file: "form-utils.js", match: /\{\s*domain:\s*domain\s*\}/, why: "email_mx_verified / email_mx_failed send the email domain (pending decision)" },
  { file: "form-utils.js", match: /corrected_to:/, why: "email_typo_fixed sends the corrected email domain (pending decision)" },
  { file: "form-utils.js", match: /email_domain:/, why: "email_server_rejected sends the email domain (pending decision)" },
];
const gaWarnings = [];
// Params passed as a variable cannot be inspected here. Only these names are allowed:
// p/params: wrapper functions forwarding their argument; utm: built from a fixed list of utm_* URL keys.
const PARAM_VARS_ALLOWED = new Set(["p", "params", "utm"]);

function splitArgs(src, start) {
  // src[start] is the char after "(". Returns top-level args as strings, or null if unbalanced.
  const args = [];
  let depth = 0, cur = "", quote = null;
  for (let i = start; i < src.length; i++) {
    const ch = src[i];
    if (quote) {
      cur += ch;
      if (ch === "\\") { cur += src[++i] || ""; continue; }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") { quote = ch; cur += ch; continue; }
    if (ch === "(" || ch === "{" || ch === "[") depth++;
    if (ch === ")" || ch === "}" || ch === "]") {
      if (depth === 0 && ch === ")") { args.push(cur.trim()); return args; }
      depth--;
    }
    if (ch === "," && depth === 0) { args.push(cur.trim()); cur = ""; continue; }
    cur += ch;
  }
  return null;
}

function gaProblems(src, file) {
  const problems = [];
  const re = /\b(gtag|trackEvent|oyeTrackEvent|track)\s*\(/g;
  let m;
  while ((m = re.exec(src))) {
    const before = src.slice(Math.max(0, m.index - 9), m.index);
    if (/function\s*$/.test(before)) continue; // a definition, not a call
    const args = splitArgs(src, m.index + m[0].length);
    if (!args) continue;
    let params;
    if (m[1] === "gtag") {
      if (!/^["']event["']$/.test(args[0] || "")) continue; // gtag("js"), gtag("config") are not events
      params = args[2];
    } else {
      params = args[1];
    }
    if (!params) continue;
    const line = src.slice(0, m.index).split("\n").length;
    const where = `${file}:${line}`;
    if (PII_KEY.test(params) || PII_VALUE.test(params)) {
      const ex = GA_EXCEPTIONS.find((x) => x.file === file && x.match.test(params));
      if (ex) { gaWarnings.push(`${where}: ${ex.why}`); continue; }
      problems.push(`${where}: GA event sends personal data: ${params.replace(/\s+/g, " ").slice(0, 120)}`);
    } else if (!/^\{/.test(params)) {
      const v = params.replace(/\s*\|\|\s*\{\s*\}\s*$/, "");
      if (!PARAM_VARS_ALLOWED.has(v)) {
        problems.push(`${where}: GA event params "${params}" cannot be checked. Pass an object literal.`);
      }
    }
  }
  return problems;
}

// Self-test: the scanner must catch these
const selfTest = gaProblems(
  'trackEvent("x_success", { visitor_name: payload.name });\ngtag("event", "y", { email: e });\n' +
    'oyeTrackEvent("z", { who: payload.email });\ntrack("w", someObject);\ngtag("event","ok",{ form_id: "a" });',
  "self-test"
);
check(selfTest.length === 4, "GA scanner self-test: expected 4 problems, got " + selfTest.length + ": " + selfTest.join(" | "));

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
const gaFiles = [path.join(ROOT, "form-utils.js"), ...listHtml(ROOT)];
let gaScanned = 0;
for (const f of gaFiles) {
  const problems = gaProblems(fs.readFileSync(f, "utf8"), path.relative(ROOT, f));
  gaScanned++;
  if (problems.length) failures.push(...problems);
  else passes++;
}

// ---------- Report ----------
console.log(`Starter pack version ${PACK.version}`);
console.log(`Prompts in index: ${indexIds.length}. P links in guides: ${refCount}.`);
console.log(`GA personal data scan: ${gaScanned} files.`);
for (const w of gaWarnings) console.log("  WARN " + w);
if (failures.length) {
  console.error(`\n${failures.length} check(s) FAILED:`);
  for (const f of failures) console.error("  FAIL " + f);
  process.exit(1);
}
console.log(`All ${passes} checks passed.`);
