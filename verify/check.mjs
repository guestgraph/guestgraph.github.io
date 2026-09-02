// The deliverable is rendered pages, so the tests are assertions against a rendered DOM.
// Run against a served copy of the repo: python3 -m http.server 8000
import { chromium } from "playwright";
import { DESIGN_CHECKS, SYSTEM_FACES } from "@robertblust/design/verify/design";
import { STAGE_CHECKS } from "@robertblust/design/verify/stage";
import { pageChecks } from "@robertblust/design/verify/pages";
import { runSuite } from "@robertblust/design/verify/suite";

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
    transportFits: [320, 350, 360, 390, 393, 414, 430],
    links: ["https://blust.ch/"], sameTab: ["https://blust.ch/"],
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    tokens: true, sky: true, monoScope: true, contrast: true, noFlash: "rb-theme", tokenVersion: true, readoutInvariant: true,
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
const failures = await runSuite({ browser, SITE, BASE, PAGES, CHECKS, systemFaces: SYSTEM_FACES });
await browser.close();
process.exit(failures ? 1 : 0);
