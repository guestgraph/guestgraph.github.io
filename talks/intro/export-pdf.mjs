// Render the slide deck to a 16:9 PDF fallback (one slide per page), in both languages.
// Screenshots each slide exactly as shown on screen (dark theme, SVG diagrams), then
// assembles the PNGs into a PDF. The deck narrates in two languages, so the printable
// fallback exists in two: guestgraph-de.pdf and guestgraph-en.pdf.
// Usage: npm run pdf   (or: node export-pdf.mjs)
import { chromium } from "playwright";
import { PDFDocument } from "pdf-lib";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const W = 1280, H = 720;
const LANGS = ["de", "en"];
const here = path.dirname(fileURLToPath(import.meta.url));
const src = pathToFileURL(path.join(here, "index.html")).href;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
await page.goto(src, { waitUntil: "networkidle" });

// Hide the controls, not the credit: .name lives inside .chrome, and hiding the whole
// bar took the byline off every printed page. A transport in a PDF advertises buttons
// that do nothing; a byline is the one part of that bar a printed page still wants.
await page.addStyleTag({ content: `.transport,.bar,.notes{display:none!important}\n     .slide.active > *{animation:none!important}` });
const count = await page.evaluate(() => document.querySelectorAll(".slide").length);

for (const lang of LANGS) {
  // the deck has no keyboard shortcuts any more — click the transport's language toggle.
  // It is hidden by the rule above, so click it through the DOM rather than the pointer.
  await page.evaluate(l => document.getElementById(l === "de" ? "langDe" : "langEn").click(), lang);
  await page.waitForTimeout(400);

  const pdf = await PDFDocument.create();
  for (let i = 0; i < count; i++) {
    await page.evaluate(n => {
      const s = Array.from(document.querySelectorAll(".slide"));
      s.forEach((el, k) => el.classList.toggle("active", k === n));
    }, i);
    await page.waitForTimeout(500);            // let the rise animation settle
    const png = await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: W, height: H } });
    const img = await pdf.embedPng(png);
    const p = pdf.addPage([W, H]);
    p.drawImage(img, { x: 0, y: 0, width: W, height: H });
  }
  const out = path.join(here, `guestgraph-${lang}.pdf`);
  writeFileSync(out, await pdf.save());
  console.log(`  ✓ intro/guestgraph-${lang}.pdf  (${count} slides)`);
}

await browser.close();
