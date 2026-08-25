// Render the 1200×630 share cards that link previews use (og:image).
//
// A card is the page it links to, rendered: the landing page and the talks index are their
// own cards, a deck's card is its title slide. A preview then shows what the visitor is
// about to land on rather than a banner kept in step with the page by hand.
//
// deviceScaleFactor stays 1 so the file is exactly the size the og:image:width tags claim.
// The page is rendered at 16:9 and the middle band taken: these pages size themselves
// against the viewport's shorter side, and squeezed straight into 1.9:1 they shrink and
// leave the frame half empty.
//
// `--check` re-derives each card's recipe hash and fails if it no longer matches the
// `og.sha` beside the card. It renders nothing and needs no browser, so CI can run it
// before anything is installed — see "Share cards go stale silently" in CLAUDE.md for why
// it hashes the source instead of comparing the pixels.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const W = 1200, H = 630, RENDER_H = 675, DSF = 1, BAND_Y = Math.round((RENDER_H - H) / 2);
const root = path.dirname(fileURLToPath(import.meta.url));

// A share card should not advertise controls that do nothing inside a PNG. `.bar` is two
// different things by the same name — a deck's transport bar and the header bar on the
// landing page and the talks index — and hiding it is what the talks cards want, but the
// overlap is accidental: rename either one and the other's rule here stops applying,
// silently.
const CHROME = `.chrome,.bar,.notes,.langind,.hint{display:none!important}
  /* a still image should not be waiting out a transition it does not want */
  .slide.active > *{animation:none!important}`;

// The landing page keeps its header — the committed card has always shown it — and drops
// the figure. Not for want of room: the card's job is the headline and the two buttons,
// the part a reader takes in before deciding to care. The figure is the five-record
// argument that leads there, and an argument does not survive being glanced at in a feed.
const LANDING = `.figure{display:none!important}`;

const cards = [
  { dir: ".", hide: LANDING },
  { dir: "talks", hide: CHROME },
  { dir: "talks/intro", hide: CHROME, titleSlide: true },
];

// Everything the page pulls in from this repository: the fonts it declares, the images it
// shows. A font swap changes every card while no HTML changes at all, so hashing the page
// alone would call a card current that no longer looks like its page.
//
// Quoted spans are consumed whole, so a `>` inside an attribute value cannot end a tag
// early and drop the references after it. Under-reporting is the one direction this must
// not fail in, and the decks keep prose in `data-notes` where that character is ordinary.
const TAG = /<([a-zA-Z][\w-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>/g;
const ATTR = /(?:src|href)="([^"]+)"/g;
const CSSURL = /url\((['"]?)([^)'"]+)\1\)/g;

function sources(dir) {
  const page = path.join(dir, "index.html");
  const html = fs.readFileSync(path.join(root, page), "utf8");
  const found = new Set([page]);
  const refs = [];
  for (const [, tag, attrs] of html.matchAll(TAG)) {
    // An `<a>` names somewhere else to go, not something to draw. This is the one place
    // the walk departs from a flat attribute sweep, and the talks index is why: it links
    // two multi-megabyte PDFs of the same talk. Hashing a link target would report that
    // card stale every time `npm run pdf` ran, over a page that had not moved a pixel.
    if (tag.toLowerCase() === "a") continue;
    for (const m of attrs.matchAll(ATTR)) refs.push(m[1]);
  }
  for (const m of html.matchAll(CSSURL)) refs.push(m[2]);
  for (const raw of refs) {
    const ref = raw.split(/[?#]/)[0];
    // absolute, inline and protocol-relative references leave this repository, and the
    // card's own og:image is one of them — hashing it would key the card on itself.
    if (!ref || /^(https?:)?\/\/|^data:|^mailto:/.test(ref)) continue;
    const rel = path.normalize(path.join(dir, ref));
    if (rel.startsWith("..")) continue;
    const abs = path.join(root, rel);
    if (fs.existsSync(abs) && fs.statSync(abs).isFile()) found.add(rel);
  }
  return [...found].sort();
}

// The recipe, not the rendering: the sources plus the frame and the rules the exporter
// applies to them. Two machines rasterise the same text differently, so a card compared by
// its pixels reports the machine it was made on; compared by its recipe it reports whether
// anything it shows has moved.
function recipe(c) {
  const h = crypto.createHash("sha256");
  h.update(`${W}x${H}@${RENDER_H}x${DSF} titleSlide=${!!c.titleSlide}\n${c.hide}\n`);
  for (const rel of sources(c.dir)) {
    h.update(rel + "\0");
    h.update(fs.readFileSync(path.join(root, rel)));
  }
  return h.digest("hex");
}

const stampOf = (dir) => path.join(root, dir, "og.sha");

if (process.argv.includes("--check")) {
  let stale = 0;
  for (const c of cards) {
    const card = path.join(c.dir, "og.png");
    const stamp = stampOf(c.dir);
    const want = recipe(c);
    const have = fs.existsSync(stamp) ? fs.readFileSync(stamp, "utf8").trim() : "";
    if (have === want) {
      console.log("  ✓ " + card);
    } else {
      stale++;
      console.log(`  ✗ ${card}  ${have ? "the page has changed since it was rendered" : "never stamped"}`);
    }
  }
  if (stale) {
    console.log(`\n  ${stale} card(s) no longer show their page — run: npm run og`);
    process.exit(1);
  }
  console.log("\n  every card matches the page it renders");
} else {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  for (const c of cards) {
    const page = await browser.newPage({ viewport: { width: W, height: RENDER_H }, deviceScaleFactor: DSF });
    await page.goto(pathToFileURL(path.join(root, c.dir, "index.html")).href, { waitUntil: "networkidle" });
    // a card rendered in the fallback face is exactly the silent failure the design notes
    // describe: nothing errors, and the type is simply not the type the page declares.
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({ content: c.hide });
    if (c.titleSlide) {
      await page.evaluate(() => {
        const s = Array.from(document.querySelectorAll(".slide"));
        s.forEach((el, k) => el.classList.toggle("active", k === 0));
      });
    }
    await page.waitForTimeout(900);          // let the rise animation settle
    const out = path.join(root, c.dir, "og.png");
    await page.screenshot({ path: out, clip: { x: 0, y: BAND_Y, width: W, height: H } });
    // stamped after the screenshot, so an exporter that dies half way leaves the card
    // reported stale rather than reported current on a file it never wrote.
    fs.writeFileSync(stampOf(c.dir), recipe(c) + "\n");
    console.log("  ✓ " + path.relative(root, out));
    await page.close();
  }
  await browser.close();
}
