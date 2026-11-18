/**
 * starter-pack-render.js: a small, safe Markdown renderer for the Home Server Starter Pack.
 * No dependencies. Used by starter-pack.html in the browser and by scripts/check-starter-pack.js in Node.
 *
 * Safety model: every piece of source text is HTML-escaped before any markup is added.
 * The only tags in the output are the ones this file writes. Links allow http and https only.
 *
 * Supported: headings (# to ###), paragraphs, **bold**, `inline code`, [links](https://...),
 * bullet lists, numbered lists, task lists (- [ ] / - [x]), tables (with \| for a literal pipe),
 * and fenced code blocks with a language label.
 *
 * Options for render(md, opts):
 *   headingOffset  number   added to heading levels (default 1, so "#" becomes <h2>)
 *   promptDoc      boolean  this is the prompt library: give "### P1: ..." headings id="p1",
 *                           and highlight [placeholders] inside code blocks
 *   linkPrompts    boolean  turn plain "P7" references in text into links to #p7
 *   docId          string   used for data attributes on code blocks
 *
 * Guide options (all off by default; the starter pack does not use them):
 *   guide          boolean  turns on the four features below
 *     callouts:      "> **Tip:** ...", "> **Warning:** ...", "> **Real-life analogy:** ...", "> **Note:** ..."
 *                    become <div class="callout callout-tip" role="note"> etc. Other "> " quotes become plain callouts.
 *     output blocks: a fence labelled ```output is shown as command output, without a copy button.
 *     placeholders:  <UPPER-CASE> words in code (not output) are highlighted as "replace this".
 *     page links:    [text](#section-id) links within the page (no other relative links)
 *     heading ids:   ## and ### headings get id="<idPrefix>-<slug>" (unique per page via opts.usedIds).
 *   idPrefix       string   prefix for heading ids
 *   usedIds        object   shared map of ids already used on the page
 *   diagrams       object   name -> trusted SVG HTML; a line "{{diagram:name}}" is replaced by it.
 *                           Only the build script passes this, from files in the repo, never user input.
 */
