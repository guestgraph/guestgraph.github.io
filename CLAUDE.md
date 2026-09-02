# guestgraph.io — working conventions

The site for GuestGraph, the open-source guest identity graph: a landing page, a billing
page describing how the hosted service will charge, and a privacy note. What the files are and why
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

### The other two pages are the exception, and a narrow one

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

`privacy/index.html` is the other one, and it is the same kind of claim: what **this site**
does with a visitor, and what the hosted service will do with guest data. Both are facts
this repo owns, because nobody else can state them — and the site half is checkable, so
`verify` checks it rather than trusting the prose. The `sameOrigin` assertion records every
request the page makes and fails on any that leaves this origin: the headline says nothing
is fetched from anywhere else, and a font CDN, an analytics tag or one embedded image would
make that a lie which reads exactly like the truth.

**Two obligations fire on one event, and neither may fire alone.** The day the hosted
service opens, the billing page's *not open yet* sentence comes out **and** an imprint —
name, postal address, contact — is published. It gets a page of its own, `/imprint/`, which
is also the word a German-speaking visitor looks for; `/privacy/` says in public that it is
coming and stays named for what it carries. Until then nothing here can be bought, which is
what makes both states honest. Doing half of it leaves the site either advertising a product
with no seller, or naming a seller for a product it still calls unavailable.

**The nav and the footer are repeated in every page here, and `verify` is what keeps them in
step.** `Billing` lives in four files — the landing page, billing, privacy and the talks index
— and the footer's *Privacy* link in the same four, because there is no build step and nothing
to import. That used to be an obligation spanning two repositories that neither suite could see
across; the talks live here now, so one `npm run verify` asserts all of them in one run.
Renaming or reordering a nav item still means editing every page, but forgetting one is now
caught rather than merely warned about.

It was written as a bare path first, to keep the footer strictly to data — the strip
is set in the data face, and a bare word there looked like navigation in mono. That was the
wrong reading of the rule. The strip is not URLs: `Apache 2.0` is a licence name and
`Robert Blust` is a person's name, and both are links. It is *identifiers that happen to be
links*, and a page name belongs in that slot. What settled it is that someone looking for a
privacy statement scans for the word, not for a path — on a page that exists to be found by
exactly that person, findability beats formal tidiness. The mono rule's real target is nav
bars, buttons and prose, which is the scope `verify` encodes.

**The one fact this site restates** is the talk's length ("12 minutes", in `index.html`
and `README.md`). It is duplicated from the talks repo because a call-to-action needs
it inline. If the talk's length changes, both files here change too — it is the only
number carrying that obligation, which is what makes it worth naming.

The billing page carries no call to action and so no copy of the length: it ends on its
argument and lets the nav and the footer do the routing. The obligation above stays a
two-file obligation, which is the point.

## Constraints

- **The repository name is load-bearing.** `guestgraph.github.io` makes this the org's Pages
  site, which is what puts it on the custom domain in `CNAME`. Renaming it or removing `CNAME`
  takes the whole domain down — the talks included, since they are folders here rather than a
  repository of their own. A repository named `talks` in this org would claim
  `guestgraph.io/talks/` the moment its Pages were switched on, shadowing `talks/` here; that
  is what had to be undone to merge them. Do not recreate one.
- **Nothing opens in a new tab, and there is one exception.** A new tab takes away the
  visitor's back button, and every deck carries its own way out, so nothing needs one.
  `noNewTab` asserts it on every page.

  The exception is **a link inside a slide**. A presenter who clicks one mid-talk in the same
  tab loses the deck, and no back-button muscle memory saves that in front of a room. Note
  what the exception keys on: *where the link sits*, not where it points. This site has no
  such link today; companygraph's deck has two.
