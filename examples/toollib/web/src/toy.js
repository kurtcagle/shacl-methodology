// Browser port of the tool-library toy: N3.js for Turtle, Comunica for SPARQL,
// and a small SHACL validator covering the constructs the toy's shapes use.
import { QueryEngine } from "@comunica/query-sparql-rdfjs";
import { Parser, Store, DataFactory } from "n3";

const { namedNode, quad } = DataFactory;
const SH = "http://www.w3.org/ns/shacl#";
const RDF_TYPE = namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type");
const SUBCLASS = namedNode("http://www.w3.org/2000/01/rdf-schema#subClassOf");
const XSD = "http://www.w3.org/2001/XMLSchema#";
const LEM = "https://example.org/lemma#";
const SKOS_NOTATION = namedNode("http://www.w3.org/2004/02/skos/core#notation");
const TL = "https://example.org/toollib#";
const sh = (n) => namedNode(SH + n);
const lem = (n) => namedNode(LEM + n);

const SUPPORTED = new Set(["targetClass", "property", "path", "class", "datatype", "minCount", "maxCount",
  "severity", "message", "qualifiedValueShape", "qualifiedMaxCount", "qualifiedMinCount", "inversePath",
  "sparql", "select", "prefixes", "declare", "prefix", "namespace"]);

let engine = null;
const getEngine = () => (engine ||= new QueryEngine());

function parse(name, text) {
  try {
    const store = new Store();
    store.addQuads(new Parser({ format: "text/turtle" }).parse(text));
    return store;
  } catch (err) {
    throw new Error("Could not parse " + name + ": " + err.message);
  }
}

const short = (term) => String(term && term.value !== undefined ? term.value : term).split("#").pop();
const pyBool = (b) => (b ? "True" : "False");
const pyList = (xs) => "[" + xs.map((x) => "'" + x + "'").join(", ") + "]";

// ---- SPARQL helpers ---------------------------------------------------------
async function select(store, text) {
  const stream = await getEngine().queryBindings(text, { sources: [store] });
  return stream.toArray();
}
async function ask(store, text) {
  return getEngine().queryBoolean(text, { sources: [store] });
}
function fill(text, params) {
  let out = text;
  for (const [k, v] of Object.entries(params)) out = out.split("{{" + k + "}}").join(String(v));
  return out;
}

// ---- Mini SHACL -------------------------------------------------------------
function subclassClosure(data, cls) {
  const seen = new Set([cls.value]);
  const todo = [cls];
  while (todo.length) {
    const c = todo.pop();
    for (const q of data.getQuads(null, SUBCLASS, c, null)) {
      if (!seen.has(q.subject.value)) { seen.add(q.subject.value); todo.push(q.subject); }
    }
  }
  return [...seen].map((v) => namedNode(v));
}
function instances(data, cls) {
  const out = new Map();
  for (const c of subclassClosure(data, cls))
    for (const s of data.getSubjects(RDF_TYPE, c, null)) out.set(s.value, s);
  return [...out.values()];
}
function isInstance(data, node, cls) {
  if (node.termType === "Literal") return false;
  return subclassClosure(data, cls).some((c) => data.has(quad(node, RDF_TYPE, c)));
}
function lexicalOk(lit) {
  const dt = lit.datatype && lit.datatype.value;
  const v = lit.value;
  if (dt === XSD + "decimal") return /^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(v);
  if (dt === XSD + "integer") return /^[+-]?\d+$/.test(v);
  if (dt === XSD + "boolean") return /^(true|false|1|0)$/.test(v);
  if (dt === XSD + "date") {
    const m = /^(-?\d{4,})-(\d{2})-(\d{2})(Z|[+-]\d{2}:\d{2})?$/.exec(v);
    if (!m) return false;
    const d = new Date(Date.UTC(Math.abs(+m[1]), +m[2] - 1, +m[3]));
    return +m[2] >= 1 && +m[2] <= 12 && d.getUTCDate() === +m[3];
  }
  return true;
}
function valueNodes(shapes, data, path, focus) {
  if (path.termType === "NamedNode") return data.getObjects(focus, path, null);
  const inv = shapes.getObjects(path, sh("inversePath"), null)[0];
  if (inv) return data.getSubjects(inv, focus, null);
  return [];
}
const num = (shapes, node, p) => {
  const o = shapes.getObjects(node, sh(p), null)[0];
  return o ? Number(o.value) : null;
};
const severityOf = (shapes, node) => shapes.getObjects(node, sh("severity"), null)[0] || sh("Violation");