(function (root) {
  "use strict";

  var P_MAX = 16;

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // ---------- INLINE ----------

  // Placeholders keep finished HTML (code spans, links) away from later inline rules.
  var TOKEN_RE = /\u0000(\d+)\u0000/g;
  var HAS_TOKEN_RE = /\u0000\d+\u0000/;

  function renderInline(raw, opts, stash) {
    stash = stash || [];
    function keep(html) {
      stash.push(html);
      return "\u0000" + (stash.length - 1) + "\u0000";
    }

    // 1. Code spans, taken from the raw text so their content is never formatted.
    var text = String(raw).replace(/`([^`]+)`/g, function (_, code) {
      var c = escapeHtml(code);
      if (opts && opts.guide) c = markPlaceholders(c);
      return keep("<code>" + c + "</code>");
    });

    // 2. Escape everything else.
    text = escapeHtml(text);

    // 3. Links: [label](http(s)://...). Anything else stays as plain text.
    text = text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (all, label, url) {
      // url is already escaped; decode &amp; only for the scheme check
      var plain = url.replace(/&amp;/g, "&");
      // Guide mode also allows links to a section on the same page, like (#gitignore)
      if (opts && opts.guide && /^#[a-z0-9-]{1,80}$/.test(plain)) {
        return keep('<a href="' + url + '">' + applyBold(label) + "</a>");
      }
      if (!/^https?:\/\/[^\s]+$/i.test(plain)) return all;
      var inner = applyBold(label);
      return keep(
        '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + inner + "</a>"
      );
    });

    // 4. Bold.
    text = applyBold(text);

    // 5. Prompt references, outside code and links (those are tokens by now).
    if (opts && opts.linkPrompts) text = linkPromptRefs(text);

    // 6. Put tokens back (tokens may nest: links can contain code).
    for (var guard = 0; HAS_TOKEN_RE.test(text) && guard < 5; guard++) {
      text = text.replace(TOKEN_RE, function (_, i) { return stash[+i]; });
    }
    return text;
  }

  // <REPOSITORY-URL>, <file>, <COMMIT-HASH>: runs on escaped text, so it cannot create tags.
  function markPlaceholders(escaped) {
    return escaped.replace(/&lt;([A-Za-z][A-Za-z0-9_-]{0,40})&gt;/g,
      '<mark class="ph" title="Replace this with your own value">&lt;$1&gt;</mark>');
  }

  function slugify(s) {
    return String(s).toLowerCase().replace(/`/g, "").replace(/&[a-z]+;/g, " ")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "section";
  }

  function applyBold(s) {
    return s.replace(/\*\*([^*]+?)\*\*/g, "<strong>$1</strong>");
  }

  // "P7", "P1, P4", "(prompt P15)". Only P1 to P16, whole words.
  function linkPromptRefs(s) {
    return s.replace(/(^|[^A-Za-z0-9_#\-])P(\d{1,2})(?![A-Za-z0-9_])/g, function (all, pre, num) {
      var n = parseInt(num, 10);
      if (n < 1 || n > P_MAX || String(n) !== num) return all;
      return (
        pre +
        '<a class="p-ref" href="#p' + n + '" data-prompt="p' + n + '">P' + n + "</a>"
      );
    });
  }

  // ---------- TABLES ----------

  function splitRow(line) {
    var s = line.trim();
    if (s.charAt(0) === "|") s = s.slice(1);
    if (s.charAt(s.length - 1) === "|" && s.charAt(s.length - 2) !== "\\") s = s.slice(0, -1);
    var cells = [], cur = "";
    for (var i = 0; i < s.length; i++) {
      var ch = s.charAt(i);
      if (ch === "\\" && s.charAt(i + 1) === "|") { cur += "|"; i++; continue; }
      if (ch === "|") { cells.push(cur.trim()); cur = ""; continue; }
      cur += ch;
    }
    cells.push(cur.trim());
    return cells;
  }

  function isTableSep(line) {
    return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/.test(line);
  }

  function alignOf(cell) {
    var c = cell.trim();
    var l = c.charAt(0) === ":", r = c.charAt(c.length - 1) === ":";
    return l && r ? "center" : r ? "right" : l ? "left" : "";
  }

  function renderTable(header, sep, rows, opts) {
    var aligns = splitRow(sep).map(alignOf);
    function cellAttr(i) {
      return aligns[i] ? ' style="text-align:' + aligns[i] + '"' : "";
    }
    var html = '<div class="table-wrap" role="region" tabindex="0" aria-label="Table, scroll sideways to see all columns"><table><thead><tr>';
    header.forEach(function (c, i) { html += "<th scope=\"col\"" + cellAttr(i) + ">" + renderInline(c, opts) + "</th>"; });
    html += "</tr></thead><tbody>";
    rows.forEach(function (r) {
      html += "<tr>";
      for (var i = 0; i < header.length; i++) {
        html += "<td" + cellAttr(i) + ">" + renderInline(r[i] || "", opts) + "</td>";
      }
      html += "</tr>";
    });
    return html + "</tbody></table></div>";
  }

  // ---------- CODE BLOCKS ----------

  function renderCode(lang, lines, opts) {
    var body = escapeHtml(lines.join("\n"));
    var isPrompt = !!(opts && opts.promptDoc);
    if (opts && opts.guide) return renderGuideCode(lang, lines, body, opts);
    if (isPrompt) {
      // Highlight [placeholders]. Runs on escaped text, so the match cannot create tags.
      body = body.replace(/\[([^\[\]\n]{1,200})\]/g, '<mark class="ph">[$1]</mark>');
    }
    var label = lang ? escapeHtml(lang) : "code";
    return (
      '<div class="code-block' + (isPrompt ? " is-prompt" : "") + '" data-lang="' + label + '"' +
      (opts && opts.docId ? ' data-doc="' + escapeHtml(opts.docId) + '"' : "") + ">" +
      '<div class="code-head"><span class="code-lang">' + (isPrompt ? "Prompt" : label) + "</span>" +
      '<span class="copy-hint" aria-live="polite"></span>' +
      '<button type="button" class="copy-btn" aria-label="Copy ' + (isPrompt ? "prompt" : "code") + '">Copy</button></div>' +
      // Prompt blocks wrap; other blocks scroll sideways, so they need to be focusable for keyboard users.
      '<pre class="code-body"' + (isPrompt ? "" : ' tabindex="0"') + "><code>" + body + "</code></pre></div>"
    );
  }

  function renderGuideCode(lang, lines, body, opts) {
    var isOutput = lang === "output";
    if (isOutput) {
      return '<div class="code-block is-output" data-lang="output"><div class="code-head"><span class="code-lang">Output</span></div>' +
        '<pre class="code-body" tabindex="0"><code>' + body + "</code></pre></div>";
    }
    var first = "";
    for (var k = 0; k < lines.length; k++) {
      var t = lines[k].trim();
      if (t && t.charAt(0) !== "#") { first = t; break; }
    }
    if (first.length > 60) first = first.slice(0, 57) + "...";
    var label = lang ? escapeHtml(lang) : "code";
    return (
      '<div class="code-block" data-lang="' + label + '">' +
      '<div class="code-head"><span class="code-lang">' + label + "</span>" +
      '<span class="copy-hint" aria-live="polite"></span>' +
      '<button type="button" class="copy-btn" aria-label="Copy: ' + escapeHtml(first || label) + '">Copy</button></div>' +
      '<pre class="code-body" tabindex="0"><code>' + markPlaceholders(body) + "</code></pre></div>"
    );
  }

  var CALLOUTS = { "tip": "tip", "warning": "warning", "real-life analogy": "analogy", "note": "note" };

  function renderCallout(quoteLines, opts) {
    var md = quoteLines.join("\n");
    var kind = "note", title = "";
    var m = md.match(/^\*\*([A-Za-z -]{2,30}):\*\*\s*/);
    if (m && CALLOUTS[m[1].toLowerCase()]) {
      kind = CALLOUTS[m[1].toLowerCase()];
      title = m[1];
      md = md.slice(m[0].length);
    }
    var inner = render(md, { guide: true, headingOffset: 3, diagrams: null });
    return '<div class="callout callout-' + kind + '" role="note">' +
      (title ? '<p class="callout-title">' + escapeHtml(title) + "</p>" : "") + inner + "</div>";
  }

  // ---------- BLOCKS ----------

  var RE_FENCE = /^\s*```\s*([A-Za-z0-9_+.#-]*)\s*$/;
  var RE_HEADING = /^(#{1,3})\s+(.+?)\s*#*\s*$/;
  var RE_UL = /^\s*[-*+]\s+(.*)$/;
  var RE_OL = /^\s*(\d{1,9})[.)]\s+(.*)$/;
  var RE_TASK = /^\[([ xX])\]\s+(.*)$/;
  var RE_PROMPT_HEADING = /^P(\d{1,2}):\s*(.+)$/;
  var RE_DIAGRAM = /^\s*\{\{diagram:([a-z0-9-]+)\}\}\s*$/;

  function render(md, opts) {
    opts = opts || {};
    var offset = typeof opts.headingOffset === "number" ? opts.headingOffset : 1;
    var lines = String(md == null ? "" : md).replace(/\r\n?/g, "\n").split("\n");
    var out = [];
    var i = 0;

    function isBlockStart(line, next) {
      return (
        RE_FENCE.test(line) || RE_HEADING.test(line) || RE_UL.test(line) || RE_OL.test(line) ||
        (opts.guide && (/^\s*>/.test(line) || RE_DIAGRAM.test(line))) ||
        (/^\s*\|/.test(line) && next !== undefined && isTableSep(next))
      );
    }

    while (i < lines.length) {
      var line = lines[i];

      if (/^\s*$/.test(line)) { i++; continue; }

      // Fenced code
      var fence = line.match(RE_FENCE);
      if (fence) {
        var lang = fence[1], body = [];
        i++;
        while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) { body.push(lines[i]); i++; }
        i++; // skip closing fence (or run off the end of an unclosed block)
        out.push(renderCode(lang, body, opts));
        continue;
      }

      if (opts.guide) {
        // Callout: consecutive "> " lines
        if (/^\s*>/.test(line)) {
          var q = [];
          while (i < lines.length && /^\s*>/.test(lines[i])) { q.push(lines[i].replace(/^\s*>\s?/, "")); i++; }
          out.push(renderCallout(q, opts));
          continue;
        }
        // Diagram from a trusted file passed in by the build script
        var dg = line.match(RE_DIAGRAM);
        if (dg && opts.diagrams && Object.prototype.hasOwnProperty.call(opts.diagrams, dg[1])) {
          out.push(opts.diagrams[dg[1]]);
          i++;
          continue;
        }
      }

      // Heading
      var h = line.match(RE_HEADING);
      if (h) {
        var level = Math.min(6, h[1].length + offset);
        var text = h[2], id = "";
        var pm = opts.promptDoc && h[1].length === 3 && text.match(RE_PROMPT_HEADING);
        if (pm) {
          id = ' id="p' + parseInt(pm[1], 10) + '" tabindex="-1" class="p-heading"';
        } else if (opts.guide && opts.idPrefix) {
          var base = opts.idPrefix + "-" + slugify(text), hid = base, n = 2;
          var used = opts.usedIds || (opts.usedIds = {});
          while (used[hid]) hid = base + "-" + n++;
          used[hid] = true;
          id = ' id="' + hid + '"';
        }
        out.push("<h" + level + id + ">" + renderInline(text, { linkPrompts: false }) + "</h" + level + ">");
        i++;
        continue;
      }

      // Table
      if (/^\s*\|/.test(line) && i + 1 < lines.length && isTableSep(lines[i + 1])) {
        var header = splitRow(line), sep = lines[i + 1], rows = [];
        i += 2;
        while (i < lines.length && /^\s*\|/.test(lines[i])) { rows.push(splitRow(lines[i])); i++; }
        out.push(renderTable(header, sep, rows, opts));
        continue;
      }

      // Lists
      var ul = line.match(RE_UL), ol = line.match(RE_OL);
      if (ul || ol) {
        var ordered = !!ol && !ul;
        var itemRe = ordered ? RE_OL : RE_UL;
        var items = [];
        var start = ordered ? parseInt(ol[1], 10) : 1;
        while (i < lines.length) {
          var m = lines[i].match(itemRe);
          if (m) {
            items.push(ordered ? m[2] : m[1]);
            i++;
          } else if (items.length && /^\s{2,}\S/.test(lines[i]) && !isBlockStart(lines[i], lines[i + 1])) {
            items[items.length - 1] += " " + lines[i].trim(); // continuation line
            i++;
          } else {
            break;
          }
        }
        var isTaskList = !ordered && items.some(function (t) { return RE_TASK.test(t); });
        var tag = ordered ? "ol" : "ul";
        var attrs = ordered && start !== 1 ? ' start="' + start + '"' : "";
        if (isTaskList) attrs += ' class="task-list"';
        var html = "<" + tag + attrs + ">";
        items.forEach(function (t) {
          var task = !ordered && t.match(RE_TASK);
          if (task) {
            var checked = task[1] !== " " ? " checked" : "";
            html += '<li class="task"><label><input type="checkbox" disabled' + checked + " /> <span>" +
              renderInline(task[2], opts) + "</span></label></li>";
          } else {
            html += "<li>" + renderInline(t, opts) + "</li>";
          }
        });
        out.push(html + "</" + tag + ">");
        continue;
      }

      // Paragraph: gather lines until a blank line or another block starts
      var para = [line.trim()];
      i++;
      while (i < lines.length && !/^\s*$/.test(lines[i]) && !isBlockStart(lines[i], lines[i + 1])) {
        para.push(lines[i].trim());
        i++;
      }
      out.push("<p>" + renderInline(para.join(" "), opts) + "</p>");
    }

    return out.join("\n");
  }

  /** Returns [{ id: "p1", num: 1, title: "Do I need a home server?" }, ...] from a prompt library doc. */
  function promptIndex(md) {
    var list = [];
    String(md || "").split(/\r?\n/).forEach(function (line) {
      var m = line.match(/^###\s+P(\d{1,2}):\s*(.+?)\s*$/);
      if (m) list.push({ id: "p" + parseInt(m[1], 10), num: parseInt(m[1], 10), title: m[2] });
    });
    return list;
  }

  /** Renders the P1 to P16 index as a nav with links. */
  function renderPromptIndex(md) {
    var items = promptIndex(md);
    if (!items.length) return "";
    var html = '<nav class="p-index" aria-label="Prompt index"><h2 class="p-index-title">Prompt index</h2><ol>';
    items.forEach(function (p) {
      html += '<li><a class="p-ref" href="#' + p.id + '" data-prompt="' + p.id + '"><span class="p-num">P' +
        p.num + "</span> " + escapeHtml(p.title) + "</a></li>";
    });
    return html + "</ol></nav>";
  }

  var api = {
    escapeHtml: escapeHtml,
    render: render,
    renderInline: renderInline,
    slugify: slugify,
    promptIndex: promptIndex,
    renderPromptIndex: renderPromptIndex,
    P_MAX: P_MAX
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.SPMarkdown = api;
})(this);