- **The deck's footer is three destinations, and two of them are brands.** The lockup goes to
  the landing page (`../../`), `Robert Blust` to `https://blust.ch/`, and *Talks* / *Vorträge*
  to the index (`../`) — the same place the transport control goes, which is the deliberate
  duplicate: the corner offers every level of "out", and it is the one corner nobody clicks by
  accident.

  `Robert Blust` is a **full lockup, not a name in text** — the `rb` plate from `blust.ch`
  inlined beside the wordmark, taking the colours `.name b` already defines: ink with the
  second word in `--c-mid`. It is a brand with a mark of its own and reads as a peer of this
  site's lockup, which is the whole point of the row. *Talks* stays `--dim`: it is the one nav
  item among two brands, and that contrast is what makes the row legible at 15px.

  That is the fact `.name .nlink{color:var(--dim)}` used to carry as its own inline comment,
  before the deck's lockup became a fence the `@robertblust/design` package owns end to end:
  `.nlink` is *Talks*, dimmed like any other nav item, and `Robert Blust` is deliberately not
  styled through it — it takes the wordmark colours instead because it is the other brand in
  the row, not a name mentioned in passing. The fence body is shared now and cannot carry a
  guestgraph-only sentence, so this paragraph is where that fact lives instead.

  The plate is inlined rather than linked, like every mark on these sites — a deck opens from
  `file://`, where a linked asset is a broken box. Its face is `Plex Mono`, the name this deck
  actually `@font-face`s; naming the upstream `IBM Plex Mono` would render it in whatever mono
  the visitor's OS happens to have.

  Three checks share the row and none covers another's link. `wayOut` takes the index link,
  `links` takes `blust.ch` (presence only — it no longer asserts anything about tabs), and
  `landing` takes the lockup, which nothing else can: a relative `../../` is invisible to
  `links`, and a dead one looks like a working deck right up until somebody clicks it.

  The same footer is on `companygraph.io`, and on `blust.ch` in two parts rather than three:
  there the brand and the person are the same name, so merging them is the only way not to
  print it twice.

  It used to be fenced by its own `deck footer · vN` marker with a `footerVersion` check —
  the same habit-with-a-tripwire the token block gets, for the same reason: no suite can see
  a sibling. Both are gone now, not retargeted: retired in a previous plan and replaced by
  the deck's chrome fences — `deck transport`, `deck lockup`, `deck fit` and `deck runtime` —
  generated like the tokens. What the old marker covered is still a contract, not a look —
  where each of the three links goes, and that none opens in a new tab — and `design:check`
  is what enforces it now, comparing each fence's bytes against the pinned release.

  `verify/design.mjs` now lives in `@robertblust/design`, alongside the nineteen shared page
  checks — edited there, released as a tag, and taken here by re-pinning that tag in
  `package.json`, exactly like the fences above. `verify/check.mjs` imports it by package
  specifier, `@robertblust/design/verify/design`; a `verify/design.mjs` created in this
  repository is never resolved by that import and would be silently ignored — the suite would
  still report green, having run the pinned release's code instead of the one just edited.
- **The `blust.ch` credit in the page footer is a lockup, not a footer link.** It leaves the
  footer's mono for the same treatment it has on every deck — the `rb` plate inlined, wordmark
  with the second word in `--c-mid`. The rest of the row stays mono because the rest of the row
  is data: a repository URL and a licence. A prose mention of the name inside a sentence stays
  a plain link — the mark belongs in the footer row, not mid-paragraph.
- **A link check that trusts the DOM inspects half the site.** The rendered DOM is only ever
  one language; German lives in `data-de` as markup that does not exist until a visitor
  switches. The privacy page's German credit kept `target='_blank'` — in single quotes, because
  it is nested inside an attribute — and survived both a source-wide strip and the check.
  `noNewTab` now parses every `[data-de]` value and reports what it finds with a `[de]` suffix;
  any new link check must do the same. A translated link and its English original are two
  separate attributes and nothing pairs them.
- **Self-contained. No external asset at all** — the fonts are served from `fonts/`, and
  nothing else is fetched off-origin. Reference them relatively (`../fonts/…` from
  `billing/`): a root-absolute path works on the domain and breaks under `file://`, which
  is the one failure mode nobody opens a browser to find. `verify` asserts the same for
  internal links.
