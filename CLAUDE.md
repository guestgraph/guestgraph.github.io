# guestgraph.io — working conventions

The site for GuestGraph, the open-source guest identity graph: a landing page, and a
billing page describing how the hosted service will charge. What the files are and why
the mark looks the way it does is in `README.md`; this file is about the
constraints that are easy to break.

## Build & verify

No build. `python3 -m http.server 8000` and open it. Check both themes and at least a
phone width — **verify by rendering, not by reading the diff.**

GitHub Pages rebuilds a minute or two after a push, so a change that looks missing on
guestgraph.io is usually just not deployed yet.

## One screen, one job

The landing page says what GuestGraph is and sends the visitor to the talk or the code.
That is the whole scope of `index.html`. It deliberately makes **no claim about matching
behaviour, roadmap, or status** — those are owned by the engine repository and go stale
here within a slice.

This is not hypothetical: the org profile at `guestgraph/.github` once advertised "Core
in development" while two slices had shipped, because it restated a roadmap that lives
elsewhere. No CI in one repository can catch drift in another.

### The billing page is the exception, and a narrow one

`billing/index.html` is the second page and the only place this site makes a claim **of its
own** rather than restating one. It describes how the hosted service will bill — one meter,
and it is arrivals — and carries **no prices and no bands**. The model is the durable part;
the numbers are the part that goes stale, and there is no other repository to own them.

The service does not exist yet, which is what makes one sentence on that page load-bearing:
*the hosted service is not open yet*. It is the difference between publishing an intention
and advertising a product, and `verify` asserts the page still contains it. It comes out the
day the service opens — not before, and not as tidying.

This narrows the rule above; it does not repeal it. Product status, matching behaviour and
roadmap still belong to the engine repository. What this repo now owns is the commercial
model, because nothing else does.

**The one fact this site restates** is the talk's length ("12 minutes", in `index.html`
and `README.md`). It is duplicated from the talks repo because a call-to-action needs
it inline. If the talk's length changes, both files here change too — it is the only
number carrying that obligation, which is what makes it worth naming.

The billing page carries no call to action and so no copy of the length: it ends on its
argument and lets the nav and the footer do the routing. The obligation above stays a
two-file obligation, which is the point.

## Constraints

- **The repository name is load-bearing.** `guestgraph.github.io` makes this the org's
  Pages site, so the custom domain in `CNAME` cascades to every other Pages site in the
  org — `guestgraph/talks` serves at guestgraph.io/talks/ with no configuration of its
  own. Renaming this repo or removing `CNAME` silently breaks the talks URL.
- **Outbound links open in a new tab** — `target="_blank" rel="noopener"` — and that now
  means GitHub only. Both links into `guestgraph.io/talks/`, the nav item and the
  `Watch intro talk` button, stay in the tab: the deck they lead to carries its own *All
  talks* control in the transport bar, so it can no longer strand anyone. That control
  lives in the talks repository; `verify` there asserts it, and `verify` here asserts these
  links stay in the tab. The two halves are a pair — breaking either one alone is the trap.

- **Self-contained. No external asset at all** — the fonts are served from `fonts/`, and
  nothing else is fetched off-origin. Reference them relatively (`../fonts/…` from
  `billing/`): a root-absolute path works on the domain and breaks under `file://`, which
  is the one failure mode nobody opens a browser to find. `verify` asserts the same for
  internal links.
- **The avatar is uploaded by hand** — GitHub takes no SVG and offers no API for it.
  Upload `avatar.png` (Organisation → Settings → Profile).

## Findability

