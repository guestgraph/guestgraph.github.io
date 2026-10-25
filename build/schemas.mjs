// The schemas an instance is written against: its core, vendored at `<units>/core/`, and the
// pack folders its `.companygraph/manifest.json` lists, vendored beside it at `<units>/<pack>/`.
// Core's files travel under bare keys and a pack's under `<pack>/<file>`, which is how the
// parser tells them apart (R20) and how meta-model's own `readInstance` hands them over.
// `read(sub)` returns the files under one folder of the instance's repository with that
// prefix stripped, whether from a checkout or from GitHub.
export async function readSchemas(read) {
  const where = ".companygraph/manifest.json";
  const text = await read(where, { file: true });
  let manifest = {};
  if (text !== undefined) {
    try { manifest = JSON.parse(text); }
    catch (e) { throw new Error(`${where} is not valid JSON: ${e.message}`); }
  }
  const packs = manifest.packs ?? [];
  if (!Array.isArray(packs) || packs.some((p) => typeof p !== "string"))
    throw new Error(`${where}: "packs" must be an array of pack names, got ${JSON.stringify(packs)}`);
  const units = manifest.units ?? "meta";
  const schemas = new Map(await read(`${units}/core/`));
  for (const pack of packs) {
    let files;
    try { files = await read(`${units}/${pack}/`); }
    catch (e) { if (e?.code !== "ENOENT") throw e; files = new Map(); }
    if (files.size === 0)
      throw new Error(`${where} lists the pack "${pack}", but ${units}/${pack}/ has no files in the instance`);
    for (const [file, text] of files) schemas.set(`${pack}/${file}`, text);
  }
  return schemas;
}
