// The deliverable is rendered pages, so the tests are assertions against a rendered DOM.
// Run against a served copy of the repo: python3 -m http.server 8000
import { chromium } from "playwright";
import { DESIGN_CHECKS } from "@robertblust/design/verify/design";
import { httpStatus } from "@robertblust/design/verify/http";
import { STAGE_CHECKS } from "@robertblust/design/verify/stage";
import { pageChecks } from "@robertblust/design/verify/pages";

const BASE = process.env.BASE || "http://localhost:8000";
// The public origin, in one place. It was hardcoded in `card`, in the sitemap's expected
// list, and in the seo fetch rewrite — and *derived* in the seo origin filter, by rewriting
// a literal "http://localhost:8000". Run with BASE=http://127.0.0.1:8000 and that derivation
// produced a filter nothing matched, so every URL in every graph was skipped and the check
// printed ✓ having fetched none of them.
const SITE = "https://guestgraph.io";

// What every prose footer reads, left to right. The check compares this to the rendered DOM,
// so it is the one place that decides the order — and the German labels never appear here
// because the suite loads each page in its source language.
const FOOTER = ["Robert Blust", "GitHub", "Licence", "Privacy"];

const PAGES = [
  { path: "/", footer: FOOTER, storageKeys: true, mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, seo: true, noNewTab: true, title: /GuestGraph/, lang: "en", sourceLang: "en",
    contains: ["Five strangers", "One guest", "GuestGraph"],
    links: ["https://github.com/guestgraph/engine"],
    // the deck carries its own way back now, so it no longer needs its own tab
    sameTab: ["talks/", "talks/intro/", "billing/", "privacy/"],
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true, tokens: true, sky: true, header: true, monoScope: true, monoDefined: true, contrast: true, noFlash: "rb-theme", tokenVersion: true, fences: ["design tokens", "header contract", "language", "prose reset", "prose footer"],
    card: true, cardBase: SITE, internalLinks: true },

  // The billing model. The only page here that makes a claim of its own rather than
  // restating one, which is why two of these assertions are about the claim itself:
  // the unit must be stated exactly, and the page must keep saying the service is not
  // open. Drop that second sentence and the page stops describing an intention and
  // starts advertising a product that does not exist.
  { path: "/billing/", footer: FOOTER, storageKeys: true, mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, seo: true, noNewTab: true, title: /GuestGraph/, lang: "en", sourceLang: "en",
    contains: ["Not per record", "1 arrival = 1 reservation that checked in", "not open yet"],
    // no call to action here: the page ends on its argument, so the only outbound link
    // left to hold to the new-tab rule is the one in the footer.
    links: ["https://github.com/guestgraph"],
    sameTab: ["../talks/", "../", "./", "../privacy/"],
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true, tokens: true, sky: true, header: true, monoScope: true, monoDefined: true, contrast: true, noFlash: "rb-theme", tokenVersion: true, fences: ["design tokens", "header contract", "language", "prose reset", "prose footer"],
    card: true, cardBase: SITE, internalLinks: true },

  // The privacy note. Its claims are checkable, so `verify` checks them rather than
  // trusting the prose: a page that says it makes no third-party request must make none,
  // and the suite's own `requestfailed`/`links` machinery cannot see that. If a font, an
  // analytics tag or an embed ever creeps in, this is what fails.
  { path: "/privacy/", footer: FOOTER, storageKeys: true, mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, seo: true, noNewTab: true, title: /GuestGraph/, lang: "en", sourceLang: "en",
    contains: ["This site collects", "There is no imprint yet"],
    links: ["https://github.com/guestgraph"],
    sameTab: ["../talks/", "../", "../billing/", "./"],
    sameOrigin: true,
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true, tokens: true, sky: true, header: true, monoScope: true, monoDefined: true, contrast: true, noFlash: "rb-theme", tokenVersion: true, fences: ["design tokens", "header contract", "language", "prose reset", "prose footer"],
    card: true, cardBase: SITE, internalLinks: true },

  { path: "/talks/", footer: FOOTER, storageKeys: true, mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, seo: true, noNewTab: true, title: /talks/i, lang: "en", sourceLang: "en",
    contains: ["GuestGraph", "guest identity"],
    // the nav no longer carries a Code item — the footer's org link is the way to the
    // source from here, one click further out than it used to be
    links: ["https://github.com/guestgraph"],
    // Billing lives in the guestgraph.github.io repository and this nav item is the only
    // link to it from here — it is shared chrome, so it stays in the tab like the rest.
    sameTab: ["intro/", "./", "../billing/", "../privacy/"],
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true, tokens: true, sky: true, header: true, monoScope: true, monoDefined: true, contrast: true, noFlash: "rb-theme", tokenVersion: true, fences: ["design tokens", "header contract", "language", "prose reset", "prose footer"],
    card: true, cardBase: SITE, internalLinks: true },
  // opensFromFile resolves its file:// probe against process.cwd(), which npm sets to this
  // repo's root — so the suite must be run with `npm run verify` from here, not from elsewhere.
  { path: "/talks/intro/", storageKeys: true, opensFromFile: true, carriesLang: true, seo: true, noNewTab: true, title: /GuestGraph/, lang: "en", sourceLang: "en", wayOut: "../",
    // The footer's other two destinations. `landing` covers the lockup, which is relative and
    // therefore invisible to `links`; blust.ch is absolute, so `links` catches a typo in it and
    // `newTab` holds it to the rule the pages already follow — a talk the presenter navigates
    // away from mid-sentence is gone.
    landing: "../../",
    links: ["https://blust.ch/"], sameTab: ["https://blust.ch/"],
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    tokens: true, sky: true, monoScope: true, contrast: true, noFlash: "rb-theme", tokenVersion: true,
    // fences is presence-only and order-blind — deck runtime landing last here while
    // fenceOrder places it third, two lines down, is not the pair disagreeing.
    fences: ["design tokens", "language", "deck transport", "deck lockup", "deck fit", "deck runtime"],
    fenceOrder: ["design tokens", "deck lockup", "deck transport", "deck runtime", "language", "deck fit"],
    lockupCollapses: true,
    card: true, cardBase: SITE, internalLinks: true },
];

