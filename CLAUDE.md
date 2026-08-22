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
export ELEVENLABS_API_KEY=...      # never `eval` an extraction from the shell profile —
./generate.py --dry-run            # a bare `export` with no match prints the environment
./generate.py [--only 04]
```

- **Measurements before mechanisms.** `voice_settings.speed` is accepted by the API and
  ignored by `eleven_v3`; audio tags and paragraph breaks move the speaking rate a few
  percent. The numbers are in the generator's docstring. Real pauses would mean silence
  between separate clips, owned by the player. Don't re-litigate this by feel.
- **Audio is committed, not LFS.** GitHub Pages does not resolve LFS objects — it would
  serve the pointer text. `.gitattributes` records why.
- **Two durations, both true.** ~6 min narrated, 12 min live. The live figure is the one
  quoted publicly; presenting involves pauses a recording does not take.

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

Before writing a number or a claim about the product into a slide, ask where it is
owned. A deck that restates the roadmap is a second copy that no CI can keep honest.

## Process

- Commits happen when the user asks; suggest a message, don't auto-commit.
- Never mention closed-source predecessor projects — here, in docs, or in commits.
