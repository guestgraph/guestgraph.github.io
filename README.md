# GuestGraph — Talks

Talks on **GuestGraph**, the open-source guest identity graph for hospitality.

**Live:** https://guestgraph.github.io/talks/

`favicon.svg` is a copy of the one on [guestgraph.io](https://guestgraph.io) rather than a link
to it. The decks are self-contained by design — they have to work from `file://` and a plain local
server, not only from the live domain.

Each talk is a self-contained HTML deck (dark theme, bilingual DE/EN, inline SVG, no external
assets) with a PDF fallback. Same approach as [mental-model](https://github.com/robertblust/mental-model)
and [essential-complexity](https://github.com/robertblust/essential-complexity).

| | Talk | Length | Languages |
|---|---|---|---|
| 01 | [**GuestGraph — an introduction**](intro/) · [live](https://guestgraph.io/talks/intro/) | 12 min | DE · EN |

### Controls

A transport bar along the bottom edge drives the deck: back to start, previous, play/pause,
next, fullscreen, then language (DE/EN) and speaker notes. The track number sits in the bar's
display window; the hairline under it is the position of the clip that is speaking.

On touch, swipe left or right to turn the page. Arrow, space, page and Home/End keys still work
so a presenter remote can drive the deck, but they are not shown anywhere — the buttons are the
interface.

## Working on a talk

```bash
cd intro
npm install
npx playwright install chromium
npm run pdf        # → guestgraph.pdf, the 16:9 fallback (German)
python3 -m http.server 8000    # → http://localhost:8000
```

## What these claim

The talks state the project's status honestly — what is built, what is not, and that there are no
production users yet. Every substantive claim about how matching decides is backed by
[`docs/matching.md`](https://github.com/guestgraph/engine/blob/main/docs/matching.md) in the
core repository, which is the single place those rules are defined. Per that repo's documentation
rules, a talk **links to** the values rather than restating them, so a matcher change cannot leave
a slide quietly wrong.
