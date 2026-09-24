// Renders `model.json` into every region of this site derived from the model — `npm run pages`
// and `npm run pages:check`.
//
// No network, and no parser: everything here is a pure function of one committed file. The
// renderers come from @robertblust/design, which every site that draws a model shares, so this
// runs after `npm ci` has put the package on disk.
//
// An artifact that declares its own commit cannot be rendered stale, so the order of `npm run
// model` and `npm run pages` is enforced by the data rather than remembered by a person.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writePrinciples } from "@robertblust/design/render/principles";
import { writeTeam } from "@robertblust/design/render/team";
import { writeSurfaces } from "@robertblust/design/render/surfaces";
import { writeJsonLd } from "./jsonld.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const { repo, commit } = JSON.parse(fs.readFileSync(path.join(ROOT, "source.json"), "utf8"));
const ARTIFACT = path.join(ROOT, "model.json");

if (!fs.existsSync(ARTIFACT)) {
  console.error("  ✗ model.json is missing — run: npm run model");
  process.exit(1);
}
const data = JSON.parse(fs.readFileSync(ARTIFACT, "utf8"));
if (data.commit !== commit) {
  console.error(`  ✗ model.json is at ${String(data.commit).slice(0, 7)}, source.json pins ${commit.slice(0, 7)} — run: npm run model`);
  process.exit(1);
}

const check = process.argv.includes("--check");
// The order the boards argue in: the work first, then how an outsider joins it, then how a
// visitor is answered. Core gives a process no rank, so the site names the order, and the
// renderer refuses the build if a name leaves the model.
const RENDERERS = [
  writePrinciples,
  (d, o) => writeTeam(d, { ...o, order: ["Delivery", "Contribution", "Feature request", "Answering", "Narrating"] }),
  writeSurfaces,
  writeJsonLd,
];

const stale = RENDERERS.flatMap((write) => write(data, { check, root: ROOT }));

if (check) {
  if (stale.length) {
    console.error(`  ✗ ${stale.join(", ")} no longer match model.json — run: npm run pages`);
    process.exit(1);
  }
  console.log(`  ✓ every derived region matches model.json at ${repo}@${commit.slice(0, 7)}`);
} else {
  console.log(`  wrote every derived region from model.json at ${repo}@${commit.slice(0, 7)}`);
}
