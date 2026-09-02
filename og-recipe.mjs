// What goes into each 1200×630 share card, and how to tell whether a card still shows it.
//
// `og.png` is not a banner someone drew: it is the page itself, rendered — the landing page
// and the talks index are their own cards, the deck's card is its title slide. The cost of
// that is a copy that has to be re-rendered whenever the page moves, and nothing about a
// stale card looks wrong: it advertises the site as it read some commits ago while every
// check passes. `npm run og:check` is what notices; this module is what it and the exporter
// agree on.
//
// The machinery — what counts as a source, how the hash is derived, what "current" means —
// lives in @robertblust/design/cards/recipe, shared with blust.ch and companygraph.io. What
// stays here is this site's own data: which pages are cards, and the frame and hide rules each
// is rendered with. That split is the point. A second copy of a knob is a knob that can be
// edited without the hash moving, which is the one failure this whole mechanism exists to make
// impossible, so the exporter and the check both read the knobs from here rather than holding
// their own.
//
// REPO_ROOT is derived here and passed into the package, never derived inside it: a module that
// works out where it is from its own location points inside node_modules once it ships as a
// dependency.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { recipeFor } from "@robertblust/design/cards/recipe";

export const REPO_ROOT = path.dirname(fileURLToPath(import.meta.url));

// A share card with a progress bar and a play button on it advertises controls that do nothing
// inside a PNG. `.bar` is two different things by the same name — a deck's transport bar and
// the header bar on the landing page and the talks index — and hiding it is what the talks
// cards want, but the overlap is accidental: rename either one and the other's rule here stops
// applying, silently.
const DECK_HIDE = `.chrome,.bar,.notes,.langind,.hint{display:none!important}
  /* a still image should not be waiting out a transition it does not want */
  .slide.active > *{animation:none!important}`;

// The landing card keeps its header — the committed card has always shown it — and drops the
// figure. Not for want of room: the card's job is the headline and the two buttons, the part a
// reader takes in before deciding to care. The figure is the five-record argument that leads
// there, and an argument does not survive being glanced at in a feed.
const HOME_HIDE = `.figure{display:none!important}`;

// Rendered at 16:9 and the middle band taken: these pages size themselves against the
// viewport's shorter side, so squeezed straight into 1.9:1 they shrink and leave the frame
// half empty. deviceScaleFactor stays 1 so each file is exactly the size its og:image:width
// tags claim.
const FRAME = { width: 1200, height: 630, renderHeight: 675, deviceScaleFactor: 1 };
const CLIP_Y = Math.round((FRAME.renderHeight - FRAME.height) / 2);

// Every page here works from `file://` — the decks have to, and `verify` asserts the same of
// the rest — so one exporter renders all five the same way and none of them needs a server.
export const cards = [
  { dir: ".", ...FRAME, clipY: CLIP_Y, hide: HOME_HIDE, titleSlide: false, settle: "wait:900" },
  { dir: "talks", ...FRAME, clipY: CLIP_Y, hide: DECK_HIDE, titleSlide: false, settle: "wait:900" },
  { dir: "talks/intro", ...FRAME, clipY: CLIP_Y, hide: DECK_HIDE, titleSlide: true, settle: "wait:900" },
  // /billing/ and /privacy/ advertised the landing card until 2026-08-26 — a paste of either
  // URL previewed the landing hero, buttons and all, under the pasted page's title. The seo
  // check now asserts a page points at its own card, which is what surfaced these two.
  { dir: "billing", ...FRAME, clipY: CLIP_Y, hide: HOME_HIDE, titleSlide: false, settle: "wait:900" },
  { dir: "privacy", ...FRAME, clipY: CLIP_Y, hide: HOME_HIDE, titleSlide: false, settle: "wait:900" },
];

// Bound to this repository's root so the site's own callers can say `state(card)`. The package
// leaves `root` a defaulted parameter rather than closing over it, so the shared tests can
// still drive every function against a throwaway tree.
export const { sources, recipe, stampOf, state, stamp } = recipeFor(REPO_ROOT);
