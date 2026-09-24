// The one way this repository reads the model it pins. Both the artifact and, before this
// existed, the principles page needed the same thing — one commit's worth of files — and each
// had its own copy of how to get them, on a different GitHub endpoint. A second copy is a
// second thing to keep true, and no check held the two together.
//
// A local checkout when MENTAL_MODEL points at one whose HEAD is the pinned commit, otherwise
// GitHub: one call to the git trees API for the listing, then the raw files. No tarball, so
// nothing to untar and no dependency. GITHUB_TOKEN is sent if present and never printed.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { IMAGE_FILE } from "companygraph-meta-model/instance";

function readLocal(dir, commit, sub) {
  const head = execFileSync("git", ["-C", dir, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  if (head !== commit) {
    throw new Error(`MENTAL_MODEL is at ${head.slice(0, 7)}, source.json pins ${commit.slice(0, 7)}`);
  }
  const root = path.join(dir, sub);
  const files = new Map();
  const walk = (d) => {
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, ent.name);
      if (ent.isDirectory()) walk(p);
      // An image is bytes: read as text it is corrupted before the copy step sees it.
      else files.set(path.relative(root, p).split(path.sep).join("/"), fs.readFileSync(p, IMAGE_FILE.test(p) ? undefined : "utf8"));
    }
  };
  walk(root);
  return files;
}

async function readRemote(repo, commit, sub) {
  const headers = { "user-agent": "guestgraph.io model build" };
  if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(`https://api.github.com/repos/${repo}/git/trees/${commit}?recursive=1`, { headers });
  if (!res.ok) throw new Error(`trees API: HTTP ${res.status}`);
  const { tree, truncated } = await res.json();
  if (truncated) throw new Error("trees API truncated the listing");
  const files = new Map();
  for (const e of tree) {
    if (e.type !== "blob" || !e.path.startsWith(sub)) continue;
    const raw = await fetch(`https://raw.githubusercontent.com/${repo}/${commit}/${e.path}`, { headers });
    if (!raw.ok) throw new Error(`${e.path}: HTTP ${raw.status}`);
    files.set(e.path.slice(sub.length), IMAGE_FILE.test(e.path) ? new Uint8Array(await raw.arrayBuffer()) : await raw.text());
  }
  return files;
}

export function readInstance({ repo, commit, sub }) {
  return process.env.MENTAL_MODEL
    ? Promise.resolve(readLocal(process.env.MENTAL_MODEL, commit, sub))
    : readRemote(repo, commit, sub);
}