const CHECKS = {
  ...DESIGN_CHECKS,
  ...STAGE_CHECKS,
  ...pageChecks({ SITE, BASE }),
};

const browser = await chromium.launch();
let failures = 0;

// Two things the page loop cannot say about itself.
//
// Every page must opt into `seo`. The runner skips any check whose key is undefined, so
// deleting one line from PAGES turns the contract off for that page and changes no output.
{
  const off = PAGES.filter(p => !p.seo).map(p => p.path);
  if (off.length) { console.log("✗ PAGES  seo is not enabled on: " + off.join(", ")); failures++; }
}
// And every page must opt into tokenVersion, for the same reason. The deleted page-against-page
// block below asserted every page in PAGES unconditionally; tokenVersion alone does not, because
// the runner skips any check whose key is undefined — a page added to PAGES with neither a
// `design tokens` fence nor `tokenVersion: true` is invisible to design:check (discovery only
// finds fences that exist) and to this suite alike. This line is what restores that half of it.
{
  const off = PAGES.filter(p => !p.tokenVersion).map(p => p.path);
  if (off.length) { console.log("✗ PAGES  tokenVersion is not enabled on: " + off.join(", ")); failures++; }
}
// And every page must opt into `fences`, for the same reason. Task 2 added the check that
// fails a page whose fences no longer include `prose reset` — but not this line, so deleting
// `fences: [...]` from a page's spec (or adding a page to PAGES without it) turns that check
// off for that page and design:check only finds fences that exist, so the whole suite stays
// green while the page silently loses every fence it should have been checked against.
{
  const off = PAGES.filter(p => !p.fences).map(p => p.path);
  if (off.length) { console.log("✗ PAGES  fences is not enabled on: " + off.join(", ")); failures++; }
}

// The token block used to be compared page-against-page here, because there was no
// recorded source to compare it against and a hash would have been a second thing to
// keep in step. `design:check` is that source now: it asserts every page's fence
// byte-for-byte against what @robertblust/design ships, which is strictly stronger than
// pages merely agreeing with each other, and it reads the `page`/`deck` variant word off
// each page rather than expecting every page to share one block. Keeping this check
// alongside it would mean teaching a weaker check about every variant the stronger one
// already handles for free — so it is deleted, not adjusted.

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
// The crawl map is not a page, so it is checked separately. Two separate promises live
// here and both were being made without anything keeping them: every URL a sitemap claims
// must resolve, and every sitemap robots.txt names must exist. This file named three —
// sitemap-site.xml and talks/sitemap.xml were 404 in production, left behind when the talks
// moved out of the guestgraph/talks repository and into this one. Nothing failed, nobody
// saw it, and a crawler was being sent to both on every fetch.
{
  const res = await fetch(BASE + "/sitemap.xml");
  if (!res.ok) { console.log(`✗ /sitemap.xml  HTTP ${res.status}`); failures++; }
  else {
    const xml = await res.text();
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
    const expected = PAGES.map(p => SITE + p.path);
    const missing = expected.filter(u => !locs.includes(u));
    const extra = locs.filter(u => !expected.includes(u));
    if (missing.length || extra.length) {
      console.log(`✗ /sitemap.xml  missing: ${missing} unexpected: ${extra}`); failures++;
    } else {
      let unreachable = 0;
      for (const u of locs) {
        const s = await httpStatus(u.replace(SITE, BASE));
        if (s !== 200) { console.log(`✗ sitemap URL ${u} → ${s}`); failures++; unreachable++; }
      }
      if (!unreachable) console.log("✓ /sitemap.xml  " + locs.length + " urls, all reachable");
    }
  }

  const rb = await fetch(BASE + "/robots.txt");
  if (!rb.ok) { console.log(`✗ /robots.txt  HTTP ${rb.status}`); failures++; }
  else {
    const named = [...(await rb.text()).matchAll(/^\s*Sitemap:\s*(\S+)/gim)].map(m => m[1]);
    if (!named.length) { console.log("✗ /robots.txt  names no sitemap"); failures++; }
    else {
      const dead = [];
      for (const u of named) {
        const s = await httpStatus(u.replace(SITE, BASE));
        if (s !== 200) dead.push(`${u} → ${s}`);
      }
      if (dead.length) { console.log("✗ /robots.txt  names sitemap(s) that do not exist: " + dead.join(", ")); failures++; }
      else console.log(`✓ /robots.txt  ${named.length} sitemap(s), all reachable`);
    }
  }
}

console.log(failures ? `\n${failures} page(s) FAILED` : "\nall checks pass");
process.exit(failures ? 1 : 0);
