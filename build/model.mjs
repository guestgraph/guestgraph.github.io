// Writes the pinned model into `model.json`, or checks that the file there is still what that
// commit parses to — `npm run model` and `npm run model:check`.
//
// This is the only part of the build that needs both GitHub and the parser, and that pairing is
// what fixes its place in CI below `npm ci`: the parser is a dependency and is not on disk until
// then. Reaching the network is not the rare half — `pin-check.mjs` reaches GitHub too.
// Everything else on this site is rendered from the file this writes, which is why the pages can
// be checked before `npm ci` has run and without GitHub being reachable.
//
// Pretty-printed because the file is committed and the point of committing it is review: a
// re-pin then shows which experience gained a field and which tagline was reworded, rather than
// one changed line of 300KB. The pages inline it minified, so their bytes do not move.
//
// The parser comes from `companygraph-meta-model`, pinned by tag. It implements the
// CompanyGraph conventions and lives in the repository that defines them, so a rule and its
// implementation cannot drift apart unseen. If the model gains a type or a section shape, the
// fix belongs there and arrives here as a version bump.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseInstance, imagesOf } from "companygraph-meta-model/instance";
import { syncImages } from "@robertblust/design/images";
import { readInstance } from "./read.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const { repo, commit } = JSON.parse(fs.readFileSync(path.join(ROOT, "source.json"), "utf8"));
const OUT = path.join(ROOT, "model.json");

// R13: an instance's content lives in one container, and `model/` is it. Everything outside —
// `meta/`, `.companygraph/`, the READMEs at the root — is machinery, not the company.
const SUB = "model/";

// The vendored core sits beside the container, and the parser reads the model against it:
// R16 makes the declared type the only thing that decides which fields are edges, so the
// schemas travel with the pages they declare.
const CORE = "meta/core/";

const [files, schemas] = await Promise.all([
  readInstance({ repo, commit, sub: SUB }),
  readInstance({ repo, commit, sub: CORE }),
]);
// `repo` travels with the data because the stage draws more than one repository's model and the
// file link has to point at the right one. `sub` is where these files sit in the model's own
// repository, and the parser needs it: an entity's `path` is what a page turns into a link to
// the file on GitHub.
const data = { ...parseInstance(files, { sub: SUB, schemas }), commit, repo };
const text = JSON.stringify(data, null, 2) + "\n";
// The pictures the model names, copied beside model.json at `images/<entity id>.<extension>`
// and pinned exactly as it is: the site serves its own copy, so a visitor's browser asks no
// third party for one, which is what the privacy page says.
const images = imagesOf(files, data, { sub: SUB, schemas });

if (process.argv.includes("--check")) {
  const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
  if (current !== text) {
    console.log(`  ✗ model.json is not what ${repo}@${commit.slice(0, 7)} parses to — run: npm run model`);
    process.exit(1);
  }
  const { problems } = syncImages({ root: ROOT, images, check: true });
  if (problems.length) {
    for (const p of problems) console.log(`  ✗ ${p} — run: npm run model`);
    process.exit(1);
  }
  console.log(`  ✓ model.json is ${repo}@${commit.slice(0, 7)}: ${data.entities.length} entities, ${data.edges.length} edges, ${images.length} image(s)`);
} else {
  fs.writeFileSync(OUT, text);
  syncImages({ root: ROOT, images });
  console.log(`  wrote model.json: ${data.entities.length} entities, ${data.edges.length} edges from ${repo}@${commit.slice(0, 7)}`);
}