- **The avatar is uploaded by hand** — GitHub takes no SVG and offers no API for it.
  Upload `avatar.png` (Organisation → Settings → Profile).

## Findability

`sitemap.xml` at the repository root lists every URL on this domain — the landing page,
billing, privacy, the talks index and each deck. It was an index pointing at
`sitemap-site.xml` and a second sitemap owned by the talks repository: one list per
repository, kept in step by hand. One repository serves the domain now, so there is one list
and nothing to drift.

**Adding a talk means editing `README.md` and `sitemap.xml`**, alongside the deck's own
`index.html`. The PDF is deliberately not listed: it is the same talk in a second format and
would compete with the deck for the same query.

`npm run og` regenerates the 1200×630 share cards from the pages themselves, and
`npm run og:check` says whether they still match. Keep the `og:image:width`/`height` tags
matching the file.

## The header is a contract, and its copy carries a version

The row across the top — wordmark, links, language control — is one design on three sites,
and like the tokens it is a copy, because a deck opens from `file://` and there is no
stylesheet to share. It is fenced in every page as `header contract · vN` and is
**byte-identical on all sixteen pages** in the three repositories. It is generated, like the
tokens: change it in `robertblust/design`, tag a release, then run `npm run design` here. Editing
it in this file does nothing — the next sync overwrites it.

What the contract says:

- **Order.** Ideas, Principles, Model, Example, Talks, Billing, Privacy, then the language
  control. A site skips what it does not have and reorders nothing. Read right to left, the
  switcher is at the edge and each step left is more the site's own subject.
- **One baseline.** A single line runs through the middle of every text in the row. The
  links carry equal space above and below: the hover underline hangs below the word, and
  centring the boxes instead would ride the text high — which it did, by 5px, until the
  language control sat next to it and made it visible.
- **States are different things.** Hover is an underline and nothing else. The current page
  is brighter ink and carries no line. When both drew the same line, the page you were on
  read as permanently hovered.
- **The wordmark never breaks.** It is `white-space:nowrap` and does not shrink. This one
  sits *outside* the fence, because each site's mark has its own colours; the rule is the
  outcome, not the declaration, and `mobileNav` asserts it.
- **Under 640px the links collapse behind a button.** The language control stays on the bar
  — two characters, reached for constantly by a bilingual audience, and one a visitor
  cannot find costs more than the tap it saves. The button sits to its left, so the order
  still reads. The links are *wrapped*, not duplicated: one list presented two ways, so
  there is no second copy to drift.

`navOrder`, `headerBaseline` and `mobileNav` assert all of it, per repository. What they
cannot do is see a sibling — that is the whole reason the block carries a version. Before
this was written down there were five different mobile behaviours across the family and
eight different wordings of the same CSS, and nothing failed anywhere.

## Share cards go stale silently, and nothing on the page says so

`og.png` is not a banner someone drew: `npm run og` renders it from the page itself — the
landing page and the talks index are their own cards, the deck's card is its title slide —
so a link preview shows what the visitor is about to land on. The cost of that is a copy
that has to be re-rendered whenever the page moves, and nothing about a stale card looks
wrong. Two of the three here were stale when the check was added: the landing card predated
the `Billing` nav item and the footer's `Privacy` link, the talks card predated the same
footer link, and both had been serving guestgraph.io that way through several commits.

- **`npm run og:check` compares the recipe, never the pixels.** Two machines rasterise the
  same text differently, so a card compared by its bytes reports which machine rendered it.
  The check re-derives a hash of what went *into* the card and compares it with the `og.sha`
  committed beside it. It renders nothing and needs no browser, so it runs before the browser
  install in CI — but after `npm ci`, which it did not used to need: the machinery it calls
  now ships in `@robertblust/design` and is not on disk until then. Moved back above `npm ci`,
  every push fails with `ERR_MODULE_NOT_FOUND`, and a local run cannot catch that because
  `node_modules` is already there. `mv node_modules /tmp/nm && npm run og:check` is how you
  see what CI sees.
