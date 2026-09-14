// How far the API page's pins have fallen behind the services they point at.
//
// `api-sources.json` names one commit of the engine and one of the connector, and those pins
// are editorial: they say which state of each API this page publishes, so moving one is a
// person's decision and never a bot's. Nothing here changes a pin. It reports the distance and
// passes, for the reason the shared check carries in its own comment: a pin ten commits behind
// is not a broken page, and a check that went red would teach everyone to ignore it.
//
// `npm run api:check` is the other half and is not this: it proves the page is what the pins
// say, not that the pins are what the services say. Both are needed, and only this one can tell
// you an operation exists that the page has never heard of.
//
// The check itself is `@robertblust/design/verify/pin`, shared with the two sibling sites. A
// second copy would be a second thing to keep true.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pinDrift, pinReport } from "@robertblust/design/verify/pin";

const here = path.dirname(fileURLToPath(import.meta.url));
const sources = JSON.parse(readFileSync(path.join(here, "api-sources.json"), "utf8"));

for (const [name, pin] of Object.entries(sources)) {
  pinReport(await pinDrift({ root: here, pin }), console.log, name);
}
