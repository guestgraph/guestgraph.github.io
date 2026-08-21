// Render the slide deck to a 16:9 PDF fallback (one slide per page).
// Screenshots each slide exactly as shown on screen (dark theme, SVG diagrams),
// then assembles the PNGs into a PDF. DE is the default language.
// Usage: npm run pdf   (or: node export-pdf.mjs)
import { chromium } from "playwright";
import { PDFDocument } from "pdf-lib";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const W = 1280, H = 720;
const here = path.dirname(fileURLToPath(import.meta.url));
const src = pathToFileURL(path.join(here, "index.html")).href;
const out = path.join(here, "guestgraph.pdf");

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
await page.goto(src, { waitUntil: "networkidle" });
// German for the printed fallback; the deck itself opens in English.
await page.keyboard.press("l");
await page.waitForTimeout(300);
// hide on-screen chrome (navigation hints, counter, name, progress bar, notes)
await page.addStyleTag({ content: `.hint,.counter,.name,.langind,.bar,.notes,.play{display:none!important}` });

const count = await page.evaluate(() => document.querySelectorAll(".slide").length);

const pdf = await PDFDocument.create();
for (let i = 0; i < count; i++) {
  await page.evaluate((n) => {
    const s = Array.from(document.querySelectorAll(".slide"));
    s.forEach((el, k) => el.classList.toggle("active", k === n));
  }, i);
  await page.waitForTimeout(700); // let the rise animation settle
  const png = await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: W, height: H } });
  const img = await pdf.embedPng(png);
  const p = pdf.addPage([W, H]);
  p.drawImage(img, { x: 0, y: 0, width: W, height: H });
  console.log(`  slide ${i + 1}/${count}`);
}
writeFileSync(out, await pdf.save());
await browser.close();
console.log("✓ " + out);
