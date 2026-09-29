// The team page's process pictures, drawn when the site builds rather than in the visitor's
// browser. `@robertblust/design/pictures` lets this site's own chat.js draw each one in Chromium
// and writes it beside the page as team/pictures/<process>.svg, with a stamp of what went into it
// that `npm run pages:check` reads without a browser.
//
// Usage: npm run pages && npm run pictures && npm run pages
//
// The package never imports Playwright, so the browser is handed in from here, as the share
// cards' export script hands it in.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { drawPictures } from "@robertblust/design/pictures";

await drawPictures({ chromium, root: path.join(path.dirname(fileURLToPath(import.meta.url)), "..") });
