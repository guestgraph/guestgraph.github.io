// Render the 1200×630 share cards that link previews use (og:image).
//
// Usage: npm run og
//
// A card is the page it links to, rendered: the landing page and the talks index are their own
// cards, a deck's card is its title slide. A preview then shows what the visitor is about to
// land on rather than a banner kept in step with the page by hand.
//
// The frame, the crop and the hide rules live in og-recipe.mjs rather than here, because
// `npm run og:check` has to hash the same ones this renders with. This file is the only one
// that needs playwright — the package never imports it, so the check and its tests stay
// dependency-free; the browser is handed in from here.
import { chromium } from "playwright";
import { exportCards } from "@robertblust/design/cards/export";
import * as recipe from "./og-recipe.mjs";

await exportCards({ chromium, recipe });
