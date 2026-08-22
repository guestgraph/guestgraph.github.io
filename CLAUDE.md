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
  leaving for the talk or the repo should not lose the page.
- **Self-contained apart from the Google Fonts stylesheet.** No other external asset.
- **The avatar is uploaded by hand** — GitHub takes no SVG and offers no API for it.
  Upload `avatar.png` (Organisation → Settings → Profile).

## Process

- Commits happen when Rob asks; suggest a message, don't auto-commit.
- Never mention closed-source predecessor projects — here, in docs, or in commits.
