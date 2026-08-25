// The design system, expressed as assertions.
//
// These three repositories share no stylesheet, and cannot: a deck has to open from
// file://, so there is nothing to import. The tokens are therefore a copy inside every
// page, and this file is what stops the copies drifting *within* a repository.
//
// Across repositories the check is deliberate rather than automatic. Every copy carries
// a `design tokens · vN` marker and every repo records the N it expects below. Bumping
// the system means bumping N in all three and running all three suites. `npm run verify`
// will tell you which page in *this* repo is behind; nothing here can tell you that a
// sibling repository is. That part is a habit, and this comment is the reminder.

export const TOKEN_VERSION = "v1";

// The deck footer is copied across the three sites for the same reason the token block is:
// a deck opens from file://, so there is nothing to import. What it holds is a contract, not
// just a look — the lockup goes to the landing page, the person to blust.ch, the third link
// to the talks index, and none of them opens in a new tab. Change any of that on one site and
// the other two are quietly describing a footer that no longer exists.
//
// This marker is the tripwire, the same habit-with-a-tripwire the tokens get. Bumping it means
// bumping it in all three repositories and running all three suites. Nothing here can see a
// sibling; that is exactly the gap it is compensating for.
export const FOOTER_VERSION = "v1";

export const TOKENS = {
  "--ground": "#0C0E13", "--raise": "#171A21", "--rule": "#232833",
  "--ink":    "#EFEDE8", "--dim":   "#8A8B86",
  "--c-weak": "#3E5878", "--c-mid": "#7FA3D8",
  "--c-firm": "#B8D0FF", "--c-flag": "#D9A44F",
};

