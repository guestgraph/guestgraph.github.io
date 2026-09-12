// The API page's operation list, written from the services' own OpenAPI documents.
//
// The page describes two APIs that live in two other repositories, and a page that restates
// them by hand is a page that is wrong the first time either one changes. So it is generated:
// `api-sources.json` pins each service by commit, this script fetches the document that commit
// holds, and the page's fenced region is rewritten from it. `--check` fails when the committed
// region is not what the pins parse to, which is what CI runs — the same shape `npm run design`
// uses for the design system's fenced blocks, and the same one the sibling site uses for its
// model pages.
//
// The pins are editorial. They move when someone decides a newer API is what this page
// publishes, in a commit that says why; a pin behind its service is intent, not drift.
//
// GUESTGRAPH_ENGINE and GUESTGRAPH_CONNECTOR point at local checkouts and skip the fetch,
// which is how this is run offline and against an unreleased change.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const here = path.dirname(fileURLToPath(import.meta.url));
const SOURCES = JSON.parse(fs.readFileSync(path.join(here, "api-sources.json"), "utf8"));
const PAGE = path.join(here, "api", "index.html");
// One fence per section, so the page keeps its own prose. A section's heading and lede are
// hand-written and carry their German; only the rows are generated, and an operation summary
// stays in the document's own English, as a path and a method do.
const CLOSE = "<!-- end ops -->";

// Which operations undo something a caller or the engine did earlier. The engine's claim is
// that a merge is explainable and reversible, so the page says which calls are the reversing
// half rather than leaving a reader to infer it from a summary. Keyed by operationId, because
// a path can change spelling and an id is the document's own stable name for an operation.
// Deciding a review is not one of them: confirming a match makes a merge rather than taking
// one back, and the same call does both.
const REVERSES = new Set(["unmergeGuest", "deleteNegativeRule"]);

// Which problem type each refusal carries. The documents cannot say: every error response
// points at one shared problem schema, so a 400 there is any of three types. This map is read
// from the services' own code — the exceptions each operation raises — and an error response
// with no entry stops the build, so a new refusal cannot quietly link to nothing.
//
// Two refusals are every operation's and are named once on the page instead of on every row:
// a malformed actor claim, which the key filter raises as a 400 before an operation runs, and
// a body over the size cap, which no document declares because no operation does.
const PROBLEMS = {
  // engine
  registerSourceSystem: { 400: ["invalid-request"], 401: ["unauthorized"], 409: ["conflict"] },
  ingestRecords: { 400: ["invalid-request"], 401: ["unauthorized"] },
  getGuest: { 401: ["unauthorized"], 404: ["not-found"] },
  getGuestRecords: { 401: ["unauthorized"], 404: ["not-found"], 410: ["guest-retired"] },
  explainGuest: { 401: ["unauthorized"], 404: ["not-found"], 410: ["guest-retired"] },
  unmergeGuest: { 400: ["invalid-unmerge"], 401: ["unauthorized"], 404: ["not-found"], 410: ["guest-retired"] },
  lookupGuests: { 400: ["invalid-request"], 401: ["unauthorized"] },
  listMatchReviews: { 401: ["unauthorized"] },
  decideMatchReview: { 401: ["unauthorized"], 404: ["not-found"], 409: ["review-already-decided"] },
  getMatchingConfig: { 401: ["unauthorized"] },
  updateMatchingConfig: { 400: ["invalid-request"], 401: ["unauthorized"] },
  listIdentifierRules: { 401: ["unauthorized"] },
  addIdentifierRule: { 400: ["invalid-request"], 401: ["unauthorized"], 409: ["conflict"] },
  deleteIdentifierRule: { 401: ["unauthorized"], 404: ["not-found"] },
  listNegativeRules: { 401: ["unauthorized"] },
  deleteNegativeRule: { 401: ["unauthorized"], 404: ["not-found"] },
  getGuestTimeline: { 401: ["unauthorized"], 404: ["not-found"], 410: ["guest-retired"] },
  getSourceObject: { 401: ["unauthorized"], 404: ["not-found"] },
  // connector. Its webhook answers an unknown secret with a bare 404 and no body, so a probe
  // learns nothing about which secrets exist; that one carries no problem type at all.
  receiveApaleoEvent: { 400: ["invalid-request"], 404: [] },
  getStatus: { 401: ["unauthorized"] },
  startFullSync: { 401: ["unauthorized"], 404: ["not-found"], 409: ["run-in-progress"] },
  startReconciliation: { 401: ["unauthorized"], 404: ["not-found"], 409: ["run-in-progress"] },
  startRefresh: { 401: ["unauthorized"], 404: ["not-found"] },
  getRun: { 401: ["unauthorized"], 404: ["not-found"] },
};