- **One file of knobs, three thin callers, and a shared harness.** `og-recipe.mjs` holds this
  site's data — the card list, the frame, the hide rules — and binds the machinery with
  `recipeFor(REPO_ROOT)`. `export-og.mjs`, `og-check.mjs` and `verify/og-recipe.test.mjs` are
  four lines each: they hand that module to `exportCards`, `checkCards` and `checkRecipe` from
  `@robertblust/design/cards/*`. `og-recipe.mjs` stays pure and side-effect-free on import,
  which is what lets a test file load it; `export-og.mjs` is still the only one that needs
  playwright, and it passes the browser in, because the package has no dependencies at all.
- **The knobs live in `og-recipe.mjs`, and nowhere else.** Not in the exporter, and not in the
  package: a second copy of the frame or a hide rule is a knob that can be edited without the
  hash moving — the one failure this whole mechanism exists to make impossible. The recipe
  hashes the card object canonically, so a knob added later enters the hash by existing rather
  than by someone remembering to list it. The same canonical hash is why removing a key moves
  every stamp on the site while the rendered PNGs stay byte-identical, which is exactly what
  dropping the unread `from: "file"` key did.
- **`REPO_ROOT` is derived here and passed in.** A module that works out where it is from its
  own location points inside `node_modules` once it ships as a dependency, so the package
  takes `root` on every call and never guesses.
- **`npm run test:og` is the check's own suite**, and the assertions are the package's
  (`@robertblust/design/cards/recipe-tests`), driven against this site's recipe. It drives
  both directions — a moved page must come out stale, and a card reported current after the
  page changed must be impossible — against a temporary tree rather than against this
  repository, so it still means something after these pages change.
- **The recipe is the page plus every local file the page renders plus the exporter's own
  frame and hide rules.** Fonts count, and here there is one `fonts/` at the root shared by
  all three pages — so a font swap marks **all three** cards stale in one go. On blust.ch,
  where each deck carries its own fonts, the same edit moves only the index cards. Nothing
  about the check changed; the dependency graph is simply flatter here.
- **`<a href>` is excluded, and it is the one place the walk is not a plain attribute
  sweep.** The talks index links two multi-megabyte PDFs of the same talk. A link target is
  not something the page renders, so hashing it would report the talks card stale every
  time `npm run pdf` ran, over a page that had not moved a pixel — noise that trains you
  to stop reading the check.
- **The three cards do not all hide the same things.** The talks cards drop the chrome — a
  card with a progress bar and a play button on it advertises controls that do nothing
  inside a PNG. The landing card keeps its header and drops `.figure`, which is why its
  right half is empty. The rules are hashed per card, so changing one marks only its own
  card stale.
- **Both files are committed together.** `og.png` and `og.sha`, in the same commit as the
  page that moved. The stamp is written after the screenshot, so an exporter that dies half
  way leaves the card reported stale rather than reported current.
- **It over-reports and never under-reports, deliberately.** Editing a comment in a page
  marks its card stale even though the render would be identical. Clearing that is
  `npm run og` and a commit — cheap, and the opposite error is a card nobody notices for
  weeks.
- **The setup is shared with `blust.ch` and `companygraph.io`,** which render their own cards
  the same way — and now literally share it. The exporter, the check and the test assertions
  are one copy in `@robertblust/design`, so fixing a rule here fixes it there, with `npm ci`
  rather than with a habit. What still differs per site is only the card list, the frame and
  the hide rules, which is the part that should differ. The package is the union of the three
  copies it replaced, never their intersection: `deviceScaleFactor` was only ever ours, and
  consolidating onto what all three agreed on would have deleted it silently.

## The design system, and why it is a copy

Type and colour are shared across `blust.ch`, `guestgraph.io` and `companygraph.io`.
They share no stylesheet and cannot: a deck has to open from `file://`, so there is
nothing to import. Every page therefore carries its own copy of the token block, fenced
by `design tokens · vN` markers.

