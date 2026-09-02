// What the share-card staleness check has to get right.
//
// Run: npm run test:og   (node --test, no dependencies — the check itself has none either)
//
// The assertions are shared with blust.ch and companygraph.io, which run the same check over
// their own cards: they live in @robertblust/design/cards/recipe-tests and are driven here
// against this site's own recipe. Fixing a rule now fixes it in all three at once, which is
// what the three drifted copies of this file could not do.
import { checkRecipe } from "@robertblust/design/cards/recipe-tests";
import * as recipe from "../og-recipe.mjs";

checkRecipe(recipe);
