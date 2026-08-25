// Does each share card still show the page it was rendered from?
//
// Usage: npm run og:check
//
// It renders nothing and imports nothing outside node's standard library, so CI can run it
// before `npm ci` — and a stale card is caught by the cheapest step in the job rather than by
// whoever notices the preview.
//
// It over-reports and never under-reports, deliberately. Editing a comment in a page marks its
// card stale even though the render would be identical. Clearing that is `npm run og` and a
// commit — cheap, and the opposite error is a card nobody notices for days.
import { cards, state } from "./og-recipe.mjs";

const WHY = {
  unstamped: "never stamped",
  stale: "the page has changed since it was rendered",
};

// `cards.map(state)` would hand map's index to `state`'s root parameter. It has to be a call
// that passes one argument.
const stale = cards.map((c) => state(c)).filter((s) => {
  console.log(s.state === "current" ? `  ✓ ${s.card}` : `  ✗ ${s.card}  ${WHY[s.state]}`);
  return s.state !== "current";
});

if (stale.length) {
  console.log(`\n  ${stale.length} card(s) no longer show their page — run: npm run og`);
  console.log("  then commit each og.png with the og.sha beside it.");
  process.exit(1);
}

console.log("\n  every card matches the page it renders");
