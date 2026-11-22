// Compares the browser engine's report with the Python toy's (rdflib + pyshacl)
// on the fixture and on the three "Try an edit" scenarios.
// Needs: pip install rdflib pyshacl; npm install.
import fs from "fs";
import os from "os";
import path from "path";
import { execSync } from "child_process";
import { runToy } from "../src/toy.js";
import { defaults } from "../defaults.mjs";

const toyDir = new URL("../../", import.meta.url).pathname;
const EDITS = {
  base: "",
  due: '\ntl:loan7 tl:dueDate "2026-12-05"^^xsd:date .\n',
  "return": '\ntl:loan3 tl:returnedDate "2026-11-20"^^xsd:date .\n',
  value: "\ntl:tilecutter tl:replacementValue 180.00 .\ntl:trimmer tl:replacementValue 95.00 .\ntl:sander tl:replacementValue 120.00 .\n",
};

let bad = 0;
for (const [name, extra] of Object.entries(EDITS)) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "toy-" + name + "-"));
  fs.cpSync(toyDir, dir, { recursive: true, filter: (p) => !p.includes(path.sep + "web") });
  fs.appendFileSync(path.join(dir, "data.ttl"), extra);
  const files = defaults(dir + "/");
  files.__defaults = defaults(toyDir);
  const js = (await runToy(files, "2026-11-21")).join("\n") + "\n";
  const py = execSync("python3 run.py", { cwd: dir }).toString();
  const ok = js === py;
  if (!ok) bad++;
  console.log(name.padEnd(7), ok ? "IDENTICAL" : "DIFFERENT");
}
process.exit(bad ? 1 : 0);