The domain is served by two repositories, so the crawl map is split the same way the
content is. `sitemap.xml` here is a **sitemap index** and lists no URLs of its own: it
points at `sitemap-site.xml` (this repo's two pages — the landing page and `/billing/`)
and at `/talks/sitemap.xml`, which `guestgraph/talks` owns. A flat sitemap listing the talks would be a second copy of the
talk list — the failure this repo's rules exist to prevent. `robots.txt` names the index
and both children.

`og.png` is the landing page itself, rendered at 1200×630 and committed as a PNG. It is
made by hand — like `avatar.png` — because a generator here would mean a build step, and
this repo has none. To remake it after a visual change, render `index.html` at 1200×675
and take the middle 630 rows; `intro/export-og.mjs` in the talks repo does exactly that
and is the reference. Its declared size in the `og:image:width`/`height` tags must keep
matching the file — on **both** pages, because `/billing/` points its card at the same
file rather than carrying one of its own. A second card would be a second hand-render to
keep in step, and the landing card is the right thing to show for a link to either page.

**Hide `.figure` when rendering the card.** The record band runs the full page width and
cannot fit beside the headline in a 1.9:1 crop; included, the frame cuts the wires off
above the profile they converge on, so the card shows five records connected to nothing —
which says the opposite of what the page says. The card carries the lockup, the headline
and the call to action, and that is a complete thought on its own.

**Render it with `prefers-reduced-motion` emulated** (Playwright: `reducedMotion:
"reduce"`). The figure animates in over a chain that finishes at 2.15s — chips, then
wires, then the profile box last of all — so a render that merely waits "long enough"
catches the diagram mid-draw. It fails in the worst way available: the wires arrive and
the box they converge on does not, so the card ships showing five records connected to
nothing, and it looks deliberate. The page's own `@media (prefers-reduced-motion)` block
already defines the settled state; emulating it renders that state exactly instead of
racing a timer.

Both pages are one URL carrying two languages, with English in the markup and German in
`data-de`, so English is what a crawler reads and what the og tags promise. There is no
hreflang here, because there is no second URL to point one at — only one language of any
page on this domain is indexable. The decks work the same way; it is a known, accepted
limit, recorded in the talks repo.

## The design system, and why it is a copy

Type and colour are shared across `blust.ch`, `guestgraph.io` and the talks repository.
They share no stylesheet and cannot: a deck has to open from `file://`, so there is
nothing to import. Every page therefore carries its own copy of the token block, fenced
by `design tokens · vN` markers.

- **Brightness is confidence, and each stop has exactly one job.** `--c-weak` a candidate
  considered and not accepted; `--c-mid` anything interactive — links, controls, the brand
  accent; `--c-firm` the resolved thing — the thesis, the current page; `--c-flag` a
  reversal, at most once per page and never decoration. Before adding a colour, ask which
  of the four jobs it is doing. If the answer is "none", it does not belong.
- **Mono means data.** Record values, lengths, language pairs, URLs, code. Not navigation,
  not buttons, not prose. It was on all of those before, which is why it had stopped
  meaning anything. `verify` fails the build if mono appears outside data.
- **Fonts are self-hosted, same origin.** Not a preference: a font CDN sends every
  visitor's IP to a third party, and a bare family name with no `@font-face` — which is
  what these sites shipped for months — silently renders in system-ui instead. Both
  failures are invisible in the source. `verify` measures the rendered text and fails if a
  declared family matches the fallback width.
- **One display face across both sites: Bricolage Grotesque.** Its weight axis carries each
  page's argument — light where the sentence describes the solved or unresolved half, heavy
  where it lands. blust.ch sets *Building fast is solved* against *Deciding well is not*;
  guestgraph.io sets *Five strangers* against *One guest*.

  It replaced Redaction, whose seven grades of decay were used to make the strangers arrive
  degraded and the guest resolve clean. That is a better idea on paper than in a browser: it
  was read as a page that had failed to load, twice, by the person who commissioned it — and
  on a site whose one genuine bug was a font that never loaded, that is the worst sentence
  type can utter. Weight says the same thing and never needs explaining. Do not reintroduce a
  degraded display face to make this point.

### Changing a token

Edit the block, run `npm run verify`, and it will name any page in **this** repository that
is behind. Nothing can tell you that a sibling repository is behind — that is why the block
carries a version. Bumping `vN` means bumping it in all three repositories and running all
three suites. The check is a habit with a tripwire, not a guarantee.

This repository had no test suite at all before. `npm install && npm run verify` now runs
the same assertions the other two do, against a served copy on `localhost:8000`.

## Process

- Commits happen when the user asks; suggest a message, don't auto-commit.
- Never mention closed-source predecessor projects — here, in docs, or in commits.
