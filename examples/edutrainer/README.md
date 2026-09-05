# EduTrainer Worked Example

Companion files for ["Should AIs Construct Your Ontology?"](https://ontologist.substack.com) (The Ontologist) - a small, fully worked example of the competency-question-driven design process described in the methodology, applied to a fictional company producing educational training materials with certifications.

## Files

| File | Contents |
|---|---|
| `edu-ontology.ttl` | The `edu:` vocabulary - 11 classes, 20 properties, RDFS + SKOS - generated against six competency questions (CQ-1 through CQ-6). |
| `edu-shapes.ttl` | The full SHACL shapes graph validating the ontology - 8 node shapes, all constraints as named property shapes (no blank nodes), each carrying an `edu:addressesCQ` annotation back to the CQ it was written to satisfy. |
| `edu-examples.ttl` | Generic test data covering CQ-1 through CQ-3. Checked against `edu-shapes.ttl` with pyshacl: conforms. |
| `edu-competency-queries.rq` | The three SPARQL queries answering CQ-1 through CQ-3, with expected results noted inline. Run against `edu-ontology.ttl` + `edu-examples.ttl`, all three return exactly the documented results. |
| `edu-invalid-example.ttl` | A deliberately malformed `CertificationAward` (the kind an import script produces when it conflates two source rows and drops a date) plus the actual pyshacl validation report it produces - two `sh:Violation` results, shown for real rather than described. |

## Competency questions covered

1. **CQ-1** - Which certifications has a given learner earned, and are they still valid as of today's date?
2. **CQ-2** - Which course modules, and in what sequence, must a learner complete to qualify for a given certification?
3. **CQ-3** - Which certifications does a client organisation require of employees in a given role, and which of its employees currently fall short?
4. **CQ-4** - Which version of a course did a specific learner complete, and does that version still satisfy the requirements of the certification it was meant to feed?
5. **CQ-5** - Which instructors or assessors are currently authorised to deliver or proctor the exam for a given certification?
6. **CQ-6** - Which learners' certifications will lapse within the next ninety days, broken down by client, so renewal outreach can be scheduled?

All six are addressed by shapes in `edu-shapes.ttl`; worked instance data and queries are provided for CQ-1 through CQ-3. CQ-4 through CQ-6 are left as an exercise - the pattern doesn't change, only the data does.

## A terminology note

This example's shapes use `sh:reifierNode` (per the SHACL 1.2 Working Draft dated 2026-08-28 referenced in the article's generation prompt) to shape the reifier of the `edu:certifies` statement. The main methodology document in this repo uses `sh:reifierShape` for the same purpose. The two drafts appear to have used different working names for this feature at different points - worth reconciling to one term across both documents.

## Running it yourself

```bash
pip install rdflib pyshacl

python3 -c "
import rdflib
g = rdflib.Graph()
g.parse('edu-ontology.ttl', format='turtle')
g.parse('edu-examples.ttl', format='turtle')
for row in g.query(open('edu-competency-queries.rq').read().split(chr(10)+chr(10)+chr(10))[0]):
    print(row)
"

python3 -c "
import pyshacl
conforms, _, report = pyshacl.validate(
    data_graph=open('edu-ontology.ttl').read() + open('edu-examples.ttl').read(),
    shacl_graph=open('edu-shapes.ttl').read(),
    data_graph_format='turtle', shacl_graph_format='turtle',
)
print(conforms)
print(report)
"
```

---

*Kurt Cagle & Chloe Shannon · [The Ontologist](https://ontologist.substack.com)*