// All results for one property shape against one focus node.
function evalProperty(shapes, data, ps, focus) {
  const out = [];
  const path = shapes.getObjects(ps, sh("path"), null)[0];
  if (!path) return out;
  const values = valueNodes(shapes, data, path, focus);
  const add = (component) => out.push({ focus, source: ps, severity: severityOf(shapes, ps), component });
  const min = num(shapes, ps, "minCount"), max = num(shapes, ps, "maxCount");
  if (min !== null && values.length < min) add("minCount");
  if (max !== null && values.length > max) add("maxCount");
  for (const cls of shapes.getObjects(ps, sh("class"), null))
    for (const v of values) if (!isInstance(data, v, cls)) add("class");
  for (const dt of shapes.getObjects(ps, sh("datatype"), null))
    for (const v of values)
      if (v.termType !== "Literal" || v.datatype.value !== dt.value || !lexicalOk(v)) add("datatype");
  for (const qs of shapes.getObjects(ps, sh("qualifiedValueShape"), null)) {
    const conforming = values.filter((v) => evalProperty(shapes, data, qs, v).length === 0).length;
    const qmax = num(shapes, ps, "qualifiedMaxCount"), qmin = num(shapes, ps, "qualifiedMinCount");
    if (qmax !== null && conforming > qmax) add("qualifiedMaxCount");
    if (qmin !== null && conforming < qmin) add("qualifiedMinCount");
  }
  return out;
}

