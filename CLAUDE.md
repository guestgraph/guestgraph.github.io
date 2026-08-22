# guestgraph.io — working conventions

The landing page for GuestGraph, the open-source guest identity graph. What the files
are and why the mark looks the way it does is in `README.md`; this file is about the
constraints that are easy to break.

## Build & verify

No build. `python3 -m http.server 8000` and open it. Check both themes and at least a
phone width — **verify by rendering, not by reading the diff.**

GitHub Pages rebuilds a minute or two after a push, so a change that looks missing on
guestgraph.io is usually just not deployed yet.

## One screen, one job

The page says what GuestGraph is and sends the visitor to the talk or the code. That is
the whole scope. It deliberately makes **no claim about matching behaviour, roadmap, or
status** — those are owned by the engine repository and go stale here within a slice.

This is not hypothetical: the org profile at `guestgraph/.github` once advertised "Core
in development" while two slices had shipped, because it restated a roadmap that lives
elsewhere. No CI in one repository can catch drift in another.

**The one fact this page restates** is the talk's length ("12 minutes", in `index.html`
and `README.md`). It is duplicated from the talks repo because a call-to-action needs
it inline. If the talk's length changes, both files here change too — it is the only
number carrying that obligation, which is what makes it worth naming.

## Constraints

- **The repository name is load-bearing.** `guestgraph.github.io` makes this the org's
  Pages site, so the custom domain in `CNAME` cascades to every other Pages site in the
  org — `guestgraph/talks` serves at guestgraph.io/talks/ with no configuration of its
  own. Renaming this repo or removing `CNAME` silently breaks the talks URL.
- **Outbound links open in a new tab** — `target="_blank" rel="noopener"`. A visitor
  leaving for a deck or the repo should not lose the page. **The nav's `Talks` link is
  the exception**: `guestgraph.io/talks/` is an index — a short list page you read and
  leave — not a twelve-minute deck, so it stays in the tab. The rule is about what the
  visitor has not finished with, and nobody is mid-way through a list of two links. The
  `Watch Intro Talk` button still opens a new tab, because that one is a deck.
- **Self-contained apart from the Google Fonts stylesheet.** No other external asset.
- **The avatar is uploaded by hand** — GitHub takes no SVG and offers no API for it.
  Upload `avatar.png` (Organisation → Settings → Profile).

## Findability

The domain is served by two repositories, so the crawl map is split the same way the
content is. `sitemap.xml` here is a **sitemap index** and lists no URLs of its own: it
points at `sitemap-site.xml` (this repo's one page) and at `/talks/sitemap.xml`, which
`guestgraph/talks` owns. A flat sitemap listing the talks would be a second copy of the
talk list — the failure this repo's rules exist to prevent. `robots.txt` names the index
and both children.

`og.png` is the landing page itself, rendered at 1200×630 and committed as a PNG. It is
made by hand — like `avatar.png` — because a generator here would mean a build step, and
this repo has none. To remake it after a visual change, render `index.html` at 1200×675
and take the middle 630 rows; `intro/export-og.mjs` in the talks repo does exactly that
and is the reference. Its declared size in the `og:image:width`/`height` tags must keep
matching the file.

**Render it with `prefers-reduced-motion` emulated** (Playwright: `reducedMotion:
"reduce"`). The figure animates in over a chain that finishes at 2.15s — chips, then
wires, then the profile box last of all — so a render that merely waits "long enough"
catches the diagram mid-draw. It fails in the worst way available: the wires arrive and
the box they converge on does not, so the card ships showing five records connected to
nothing, and it looks deliberate. The page's own `@media (prefers-reduced-motion)` block
already defines the settled state; emulating it renders that state exactly instead of
racing a timer.

The page is English only, so there is no hreflang here. The decks are bilingual on one
URL and only one language is indexable; that is a known, accepted limit, recorded in the
talks repo.

## Process

- Commits happen when the user asks; suggest a message, don't auto-commit.
- Never mention closed-source predecessor projects — here, in docs, or in commits.
