import fs from "fs";

export const PREFIXES = "@prefix tl: <https://example.org/toollib#> .\n@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .\n";

// Load the toy's files from a directory (default: the Python toy one level up).
export function defaults(dir = new URL("../", import.meta.url).pathname) {
  const f = {};
  for (const n of ["data.ttl", "shapes.ttl", "lemmas.ttl"]) f[n] = fs.readFileSync(dir + n, "utf8");
  for (const n of fs.readdirSync(dir + "queries")) f["queries/" + n] = fs.readFileSync(dir + "queries/" + n, "utf8");
  f["candidate-extracted.ttl"] = PREFIXES + '\ntl:mower a tl:Item ; rdfs:label "Lawn mower" ; tl:status tl:Available ; tl:replacementValue "about 150" .\n';
  f["candidate-corrected.ttl"] = PREFIXES + '\ntl:mower a tl:Item ; rdfs:label "Lawn mower" ; tl:status tl:Available ; tl:replacementValue 150.00 .\n';
  return f;
}
