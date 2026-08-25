// What goes into each 1200×630 share card, and how to tell whether a card still shows it.
//
// `og.png` is not a banner someone drew: it is the page itself, rendered — the landing page
// and the talks index are their own cards, the deck's card is its title slide. The cost of
// that is a copy that has to be re-rendered whenever the page moves, and nothing about a
// stale card looks wrong: it advertises the site as it read some commits ago while every
// check passes. `npm run og:check` is what notices; this module is what it and the exporter
// agree on.
//
// The comparison is the recipe, never the pixels. Two machines rasterise the same text
// differently, so a card compared by its bytes reports which machine rendered it. Re-deriving
// a hash of what went *into* the card needs no browser and no server, which is why the check
// can run in CI before `npm ci`.
//
// The knobs below are the single copy. The exporter reads its frame and hide rules from here
// rather than holding its own: a second copy is a knob that can be edited without the hash
// moving, which is the one failure this whole mechanism exists to make impossible.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
// the rest — so one exporter renders all three the same way and none of them needs a server.
export const cards = [
  { dir: ".", ...FRAME, clipY: CLIP_Y, hide: HOME_HIDE, titleSlide: false, settle: "wait:900", from: "file" },
  { dir: "talks", ...FRAME, clipY: CLIP_Y, hide: DECK_HIDE, titleSlide: false, settle: "wait:900", from: "file" },
  { dir: "talks/intro", ...FRAME, clipY: CLIP_Y, hide: DECK_HIDE, titleSlide: true, settle: "wait:900", from: "file" },
];

export const cardFor = (dir) => cards.find((c) => c.dir === dir);

// Everything the page pulls in from this repository: the fonts it declares, the images it
// shows. A font swap changes every card while no HTML changes at all, so hashing the page
// alone would call a card current that no longer looks like its page.
//
// Quoted spans are consumed whole, so a `>` inside an attribute value cannot end a tag early
// and drop the references after it. Under-reporting is the one direction this must not fail
// in, and the decks keep prose in `data-notes` where that character is ordinary.
const TAG = /<([a-zA-Z][\w-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>/g;
// The attribute branch admits `?` and `#` and lets the split below strip them. Excluding them
// from the class instead means an attribute carrying either simply fails to match, so
// `href="a.css?v=2"` drops out of the recipe entirely and the file stops being tracked.
// Nothing here uses one today; the check is supposed to over-report, and a rule that quietly
// under-reports is the wrong way to be wrong.
const ATTR = /(?:src|href)="([^"]+)"/g;
const CSSURL = /url\((['"]?)([^)'"]+)\1\)/g;

export function sources(dir, root = REPO_ROOT) {
  const page = path.join(dir, "index.html");
  const html = fs.readFileSync(path.join(root, page), "utf8");
  const found = new Set([page]);
  const refs = [];
  for (const [, tag, attrs] of html.matchAll(TAG)) {
    // An `<a>` names somewhere else to go, not something to draw. The talks index is why this
    // exception exists: it links both multi-megabyte deck PDFs, so hashing link targets
    // reports that card stale on every `npm run pdf`, over a page that has not moved a pixel.
    if (tag.toLowerCase() === "a") continue;
    for (const m of attrs.matchAll(ATTR)) refs.push(m[1]);
  }
  for (const m of html.matchAll(CSSURL)) refs.push(m[2]);
  for (const raw of refs) {
    const ref = raw.split(/[?#]/)[0];
    // absolute, inline and protocol-relative references leave this repository, and the card's
    // own og:image is one of them — hashing it would key the card on itself.
    if (!ref || /^(https?:)?\/\/|^data:|^mailto:/.test(ref)) continue;
    const rel = path.normalize(path.join(dir, ref));
    if (rel.startsWith("..")) continue;
    const abs = path.join(root, rel);
    if (fs.existsSync(abs) && fs.statSync(abs).isFile()) found.add(rel);
  }
  return [...found].sort();
}

// Key order in a card literal is not a change to the card, and a knob added to a card later is.
// Sorting the keys and hashing all of them means a new knob enters the recipe by existing,
// rather than by someone remembering to list it here as well.
const canonical = (card) =>
  JSON.stringify(Object.fromEntries(Object.entries(card).sort(([a], [b]) => (a < b ? -1 : 1))));

export function recipe(card, root = REPO_ROOT) {
  const h = crypto.createHash("sha256");
  h.update("og-recipe/1\n" + canonical(card) + "\n");
  for (const rel of sources(card.dir, root)) {
    h.update(rel + "\0");
    h.update(fs.readFileSync(path.join(root, rel)));
  }
  return h.digest("hex");
}

export const stampOf = (dir, root = REPO_ROOT) => path.join(root, dir, "og.sha");

export function state(card, root = REPO_ROOT) {
  const stamp = stampOf(card.dir, root);
  const want = recipe(card, root);
  const have = fs.existsSync(stamp) ? fs.readFileSync(stamp, "utf8").trim() : "";
  return {
    dir: card.dir,
    card: path.join(card.dir, "og.png"),
    want,
    have,
    state: !have ? "unstamped" : have === want ? "current" : "stale",
  };
}

// Written after the screenshot, so an exporter that dies half way leaves its card reported
// stale rather than reported current on a file it never wrote.
export function stamp(card, root = REPO_ROOT) {
  fs.writeFileSync(stampOf(card.dir, root), recipe(card, root) + "\n");
}
