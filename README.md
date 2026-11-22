# SHACL-Based Ontology Design Methodology

> **A Practitioner's Methodology for SHACL-Based Ontology Design**  
> An Iterative, Governance-First Framework — Version 2.0  
> Aligned with SHACL 1.2 (Working Draft, 05 January 2026)

[![License: CC BY 4.0](https://img.shields.io/badge/License-CC%20BY%204.0-blue.svg)](https://creativecommons.org/licenses/by/4.0/)
[![SHACL 1.2](https://img.shields.io/badge/SHACL-1.2%20WD-2E75B6)](https://www.w3.org/TR/shacl12-core/)
[![W3C RDF Stack](https://img.shields.io/badge/W3C-RDF%20Stack-1F4E79)](https://www.w3.org/RDF/)

---

## Overview

This repository contains a practitioner's methodology for designing ontologies using SHACL (Shapes Constraint Language), developed from over eight years of applied SHACL work across enterprise knowledge graph projects.

**This is not an OWL methodology adapted for SHACL.** SHACL design is fundamentally different from OWL-based ontology design: it is data-shape-first rather than class-hierarchy-first, constraint-driven rather than inference-driven, and benefits from an iterative cycle rather than a waterfall sequence.

### Key Principles

- **Governance first** — scope, stewardship, and conflict resolution must be established before schema work begins
- **Exemplar-driven** — write instance data in Turtle before writing shapes
- **Iterative, not sequential** — Phases 2–7 form an explicit feedback cycle with defined re-entry points
- **Exit-criteria gated** — each phase has observable completion conditions, not subjective quality standards
- **LLM-assisted, engineer-decided** — specific prompt patterns and guard-rail checklists for every LLM touchpoint

---

## Repository Structure

```
shacl-methodology/
├── README.md                          ← You are here
├── LICENSE
├── docs/
│   ├── README.md                      ← Document guide
│   ├── shacl_methodology_v2.md        ← Full methodology (Markdown)
│   ├── shacl_methodology_v2.docx      ← Full methodology (Word)
│   └── shacl_methodology_v2.pdf       ← Full methodology (PDF)
├── examples/
│   ├── edutrainer/                    ← Worked example: ontology, shapes, competency queries
│   └── toollib/                       ← Competency questions, levelled lemmas and shapes (Python + browser)
└── diagrams/
    ├── README.md                      ← Diagram guide
    ├── 01_design_cycle.mmd            ← The iterative design cycle
    ├── 01_design_cycle.png
    ├── 02_phase_timeline.mmd          ← Phase overview timeline
    ├── 02_phase_timeline.png
    ├── 03_governance_structure.mmd    ← Governance roles and artefacts
    ├── 03_governance_structure.png
    ├── 04_taxonomy_reification.mmd    ← Phase 3 decision flow
    ├── 04_taxonomy_reification.png
    ├── 05_shape_composition.mmd       ← Abstract shape patterns
    ├── 05_shape_composition.png
    ├── 06_validation_loop.mmd         ← Phase 6 validation feedback
    ├── 06_validation_loop.png
    ├── 07_llm_guardrails.mmd          ← LLM integration points
    ├── 07_llm_guardrails.png
    ├── 08_imports_architecture.mmd    ← owl:imports module structure
    └── 08_imports_architecture.png
```

---

## The Design Cycle at a Glance

```
┌─────────────────────────────────────────────┐
│  FOUNDATIONS (Once)                         │
│  Phase 0: Governance & Scope                │
│  Phase 1: Namespace Strategy                │
└───────────────────┬─────────────────────────┘
                    ▼
┌─────────────────────────────────────────────┐
│  ITERATIVE CYCLE                            │
│                                             │
│  Phase 2: Use Case & Exemplar Sketching     │
│       ↕  (bidirectional)                    │
│  Phase 3: Taxonomy & Reification ID         │
│       ↓                                     │
│  Phase 4: First-Pass Schema Generation      │
│       ↓                                     │
│  Phase 5: Abstract Shape Construction       │
│       ↓                                     │
│  Phase 6: Validation, Testing & Regression  │
│       ↓                                     │
│  Phase 7: Stakeholder Review & Revision ────┤
│       │                                     │
│       ├── Exemplar problems → Phase 2       │
│       ├── Schema-only fixes → Phase 4       │
│       └── Validation failures → Phase 5    │
└───────────────────┬─────────────────────────┘
                    ▼ (exit criteria met)
┌─────────────────────────────────────────────┐
│  POST-CYCLE                                 │
│  Phase 8: Transformer & Integration Dev     │
│  Phase 9: Ongoing Governance                │
└─────────────────────────────────────────────┘
```

See [`diagrams/01_design_cycle.png`](diagrams/01_design_cycle.png) for the full rendered version.

---

## SHACL 1.2 Alignment

This methodology incorporates features from the SHACL 1.2 Working Draft (05 January 2026). Key integrations:

| Feature | Phase | Usage |
|---|---|---|
| `sh:reifierShape` | 3, 4 | Relationship-level annotation constraints |
| `sh:targetWhere` | 2, 7 | Use-case-specific shape targeting |
| `sh:conformanceDisallows` | 0, 6 | Governance-aligned conformance control |
| `sh:codeIdentifier` | 4, 7 | Code generation binding names |
| `sh:memberShape` | 5 | RDF list member constraints |
| `sh:singleLine` | 4 | Identifier/label string constraints |
| `IMPORTS` in SHACLC | 1 | Clean compact syntax import declarations |

> **Note:** SHACL 1.2 is a Working Draft, not yet a W3C Recommendation. Verify processor conformance before using 1.2-specific features in production.

---

## Tooling Referenced

### SHACL Processors
- [Apache Jena SHACL](https://jena.apache.org/documentation/shacl/) — follows `owl:imports` transitively ✓
- [pyshacl](https://github.com/RDFLib/pySHACL) — Python, SHACL Core + SHACL-SPARQL, CI-friendly
- [rdf-validate-shacl](https://github.com/zazuko/rdf-validate-shacl) — Node.js, RDF.js ecosystem

### Diagram Generation from SHACL
- [SHACL Play!](https://shacl-play.sparna.fr/play/) — online, PlantUML output
- [semanticz-shaclviz](https://github.com/cognizone/semanticz-shaclviz) — Java/Gradle, yEd TGF output
- [shacl2plantuml](https://github.com/rosecky/shacl2plantuml) — OWL+SHACL, follows imports

### Transformation
- [SPARQL-Anything](https://sparql-anything.cc/) — virtual RDF from CSV, JSON, XML
- [TARQL](https://github.com/tarql/tarql) — CSV-to-RDF via SPARQL CONSTRUCT

---

## Changelog

### v2.0 (March 2026)
- Restructured from waterfall sequence to explicit iterative cycle
- Added exit criteria for every phase
- Phase 3 (Taxonomy + Reification) now treated as coupled bidirectional process
- Added SHACL 1.2 feature integration throughout
- Added `sh:reifierShape` worked examples
- Expanded namespace strategy with concrete patterns and tradeoffs
- Added LLM guard-rail checklists with CRITICAL item flagging
- Added Phase 6 test suite specification and CI pipeline guidance
- Added conflict resolution mechanisms in stakeholder review
- Added `ex:inScope` scope enforcement annotation pattern
- Added `sh:conformanceDisallows` governance integration

### v1.0 (original)
- Initial practitioner methodology, eight phases, sequential structure

---

## Citation

```bibtex
@misc{cagle2026shacl,
  title     = {A Practitioner's Methodology for SHACL-Based Ontology Design},
  author    = {Cagle, Kurt},
  year      = {2026},
  version   = {2.0},
  publisher = {The Ontologist},
  url       = {https://github.com/kurtcagle/shacl-methodology}
}
```

---

## License

This work is licensed under [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/).

You are free to share and adapt this material for any purpose, provided appropriate credit is given.

---

*Kurt Cagle · [The Ontologist](https://ontologist.substack.com) · [The Cagle Report](https://linkedin.com/in/kurtcagle)*