**The copies have a source now.** They are generated from `@robertblust/design`, which this
repository pins by tag, and `npm run design` writes them. What that changes about editing them is
in *Changing a token* below, and it is the opposite of what this file said for most of its life.

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

### Changing a token, or anything else the package owns

**Do not edit a fenced block in place. The next `npm run design` overwrites it and nothing warns
you.** This section used to say "edit the block, run `npm run verify`, bump `vN` in all three
repositories". That was true while the blocks were maintained by hand. It is now the one
instruction in this file that silently does nothing.

Nine blocks are generated here, and the fence markers name them: `design tokens`,
`header contract`, `language`, `prose reset`, `prose footer`, `deck transport`, `deck lockup`,
`deck fit` and `deck runtime`. Everything between and including a pair of markers belongs to
the package. A tenth, `stage contract`, exists in the package and this site does not take it —
it has no graph to draw yet. It arrives the day it grows one, which is the point of the stage
having a source by then.

```bash
npm run design         # rewrite every fenced block from the pinned release
npm run design:check   # report drift without writing — runs in CI, before the browser suite
```

To change one of them:

1. Edit it in `robertblust/design` under `blocks/`, and bump both its entry in `versions.json` and
   the version typed into the block's own first line. A test there fails if the two disagree — it
   exists because nothing else reconciled them.
2. Tag a release. The sites pin an exact **tag**, never a commit SHA: Dependabot's version detection
   rejects a SHA, and this site would then never be told a release happened.
3. Here: take the Dependabot pull request, run `npm run design && npm run og`, commit what changed.
   The design package has its own Dependabot group so a design bump never arrives beside a
   Playwright one — it is the pull request that has to be read rather than merged on sight.

`design:check` runs in CI, so a page that drifts from the pinned release goes red without anyone
remembering to look. That is the guarantee the old habit-with-a-tripwire never was.

**Two escape hatches that are decisions, not build fixes.** Removing a fence's name from a page's
`fences` array in `PAGES`, or a group from `design.config.json`, each clears a red `design:check`
with a one-line diff. Either one means this site has decided to own that block and diverge. That is
a real choice; make it deliberately, in a commit that says so.

**Not everything is generated.** The `<head>` contract is a copy with no fence at all. The deck
footer used to belong here too, hand-maintained — see above, where its old version marker was
replaced rather than kept.

This repository had no test suite at all before. `npm install && npm run verify` now runs
the same assertions the other two do, against a served copy on `localhost:8000`.

## Process

- Commits happen when the user asks; suggest a message, don't auto-commit.
- **Merge a pull request with a merge commit — `gh pr merge --merge`, never `--squash`.**
  Squashing is not a history preference here. GitHub *re-authors* a squash commit to the
  account that pressed the button, so a commit made locally under the wrong `user.email`
  lands on the default branch looking correct. That is not hypothetical: it was found in
  `robertblust.github.io`, where the local commit was authored `rob@likemagic.tech` and the
  commit that reached `main` read `robert.blust@flatland.ch`, with nothing anywhere saying
  so. A merge commit preserves the author it was given, which is the point — a wrong
  identity surfaces instead of being laundered.
- **The author is `robert.blust@flatland.ch`, and nothing on GitHub enforces it.** The
  ruleset rule that would — `commit_author_email_pattern`, a metadata restriction — is
  rejected on this plan. Tested, not assumed: an otherwise identical ruleset carrying a
  `deletion` rule was accepted in the same breath. So the identity comes from
  `~/.gitconfig`, where three `includeIf` blocks key it to `~/git/robertblust/`,
  `~/git/guestgraph/` and `~/git/companygraph/` and point at `~/.gitconfig-flatland`. The
  global default stays `rob@likemagic.tech`, which is right for `~/git/likemagic-tech` and
  `~/git/3ap-ag`. A clone made outside those three directories gets the global default and
  no warning, so check `git config user.email` before the first commit in a fresh clone.
