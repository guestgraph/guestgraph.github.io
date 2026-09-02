// Render the deck to a 16:9 PDF fallback, one slide per page, in both languages.
//
// Usage: npm run pdf
//
// Which decks there are and what their files are called is the only thing that varies between
// this site and its two siblings, so it is the only thing that lives here. The rendering is
// `@robertblust/design/decks/export`; the package imports neither Playwright nor pdf-lib, so
// both are handed in from this file.
import { chromium } from "playwright";
import { PDFDocument } from "pdf-lib";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { exportDecks } from "@robertblust/design/decks/export";

await exportDecks({
  chromium,
  PDFDocument,
  root: path.dirname(fileURLToPath(import.meta.url)),
  decks: [{ dir: "talks/intro", slug: "guestgraph" }],
});
