// The model's Dataset node, written into every page's JSON-LD graph from one definition, so the
// structured data says what every footer says: this site publishes `model.json`. A node typed
// once per page is a node that can differ between pages, which is why it is generated here and
// held by `npm run pages:check`, as companygraph.io does for its own model.
//
// This renderer owns the tail of each graph, not the head. The nodes before it are the page's
// own and stay hand-written; each page names its head, and a graph whose head is not the one
// named, or that carries a node after it this renderer does not own, is refused rather than
// rewritten, because `npm run pages` would otherwise delete someone's work without a word.
import fs from "node:fs";
import path from "node:path";

const SITE = "https://guestgraph.io";
// guestgraph/mental-model is CC BY 4.0.
const INSTANCE_LICENSE = "https://creativecommons.org/licenses/by/4.0/";

const PAGE_HEAD = ["Organization", "WebSite", "WebPage", "BreadcrumbList"];
export const PAGES = [
  { file: "index.html", head: ["Person", "Organization", "WebSite", "SoftwareSourceCode", "WebPage"] },
  { file: "team/index.html", head: PAGE_HEAD },
  { file: "principles/index.html", head: PAGE_HEAD },
  { file: "surfaces/index.html", head: PAGE_HEAD },
  { file: "api/index.html", head: PAGE_HEAD },
  { file: "model/index.html", head: PAGE_HEAD },
  { file: "talks/index.html", head: PAGE_HEAD },
  { file: "talks/intro/index.html", head: PAGE_HEAD },
  { file: "billing/index.html", head: PAGE_HEAD },
  { file: "privacy/index.html", head: PAGE_HEAD },
  { file: "problems/index.html", head: PAGE_HEAD },
];

export function datasetNode(data) {
  return {
    "@type": "Dataset",
    "@id": `${SITE}/model/#dataset`,
    // The name comes from the model, so a re-pin that renames the company carries onto every page.
    name: `${data.root} — mental model`,
    description: "GuestGraph described in CompanyGraph: its vision, values, objectives and strategies, the products it ships and the concepts they use, how its work is done, and where the model is published.",
    url: `${SITE}/model/`,
    license: INSTANCE_LICENSE,
    isBasedOn: `https://github.com/${data.repo}`,
    creator: { "@id": `${SITE}/#organization` },
    distribution: [
      { "@type": "DataDownload", encodingFormat: "application/json", contentUrl: `${SITE}/model.json` },
    ],
  };
}

const RE = /(<script type="application\/ld\+json">\n)([\s\S]*?)(\n<\/script>)/;

// Every committed page that carries a graph, so a new page cannot go without the node unseen.
function pagesWithGraphs(root) {
  const found = [];
  const walk = (dir) => {
    for (const ent of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
      if (ent.name === "node_modules" || ent.name.startsWith(".")) continue;
      const rel = dir ? `${dir}/${ent.name}` : ent.name;
      if (ent.isDirectory()) walk(rel);
      else if (ent.name === "index.html" && RE.test(fs.readFileSync(path.join(root, rel), "utf8"))) found.push(rel);
    }
  };
  walk("");
  return found;
}

export function writeJsonLd(data, { check = false, root, pages = PAGES } = {}) {
  if (!root) throw new Error("writeJsonLd needs the site's root");
  if (!data.repo || !data.root) throw new Error("writeJsonLd needs model.json's repo and root");
  const listed = new Set(pages.map((p) => p.file));
  const missing = pagesWithGraphs(root).filter((f) => !listed.has(f));
  if (missing.length) throw new Error(`${missing.join(", ")} carr${missing.length > 1 ? "y" : "ies"} JSON-LD but ${missing.length > 1 ? "are" : "is"} not in build/jsonld.mjs's PAGES`);
  const node = datasetNode(data);
  const stale = [];
  for (const { file: rel, head: HEAD } of pages) {
    const file = path.join(root, rel);
    const page = fs.readFileSync(file, "utf8");
    const m = RE.exec(page);
    if (!m) throw new Error(`${rel} carries no JSON-LD block`);
    const doc = JSON.parse(m[2]);
    if (!Array.isArray(doc["@graph"])) throw new Error(`${rel}'s JSON-LD has no @graph`);
    const head = doc["@graph"].slice(0, HEAD.length).map((n) => n && n["@type"]);
    if (head.join() !== HEAD.join()) throw new Error(`${rel}: @graph must begin with ${HEAD.join(", ")}, not ${head.join(", ") || "nothing"}`);
    const foreign = doc["@graph"].slice(HEAD.length).filter((n) => !n || n["@id"] !== node["@id"]);
    if (foreign.length) throw new Error(`${rel}: @graph carries ${foreign.length} node(s) after ${HEAD.join(", ")} that this renderer does not own`);
    doc["@graph"] = [...doc["@graph"].slice(0, HEAD.length), node];
    // `<` keeps a `</` in any string from ending the script element early.
    const text = JSON.stringify(doc, null, 2).replace(/</g, "\\u003c");
    const next = page.replace(RE, (all, open, _body, close) => open + text + close);
    JSON.parse(RE.exec(next)[2]);
    if (next === page) continue;
    if (check) stale.push(rel);
    else fs.writeFileSync(file, next);
  }
  return stale;
}
