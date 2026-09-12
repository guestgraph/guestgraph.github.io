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
const FOOTER = ["Robert Blust", "GitHub", "License", "Privacy"];

const PAGES = [
  { path: "/", typography: true, footer: FOOTER, storageKeys: true, mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, seo: true, noNewTab: true, title: /GuestGraph/, lang: "en", sourceLang: "en",
    translates: { lang: "de", shows: ["Einführungsvortrag ansehen", "Code lesen", "VORTRÄGE", "ABRECHNUNG"], hides: ["Watch intro talk", "Read the code"],
                  title: "GuestGraph – der Open-Source-Identitätsgraph für Gäste",
                  desc: "Ein erklärbares Gastprofil, aus Daten, die über jedes System im Hotel verstreut liegen. Quelloffen, Apache 2.0." },
    contains: ["Five strangers", "One guest", "GuestGraph"],
    links: ["https://github.com/guestgraph/engine"],
    // the deck carries its own way back now, so it no longer needs its own tab
    sameTab: ["talks/", "talks/intro/", "billing/", "privacy/"],
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true, tokens: true, sky: true, header: true, monoScope: true, monoDefined: true, contrast: true, noFlash: "theme", tokenVersion: true, fences: ["design tokens", "header contract", "language", "prose reset", "prose footer"],
    card: true, cardBase: SITE, internalLinks: true },

  // The billing model. The only page here that makes a claim of its own rather than
  // restating one, which is why two of these assertions are about the claim itself:
  // the unit must be stated exactly, and the page must keep saying the service is not
  // open. Drop that second sentence and the page stops describing an intention and
  // starts advertising a product that does not exist.
  { path: "/billing/", typography: true, footer: FOOTER, storageKeys: true, mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, seo: true, noNewTab: true, title: /GuestGraph/, lang: "en", sourceLang: "en",
    translates: { lang: "de", shows: ["Ein einziger Zähler", "Alles andere ist kostenlos", "Wie sich die Rechnung verhält"], hides: ["One meter", "Everything else is free", "How the bill behaves"],
                  title: "Abrechnung – GuestGraph",
                  desc: "Wie der gehostete GuestGraph abrechnen wird: ein einziger Zähler, und das sind Anreisen. Datenzufuhr, Import, Speicher und Abfragen sind kostenlos." },
    contains: ["Not per record", "1 arrival = 1 reservation that checked in", "not open yet"],
    // no call to action here: the page ends on its argument, so the only outbound link
    // left to hold to the new-tab rule is the one in the footer.
    links: ["https://github.com/guestgraph"],
    sameTab: ["../talks/", "../", "./", "../privacy/"],
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true, tokens: true, sky: true, header: true, monoScope: true, monoDefined: true, contrast: true, noFlash: "theme", tokenVersion: true, fences: ["design tokens", "header contract", "title contract", "language", "prose reset", "prose footer"],
    card: true, cardBase: SITE, internalLinks: true },

  // The privacy note. Its claims are checkable, so `verify` checks them rather than
  // trusting the prose: a page that says it makes no third-party request must make none,
  // and the suite's own `requestfailed`/`links` machinery cannot see that. If a font, an
  // analytics tag or an embed ever creeps in, this is what fails.
  { path: "/privacy/", typography: true, footer: FOOTER, storageKeys: true, mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, seo: true, noNewTab: true, title: /GuestGraph/, lang: "en", sourceLang: "en",
    translates: { lang: "de", shows: ["Was diese Seite tut", "Gastdaten, sobald es welche gibt", "Wer das betreibt"], hides: ["What this site does", "Guest data, when there is any", "Who runs this"],
                  title: "Datenschutz – GuestGraph",
                  desc: "Diese Seite setzt keine Cookies, führt keine Statistik und stellt keine Anfragen an Dritte. Wie der gehostete GuestGraph Gastdaten behandeln wird, aufgeschrieben, bevor es welche gibt." },
    contains: ["This site collects", "There is no imprint yet"],
    links: ["https://github.com/guestgraph"],
    sameTab: ["../talks/", "../", "../billing/", "./"],
    sameOrigin: true,
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true, tokens: true, sky: true, header: true, monoScope: true, monoDefined: true, contrast: true, noFlash: "theme", tokenVersion: true, fences: ["design tokens", "header contract", "title contract", "language", "prose reset", "prose footer"],
    card: true, cardBase: SITE, internalLinks: true },

  // The problems page. A refusal's `type` URI is this page's address with the slug as its
  // fragment, so every slug the two services answer must land on a heading here; the list is
  // the one the engine's shared-runtime contract names, and a service that adds a slug adds a
  // The API page. Its operation rows are generated from the two services' OpenAPI documents
  // at the commits `api-sources.json` pins, so the assertions here are about the page's own
  // shape: the spine, the one flagged note, and that a reader can reach the problems page from
  // it. Whether the rows are current is `npm run api:check`, which CI runs beside this suite.
  { path: "/api/", typography: true, footer: FOOTER, storageKeys: true, mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, seo: true, noNewTab: true, title: /GuestGraph/, lang: "en", sourceLang: "en",
    // The rows stay English in both languages: a method, a path and an operation summary are
    // the document's own words. `hides` therefore names prose only, never a summary.
    translates: { lang: "de", shows: ["Zwei APIs", "Was hereinkommt", "Wenn ein Aufruf abgelehnt wird"], hides: ["Two APIs", "What arrives", "When a call is refused"],
                  title: "API – GuestGraph",
                  desc: "Zwei HTTP-APIs: Die eine hält den Gast-Graphen und beantwortet Fragen dazu, die andere füllt ihn. Was jeder Aufruf tut und was eine Ablehnung bedeutet." },
    contains: ["Two APIs", "One fills it", "What arrives", "What came out", "When it is wrong",
               "There is no instance to call", "POST", "/records", "/guests/{guestId}/explain"],
    ids: ["connector", "arrives", "came-out", "wrong", "refusals"],
    links: ["https://github.com/guestgraph"],
    sameTab: ["../talks/", "../", "../billing/", "../privacy/", "../problems/"],
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true, tokens: true, sky: true, header: true, monoScope: true, monoDefined: true, contrast: true, noFlash: "theme", tokenVersion: true, fences: ["design tokens", "header contract", "title contract", "language", "prose reset", "prose footer"],
    card: true, cardBase: SITE, internalLinks: true },

  // section.
  { path: "/problems/", typography: true, footer: FOOTER, storageKeys: true, mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, seo: true, noNewTab: true, title: /GuestGraph/, lang: "en", sourceLang: "en",
    translates: { lang: "de", shows: ["Jede Ablehnung", "Ungültige Anfrage", "Interner Serverfehler"], hides: ["Every refusal", "Invalid request", "Internal server error"],
                  title: "Probleme – GuestGraph",
                  desc: "Jede Ablehnung, mit der ein GuestGraph-Dienst antwortet, trägt einen Typ. Was jeder Typ bedeutet, welcher Dienst damit antwortet und was dagegen zu tun ist." },
    contains: ["Every refusal", "invalid-request", "invalid-actor-claim", "invalid-unmerge", "unauthorized", "not-found", "conflict", "review-already-decided", "run-in-progress", "guest-retired", "payload-too-large", "internal-error"],
    ids: ["invalid-request", "invalid-actor-claim", "invalid-unmerge", "unauthorized", "not-found", "conflict", "review-already-decided", "run-in-progress", "guest-retired", "payload-too-large", "internal-error"],
    // The standard itself, linked where the page names it: a reader who wants the shape of a
    // problem detail rather than this list goes to the source.
    links: ["https://github.com/guestgraph", "https://www.rfc-editor.org/rfc/rfc9457.html"],
    sameTab: ["../talks/", "../", "../billing/", "../privacy/", "https://www.rfc-editor.org/rfc/rfc9457.html"],
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true, tokens: true, sky: true, header: true, monoScope: true, monoDefined: true, contrast: true, noFlash: "theme", tokenVersion: true, fences: ["design tokens", "header contract", "title contract", "language", "prose reset", "prose footer"],
    card: true, cardBase: SITE, internalLinks: true },

  { path: "/talks/", typography: true, footer: FOOTER, storageKeys: true, mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, seo: true, noNewTab: true, title: /talks/i, lang: "en", sourceLang: "en",
    // The German PDF is reached by data-de-href, which `sameTab` cannot see: it reads the href as
    // delivered, and the swap happens only after a click. `dlHref` reads the first such link.
    translates: { lang: "de", shows: ["Vorträge über", "Vortrag ansehen", "PDF herunterladen"], hides: ["Watch the talk", "Download PDF"],
                  dlHref: { de: "intro/guestgraph-de.pdf", en: "intro/guestgraph-en.pdf" },
                  title: "GuestGraph – Vorträge über Gastidentität in der Hotellerie",
                  desc: "Vorträge über GuestGraph, den Open-Source-Identitätsgraphen für Gäste in der Hotellerie – auf Deutsch und Englisch." },
    contains: ["GuestGraph", "guest identity"],
    // the nav no longer carries a Code item — the footer's org link is the way to the
    // source from here, one click further out than it used to be
    links: ["https://github.com/guestgraph"],
    // Billing lives in the guestgraph.github.io repository and this nav item is the only
    // link to it from here — it is shared chrome, so it stays in the tab like the rest.
    sameTab: ["intro/", "./", "../billing/", "../privacy/"],
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true, tokens: true, sky: true, header: true, monoScope: true, monoDefined: true, contrast: true, noFlash: "theme", tokenVersion: true, fences: ["design tokens", "header contract", "title contract", "language", "prose reset", "prose footer"],
    card: true, cardBase: SITE, internalLinks: true },
  // opensFromFile resolves its file:// probe against process.cwd(), which npm sets to this
  // repo's root — so the suite must be run with `npm run verify` from here, not from elsewhere.
  { path: "/talks/intro/", typography: true, storageKeys: true, opensFromFile: true, carriesLang: true, seo: true, noNewTab: true, title: /GuestGraph/, lang: "en", sourceLang: "en", wayOut: "../",
    // The deck's German is the whole second half of the talk, including every speaker note.
    // "Architekt"/"Architect" is the pair: one letter apart, present in exactly one language each.
    translates: { lang: "de", shows: ["Architekt", "Gastprofil"], hides: ["Architect"], id: "langDe", backId: "langEn",
                  title: "GuestGraph – eine Einführung · ein Vortrag von Robert Blust",
                  desc: "Ein Vortrag darüber, warum ein Stammgast wie fünf Fremde aussieht – und wie gestufte Sicherheit jede Zusammenführung erklärbar und umkehrbar macht." },
    // The footer's other two destinations. `landing` covers the lockup, which is relative and
    // therefore invisible to `links`; blust.ch is absolute, so `links` catches a typo in it and
    // `newTab` holds it to the rule the pages already follow — a talk the presenter navigates
    // away from mid-sentence is gone.
    landing: "../../",
    transportFits: [320, 350, 360, 390, 393, 414, 430],
    // One width per tier of the transport's own breakpoints, plus two above them. The
    // desktop pair is where the language and theme controls actually disagreed before
    // design v0.27.0; the three narrow widths hold for free today, because each tier
    // restates `min-height` on `.seg button` — they are named so a change to the theme
    // control's padding cannot break one of them unseen.
    transportBaseline: [320, 360, 430, 500, 900, 1280],
    links: ["https://blust.ch/"], sameTab: ["https://blust.ch/"],
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    tokens: true, sky: true, monoScope: true, contrast: true, noFlash: "theme", tokenVersion: true, readoutInvariant: true,
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
  // A refusal's type URI ends in a fragment, and a fragment that lands on nothing is a
  // reader left at the top of the page: every id the spec names must be an element's id.
  async ids(page, spec) {
    const missing = await page.evaluate(ids => ids.filter(id => !document.getElementById(id)), spec.ids);
    return missing.length ? `no element carries the id ${missing.map(id => JSON.stringify(id)).join(", ")}` : null;
  },
};

const browser = await chromium.launch();
const failures = await runSuite({ browser, SITE, BASE, PAGES, CHECKS, systemFaces: SYSTEM_FACES });
await browser.close();
process.exit(failures ? 1 : 0);
