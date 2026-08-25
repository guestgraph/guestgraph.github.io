// Render the 1200×630 share cards that link previews use (og:image).
//
// A card is the page it links to, rendered: the landing page and the talks index are their own
// cards, a deck's card is its title slide. A preview then shows what the visitor is about to
// land on rather than a banner kept in step with the page by hand.
//
// The frame, the crop and the hide rules live in og-recipe.mjs rather than here, because
// `npm run og:check` has to hash the same ones this renders with; a second copy is a knob that
// can be edited without the check noticing. This file is the only one that needs playwright —
// the check and its tests import nothing outside node's standard library.
//
// The stamp beside each card is what makes staleness visible later — see og-recipe.mjs.
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { cards, REPO_ROOT, stamp } from "./og-recipe.mjs";

// Every page here works from `file://` and none of them settles any other way, so one loop
// renders all three. If a card ever describes itself differently, the recipe would be hashing
// a render this does not perform — say so rather than stamping it.
for (const c of cards) {
  if (c.from !== "file" || c.settle !== "wait:900") {
    throw new Error(`og-recipe.mjs describes ${c.dir} as ${c.settle}/${c.from}, which is not what this renders`);
  }
}

const browser = await chromium.launch();
for (const c of cards) {
  const page = await browser.newPage({
    viewport: { width: c.width, height: c.renderHeight },
    deviceScaleFactor: c.deviceScaleFactor,
  });
  await page.goto(pathToFileURL(path.join(REPO_ROOT, c.dir, "index.html")).href, { waitUntil: "networkidle" });
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
  const out = path.join(REPO_ROOT, c.dir, "og.png");
  await page.screenshot({ path: out, clip: { x: 0, y: c.clipY, width: c.width, height: c.height } });
  // stamped after the screenshot, so an exporter that dies half way leaves the card reported
  // stale rather than reported current on a file it never wrote.
  stamp(c);
  console.log("  ✓ " + path.relative(REPO_ROOT, out));
  await page.close();
}
await browser.close();
