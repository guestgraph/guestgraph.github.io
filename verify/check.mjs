// The deliverable is rendered pages, so the tests are assertions against a rendered DOM.
// Run against a served copy of the repo: python3 -m http.server 8000
//
// The design assertions live in verify/design.mjs, which is a byte-identical copy in all
// three repositories. See the comment at the top of that file for what that does and does
// not guarantee.
import { chromium } from "playwright";
import { DESIGN_CHECKS } from "./design.mjs";

const BASE = process.env.BASE || "http://localhost:8000";

const PAGES = [
  { path: "/", noNewTab: true, title: /GuestGraph/, lang: "en",
    contains: ["Five strangers", "One guest", "GuestGraph"],
    links: ["https://github.com/guestgraph/engine"],
    // the deck carries its own way back now, so it no longer needs its own tab
    sameTab: ["talks/", "talks/intro/", "billing/", "privacy/"],
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], tokens: true, monoScope: true, contrast: true, tokenVersion: true,
    card: true, cardBase: "https://guestgraph.io", internalLinks: true },

  // The billing model. The only page here that makes a claim of its own rather than
  // restating one, which is why two of these assertions are about the claim itself:
  // the unit must be stated exactly, and the page must keep saying the service is not
  // open. Drop that second sentence and the page stops describing an intention and
  // starts advertising a product that does not exist.
  { path: "/billing/", noNewTab: true, title: /GuestGraph/, lang: "en",
    contains: ["Not per record", "1 arrival = 1 reservation that checked in", "not open yet"],
    // no call to action here: the page ends on its argument, so the only outbound link
    // left to hold to the new-tab rule is the one in the footer.
    links: ["https://github.com/guestgraph"],
    sameTab: ["../talks/", "../", "./", "../privacy/"],
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], tokens: true, monoScope: true, contrast: true, tokenVersion: true,
    card: true, cardBase: "https://guestgraph.io", internalLinks: true },

  // The privacy note. Its claims are checkable, so `verify` checks them rather than
  // trusting the prose: a page that says it makes no third-party request must make none,
  // and the suite's own `requestfailed`/`links` machinery cannot see that. If a font, an
  // analytics tag or an embed ever creeps in, this is what fails.
  { path: "/privacy/", noNewTab: true, title: /GuestGraph/, lang: "en",
    contains: ["This site collects", "There is no imprint yet"],
    links: ["https://github.com/guestgraph"],
    sameTab: ["../talks/", "../", "../billing/", "./"],
    sameOrigin: true,
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], tokens: true, monoScope: true, contrast: true, tokenVersion: true,
    card: true, cardBase: "https://guestgraph.io", internalLinks: true },

  { path: "/talks/", noNewTab: true, title: /talks/i, lang: "en", sourceLang: "en",
    contains: ["GuestGraph", "guest identity"],
    // the nav no longer carries a Code item — the footer's org link is the way to the
    // source from here, one click further out than it used to be
    links: ["https://github.com/guestgraph"],
    // Billing lives in the guestgraph.github.io repository and this nav item is the only
    // link to it from here — it is shared chrome, so it stays in the tab like the rest.
    sameTab: ["intro/", "./", "../billing/", "../privacy/"],
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], tokens: true, monoScope: true, contrast: true, tokenVersion: true,
    card: true, cardBase: "https://guestgraph.io", internalLinks: true },
  { path: "/talks/intro/", noNewTab: true, title: /GuestGraph/, lang: "en", sourceLang: "en", wayOut: "../",
    // The footer's other two destinations. `landing` covers the lockup, which is relative and
    // therefore invisible to `links`; blust.ch is absolute, so `links` catches a typo in it and
    // `newTab` holds it to the rule the pages already follow — a talk the presenter navigates
    // away from mid-sentence is gone.
    landing: "../../",
    links: ["https://blust.ch/"], sameTab: ["https://blust.ch/"],
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"],
    tokens: true, monoScope: true, contrast: true, tokenVersion: true,
    card: true, cardBase: "https://guestgraph.io", internalLinks: true },
];