// The order a record moves through the engine, which is the page's spine. An operation not
// named here keeps the document's own order, after the ones that are — a new endpoint appears
// rather than disappearing.
// Which section each operation belongs to. An operation named in no section stops the build:
// a new endpoint must be placed deliberately, because the alternative is a page that quietly
// omits it and a reader who never learns it exists.
const IN_SECTION = {
  connector: null, // every connector operation, in the document's order
  arrives: ["registerSourceSystem", "ingestRecords"],
  "came-out": ["getGuest", "getGuestRecords", "explainGuest", "getGuestTimeline", "lookupGuests", "getSourceObject"],
  wrong: ["unmergeGuest", "listMatchReviews", "decideMatchReview", "listNegativeRules", "deleteNegativeRule"],
  tuning: ["getMatchingConfig", "updateMatchingConfig", "listIdentifierRules", "addIdentifierRule", "deleteIdentifierRule"],
};

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

async function load(name, src) {
  const local = process.env[`GUESTGRAPH_${name.toUpperCase()}`];
  if (local) return fs.readFileSync(path.join(local, src.spec), "utf8");
  const url = `https://raw.githubusercontent.com/${src.repo}/${src.commit}/${src.spec}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} answered ${res.status}`);
  return res.text();
}

// One level of a schema, which is where the bound is. A named schema is shown by its name and
// its own properties; a property that is itself a reference is shown by that reference's name
// and not followed. The complete shape is in the document the provenance line links to, and a
// page that reproduced it would be a worse copy of what a reader can already open.
function refName(node) {
  return node?.$ref ? node.$ref.split("/").pop() : null;
}

function typeOf(node) {
  if (!node) return "";
  const ref = refName(node);
  if (ref) return ref;
  if (node.oneOf) return node.oneOf.map(typeOf).filter(Boolean).join(" or ");
  if (node.type === "array") return `${typeOf(node.items)}[]`;
  if (Array.isArray(node.type)) return node.type.filter((t) => t !== "null").join(" or ");
  return node.type ?? "";
}

function shape(doc, node) {
  const ref = refName(node);
  const target = ref ? doc.components?.schemas?.[ref] : node;
  if (!target?.properties) return { name: ref, fields: [] };
  const required = new Set(target.required ?? []);
  return {
    name: ref,
    fields: Object.entries(target.properties).map(([k, v]) => ({
      name: k,
      type: typeOf(v),
      required: required.has(k),
    })),
  };
}

function request(doc, op) {
  const schema = op.requestBody?.content?.["application/json"]?.schema;
  if (!schema) return null;
  const parts = schema.oneOf ?? [schema];
  const out = [];
  for (const part of parts) {
    const many = part.type === "array";
    const form = shape(doc, many ? part.items : part);
    if (!form.name && !form.fields.length) continue;
    // `oneOf: [X, array of X]` is one shape a caller may send singly or in a batch, not two
    // shapes. Listing it twice would read as a choice between two bodies.
    const seen = out.find((f) => f.name === form.name);
    if (seen) seen.many = seen.many || many;
    else out.push({ ...form, many });
  }
  return out;
}

function responses(doc, op) {
  const mapped = PROBLEMS[op.operationId];
  return Object.entries(op.responses ?? {}).map(([code, body]) => {
    const ref = refName(body);
    const target = ref ? doc.components?.responses?.[ref] : body;
    const error = Number(code) >= 400;
    if (error && !mapped?.[code]) {
      console.error(`✗ api: ${op.operationId} answers ${code} and PROBLEMS says nothing about it.`);
      console.error("  Add the problem type(s) it carries to PROBLEMS in build-api.mjs, read");
      console.error("  from the exceptions that operation raises. An empty list means the");
      console.error("  refusal deliberately carries no problem detail.");
      process.exit(1);
    }
    const schema = target?.content?.["application/json"]?.schema
      ?? target?.content?.["application/problem+json"]?.schema;
    return {
      code,
      description: (target?.description ?? "").trim().split("\n")[0],
      problems: error ? mapped[code] : [],
      shape: error ? null : (schema ? shape(doc, schema.type === "array" ? schema.items : schema) : null),
      many: !error && schema?.type === "array",
    };
  });
}

function operations(doc) {
  const out = [];
  for (const [p, item] of Object.entries(doc.paths ?? {})) {
    for (const method of ["get", "post", "put", "delete", "patch"]) {
      const op = item[method];
      if (!op) continue;
      out.push({
        method: method.toUpperCase(),
        path: p,
        summary: op.summary ?? "",
        id: op.operationId ?? "",
        tag: (op.tags ?? [])[0] ?? "",
        description: (op.description ?? "").trim(),
        request: request(doc, op),
        responses: responses(doc, op),
        reverses: REVERSES.has(op.operationId),
      });
    }
  }
  return out;
}

function fields(form, many) {
  const head = form.name
    ? `<b class="mono">${esc(form.name)}</b>` +
      (many ? ` <span class="t" data-de="einzeln oder als Liste">one or a list of them</span>` : "")
    : "";
  const list = form.fields
    .map((x) => `<li><code class="mono">${esc(x.name)}</code> <span class="t">${esc(x.type)}</span>` +
                (x.required ? ` <span class="req" data-de="Pflicht">required</span>` : "") + `</li>`)
    .join("");
  return `<div class="form">${head}<ul class="fields">${list}</ul></div>`;
}