async function evalSparql(shapes, data, shape, constraint, focuses, notes) {
  const select_ = shapes.getObjects(constraint, sh("select"), null)[0];
  if (!select_) return [];
  const decls = [];
  for (const pre of shapes.getObjects(constraint, sh("prefixes"), null))
    for (const d of shapes.getObjects(pre, sh("declare"), null)) {
      const p = shapes.getObjects(d, sh("prefix"), null)[0], n = shapes.getObjects(d, sh("namespace"), null)[0];
      if (p && n) decls.push("PREFIX " + p.value + ": <" + n.value + ">");
    }
  let body = select_.value.split("$this").join("?this");
  if (!/WHERE\s*\{/i.test(body)) { notes.push("sh:select on " + short(shape) + " has no WHERE block; skipped."); return []; }
  const values = focuses.map((f) => "<" + f.value + ">").join(" ");
  if (!values) return [];
  body = body.replace(/WHERE\s*\{/i, "WHERE { VALUES ?this { " + values + " } ");
  const rows = await select(data, decls.join("\n") + "\n" + body);
  const severity = shapes.getObjects(constraint, sh("severity"), null)[0] || severityOf(shapes, shape);
  return rows.map((r) => ({ focus: r.get("this"), source: shape, severity, component: "sparql" }));
}

async function validate(data, shapes, notes) {
  const results = [];
  const checked = new Set();
  for (const q of shapes.getQuads(null, sh("targetClass"), null, null)) {
    const shape = q.subject;
    const focuses = instances(data, q.object);
    for (const ps of shapes.getObjects(shape, sh("property"), null))
      for (const f of focuses) results.push(...evalProperty(shapes, data, ps, f));
    for (const c of shapes.getObjects(shape, sh("sparql"), null))
      results.push(...(await evalSparql(shapes, data, shape, c, focuses, notes)));
  }
  for (const q of shapes.getQuads(null, null, null, null)) {
    if (q.predicate.value.startsWith(SH)) {
      const local = q.predicate.value.slice(SH.length);
      if (!SUPPORTED.has(local) && !checked.has(local)) {
        checked.add(local);
        notes.push("This page's validator does not implement sh:" + local + "; shapes using it are not fully checked.");
      }
    }
  }
  return results;
}

const violations = (results) =>
  new Map(results.filter((r) => r.severity.value === SH + "Violation").map((r) => [r.focus.value + "|" + r.source.value, r]));

// ---- The run ----------------------------------------------------------------
export async function runToy(files, today) {
  const out = [];
  const print = (s = "") => out.push(s);
  const data = parse("data.ttl", files["data.ttl"]);
  const shapes = parse("shapes.ttl", files["shapes.ttl"]);
  const lemmas = parse("lemmas.ttl", files["lemmas.ttl"]);
  const q = (n) => files["queries/" + n];

  print("== 1. Competency questions on the fixture ==");
  let rows = await select(data, q("cq1.rq"));
  print(`CQ1 on loan: ${rows.length} open loans -> ` + rows.map((r) => `${short(r.get("item"))}/${short(r.get("member"))}`).join(", "));
  rows = await select(data, fill(q("cq2.rq"), { today }));
  print(`CQ2 overdue on ${today}: ${rows.length} -> ` + rows.map((r) => `${short(r.get("loan"))} (due ${r.get("due").value})`).join(", "));
  for (const [member, item] of [["memberC", "washer"], ["memberA", "washer"], ["memberC", "sander"], ["memberC", "saw"]]) {
    const answer = await ask(data, fill(q("cq3.rq"), { member: TL + member, item: TL + item }));
    print(`CQ3 can ${member} borrow ${item}? ${pyBool(answer)}`);
  }
  rows = await select(data, q("cq4.rq"));
  const bound = rows.filter((r) => r.get("value") !== undefined).length;
  print(`CQ4 replacement cost: answerable for ${bound} of ${rows.length} items`);

  print("");
  print("== 2. Lemma conformance (SHACL report grouped by lemma) ==");
  const notes = [];
  const report = await validate(data, shapes, notes);
  const shapeToLemma = new Map();
  for (const p of ["enforcedBy", "guardedBy"])
    for (const qd of lemmas.getQuads(null, lem(p), null, null)) shapeToLemma.set(qd.object.value, qd.subject.value);
  const counts = new Map();
  for (const r of report) {
    const l = shapeToLemma.get(r.source.value);
    if (!counts.has(l)) counts.set(l, { Violation: 0, Warning: 0, Info: 0 });
    counts.get(l)[short(r.severity)] += 1;
  }
  print(`${"lemma".padEnd(6)} ${"level".padEnd(9)} ${"Violation".padStart(9)} ${"Warning".padStart(8)} ${"Info".padStart(5)}  verdict`);
  const lemmaList = lemmas.getSubjects(RDF_TYPE, lem("Lemma"), null).map((t) => t.value).sort();
  for (const l of lemmaList) {
    const lvl = lemmas.getObjects(namedNode(l), lem("level"), null)[0];
    const notation = lvl ? (lemmas.getObjects(lvl, SKOS_NOTATION, null)[0] || { value: "" }).value : "";
    const c = counts.get(l) || { Violation: 0, Warning: 0, Info: 0 };
    let verdict = "ok";
    if (c.Violation) verdict = "BREACHED";
    else if (c.Warning) verdict = `gap (${c.Warning} items)`;
    else if (c.Info) verdict = `unused by ${c.Info} items`;
    print(`${short(l).padEnd(6)} ${notation.padEnd(9)} ${String(c.Violation).padStart(9)} ${String(c.Warning).padStart(8)} ${String(c.Info).padStart(5)}  ${verdict}`);
  }
  for (const n of notes) print("note: " + n);

  print("");
  print("== 3. Lemma-layer lints ==");
  let mismatch = 0;
  for (const qd of lemmas.getQuads(null, lem("level"), null, null)) {
    const expected = lemmas.getObjects(qd.object, lem("severity"), null)[0];
    for (const shape of lemmas.getObjects(qd.subject, lem("enforcedBy"), null)) {
      const actual = shapes.getObjects(shape, sh("severity"), null)[0];
      if (!actual || !expected || actual.value !== expected.value) {
        mismatch += 1;
        print(`  severity mismatch: ${short(qd.subject)} implies ${expected ? short(expected) : "none"}, ${short(shape)} has ${actual ? short(actual) : "none"}`);
      }
    }
  }
  print(`  level/severity agreement: ${mismatch ? mismatch + " mismatches" : "ok"}`);
  const orphans = lemmaList.filter((l) => lemmas.getObjects(namedNode(l), lem("fromQuestion"), null).length === 0).map(short);
  print(`  lemmas with no question behind them: ${orphans.length ? pyList(orphans) : "none"}`);

  print("");
  print("== 4. Candidate assertions: validate before promotion ==");
  const ACCEPTED = namedNode("urn:tl:accepted"), CANDIDATE = namedNode("urn:tl:candidate");
  const ds = new Store();
  for (const qd of data.getQuads(null, null, null, null)) ds.addQuad(quad(qd.subject, qd.predicate, qd.object, ACCEPTED));
  const inDefault = (...graphs) => {
    const s = new Store();
    for (const g of graphs) for (const qd of ds.getQuads(null, null, null, g)) s.addQuad(quad(qd.subject, qd.predicate, qd.object));
    return s;
  };
  const baseline = violations(await validate(inDefault(ACCEPTED), shapes, []));
  const cands = [["extracted 'about 150'", "candidate-extracted.ttl"], ["corrected 150.00", "candidate-corrected.ttl"]];
  for (const [label, file] of cands) {
    const shown = files[file] === files.__defaults[file] ? label : "from " + file;
    const cq = parse(file, files[file]);
    for (const qd of ds.getQuads(null, null, null, CANDIDATE)) ds.removeQuad(qd);
    for (const qd of cq.getQuads(null, null, null, null)) ds.addQuad(quad(qd.subject, qd.predicate, qd.object, CANDIDATE));
    const after = violations(await validate(inDefault(ACCEPTED, CANDIDATE), shapes, []));
    const fresh = [...after.entries()].filter(([k]) => !baseline.has(k)).map(([, r]) => r)
      .sort((a, b) => (a.focus.value + a.source.value < b.focus.value + b.source.value ? -1 : 1));
    if (fresh.length) {
      const names = fresh.map((r) => `${short(r.focus)} breaks ${short(shapeToLemma.has(r.source.value) ? shapeToLemma.get(r.source.value) : r.source.value)}`).join(", ");
      print(`  candidate ${shown}: REJECTED (${names})`);
    } else {
      await getEngine().queryVoid(
        "INSERT { GRAPH <urn:tl:accepted> { ?s ?p ?o } } WHERE { GRAPH <urn:tl:candidate> { ?s ?p ?o } }",
        { sources: [ds], destination: ds });
      print(`  candidate ${shown}: promoted; accepted graph now holds ${ds.countQuads(null, null, null, ACCEPTED)} triples`);
    }
  }
  return out;
}
