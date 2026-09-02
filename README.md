# guestgraph.io

The site for **GuestGraph** — the open-source guest identity graph for hospitality.

**Live:** https://guestgraph.io

One repository serves the whole domain. It was two — the talks had their own — and the split
cost more than it saved: the talks index copies this site's shell, header and footer, so every
nav change had to land in both repositories in the same breath, with no CI on either side able
to see the seam. They were merged, history and all, in August 2026.

The repository is named `guestgraph.github.io` because that makes it the organisation's GitHub
Pages site, which is what puts it on the custom domain in `CNAME`. **Renaming it or removing
`CNAME` takes the whole domain down**, talks included.

A repository named `talks` in this organisation would claim `guestgraph.io/talks/` the moment
its Pages were enabled — shadowing the folder in this repository, which is how the old split
had to be unwound. Do not recreate one.

| Path | |
|---|---|
| `/` | The landing page. |
| `/talks/` | The talks index. |
| `/talks/intro/` | The introduction — narrated, German and English, with a PDF in each. |
| `/billing/` | How the hosted service will bill. One meter, and it is arrivals. |
| `/privacy/` | What this site collects, which is nothing. |

## Contents

- `index.html` — the landing page. Self-contained: even the fonts are served from `fonts/`.
- `billing/index.html` — how the hosted service will bill. One meter, and it is arrivals.
- `privacy/index.html` — what this site collects (nothing) and how guest data will be handled.
- `talks/index.html` — the talks index, carrying this site's chrome so a visitor crossing into
  it meets no seam.
- `talks/intro/` — the deck: `index.html`, `audio/{en,de}/`, both PDFs, and `tts/generate.py`,
  which reads the deck's speaker notes as the single source for what is spoken.
- `fonts/` — the self-hosted `.woff2` files, and the only copy. Every page and the deck point
  at them relatively, so the deck still opens from `file://`.
- `sitemap.xml` — one flat list of every URL on the domain. It was an index pointing at a
  second sitemap while the talks lived elsewhere; there is one list now.
- `verify/check.mjs` — the suite, covering all five pages in one run, and
  `verify/og-recipe.test.mjs`, the share-card check's own tests.
- `og.png`, `talks/og.png`, `talks/intro/og.png` — 1200×630 share cards, each rendered from the
  page it belongs to, and an `og.sha` beside each one: a hash of everything that went into the
  card, so `npm run og:check` can say whether it still shows its page. `og-recipe.mjs` defines
  what that is, `export-og.mjs` renders all three and writes the stamps, `og-check.mjs` reports
  them. `export-pdf.mjs`, alongside it at the root, renders the deck's two PDFs into
  `talks/intro/`.
- `logo.svg` — the mark: three open records resolving into one solid profile. Uses
  `currentColor`, so it inherits whatever colour it is placed in.
- `favicon.svg`
- `avatar.svg` / `avatar.png` — the org avatar, 1024×1024. Full-bleed square on purpose:
  GitHub rounds org avatars itself, and a rounded rect here would show its corners through
  that mask. Upload the **PNG** — GitHub does not accept SVG for avatars, and there is no API
  for it (Organisation → Settings → Profile → Upload new picture).
- `CNAME` — the custom domain

## The mark

Three hollow nodes, one filled. The sources stay open because records are never consumed —
they are kept exactly as they arrived. The profile is solid because it is a *conclusion* derived
from them, not a row anybody edited. That is the product in one glyph, and it is the same figure
the hero animates and the talk draws.

## Editing

No build step. Open `index.html`, or serve it:

```bash
npm install                        # once, for Playwright
npm run serve                      # → http://localhost:8000
npm run verify                     # renders every page and asserts the DOM
npm run og:check                   # do the five share cards still show their pages?
npm run test:og                    # the card check's own tests (node --test)
npm run og                         # re-renders all five cards after a visual change
```

`og:check` needs no server and no browser — it re-derives each card's recipe and compares it
with the `og.sha` committed beside it, which is why CI runs it before installing one. It does
need `npm ci` first: the machinery lives in `@robertblust/design`, shared with blust.ch and
companygraph.io. Commit each `og.png` with its `og.sha`, in the commit that moved the page.

## What it says, and what it deliberately does not

One screen, one job: say what GuestGraph is and send the visitor to the talk or the code. The
landing page carries the title, the hook, and two links — nothing else. Everything a visitor
would ask next is answered in the [12-minute talk](https://guestgraph.io/talks/intro/), which
is a better medium for it than a scrolling page of claims.

That is also why it makes no claim about matching behaviour, roadmap, or status. Those live
where they are maintained — in the core repository and in
[`docs/matching.md`](https://github.com/guestgraph/engine/blob/main/docs/matching.md) — so a
change there cannot leave this page quietly wrong.

## Billing

[`/billing/`](https://guestgraph.io/billing/) is the one thing this site states in its own
right rather than restating from elsewhere: **the hosted service will bill on arrivals**, one
meter and nothing else, with ingestion, historical backfill, stored profiles and lookups free.
Self-hosting stays free forever, because it is Apache 2.0 and pretending otherwise would cost
more credibility than it earns.

It carries no prices and no bands. The model is the durable half; the numbers are the half
that goes stale, and the hosted service is not open yet — which the page says out loud. That
sentence is the difference between publishing an intention and advertising a product, and it
stays until there is something to buy.

## Privacy

[`/privacy/`](https://guestgraph.io/privacy/) says what this site collects, which is nothing: no
cookies, no analytics, no third-party requests, no forms, fonts served from this origin. The
only thing stored is the language choice, in the visitor's own browser. `verify` records every
request the page makes and fails on any that leaves this origin, because that claim is the kind
that can quietly stop being true.

The same page says how guest data will be handled once the hosted service exists — hotel as
controller, GuestGraph as processor, revDSG and GDPR, a cloud not yet chosen and named there
before the first record is processed. There is no imprint yet, and the page says why: nothing
here can be bought. It arrives the day the billing page stops saying the service is not open —
on a page of its own, because an imprint is not a privacy note.