- Never mention closed-source predecessor projects — here, in docs, or in commits.

# The talks

The decks live at `talks/`, served from this repository at guestgraph.io/talks/.

## Building and checking the decks

```bash
cd intro && npm install && npx playwright install chromium
python3 -m http.server 8000        # → localhost:8000/intro/  (audio autoplay is
                                   #   blocked on file:// in some browsers)
node export-pdf.mjs                # PDF fallback, after slide edits
```

**Verify by rendering, never by reading the diff.** Three separate bugs in one session
were invisible in the source and obvious in a screenshot: notes leaking onto slides,
comment text rendering as content, an English title in the German voice. Take a
screenshot, or query the DOM for what you claim to have fixed.

## Deck conventions

One talk per directory, one `index.html` per talk, no external assets. Decks must work
from `file://` and a plain local server, not only the live domain.

- **Bilingual by attribute.** German is the element's content, English is `data-en`.
  Speaker notes are `data-notes` / `data-notes-en` on the `<section>`.
- **Slide numbers are zero-based everywhere the viewer can see them** — the kicker on
  the slide, the counter, and the audio filename all say the same number.
- **`<em class='cue'>` is a stage direction**, never spoken. `<em>` alone is emphasis.
  Keep them distinct: the directions outnumber the emphases roughly ten to one, so
  overloading one tag makes both meaningless.

## Notes live inside HTML attributes — three ways that bites

Speaker notes are attribute *values*, so anything that ends an attribute ends the note,
and the rest of the tag is swallowed with it. Each of these shipped at least once:

- **Nested markup uses single quotes** — `<em class='cue'>`, never `class="cue"`.
- **German quotes must be typographic** — `„…“` with U+201E/U+201C. One straight ASCII
  `"` inside a note terminates the attribute and dumps the note onto the slide.
- **Never put an HTML comment inside a start tag.** The parser consumes it as
  attributes and everything after it is lost — `data-notes` included. Comments go
  *above* the tag.

## Narration (`intro/tts/`)

`generate.py` reads the deck directly, so the notes are the single source for what is
said. Clips cache on a content hash: editing one note regenerates one clip.

```bash
./generate.py --dry-run            # what would be billed, and for which slides
./generate.py [--only 04]
```

The key is not in a tool shell's environment — see **Secrets** below for why, and for the
one line that fetches it.

- **Measurements before mechanisms.** `voice_settings.speed` is accepted by the API and
  ignored by `eleven_v3`; audio tags and paragraph breaks move the speaking rate a few
  percent. The numbers are in the generator's docstring. Real pauses would mean silence
  between separate clips, owned by the player. Don't re-litigate this by feel.
- **Audio is committed, not LFS.** GitHub Pages does not resolve LFS objects — it would
  serve the pointer text. `.gitattributes` records why.
- **Two durations, both true.** ~6 min narrated, 12 min live. The live figure is the one
  quoted publicly; presenting involves pauses a recording does not take.

### The deck has no package.json of its own

`npm run pdf` is a **root** script and `pdf-lib` is a **root** devDependency. Until
2026-08-26 both lived in `talks/intro/package.json`, which is why that file and its lockfile
existed at all — the root had neither, so building the deck's PDFs meant
`cd talks/intro && npm install` first.

That second manifest cost more than the `cd`. CI only ever runs `npm ci` at the root, so
nothing under `talks/intro` was ever installed or exercised by a check, and a Dependabot bump
there arrived green having proved nothing about the directory it changed. `blust.ch` has had
the single-manifest shape all along; this is the two sibling sites catching up.

`export-pdf.mjs` resolves its own paths from `import.meta.url`, so it does not care where it
is invoked from — the deck still opens from `file://`, and moving the script changed nothing
about the file it renders. Verified by rebuilding both PDFs from the root: same page counts,
and the only bytes that moved were pdf-lib's `CreationDate` and `ModDate`.

## Secrets

