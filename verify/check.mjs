// The deliverable is rendered pages, so the tests are assertions against a rendered DOM.
// Run against a served copy of the repo: python3 -m http.server 8000
//
// The design assertions live in verify/design.mjs, which is a byte-identical copy in all
// three repositories. See the comment at the top of that file for what that does and does
// not guarantee.
import { chromium } from "playwright";
import { DESIGN_CHECKS } from "./design.mjs";
import { FAMILY } from "@robertblust/design/family";

const BASE = process.env.BASE || "http://localhost:8000";
// The public origin, in one place. It was hardcoded in `card`, in the sitemap's expected
// list, and in the seo fetch rewrite — and *derived* in the seo origin filter, by rewriting
// a literal "http://localhost:8000". Run with BASE=http://127.0.0.1:8000 and that derivation
// produced a filter nothing matched, so every URL in every graph was skipped and the check
// printed ✓ having fetched none of them.
const SITE = "https://guestgraph.io";

// Every fetch whose body this suite never reads goes through here.
//
// Node 22's bundled undici asserts — `assert(!this.paused)` inside `Parser.finish` — when a
// socket ends while a response body is still unread. A status-only fetch leaks exactly that,
// and the assertion is thrown from a socket `end` handler, so no try/catch at the call site
// can reach it: the process dies with a stack trace into node internals and no mention of any
// check. It killed the run after `✓ /` in CI, which reads as "the landing page broke" and is
// nothing of the kind.
//
// It is a race against the single-threaded `python3 -m http.server` the suite is served from,
// and it is not rare: **6 of 12 local runs crashed on node 22.23.2, 0 of 12 with this helper.**
// CI is a coin flip per run. Node 25 never reproduces it, which is why it was invisible in
// development for as long as it has existed and only ever appeared on a merge to `main`.
//
// So: never call `fetch` for a status alone. Read the body or cancel it.
async function httpStatus(url) {
  const res = await fetch(url);
  await res.body?.cancel();
  return res.status;
}

