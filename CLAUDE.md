# GuestGraph talks — working conventions

Self-contained HTML decks about GuestGraph, the open-source guest identity graph.
Structure, controls, and the talk list live in `README.md` — this file is about how to
work on them without breaking things that break silently.

The engine lives in a separate repository. Product facts belong there (see
**Ownership** below); a deck that restates them drifts.

## Build & verify

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

## The talks index is a page; the decks are decks

`index.html` at the repository root is not a deck and does not behave like one. It shares
guestgraph.io's shell, header bar and footer verbatim — the domain is served by two
repositories, and a visitor crossing between them should not meet a seam. Changing that
chrome means changing it in both repositories; there is no shared stylesheet and cannot
be one, because a deck has to open from `file://`.

- **A deck opens in a new tab, the index does not.** Someone who opens a twelve-minute
  talk has not finished with the page that sent them. Nobody is mid-way through a list of
  one link, so `guestgraph.io/talks/` — from the site's nav and from anywhere else — stays
  in the tab. The rule follows what the destination is, not which domain it is on.
- **The language control sits in the header bar here, not floating over the page.** The
  deck keeps its fixed `DE · EN` indicator and its `L Sprache` hint because a deck is
  presented and the hint tells a presenter which key to press. This page is clicked, so
  the control lives in the bar with the nav and the hint is gone. The `L` key still works;
  it is simply no longer advertised.

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

## Findability

`sitemap.xml` lists the talk URLs, because this repository owns the talks. The root
`guestgraph.io/sitemap.xml` is an index that points at it and never names a talk itself,
so there is no second copy to drift. **Adding a talk means editing `README.md` and
`sitemap.xml`** — a second obligation alongside the deck's own `index.html`. The PDF is
deliberately not listed: it is the same talk in a second format, and would compete with
the deck for the same query.

`npm run og` regenerates the 1200×630 share cards from the pages themselves — the talks
index card is that page, a deck's card is its title slide. Re-run it after a visual change
to either, and keep the `og:image:width`/`height` tags matching the file.

- **`lang` describes the source, not the default.** These files are German markup with
  English in `data-en`, so the static attribute is `lang="de"`; `applyLang()` sets it to
  `en` on load. A crawler that runs JS sees English under `en`, one that does not sees
  German under `de`. Before this, German source claimed to be English and neither was true.
- **The head is English while the body is German.** Deliberate: the head describes the
  page as delivered, and the deck opens in English. `applyLang()` swaps the title and the
  meta description too, so both stay true when a visitor picks German.
- **One URL, one indexable language.** A scraper never runs `applyLang()`, so the OG tags
  and the cards are English, and only English gets indexed. Fixing that needs per-language
  URLs with hreflang, which is a different shape of deck — a known limit, not an oversight.

## Process

- Commits happen when the user asks; suggest a message, don't auto-commit.
- Never mention closed-source predecessor projects — here, in docs, or in commits.
