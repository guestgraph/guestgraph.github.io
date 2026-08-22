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

const W = 1200, H = 630;
const here = path.dirname(fileURLToPath(import.meta.url));
const talks = path.dirname(here);

// hide the on-screen chrome: a share card with a progress bar and a play button on it
// advertises controls that do nothing inside a PNG
const HIDE = `.chrome,.bar,.notes,.langind,.hint{display:none!important}`;

const cards = [
  { out: path.join(talks, "og.png"), src: path.join(talks, "index.html") },
  { out: path.join(here, "og.png"), src: path.join(here, "index.html"), titleSlide: true },
];

const browser = await chromium.launch();
for (const c of cards) {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
  await page.goto(pathToFileURL(c.src).href, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: HIDE });
  if (c.titleSlide) {
    await page.evaluate(() => {
      const s = Array.from(document.querySelectorAll(".slide"));
      s.forEach((el, k) => el.classList.toggle("active", k === 0));
    });
  }
  await page.waitForTimeout(900);            // let the rise animation settle
  await page.screenshot({ path: c.out, clip: { x: 0, y: 0, width: W, height: H } });
  console.log("  ✓ " + path.relative(talks, c.out));
  await page.close();
}
await browser.close();