`ELEVENLABS_API_KEY` is the only credential these decks need, and it lives in `~/.zshrc`.
Only an **interactive** zsh sources that file, so a tool shell starts without it — and so
does a login shell, which is the surprising half. Pull it in for the one command that
needs it, and let it die with that command:

```bash
cd intro/tts
export ELEVENLABS_API_KEY="$(zsh -ic 'printf %s "$ELEVENLABS_API_KEY"' 2>/dev/null)"
./generate.py --only 10
```

- **Never print an environment variable's value.** Not to check it, not in a debug line,
  not buried in a larger `echo`. A transcript outlives the session, and a key that reaches
  one has to be rotated.
- **`${VAR:-UNSET}` prints the value whenever the variable is set.** This is exactly how
  the key leaked once: it reads like a set/unset probe and does the opposite. Probe with
  `${VAR:+SET}` alone, or `[ -n "$VAR" ] && echo set || echo unset` — forms that can only
  ever emit a fixed string.
- **Never `eval` an extraction from the shell profile.** A bare `export` with no match
  prints the whole environment.

## The parsing pitfall behind two of the above

A slide "block" runs from one `<section class="slide` to the next, so a comment written
*above* a slide lands inside the **previous** slide's block. A comment that merely
mentioned `data-say-title="no"` matched a substring test and silently stripped the
neighbouring slide's title. `generate.py` strips comments before parsing; do not
reintroduce substring tests over whole blocks. Explaining a flag must never set it.

**The same literal string decides what counts as a slide at all.** `slides()` splits on
`<section class="slide` — the exact characters — so anything inserted between the tag name
and `class` makes a slide disappear from the generator:

```html
<section data-say-title="no" class="slide title-slide">   <!-- invisible to the generator -->
<section class="slide title-slide" data-say-title="no">   <!-- correct -->
```

Nothing errors. The deck renders, the notes panel works, and the only symptom is a clip
that is never generated — indistinguishable from one that was already up to date.
`--dry-run` catches it: the slide count drops. Check it against the deck before reading a
quiet run as a cached one.

## The head is a contract, and `seo` is what holds it

Canonical, description, the `og:` block, `twitter:card` and a JSON-LD graph, on every page.
`verify`'s `seo` check asserts the lot. Three of its assertions exist because the thing they
catch had already shipped green:

- **The canonical is compared against the page's own URL**, not merely against `og:url`.
  Agreeing with `og:url` proves two tags say the same thing, and both can say the same wrong
  thing — a canonical pointing at another page removes this one from the index and hands its
  signals over, silently, which is worse than any tag being absent.
- **Every page points at its own share card.** `card` only asks whether the image resolves at
  its declared size, and a borrowed card does. `/billing/` and `/privacy/` both advertised the landing
  page's card, so a paste of either URL previewed the landing hero under the pasted title.
- **Structured data has to resolve, not merely parse.** Every `@id` a page references must be
  defined on that page — Google reads `@graph` within one document — and every same-origin URL
  in the graph is fetched. `/billing/` and `/privacy/` each declared `isPartOf` a `#website` node neither carried.

Two traps worth knowing before editing that check:

- **`page.evaluate` runs in the browser, where `SITE` does not exist**, and it takes exactly
  one argument. Both mistakes were made writing it. Pass `{ url, site }` as an object.
- **Deriving the public origin from `BASE` makes the check vacuous off the default port.** It
  used to rewrite the literal `http://localhost:8000`; run with `127.0.0.1` and the URL filter
  matched nothing, so every graph URL was skipped and the check still printed ✓. Use the `SITE`
  constant.

`PAGES` is the single list: the sitemap's expected URLs derive from it, and the suite fails if
any page lacks `seo: true` — the runner skips a check whose key is undefined, so deleting that
one line would otherwise turn the contract off in silence. The suite also asserts that whatever
is on `BASE` is actually this site: a sibling repository left serving on `:8000` produced a full
run of failures belonging to a site nobody was testing.