const CHECKS = {
  ...DESIGN_CHECKS,
  async title(page, spec) {
    const t = await page.title();
    if (!spec.title.test(t)) return `title ${JSON.stringify(t)} does not match ${spec.title}`;
    if (t.length > 70) return `title is ${t.length} chars, over 70`;
    return null;
  },
  async lang(page, spec) {
    const l = await page.evaluate(() => document.documentElement.lang);
    return l === spec.lang ? null : `lang=${l}, expected ${spec.lang}`;
  },
  async sourceLang(page, spec) {
    // lang before JS runs — the static attribute must describe the German markup
    const html = await (await fetch(spec.absolute)).text();
    const m = html.match(/<html lang="([a-z]+)"/);
    return m && m[1] === spec.sourceLang ? null : `static lang is ${m && m[1]}, expected ${spec.sourceLang}`;
  },
  async contains(page, spec) {
    const text = await page.evaluate(() => document.body.innerText);
    for (const s of spec.contains)
      if (!text.includes(s)) return `body text is missing ${JSON.stringify(s)}`;
    return null;
  },
  // Presence only. This used to assert `target="_blank" rel="noopener"` on every outbound
  // link as well; that half moved to noNewTab and inverted, because nothing opens in a new
  // tab any more. What is left is the one thing no other check does: fail when an absolute
  // href is simply wrong.
  async links(page, spec) {
    const found = await page.evaluate(() =>
      [...document.querySelectorAll("a[href^='http']")].map(a => a.href));
    for (const want of spec.links)
      if (!found.includes(want)) return `missing outbound link ${want}`;
    return null;
  },
  // A deck opens in a new tab; navigation between prose pages does not. Neither rule is
  // visible to `links`, which only inspects absolute http hrefs — a relative one slips
  // straight past it, which is exactly how this regresses unnoticed.
  // Nothing opens in a new tab any more. The three sites are one ring — each links the other
  // two, and every deck carries its own way out — so a new tab is a workaround for a problem
  // that no longer exists, and it costs the visitor their back button.
  //
  // The one exception is a link inside a slide. A presenter who clicks one mid-talk in the
  // same tab loses the deck, and no back-button muscle memory saves that in front of a room.
  // So the exception is about *where* a link sits, not where it points: this site has none
  // today, and companygraph's deck has two.
  async noNewTab(page) {
    const bad = await page.evaluate(() =>
      [...document.querySelectorAll('a[target="_blank"]')]
        .filter(a => !a.closest(".slide"))
        .map(a => a.getAttribute("href")));
    return bad.length ? "must stay in this tab: " + bad.join(", ") : null;
  },
  async sameTab(page, spec) {
    const bad = await page.evaluate(hrefs =>
      [...document.querySelectorAll("a[href]")]
        .filter(a => hrefs.includes(a.getAttribute("href")))
        .filter(a => a.target === "_blank")
        .map(a => a.getAttribute("href")), spec.sameTab);
    return bad.length ? "must stay in this tab: " + bad.join(", ") : null;
  },
  // `links` only sees a[href^='http'], so a root-absolute internal link — which breaks
  // under file:// — is invisible to it.
  async internalLinks(page) {
    const bad = await page.evaluate(() =>
      [...document.querySelectorAll("a[href]")]
        .map(a => a.getAttribute("href"))
        .filter(h => h && !/^(https?:|mailto:|tel:|#)/i.test(h) && h.startsWith("/")));
    return bad.length ? `root-absolute internal link(s), break file://: ${bad.join(", ")}` : null;
  },
  // A page that claims it contacts nobody has to be held to it. Every request the page
  // makes is recorded and compared against its own origin; one off-origin fetch — a font
  // CDN, a tag, an embedded image — makes the headline false, and nothing else here
  // would notice.
  async sameOrigin(page, spec) {
    const seen = [];
    page.on("request", r => seen.push(r.url()));
    await page.reload({ waitUntil: "networkidle" });
    const origin = new URL(spec.absolute).origin;
    const foreign = [...new Set(seen.filter(u => /^https?:/.test(u) && !u.startsWith(origin)))];
    return foreign.length ? "off-origin request(s): " + foreign.join(", ") : null;
  },
  // `links` only sees a[href^='http'], so a root-absolute internal link — which breaks
  // under file:// — is invisible to it.
  // Decks open in the same tab now, which is only safe because the deck carries its own
  // way out. If that button ever disappears the same-tab links strand the reader on a
  // page with no exit — so the two rules are asserted together, deliberately.
  // The footer carries three destinations now: the lockup to this site's landing page,
  // "Robert Blust" to blust.ch, and "Talks" to the index. wayOut covers only the last, and
  // `links` cannot see a relative href at all — so without this the brand could point at a
  // page that no longer exists and the deck would look perfectly healthy until clicked.
  async landing(page, spec) {
    const found = await page.evaluate(href =>
      [...document.querySelectorAll("#chrome a[href]")]
        .filter(a => a.getAttribute("href") === href)
        .map(a => ({
          named: !!(a.getAttribute("aria-label") || (a.textContent || "").trim()),
          isLockup: !!a.querySelector(".namemark svg"),
        })), spec.landing);
    if (!found.length) return `no link to the landing page (${spec.landing}) in the transport bar`;
    if (!found.some(l => l.isLockup)) return `the landing link is not the brand lockup`;
    const unnamed = found.filter(l => !l.named).length;
    return unnamed ? `${unnamed} landing link(s) without an accessible name` : null;
  },
  async wayOut(page, spec) {
    const found = await page.evaluate(href => {
      const links = [...document.querySelectorAll("a[href]")]
        .filter(a => a.getAttribute("href") === href);
      return links.map(a => ({
        inChrome: !!a.closest("#chrome"),
        named: !!(a.getAttribute("aria-label") || (a.textContent || "").trim()),
      }));
    }, spec.wayOut);
    if (!found.length) return `no link back to ${spec.wayOut} — a same-tab deck with no exit`;
    if (!found.some(l => l.inChrome)) return `the way back is not in the transport bar`;
    const unnamed = found.filter(l => !l.named).length;
    return unnamed ? `${unnamed} way-back link(s) without an accessible name` : null;
  },

  // The card is fetched back to compare its real pixel size with the declared tags.
  // `cardBase` is the production prefix to strip: this repository is served under
  // /talks/ on the domain but at / locally, so stripping the origin alone would ask
  // for a path that does not exist here — which looked like a broken card and was not.
  async card(page, spec) {
    const img = await page.evaluate(() =>
      (document.querySelector('meta[property="og:image"]') || {}).content);
    if (!img) return "no og:image";
    const declared = await page.evaluate(() => [
      (document.querySelector('meta[property="og:image:width"]')  || {}).content,
      (document.querySelector('meta[property="og:image:height"]') || {}).content]);
    // Rewrite the card's absolute URL onto whatever is being tested — BASE, not
    // location.origin. An origin carries no path, and this repository is served under one:
    // locally it is the root of http://localhost:8000, live it is guestgraph.io/talks/.
    // Using the origin dropped the /talks prefix, so `BASE=https://guestgraph.io/talks npm
    // run verify` reported a card that serves perfectly as "not fetchable".
    const real = await page.evaluate(async ({ u, base, testBase }) => {
      const r = await fetch(base ? u.replace(base, testBase) : u.replace(/^https:\/\/[^/]+/, testBase));
      if (!r.ok) return null;
      const dv = new DataView(await r.arrayBuffer());
      return [String(dv.getUint32(16)), String(dv.getUint32(20))];   // PNG IHDR
    }, { u: img, base: spec.cardBase, testBase: BASE });
    if (!real) return `${img} is not fetchable`;
    if (real[0] !== declared[0] || real[1] !== declared[1])
      return `card is ${real.join("×")} but declared ${declared.join("×")}`;
    return null;
  },
};

const browser = await chromium.launch();
let failures = 0;

for (const spec of PAGES) {
  const page = await browser.newPage();
  const jsErrors = [];
  page.on("pageerror", e => jsErrors.push(String(e)));
  const missing = [];
  page.on("requestfailed", r => missing.push(r.url().split("/").pop()));
  const problems = [];
  spec.absolute = BASE + spec.path;
  try {
    const res = await page.goto(spec.absolute, { waitUntil: "networkidle" });
    if (!res || !res.ok()) problems.push(`HTTP ${res ? res.status() : "no response"}`);
    await page.evaluate(() => document.fonts && document.fonts.ready);
    for (const [name, fn] of Object.entries(CHECKS)) {
      if (spec[name] === undefined) continue;
      const problem = await fn(page, spec);
      if (problem) problems.push(`${name}: ${problem}`);
    }
  } catch (e) { problems.push(String(e)); }
  if (jsErrors.length) problems.push("JS errors: " + jsErrors.join(" | "));
  if (missing.length) problems.push("failed requests: " + missing.join(", "));
  console.log((problems.length ? "✗" : "✓") + " " + spec.path +
    (problems.length ? "\n    " + problems.join("\n    ") : ""));
  failures += problems.length ? 1 : 0;
  await page.close();
}
await browser.close();
console.log(failures ? `\n${failures} page(s) FAILED` : "\nall checks pass");
process.exit(failures ? 1 : 0);
