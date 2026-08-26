# SEO — the head contract

*2026-08-25. The same spec `blust.ch` and `companygraph.io` carry, because the three sites
have the same head and drifted the same way. What differs here is which parts had already
broken.*

## The problem, measured

Found by fetching the live site, not by reading the markup:

1. **`robots.txt` names three sitemaps and two of them are 404 in production.**
   `sitemap-site.xml` and `talks/sitemap.xml` were left behind when the talks moved out of
   the `guestgraph/talks` repository and into this one. The comment beside them still says
   that repository owns those URLs. It hasn't for some time. Every crawler that reads this
   file is sent to two missing documents, and nothing anywhere reported it.
2. **`/talks/` ships `<link rel="canonical" href="./">`.** Relative canonicals are legal
   and resolve correctly, so this is not broken — but it cannot be compared against
   `og:url` by any check, and it is the only one of five pages written that way.
3. **`/billing/` and `/privacy/` declare `isPartOf` a `#website` node neither page
   carries.** Google resolves `@graph` within one document, so the reference resolves to
   nothing. The node exists — on the landing page, which is a different document.
4. **`/talks/` and `/talks/intro/` carry no structured data at all**, while the other three
   pages do.

And behind all four: **there was no check.** This suite had no sitemap assertion and no
`robots.txt` assertion of any kind — `blust.ch`'s already did, and this one is the sibling
that fell behind. Nothing asserted a canonical existed, agreed with `og:url`, or that
structured data pointed at anything real.

## What "good Google support" means here

Four things, and the contract is that every page carries all four and a check fails when
one goes missing.

**1. A canonical URL** — absolute, byte-identical to `og:url`.

**2. A title and a description** — present, within the lengths Google renders (65 / 200).

**3. Structured data that resolves.** Every `@id` a page references must be defined on that
page. Every same-origin URL inside it must be fetchable. The types:

- `Organization` and `WebSite` on every page, so `isPartOf` and `publisher` have targets.
- `WebPage` per page.
- `BreadcrumbList` on every nested page — the one type here that earns a visible Google
  result: the path shown above a search hit instead of a bare URL.
- `SoftwareSourceCode` on the landing page, with `codeRepository` and `license`. Both are
  checkable and were checked: `guestgraph/engine` is public and its licence field reads
  `Apache-2.0`, which is what the page's own prose already claims. Deliberately **not**
  `SoftwareApplication` — Google's rich result for that type wants offers and ratings, and
  this project has neither. Claiming the type without them describes a product that does
  not exist.

**4. Sitemaps that resolve, in both directions.** Every URL the sitemap lists must be a
real page, and every sitemap `robots.txt` names must be a real file.

## Non-goals, and why

**`hreflang` is not applicable, and adding it would be wrong.** These pages are bilingual
through `data-de` swapped in by `applyLang()` at runtime. There is one URL per page.
`hreflang` announces *another address* for the other language, and there is none. Pointing
it at the same URL is inert at best and an invitation to treat one page as two at worst.
`og:locale` plus `og:locale:alternate` describes one document carrying two languages, which
is what this is. Revisit the day `/de/` URLs ship — not before.

**No `VideoObject` on the talk pages.** There is no video. The deck is HTML with synthesized
narration clips. Marking it up as video is structured data contradicting the page, which is
what manual actions are for.

**The deck's eleven `<h1>` stay** — one per slide is what a slide is.

**No keyword pages.** "Five strangers. One guest." is not a query anyone types. That is a
content decision, not a metadata one, and no tag fixes it.

## The check is the deliverable

`verify/check.mjs` gains `seo`, run on every page, plus the crawl-map block this suite never
had. Both were written before the fixes and run first, where they failed on four of five
pages and on `robots.txt`.