const PAGES = [
  { path: "/", storageKeys: true, mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, seo: true, noNewTab: true, title: /GuestGraph/, lang: "en", sourceLang: "en",
    contains: ["Five strangers", "One guest", "GuestGraph"],
    links: ["https://github.com/guestgraph/engine"],
    // the deck carries its own way back now, so it no longer needs its own tab
    sameTab: ["talks/", "talks/intro/", "billing/", "privacy/"],
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true, tokens: true, sky: true, header: true, monoScope: true, monoDefined: true, contrast: true, tokenVersion: true, fences: ["design tokens", "header contract", "language", "prose reset", "prose footer"],
    card: true, cardBase: SITE, internalLinks: true },

  // The billing model. The only page here that makes a claim of its own rather than
  // restating one, which is why two of these assertions are about the claim itself:
  // the unit must be stated exactly, and the page must keep saying the service is not
  // open. Drop that second sentence and the page stops describing an intention and
  // starts advertising a product that does not exist.
  { path: "/billing/", storageKeys: true, mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, seo: true, noNewTab: true, title: /GuestGraph/, lang: "en", sourceLang: "en",
    contains: ["Not per record", "1 arrival = 1 reservation that checked in", "not open yet"],
    // no call to action here: the page ends on its argument, so the only outbound link
    // left to hold to the new-tab rule is the one in the footer.
    links: ["https://github.com/guestgraph"],
    sameTab: ["../talks/", "../", "./", "../privacy/"],
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true, tokens: true, sky: true, header: true, monoScope: true, monoDefined: true, contrast: true, tokenVersion: true, fences: ["design tokens", "header contract", "language", "prose reset", "prose footer"],
    card: true, cardBase: SITE, internalLinks: true },

  // The privacy note. Its claims are checkable, so `verify` checks them rather than
  // trusting the prose: a page that says it makes no third-party request must make none,
  // and the suite's own `requestfailed`/`links` machinery cannot see that. If a font, an
  // analytics tag or an embed ever creeps in, this is what fails.
  { path: "/privacy/", storageKeys: true, mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, seo: true, noNewTab: true, title: /GuestGraph/, lang: "en", sourceLang: "en",
    contains: ["This site collects", "There is no imprint yet"],
    links: ["https://github.com/guestgraph"],
    sameTab: ["../talks/", "../", "../billing/", "./"],
    sameOrigin: true,
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true, tokens: true, sky: true, header: true, monoScope: true, monoDefined: true, contrast: true, tokenVersion: true, fences: ["design tokens", "header contract", "language", "prose reset", "prose footer"],
    card: true, cardBase: SITE, internalLinks: true },

  { path: "/talks/", storageKeys: true, mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, seo: true, noNewTab: true, title: /talks/i, lang: "en", sourceLang: "en",
    contains: ["GuestGraph", "guest identity"],
    // the nav no longer carries a Code item — the footer's org link is the way to the
    // source from here, one click further out than it used to be
    links: ["https://github.com/guestgraph"],
    // Billing lives in the guestgraph.github.io repository and this nav item is the only
    // link to it from here — it is shared chrome, so it stays in the tab like the rest.
    sameTab: ["intro/", "./", "../billing/", "../privacy/"],
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true, tokens: true, sky: true, header: true, monoScope: true, monoDefined: true, contrast: true, tokenVersion: true, fences: ["design tokens", "header contract", "language", "prose reset", "prose footer"],
    card: true, cardBase: SITE, internalLinks: true },
  { path: "/talks/intro/", storageKeys: true, opensFromFile: true, carriesLang: true, seo: true, noNewTab: true, footerVersion: true, title: /GuestGraph/, lang: "en", sourceLang: "en", wayOut: "../",
    // The footer's other two destinations. `landing` covers the lockup, which is relative and
    // therefore invisible to `links`; blust.ch is absolute, so `links` catches a typo in it and
    // `newTab` holds it to the rule the pages already follow — a talk the presenter navigates
    // away from mid-sentence is gone.
    landing: "../../",
    links: ["https://blust.ch/"], sameTab: ["https://blust.ch/"],
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    tokens: true, sky: true, monoScope: true, contrast: true, tokenVersion: true, fences: ["design tokens", "language"],
    card: true, cardBase: SITE, internalLinks: true },
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
  // The language declared before any JS runs. It used to be `de`, because the markup was
  // German and JS swapped it to English on load — which meant a crawler without JS read
  // German from a page whose og tags, share card and canonical content were all English.
  // The markup is English-first now, so this asserts the page tells the truth cold.
  //
  // `lang` is not this check. That one reads documentElement.lang *after* applyLang() has
  // run, so a page whose source said `de` would be corrected on load and pass anyway, while
  // a crawler that runs no JS still read German. Only this one is fetched cold, which is why
  // it belongs on every page and not just the decks.
  async sourceLang(page, spec) {
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
  // The nav is one row across three sites, and it is written by hand on every page, so it
  // drifted: blust.ch put Principles after Talks on four pages and before it on the fifth,
  // and companygraph.io led with Talks while its siblings did not. Nothing caught it — the
  // items were all present, and `contains` does not see order.
  //
  // The family's order, left to right, is Ideas, Principles, Model, Example, Talks, Billing,
  // Privacy, then the language switcher. Read right to left it is the reverse, which is how
  // the rule was given: the switcher sits at the edge, and the further left an item is, the
  // more it is the site's own subject. A site skips what it does not have; no site may
  // reorder what it does have, and nothing outside the list may appear in the row.
  //
  // Privacy is on the list but lives in the footer on all three sites today. That is a
  // placement, not an exception: if it ever moves into the nav, this is where it goes.
  //
  // This function is a fourth copy, kept identical in all three suites the way the head
  // contract and the no-new-tab check are. A rule that is one row for a visitor is worth
  // asserting the same way everywhere.
  // One line runs through the middle of every word in the header — the wordmark, each nav
  // item, and both language segments. It did not before: nav is a flex row, its links
  // stretched to the row's height with their text at the top, and the language control sat
  // 5px lower than the words beside it.
  //
  // Measured on the text, not the boxes. A box can be centred while the text inside it is
  // not — that is exactly the bug this replaced, and a check comparing boxes would have
  // called it aligned.
  //
  // Two tolerances, because there are two fonts. The nav items and the language segments
  // are the same face at the same size, so they must agree to within half a pixel; that is
  // the pair the fix was about, and a loose bound there proved useless — with the link box
  // already symmetric, undoing `align-items:center` still landed inside 1px. The wordmark
  // is a different face, and where a line box falls inside its em box is the font's
  // business and the platform's, so it gets 1.5px and is judged against the row, not
  // against a single item of it.
  async headerBaseline(page) {
    return await page.evaluate(() => {
      const mid = el => {
        const n = [...el.childNodes].find(x => x.nodeType === 3 && x.textContent.trim());
        const r = document.createRange(); r.selectNodeContents(n || el);
        const b = r.getBoundingClientRect(); return (b.top + b.bottom) / 2;
      };
      const row = [];
      document.querySelectorAll("nav a").forEach(a => row.push([a.textContent.trim(), mid(a)]));
      for (const id of ["lde", "len"]) {
        const el = document.getElementById(id);
        if (el) row.push([el.textContent.trim(), mid(el)]);
      }
      if (row.length < 2) return "the nav row has fewer texts than a row";
      const vals = row.map(r => r[1]);
      const base = vals.reduce((a, b) => a + b, 0) / vals.length;
      const spread = Math.max(...vals) - Math.min(...vals);
      if (spread > 0.5)
        return `nav texts are ${spread.toFixed(2)}px apart: ` +
          row.map(([n, v]) => `${n} ${(v - base >= 0 ? "+" : "") + (v - base).toFixed(2)}`).join(", ");
      const mark = document.querySelector(".brand b");
      if (mark) {
        const d = mid(mark) - base;
        if (Math.abs(d) > 1.5) return `the wordmark sits ${d.toFixed(2)}px off the nav row`;
      }
      return null;
    });
  },
  // Three domains, three localStorages, one preference. A visitor reading German on one
  // site and following a link to a sibling used to arrive in English, because an origin
  // cannot see what another origin stored. The language travels in the link instead.
  //
  // Three things have to hold, and the middle one is the reason the implementation looks
  // the way it does. A family link can live inside a data-de attribute, and switching
  // language replaces that element whole, so an href decorated at load would be thrown
  // away by the first toggle; decorating on mousedown survives it, and keeps the param
  // out of the served markup — nothing crawlable or copyable carries it.
  //
  // Driven with mousedown rather than click on purpose: it is the event that fires before
  // the browser follows a link, so it can be dispatched without navigating away.
  async carriesLang(page, spec) {
    const problems = [];
    await page.goto(spec.absolute + "?lang=de", { waitUntil: "networkidle" });
    const arrived = await page.evaluate(() => ({
      lang: document.documentElement.lang, search: location.search,
    }));
    if (arrived.lang !== "de")
      problems.push(`arriving with ?lang=de left the page in ${arrived.lang}`);
    if (/lang=/.test(arrived.search))
      problems.push(`the param stayed in the address bar as ${JSON.stringify(arrived.search)}`);

    const probe = await page.evaluate((src) => {
      const pick = test => [...document.querySelectorAll("a[href]")].find(a => {
        try { return test(new URL(a.href, location.href)); } catch (e) { return false; }
      });
      const press = a => {
        const before = a.getAttribute("href");
        a.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
        return { before, after: a.getAttribute("href") };
      };
      const FAMILY = new RegExp(src);
      const out = { away: null, home: null };
      const away = pick(u => u.origin !== location.origin && FAMILY.test(u.hostname));
      if (away) out.away = press(away);
      const home = pick(u => u.origin === location.origin);
      if (home) out.home = press(home);
      return out;
    }, FAMILY.source);
    // A page with no link to a sibling domain simply has nothing to carry.
    if (probe.away && !/[?&]lang=de(&|$)/.test(probe.away.after))
      problems.push(`a link to ${probe.away.before} did not pick the language up: ${probe.away.after}`);
    if (probe.home && probe.home.after !== probe.home.before)
      problems.push(`a same-origin link was rewritten to ${probe.home.after}; it shares this storage already`);

    // Leave the page as this check found it, for whatever runs next.
    await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
    await page.goto(spec.absolute, { waitUntil: "networkidle" });
    return problems.length ? problems.join("; ") : null;
  },
  // The row at phone widths. Every page in the three sites used to answer this its own way
  // — some wrapped the bar, some wrapped the nav, and the two whose `.bar` carried no
  // `flex-wrap` let the wordmark itself break, so "rb Robert Blust" arrived on two lines.
  //
  // Checked at 360px, which is narrower than the phones in the analytics and wide enough
  // that nothing here is a special case. The wordmark is measured against its own mark: if
  // the name has dropped below it the brand is twice the mark's height, and no tolerance is
  // needed to see it.
  //
  // The switcher is asserted visible on purpose. It would be easy to sweep it into the menu
  // with everything else, and for a bilingual audience that is the wrong trade — a language
  // control someone cannot find costs more than the tap it saves.
  async mobileNav(page, spec) {
    const problems = [];
    await page.setViewportSize({ width: 360, height: 640 });
    try {
      await page.goto(spec.absolute, { waitUntil: "networkidle" });
      const shut = await page.evaluate(() => {
        const q = s => document.querySelector(s);
        const seen = el => el && getComputedStyle(el).display !== "none";
        const brand = q(".brand").getBoundingClientRect().height;
        const mark = q(".brand svg").getBoundingClientRect().height;
        return {
          brand: Math.round(brand), mark: Math.round(mark),
          wide: document.documentElement.scrollWidth > window.innerWidth,
          links: seen(q("#navlinks")), burger: seen(q("#burger")), seg: seen(q("#langind")),
        };
      });
      if (shut.brand > shut.mark)
        problems.push(`the wordmark broke: the brand is ${shut.brand}px against a ${shut.mark}px mark`);
      if (shut.wide) problems.push("the page scrolls sideways");
      if (shut.links) problems.push("the links are still in the row at 360px");
      if (!shut.burger) problems.push("there is no menu button");
      if (!shut.seg) problems.push("the language control is not on the bar");

      // Only drive the button if it is there to be driven: clicking a hidden one waits the
      // full timeout and reports that instead of the thing actually wrong.
      if (shut.burger) {
      await page.click("#burger");
      const open = await page.evaluate(() => ({
        links: getComputedStyle(document.getElementById("navlinks")).display !== "none",
        flag: document.getElementById("burger").getAttribute("aria-expanded"),
      }));
      if (!open.links) problems.push("pressing the button did not open the menu");
      if (open.flag !== "true") problems.push(`the button reports aria-expanded=${open.flag} while open`);

      await page.keyboard.press("Escape");
      const closed = await page.evaluate(() =>
        getComputedStyle(document.getElementById("navlinks")).display === "none");
      if (!closed) problems.push("Escape did not close the menu");
      }
    } finally {
      // Every other check runs at the desktop size; leave the page as they expect it.
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto(spec.absolute, { waitUntil: "networkidle" });
    }
    return problems.length ? problems.join("; ") : null;
  },
  // The privacy page says "that is everything that gets stored" and then lists the keys. It
  // was true until the divider started remembering its width, and nothing noticed — the claim
  // is prose and the keys are in a script, so the two could only be compared by hand.
  //
  // This drives the page instead of reading it: every write to localStorage is recorded, the
  // page is then made to do the things that write — switch language, move the divider — and
  // each key that turns up must be named on the privacy page. A key the page does not declare
  // is the failure; a key it declares and never writes is not, because a claim to store
  // something is not a claim anyone is harmed by.
  async storageKeys(page, spec) {
    const declared = await (await fetch(new URL("/privacy/", spec.absolute).href)).text();
    await page.addInitScript(() => {
      window.__keys = [];
      const real = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k, v) { window.__keys.push(k); return real.call(this, k, v); };
    });
    await page.goto(spec.absolute, { waitUntil: "networkidle" });
    // The write paths this suite knows about, each present-or-skip: prose pages carry the
    // language control as #lde/#len, a deck carries the same control as #langDe/#langEn, and
    // the model page's divider is #gutter. A page matching none of these has nothing here to
    // exercise its storage — the zero-writes check below is what actually catches that, so
    // this list is free to be incomplete without the gap going silent again.
    if (await page.$("#lde")) { await page.click("#lde"); await page.click("#len"); }
    if (await page.$("#langDe")) { await page.click("#langDe"); await page.click("#langEn"); }
    if (await page.$("#gutter")) { await page.focus("#gutter"); await page.keyboard.press("ArrowLeft"); }
    const written = await page.evaluate(() => [...new Set(window.__keys)]);
    // Leave the page as the rest of the suite expects it, storage included.
    await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
    await page.goto(spec.absolute, { waitUntil: "networkidle" });
    // This is the other half of the check, and the one a page armed with storageKeys used to
    // have no way to fail: a page that writes nothing and a page whose trigger this check
    // failed to find are indistinguishable from the outside, and both used to return a clean
    // pass. Every page armed with storageKeys is here because it is known to write
    // rb-lang/cg-lang/gg-lang on its language control, so zero observed writes means the
    // control above was not found or not exercised — not that the page has nothing to declare.
    if (!written.length)
      return "no write path was exercised — none of #lde/#len, #langDe/#langEn or #gutter " +
             "produced a write on this page; add its control to the list above";
    const undeclared = written.filter((k) => !declared.includes(k));
    return undeclared.length
      ? `writes ${undeclared.join(", ")}, which /privacy/ does not name`
      : null;
  },
  async navOrder(page) {
    const ORDER = ["Ideas", "Principles", "Model", "Example", "Talks", "Billing", "Privacy"];
    return await page.evaluate(order => {
      const nav = document.querySelector("nav");
      if (!nav) return "there is no nav";
      const items = [...nav.querySelectorAll("a")].map(a => a.textContent.trim());
      const unknown = items.filter(i => !order.includes(i));
      if (unknown.length) return "not named by the order rule: " + unknown.join(", ");
      const want = order.filter(i => items.includes(i));
      if (items.join(" ") !== want.join(" "))
        return `order is ${items.join(" · ")}; the rule is ${want.join(" · ")}`;
      // The switcher is the right-hand edge of the row, so nothing may follow it.
      const kids = [...nav.children];
      const sw = kids.findIndex(el => el.id === "langind" || el.classList.contains("langind"));
      if (sw === -1) return "the language switcher is not in the nav";
      if (sw !== kids.length - 1) return "something sits to the right of the language switcher";
      return null;
    }, ORDER);
  },
  async noNewTab(page) {
    const bad = await page.evaluate(() => {
      const live = [...document.querySelectorAll('a[target="_blank"]')]
        .filter(a => !a.closest(".slide"))
        .map(a => a.getAttribute("href"));
      // The rendered DOM is only ever one language. German rides in `data-de` as markup that
      // does not exist until a visitor switches, so a link check that trusts the DOM inspects
      // half the site. That is not hypothetical: the privacy page's German credit kept
      // `target='_blank'` — in single quotes, because it is nested inside an attribute — and
      // survived both a source-wide strip and this check until the attributes were parsed.
      const translated = [...document.querySelectorAll("[data-de]")].flatMap(el => {
        if (el.closest(".slide")) return [];
        const t = document.createElement("template");
        t.innerHTML = el.getAttribute("data-de");
        return [...t.content.querySelectorAll('a[target="_blank"]')]
          .map(a => `${a.getAttribute("href")} [de]`);
      });
      return [...live, ...translated];
    });
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

  // The head Google reads, asserted as a contract rather than page by page. The live failure
  // here was an isPartOf naming a #website node defined on another document — Google reads
  // @graph within one document, so it resolved to nothing. (The sibling suites carry the same
  // block; blust.ch's names a logo.svg it has never served, which this site does have.)
  //
  // The canonical is compared against the page's own URL, not merely against og:url. Agreeing
  // with og:url proves only that two tags say the same thing; both can say the same wrong
  // thing, and a canonical pointing at another page removes this one from the index and hands
  // its signals over — quietly, and worse than anything above.
  async seo(page, spec) {
    const problems = [];
    const want = SITE + spec.path;
    const m = await page.evaluate(() => {
      const meta = (sel) => (document.querySelector(sel) || {}).content || null;
      return {
        canonical: (document.querySelector('link[rel="canonical"]') || {}).getAttribute?.("href") ?? null,
        ogUrl: meta('meta[property="og:url"]'),
        ogTitle: meta('meta[property="og:title"]'),
        ogDesc: meta('meta[property="og:description"]'),
        ogType: meta('meta[property="og:type"]'),
        image: meta('meta[property="og:image"]'),
        desc: meta('meta[name="description"]'),
        site: meta('meta[property="og:site_name"]'),
        locale: meta('meta[property="og:locale"]'),
        alt: meta('meta[property="og:image:alt"]'),
        twitter: meta('meta[name="twitter:card"]'),
        ld: [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => s.textContent),
      };
    });

    if (!m.canonical) problems.push("no canonical");
    else if (m.canonical !== want) problems.push(`canonical ${JSON.stringify(m.canonical)} should be ${want}`);
    if (m.ogUrl !== m.canonical) problems.push(`og:url ${m.ogUrl} != canonical ${m.canonical}`);

    // Every page renders its own card. A page pointing at another's previews the wrong page
    // on every share, looks perfectly healthy, and is what `card` below cannot see: it only
    // asks whether the image resolves at its declared size, and a borrowed card does.
    if (!m.image) problems.push("no og:image");
    else if (m.image !== want + "og.png") problems.push(`og:image ${m.image} is not this page's own card (${want}og.png)`);

    if (!m.desc) problems.push("no meta description");
    else if (m.desc.length > 200) problems.push(`description is ${m.desc.length} chars, over 200`);

    for (const [k, v] of [["og:site_name", m.site], ["og:locale", m.locale],
                          ["og:image:alt", m.alt], ["twitter:card", m.twitter],
                          ["og:title", m.ogTitle], ["og:description", m.ogDesc],
                          ["og:type", m.ogType]])
      if (!v) problems.push(`no ${k}`);
    if (m.ogType && !["website", "article"].includes(m.ogType))
      problems.push(`og:type ${m.ogType} is neither website nor article`);

    // Structured data has to resolve, not merely parse. Google reads @graph within one
    // document, so an @id referenced but defined elsewhere is a pointer to nothing — and a
    // URL inside it is a promise the site either keeps or does not.
    if (!m.ld.length) problems.push("no application/ld+json");
    const defined = new Set(), referenced = [], urls = new Set();
    for (const block of m.ld) {
      let data;
      try { data = JSON.parse(block); }
      catch (e) { problems.push("ld+json does not parse: " + e.message); continue; }
      const nodes = data["@graph"] || (Array.isArray(data) ? data : [data]);
      const walk = (o) => {
        if (Array.isArray(o)) {
          for (const v of o)
            if (typeof v === "string" && /^https?:\/\//.test(v)) urls.add(v); else walk(v);
          return;
        }
        if (!o || typeof o !== "object") return;
        for (const [k, v] of Object.entries(o)) {
          // A bare { "@id": ... } is a pointer; the same key alongside an @type defines the
          // thing pointed at. Both are registered here as well as from the top-level @graph
          // members, so a node inlined under a property satisfies references to it instead of
          // being reported dangling.
          if (k === "@id" && typeof v === "string") {
            if (o["@type"]) defined.add(v);   // a node inlined under a property still defines one
            else referenced.push(v);          // a bare { "@id": … } is a pointer that must land
          }
          else if (typeof v === "string" && /^https?:\/\//.test(v) && k !== "@context") urls.add(v);
          else walk(v);
        }
      };
      nodes.forEach(n => { if (n && n["@id"]) defined.add(n["@id"]); });
      nodes.forEach(walk);
    }
    for (const r of referenced)
      if (!defined.has(r)) problems.push(`ld+json references ${r}, which no node on this page defines`);

    // Fetched from Node against BASE, not in-page against location.origin: an origin carries
    // no path, and `card` below documents a BASE that does (guestgraph.io/talks/). Nothing
    // about these URLs needs a browser.
    for (const u of urls) {
      if (!u.startsWith(SITE)) continue;              // off-site URLs are not ours to keep
      let status = 0;
      try { status = await httpStatus(u.replace(SITE, BASE)); } catch { status = 0; }
      if (status !== 200) problems.push(`ld+json names ${u} → HTTP ${status}`);
    }

    return problems.length ? problems.join("; ") : null;
  },

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