**`/favicon.svg` gets its own check, by fetch, not by rendering a page.** It's the one place the
mark lives outside a page, so no DOM check reaches it — it can't `@font-face` a face and
inherits none, so any face it names has to already be a platform face in `SYSTEM_FACES` or a
generic keyword. This mark has no text in it at all, so right now it names no `font-family` and
the check passes for that reason — HTTP 200 and nothing to reject, not a face checked against
the list and cleared. Put lettering in the mark later and this starts doing its real job; until
then a green result here is the weaker of the two things it can mean.

**`og:locale` is Open Graph only. No search engine reads it.** It is `en_US`, with
`og:locale:alternate` `de_CH`, and the prose is American to match. Google reads `<html lang>`,
which `sourceLang` fetches cold on every page — `lang` alone cannot, because it reads
`documentElement.lang` after `applyLang()` has already corrected it.

**No `hreflang`.** It names another address for the other language and there is none: one URL
per page, German swapped in at runtime from `data-de`. It becomes correct the day `/de/` URLs
ship, and not before.

**The head contract is a third copy**, shared with `blust.ch` and `companygraph.io` and
carrying no `· vN` tripwire, unlike the token block and the deck's other generated fences.
Port changes by hand to all three.

**`robots.txt` is checked too**: every `Sitemap:` line it names is fetched. It named three,
and `sitemap-site.xml` and `talks/sitemap.xml` had been 404 in production since the talks
moved out of `guestgraph/talks` and into this repository.

## Ownership (prevents drift)

| Fact | Owner |
|---|---|
| What the talk says, and the narration script | the deck's `index.html` |
| Talk list, length, controls | `README.md` |
| Narration mechanics and measurements | `intro/tts/generate.py` docstring |
| Matching behaviour, thresholds, roadmap | the **engine** repo — link, never restate |
| The talk URLs a crawler should find | `sitemap.xml` here — guestgraph.io only indexes it |

Before writing a number or a claim about the product into a slide, ask where it is
owned. A deck that restates the roadmap is a second copy that no CI can keep honest.

## Slides are a canvas, not a page

A deck lays its slides out once at a fixed height of **900**, and the whole plane is scaled
to the screen — the way a presentation tool does it, not the way a web page does. Two
things that used to be worth re-testing are now guarantees: **a slide can never scroll**,
because the canvas always fits, and **the composition is identical on every screen**,
because there is only one composition.

- **Only the height is fixed.** The width follows the screen's aspect, so the canvas covers
  the viewport exactly and there are never letterbox bars. A fixed 16:9 canvas put 96px of
  black top and bottom on a 4:3 screen, which is the wrong trade on the *minimum* supported
  size.
- **Every length is in `cqmin`, never `vmin`.** `cqmin` is 1% of the canvas's shorter side,
  and since the height is pinned at 900 and any landscape screen is wider than it is tall,
  that is a constant 9px. Type keeps its size and a wider screen buys real width. `vmin`
  did the opposite: it derived width from *viewport height*, so content width could never
  track the frame — at 2560×1080 the slides used 36–51% of the width and the rest was
  margin. That was the bug, and it is invisible unless you measure it.
- **Media needs a ceiling.** `.slide svg, .slide img{max-height:60cqmin}`. Anything sized as
  a fraction of width grows taller as the canvas widens: a square 300×300 diagram in a
  half-width column reached 780px inside a 900px frame on an ultrawide screen and pushed
  the slide into overflow. The cap sits well above any inline icon, so it only bites on a
  figure that was about to break the guarantee.
- **Below the breakpoint the canvas is switched off** — `transform:none`, `container-type:
  normal` — and the deck reflows into the scrolling reading view it always had. That is
  what "minimum supported width 1024" means in practice: canvas above, reflow below.

The scale is driven by one `fit()` function at the end of each deck. Both exporters ride on
it unchanged: the share card renders at 1200×675 and the PDF at 1280×720, and in each case
the canvas fills the frame exactly with no bars.

