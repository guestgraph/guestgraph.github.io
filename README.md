# guestgraph.io

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

## What it claims

Every claim on the page is backed by the core repository, and the "where it stands" section
deliberately lists what is *not* built — connectors, agent steward, ML matching, production use.
Matching behaviour links to
[`docs/matching.md`](https://github.com/guestgraph/guestgraph/blob/main/docs/matching.md) rather
than restating any of its values, per that repo's documentation rules.
