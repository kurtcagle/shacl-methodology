#!/usr/bin/env python3
"""Tool-library toy: competency questions, lemmas, SHACL shapes, one report."""
from collections import Counter, defaultdict
from pathlib import Path

from rdflib import RDF, Dataset, Graph, Namespace, URIRef
from rdflib.namespace import SH
from pyshacl import validate

HERE = Path(__file__).parent
TL = Namespace("https://example.org/toollib#")
LEM = Namespace("https://example.org/lemma#")
TODAY = "2026-11-21"


def load(name):
    g = Graph()
    g.parse(HERE / name, format="turtle")
    return g


def run_query(g, name, **params):
    text = (HERE / "queries" / name).read_text()
    for key, value in params.items():
        text = text.replace("{{%s}}" % key, str(value))
    return g.query(text)


def short(term):
    return str(term).split("#")[-1]


def violations(report_graph):
    """(focus, source shape) pairs for every sh:Violation in a report."""
    out = set()
    for r in report_graph.subjects(RDF.type, SH.ValidationResult):
        if report_graph.value(r, SH.resultSeverity) == SH.Violation:
            out.add((report_graph.value(r, SH.focusNode),
                     report_graph.value(r, SH.sourceShape)))
    return out


data, shapes, lemmas = load("data.ttl"), load("shapes.ttl"), load("lemmas.ttl")

# ---- 1. The competency questions, run against the fixture ---------------------
print("== 1. Competency questions on the fixture ==")
rows = list(run_query(data, "cq1.rq"))
print(f"CQ1 on loan: {len(rows)} open loans ->",
      ", ".join(f"{short(r.item)}/{short(r.member)}" for r in rows))
rows = list(run_query(data, "cq2.rq", today=TODAY))
print(f"CQ2 overdue on {TODAY}: {len(rows)} ->",
      ", ".join(f"{short(r.loan)} (due {r.due})" for r in rows))
for member, item in [("memberC", "washer"), ("memberA", "washer"),
                     ("memberC", "sander"), ("memberC", "saw")]:
    answer = run_query(data, "cq3.rq", member=TL[member], item=TL[item]).askAnswer
    print(f"CQ3 can {member} borrow {item}? {answer}")
rows = list(run_query(data, "cq4.rq"))
bound = sum(1 for r in rows if r.value is not None)
print(f"CQ4 replacement cost: answerable for {bound} of {len(rows)} items")

# ---- 2. The shapes, reported per lemma --------------------------------------
print("\n== 2. Lemma conformance (SHACL report grouped by lemma) ==")
conforms, report, _ = validate(data, shacl_graph=shapes, inference="none")

shape_to_lemma = {}
for predicate in (LEM.enforcedBy, LEM.guardedBy):
    for lemma, shape in lemmas.subject_objects(predicate):
        shape_to_lemma[shape] = lemma

counts = defaultdict(Counter)
for r in report.subjects(RDF.type, SH.ValidationResult):
    lemma = shape_to_lemma.get(report.value(r, SH.sourceShape))
    counts[lemma][short(report.value(r, SH.resultSeverity))] += 1

print(f"{'lemma':6} {'level':9} {'Violation':>9} {'Warning':>8} {'Info':>5}  verdict")
for lemma in sorted(lemmas.subjects(RDF.type, LEM.Lemma)):
    level = lemmas.value(lemmas.value(lemma, LEM.level), URIRef("http://www.w3.org/2004/02/skos/core#notation"))
    c = counts[lemma]
    if c["Violation"]:
        verdict = "BREACHED"
    elif c["Warning"]:
        verdict = f"gap ({c['Warning']} items)"
    elif c["Info"]:
        verdict = f"unused by {c['Info']} items"
    else:
        verdict = "ok"
    print(f"{short(lemma):6} {str(level):9} {c['Violation']:>9} {c['Warning']:>8} {c['Info']:>5}  {verdict}")

# ---- 3. Lints over the lemma layer ------------------------------------------
print("\n== 3. Lemma-layer lints ==")
mismatch = 0
for lemma, level in lemmas.subject_objects(LEM.level):
    expected = lemmas.value(level, LEM.severity)
    for shape in lemmas.objects(lemma, LEM.enforcedBy):
        actual = shapes.value(shape, SH.severity)
        if actual != expected:
            mismatch += 1
            print(f"  severity mismatch: {short(lemma)} implies {short(expected)}, {short(shape)} has {short(actual)}")
print(f"  level/severity agreement: {'ok' if not mismatch else str(mismatch) + ' mismatches'}")
orphans = [short(l) for l in lemmas.subjects(RDF.type, LEM.Lemma)
           if not list(lemmas.objects(l, LEM.fromQuestion))]
print(f"  lemmas with no question behind them: {orphans or 'none'}")

# ---- 4. Candidate gate -------------------------------------------------------
print("\n== 4. Candidate assertions: validate before promotion ==")
ACCEPTED, CANDIDATE = URIRef("urn:tl:accepted"), URIRef("urn:tl:candidate")
PREFIXES = ("@prefix tl: <https://example.org/toollib#> .\n"
            "@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .\n")
BAD = PREFIXES + 'tl:mower a tl:Item ; rdfs:label "Lawn mower" ; tl:status tl:Available ; tl:replacementValue "about 150" .'
GOOD = PREFIXES + 'tl:mower a tl:Item ; rdfs:label "Lawn mower" ; tl:status tl:Available ; tl:replacementValue 150.00 .'

ds = Dataset()
accepted = ds.graph(ACCEPTED)
accepted += data
baseline = violations(validate(accepted, shacl_graph=shapes, inference="none")[1])


def gate(candidate_ttl):
    candidate = ds.graph(CANDIDATE)
    candidate.remove((None, None, None))
    candidate.parse(data=candidate_ttl, format="turtle")
    union = Graph()
    union += accepted
    union += candidate
    new = violations(validate(union, shacl_graph=shapes, inference="none")[1]) - baseline
    return candidate, new


for label, text in [("extracted 'about 150'", BAD), ("corrected 150.00", GOOD)]:
    cand, new = gate(text)
    if new:
        names = ", ".join(f"{short(f)} breaks {short(shape_to_lemma.get(s, s))}" for f, s in sorted(new))
        print(f"  candidate {label}: REJECTED ({names})")
    else:
        ds.update("INSERT { GRAPH <urn:tl:accepted> { ?s ?p ?o } } "
                  "WHERE { GRAPH <urn:tl:candidate> { ?s ?p ?o } }")
        print(f"  candidate {label}: promoted; accepted graph now holds "
              f"{len(accepted)} triples")
