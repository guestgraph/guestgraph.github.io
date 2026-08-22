import { chromium } from "playwright";
const OUT = "/private/tmp/claude-501/-Users-rob-git-talks/4db9385a-f6d1-4bc2-8900-71280788df7d/scratchpad/";
const b = await chromium.launch();

async function shot(name, vp, fn){
  const p = await b.newPage({ viewport: vp, deviceScaleFactor: 2, hasTouch: true, isMobile: vp.width < 500 });
  const errs = [];
  p.on("pageerror", e => errs.push(String(e)));
  p.on("console", m => { if (m.type() === "error") errs.push("console: " + m.text()); });
  await p.goto("http://localhost:8765/intro/", { waitUntil: "networkidle" });
  await p.waitForTimeout(600);
  if (fn) await fn(p);
  await p.waitForTimeout(500);
  await p.screenshot({ path: OUT + name + ".png" });
  if (errs.length) console.log(name, "ERRORS:", errs);
  return p;
}

await shot("desk-00", { width: 1280, height: 720 });
await shot("desk-04", { width: 1280, height: 720 }, async p => { for (let k=0;k<4;k++) await p.click("#tNext"); });
await shot("desk-notes", { width: 1280, height: 720 }, async p => { await p.click("#tNext"); await p.click("#tNotes"); });
await shot("desk-de", { width: 1280, height: 720 }, async p => { await p.click("#langDe"); await p.click("#tNext"); });
await shot("mob-390", { width: 390, height: 844 }, async p => { await p.click("#tNext"); });
await shot("mob-360", { width: 360, height: 740 });
await shot("mob-320", { width: 320, height: 568 });
await shot("mob-notes", { width: 390, height: 844 }, async p => { await p.click("#tNext"); await p.click("#tNotes"); });
await shot("land-844", { width: 844, height: 390 });
await b.close();
console.log("done");
