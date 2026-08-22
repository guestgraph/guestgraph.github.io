# GuestGraph — Landing Page

The landing page for **GuestGraph** — the open-source guest identity graph for hospitality.

**Live:** https://guestgraph.io

This is the organisation's GitHub Pages site, which is why the repository is named
`guestgraph.github.io`. That name matters: setting the custom domain here makes every other
Pages site in the org inherit it, so [`guestgraph/talks`](https://github.com/guestgraph/talks)
serves at **guestgraph.io/talks/** with no configuration of its own.

## Contents

- `index.html` — the page. Self-contained apart from the Google Fonts stylesheet.
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
python3 -m http.server 8000    # → http://localhost:8000
```

## What it says, and what it deliberately does not

One screen, one job: say what GuestGraph is and send the visitor to the talk or the code. The
page carries the title, the hook, and two links — nothing else. Everything a visitor would ask
next is answered in the [12-minute talk](https://guestgraph.io/talks/intro/), which is a better
medium for it than a scrolling page of claims.

That is also why the page makes no claim about matching behaviour, roadmap, or status. Those
live where they are maintained — in the core repository and in
[`docs/matching.md`](https://github.com/guestgraph/guestgraph/blob/main/docs/matching.md) — so a
change there cannot leave this page quietly wrong.