function panel(o) {
  const bits = [];
  if (o.description) bits.push(`        <p class="desc">${esc(o.description)}</p>`);

  if (o.request?.length) {
    const forms = o.request.map((f) => fields(f, f.many)).join("");
    bits.push(`        <h3 data-de="Anfrage">Request</h3>\n        <div class="forms">${forms}</div>`);
  }

  if (o.responses?.length) {
    const rs = o.responses
      .map((r) => {
        const text = esc(r.description);
        const links = r.problems
          .map((slug) => `<a href="../problems/#${slug}"><code class="mono">${slug}</code></a>`)
          .join(" <span data-de='oder'>or</span> ");
        const body = r.shape && (r.shape.name || r.shape.fields.length) ? fields(r.shape, r.many) : "";
        return (
          `<li><div class="line"><code class="mono c">${esc(r.code)}</code> ` +
          `<span class="d">${text}${links ? ` · ${links}` : ""}</span></div>${body}</li>`
        );
      })
      .join("");
    bits.push(`        <h3 data-de="Antworten">Responses</h3>\n        <ul class="codes">${rs}</ul>`);
  }
  return bits.join("\n");
}

function rows(ops) {
  return ops
    .map((o) => {
      const body = panel(o);
      const head =
        `<code class="mono m">${esc(o.method)}</code>` +
        // A path breaks after a segment or not at all: `overflow-wrap` alone splits
        // {connectionId} down the middle, which is unreadable in a column a reader scans.
        `<code class="mono p">${esc(o.path).replace(/\//g, "/<wbr>")}</code>` +
        `<span class="s">${esc(o.summary)}</span>`;
      // An operation with nothing more to say stays a row rather than becoming a control that
      // opens on emptiness.
      if (!body) return `      <li${o.reverses ? ' class="undo"' : ""}><div class="head">${head}</div></li>`;
      return (
        `      <li${o.reverses ? ' class="undo"' : ""}><details>\n` +
        `        <summary>${head}</summary>\n` +
        `${body}\n` +
        `      </details></li>`
      );
    })
    .join("\n");
}

// The provenance line, the shape blust.ch's model page uses: the whole line is record — a
// repository, a commit, the document read from it — so it is mono end to end, and the prose
// between the links carries its German while the coordinates do not.
function derived() {
  const one = (name, src) =>
    `<a href="https://github.com/${src.repo}/blob/${src.commit}/${src.spec}">${src.repo}</a>` +
    `@<span>${src.commit.slice(0, 7)}</span>`;
  return `      <p class="derived"><span data-de="Erzeugt aus">Generated from</span> ` +
    `${one("engine", SOURCES.engine)} <span data-de="und">and</span> ${one("connector", SOURCES.connector)}` +
    `<span data-de=", den Dokumenten, die diese Commits enthalten.">, the documents those commits hold.</span></p>`;
}

function sections(engine, connector) {
  const byId = new Map(engine.ops.map((o) => [o.id, o]));
  const out = new Map();
  const placed = new Set();

  for (const [key, ids] of Object.entries(IN_SECTION)) {
    if (ids === null) {
      out.set(key, rows(connector.ops));
      continue;
    }
    const ops = ids.map((id) => {
      const op = byId.get(id);
      if (!op) throw new Error(`${id} is in this script's spine and not in the engine's document`);
      placed.add(id);
      return op;
    });
    out.set(key, rows(ops));
  }
  out.set("derived", derived());

  const stray = engine.ops.filter((o) => !placed.has(o.id));
  if (stray.length) {
    console.error("✗ api: the engine's document has operations this page does not place:");
    for (const o of stray) console.error(`    ${o.method} ${o.path}  (${o.id})`);
    console.error("  Add each to IN_SECTION in build-api.mjs, under the section it belongs to.");
    process.exit(1);
  }
  return out;
}

const check = process.argv.includes("--check");
const loaded = {};
for (const [name, src] of Object.entries(SOURCES)) {
  const doc = parse(await load(name, src));
  loaded[name] = {
    title: doc.info?.title ?? name,
    version: doc.info?.version ?? "",
    ops: operations(doc),
  };
}

const filled = sections(loaded.engine, loaded.connector);
const page = fs.readFileSync(PAGE, "utf8");
let next = page;

for (const [key, body] of filled) {
  const open = `<!-- ops:${key} -->`;
  const from = next.indexOf(open);
  if (from < 0) {
    console.error(`✗ api: api/index.html has no ${open} to fill`);
    process.exit(1);
  }
  const to = next.indexOf(CLOSE, from);
  if (to < 0) {
    console.error(`✗ api: ${open} is never closed by ${CLOSE}`);
    process.exit(1);
  }
  next = next.slice(0, from + open.length) + "\n" + body + "\n      " + next.slice(to);
}

const counted = `${loaded.engine.ops.length} engine and ${loaded.connector.ops.length} connector operations`;
if (check) {
  if (next === page) {
    console.log(`  ✓ api/index.html holds ${counted}, as the pinned documents say`);
  } else {
    console.log("  ✗ api/index.html is not what the pinned documents say — run: npm run api");
    process.exit(1);
  }
} else {
  fs.writeFileSync(PAGE, next);
  console.log(`  wrote api/index.html: ${counted}`);
}
