# Tool-Library Lemma Toy

Companion files for an Ontologist article on competency questions, lemmas and shapes (link to follow on publication). A small library that lends tools to members, used to show one pattern end to end: a competency question is answered by SPARQL, a lemma (a necessary condition with an RFC 2119 level) becomes a SHACL shape whose severity follows the level, and lineage hangs off the lemma.

Two ways to run it:

- **Python reference** (this directory): `run.py` on rdflib and pyshacl.
- **Browser version** (`web/`): the same loop in pure JavaScript (N3.js, Comunica and a small SHACL validator written for these shapes). A hosted copy runs without installing anything: [Tool Library Lemma Toy](https://claude.ai/artifact/ME7SWehXsfShsrKeFF6vZ1).

## Files

| File | Role |
|---|---|
| `data.ttl` | Fixture: 7 items, 3 members, 7 loans, with planted defects |
| `lemmas.ttl` | Levels (MUST/MUST NOT/SHOULD/MAY), four competency questions, lemmas L1 to L8 |
| `shapes.ttl` | SHACL shapes; severity follows each lemma's level |
| `queries/cq1.rq` to `cq4.rq` | The competency questions as SPARQL |
| `run.py` | Runs the questions, validates, groups the report by lemma, lints the lemma layer, gates candidate assertions |

## Run

```bash
pip install rdflib pyshacl
python3 run.py
```

Tested with rdflib 7.6.0 and pyshacl 0.40.2. "Today" for CQ2 is set in `run.py` (`TODAY`).

## Planted defects

| Defect | Caught by |
|---|---|
| Loan with no due date (loan7) | L2 |
| Withdrawn item on an open loan (loan4) | L4 |
| Item marked Available while on an open loan (saw, loan3) | L5 |
| Member with three open loans (Member A) | L6 |
| Three items with no replacement value | L7 (Warning) |
| Six items with no condition note | L8 (Info) |

## Browser version

```bash
cd web
npm install
npm run build   # bundles src/toy.js to toy.js (no eval, so it runs under a strict CSP)
npm test        # compares its report with run.py on the fixture and three edits
```

`index.html` loads `toy.js` and works from any static host. The JavaScript validator supports only the SHACL terms these shapes use (`targetClass`, `sh:property`, `class`, `datatype`, `minCount`, `maxCount`, `qualifiedValueShape`, severity, `sh:sparql`) and prints a note if it meets others. The Python harness remains the reference. `npm test` needs `pip install rdflib pyshacl` as well.

## Relation to the methodology

The methodology document treats competency questions as the source of requirements. This example adds the step from a requirement to a levelled lemma, and from the lemma to a shape and a query. `examples/edutrainer/` shows the same loop on an ontology rather than on data.

## Licence

CC BY 4.0, as for the rest of the repository.