const hex = v => v.trim().replace(/^#/, "").toUpperCase();

// Generic keywords and the system faces a fallback stack is allowed to name. Several are
// one platform's and absent on the others — Segoe UI is Windows, Menlo and SF Mono are
// Apple — and that is exactly what a fallback chain is for: the machine takes the first
// name it has. What the check is hunting is the other thing, a name that is on no machine
// and served from nowhere, so it silently resolves to something the design never chose.
// Anything outside this list has to be shipped from this origin.
// Lowercase; the check compares case-insensitively.
export const SYSTEM_FACES = new Set([
  "ui-monospace", "ui-sans-serif", "ui-serif", "ui-rounded", "system-ui", "-apple-system",
  "blinkmacsystemfont", "sans-serif", "serif", "monospace", "cursive", "fantasy",
  "inherit", "initial", "unset", "revert",
  "segoe ui", "sfmono-regular", "menlo", "monaco", "consolas", "liberation mono",
  "courier new", "courier", "sf mono", "helvetica neue", "helvetica", "arial", "roboto",
  "noto sans", "liberation sans", "apple color emoji", "segoe ui emoji",
]);

export const DESIGN_CHECKS = {
  // The bug this suite exists for. blust.ch declared IBM Plex for months and loaded no
  // font file at all, so every visitor read it in system-ui — invisible in the source,
  // invisible in review, and only findable by measuring. A declared family whose text
  // measures exactly as wide as the generic fallback is not loaded, whatever CSS says.
  async fontsLoaded(page, spec) {
    const res = await page.evaluate(families => {
      const probe = stack => {
        const s = document.createElement("span");
        s.textContent = "Handgloves 12345 äöüß";
        s.style.cssText = "position:absolute;visibility:hidden;font-size:64px;" +
                          "white-space:nowrap;font-family:" + stack;
        document.body.appendChild(s);
        const w = Math.round(s.getBoundingClientRect().width);
        s.remove();
        return w;
      };
      const declared = [...document.fonts].map(f => ({ family: f.family, status: f.status }));
      return {
        total: document.fonts.size,
        declared,
        widths: Object.fromEntries(families.map(f => [f, probe(`"${f}", ui-sans-serif`)])),
        fallback: probe("ui-sans-serif"),
        monoFallback: probe("ui-monospace"),
      };
    }, spec.fontsLoaded);

    if (!res.total) return "no @font-face rules at all — the page renders in system fonts";
    const problems = [];
    for (const fam of spec.fontsLoaded) {
      const face = res.declared.find(d => d.family === fam);
      if (!face) problems.push(`${fam} is never declared`);
      else if (face.status !== "loaded") problems.push(`${fam} declared but status=${face.status}`);
      else if (res.widths[fam] === res.fallback)
        problems.push(`${fam} measures exactly as the fallback (${res.fallback}px) — not rendering`);
    }
    return problems.length ? problems.join("; ") : null;
  },

  // fontsLoaded measures the families a page *says* it uses. It cannot see one the page
  // never lists, and that is where the same bug came back: the brand mark named
  // "IBM Plex Mono" in an SVG presentation attribute on four pages, while the only mono
  // face this repo ships is "Plex Mono". Nothing errored and nothing measured wrong — the
  // mark simply drew in whatever mono the visitor's OS happened to have, which on a site
  // that self-hosts its fonts so no third party sees a visitor is the whole point missed.
  //
  // So the rule is the general one: every family named anywhere on the page — a stylesheet
  // rule or a font-family attribute — must either be @font-face'd by this page or be a
  // generic keyword or a system face everyone already has. A name that is neither is a font
  // nobody is guaranteed to own, and it will render as something else without saying so.
  async fontsAvailable(page) {
    const bad = await page.evaluate(system => {
      const ok = new Set(system);
      const declared = new Set([...document.fonts].map(f => f.family.toLowerCase()));
      const found = new Map();
      const note = (raw, where) => {
        const name = raw.trim().replace(/^["']|["']$/g, "");
        if (!name || name.startsWith("var(")) return;
        const key = name.toLowerCase();
        if (ok.has(key) || declared.has(key)) return;
        if (!found.has(name)) found.set(name, where);
      };
      const walk = (rules) => {
        for (const r of rules) {
          if (r instanceof CSSFontFaceRule) continue;   // that is a declaration, not a use
          if (r.cssRules) walk(r.cssRules);             // @media, @supports
          const ff = r.style && r.style.fontFamily;
          if (ff) for (const f of ff.split(",")) note(f, `css ${r.selectorText || "@rule"}`);
        }
      };
      for (const sheet of document.styleSheets) {
        try { walk(sheet.cssRules); } catch { /* cross-origin — this site has none */ }
      }
      for (const el of document.querySelectorAll("[font-family]"))
        for (const f of el.getAttribute("font-family").split(","))
          note(f, `<${el.tagName.toLowerCase()} font-family>`);
      return [...found].map(([name, where]) => `${name} (${where})`);
    }, [...SYSTEM_FACES]);
    return bad.length
      ? "named but neither self-hosted nor a system face: " + bad.join("; ")
      : null;
  },

  // one vocabulary, one set of values, everywhere
  async tokens(page) {
    const got = await page.evaluate(keys => {
      const cs = getComputedStyle(document.documentElement);
      return Object.fromEntries(keys.map(k => [k, cs.getPropertyValue(k)]));
    }, Object.keys(TOKENS));
    const wrong = Object.entries(TOKENS)
      .filter(([k, v]) => hex(got[k] || "") !== hex(v))
      .map(([k, v]) => `${k} is ${(got[k] || "unset").trim()}, expected ${v}`);
    return wrong.length ? wrong.join("; ") : null;
  },

  // mono is the page's "this is data" signal. Spend it on nav, buttons and prose and it
  // stops signalling anything — which is how it was being used before.
  async monoScope(page) {
    const bad = await page.evaluate(() => {
      const sel = ["nav a", ".btn", "h1", "h2", ".lede", ".tagline", "p.byline"];
      const out = [];
      for (const s of sel)
        for (const el of document.querySelectorAll(s))
          if (/mono/i.test(getComputedStyle(el).fontFamily)) { out.push(s); break; }
      return out;
    });
    return bad.length ? "monospace used outside data: " + bad.join(", ") : null;
  },

  async contrast(page) {
    const bad = await page.evaluate(() => {
      const cs = getComputedStyle(document.documentElement);
      const rgb = h => { h = h.trim().replace("#",""); return [0,2,4].map(i => parseInt(h.slice(i,i+2),16)); };
      const lum = c => { const s = c.map(v => { v /= 255; return v <= .03928 ? v/12.92 : Math.pow((v+.055)/1.055, 2.4); });
                         return .2126*s[0] + .7152*s[1] + .0722*s[2]; };
      const ratio = (a,b) => { const [x,y] = [lum(rgb(a)), lum(rgb(b))].sort((m,n)=>n-m);
                               return (x + .05) / (y + .05); };
      const g = cs.getPropertyValue("--ground");
      const need = { "--ink": 7, "--dim": 4.5, "--c-mid": 4.5, "--c-firm": 4.5 };
      return Object.entries(need)
        .map(([k, min]) => [k, ratio(cs.getPropertyValue(k), g), min])
        .filter(([, r, min]) => r < min)
        .map(([k, r, min]) => `${k} is ${r.toFixed(2)}:1 on --ground, needs ${min}:1`);
    });
    return bad.length ? bad.join("; ") : null;
  },

  // the version marker that makes a cross-repo drift visible to a human
  async tokenVersion(page, spec) {
    const res = await fetch(spec.absolute);
    const html = await res.text();
    const m = html.match(/design tokens · (v\d+)/);
    if (!m) return "the page carries no `design tokens · vN` marker";
    return m[1] === TOKEN_VERSION ? null
      : `page says ${m[1]}, this suite expects ${TOKEN_VERSION}`;
  },

  // the same marker for the deck footer, which is copied across the three sites and which no
  // suite can see on a sibling. Armed on deck pages only — the prose pages have no footer row.
  async footerVersion(page, spec) {
    const res = await fetch(spec.absolute);
    const html = await res.text();
    const m = html.match(/deck footer · (v\d+)/);
    if (!m) return "the deck carries no `deck footer · vN` marker";
    return m[1] === FOOTER_VERSION ? null
      : `deck says ${m[1]}, this suite expects ${FOOTER_VERSION}`;
  },
};
