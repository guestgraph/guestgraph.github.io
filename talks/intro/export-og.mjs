// Render the 1200×630 share cards that link previews use (og:image).
//
// A deck's card is its own title slide, and the talks index card is the talks index — so
// the preview shows the thing the visitor is about to land on rather than a generic
// banner that has to be kept in step with it by hand.
//
// English, because the head metadata is English: a scraper never runs applyLang(), so the
// card and the og:description it sits next to have to agree.
//
// Usage: npm run og   (or: node export-og.mjs)
import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// 1200×630 is the size every scraper recommends and the size the og:image:width tags
// declare, so deviceScaleFactor stays 1 and the file is exactly what the head claims.
// The page is rendered at 16:9 and the middle band taken: both pages lay themselves out
// in vmin, so squeezing them into 1.9:1 directly shrinks everything and leaves the frame
// half empty. This keeps the proportions the page was designed with, instead of a second
// set of type rules living in here to be kept in step by hand.
const W = 1200, H = 630, RENDER_H = 675, BAND_Y = Math.round((675 - 630) / 2);
const here = path.dirname(fileURLToPath(import.meta.url));
const talks = path.dirname(here);

// hide the on-screen chrome: a share card with a progress bar and a play button on it
// advertises controls that do nothing inside a PNG. `.bar` is two different things by the
// same name — a deck's transport bar and the talks index's header bar — and hiding both is
// what a card wants, but the overlap is accidental: rename either and this stops applying.
const HIDE = `.chrome,.bar,.notes,.langind,.hint{display:none!important}
  .slide.active > *{animation:none!important}`;

const cards = [
  { out: path.join(talks, "og.png"), src: path.join(talks, "index.html") },
  { out: path.join(here, "og.png"), src: path.join(here, "index.html"), titleSlide: true },
];

const browser = await chromium.launch();
for (const c of cards) {
  const page = await browser.newPage({ viewport: { width: W, height: RENDER_H } });
  await page.goto(pathToFileURL(c.src).href, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: HIDE });
  if (c.titleSlide) {
    await page.evaluate(() => {
      const s = Array.from(document.querySelectorAll(".slide"));
      s.forEach((el, k) => el.classList.toggle("active", k === 0));
    });
  }
  await page.waitForTimeout(900);            // let the rise animation settle
  await page.screenshot({ path: c.out, clip: { x: 0, y: BAND_Y, width: W, height: H } });
  console.log("  ✓ " + path.relative(talks, c.out));
  await page.close();
}
await browser.close();
