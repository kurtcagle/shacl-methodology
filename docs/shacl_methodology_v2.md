A Practitioner's Methodology for

**SHACL-Based Ontology Design**

*An Iterative, Governance-First Framework*

Kurt Cagle \| The Ontologist \| Version 2.0

Aligned with SHACL 1.2 (Working Draft, January 2026)

**Introduction**

SHACL-based ontology design is fundamentally different from OWL-based
design. OWL is an open-world, inference-driven language: it reasons
about what must be true given partial knowledge. SHACL is a
closed-world, constraint-driven language: it describes what data should
look like, validates that it does, and — increasingly with SHACL 1.2 —
can derive new data through rules. Patterns that work well in OWL often
translate poorly to SHACL, and the reverse is equally true.

This methodology reflects over eight years of applied SHACL work,
revised to address the structural limitations of earlier practitioner
approaches. The most important of those limitations was treating design
as a waterfall: a numbered sequence of steps executed once in order. In
practice, SHACL ontology design is an iterative cycle where exemplars
inform taxonomy, taxonomy informs reification decisions, reification
reveals abstract shape candidates, and abstract shapes send you back to
revise exemplars. This document formalises that cycle.

A second structural improvement is the introduction of explicit exit
criteria for each phase. Without these, teams with less SHACL experience
have no guidance for when a phase is complete enough to advance —
leading either to premature progress or to phases that never close. The
exit criteria defined here are intentionally practical rather than
academic: they describe observable conditions in artefacts, not abstract
standards of quality.

This version is also aligned with SHACL 1.2 (Working Draft, 05 January
2026), integrating new features including sh:reifierShape,
sh:targetWhere, and conformance disallow sets at the appropriate phases
where they materially affect design decisions.

**Core Principles**

Before engaging with the phases, the following principles should be
internalised. They represent the practical wisdom underlying every phase
decision.

**Data Shape First, Class Hierarchy Second**

In OWL design, you typically begin with a class hierarchy and then
describe what instances of those classes look like. In SHACL, the
inverse approach produces better results: describe what your data
actually looks like first (as instance data), and let the shape
hierarchy emerge from those descriptions. This is why the exemplar phase
precedes schema formalisation.

**Constraints Describe, Not Infer**

SHACL shapes are descriptive. A sh:NodeShape says: for the nodes this
shape targets, these constraints must hold. It does not say: therefore
nodes that satisfy these constraints are of this type. This distinction
matters when composing shapes — sh:and combines constraints
conjunctively, it does not establish class membership. This has direct
implications for how upper ontology shapes are designed.

**Relationships Are Often More Interesting Than Entities**

Much of the semantically rich information in any domain lives not in the
properties of individual entities, but in the structured relationships
between them. Marriage, employment, authorship, transaction — these are
relationships that have their own properties (start date, role, context,
provenance). SHACL 1.2's sh:reifierShape makes these first-class design
concerns. Identifying them early prevents the costly late-stage
restructuring that results from modelling them as flat properties.

**LLMs Assist, Engineers Decide**

Large language models are genuinely useful in several phases of this
methodology: comparing exemplars for contradictions, generating
first-pass SHACL, producing test data, and suggesting documentation.
They are not reliable as primary designers. SHACL hallucination patterns
— misuse of sh:node vs sh:class, incorrect property path syntax, wrong
cardinality semantics, confused sh:or vs sh:xone logic — are common
enough that every LLM-generated artefact requires engineer review before
use. This document specifies where LLMs are appropriate and provides
guard-rail checklists for each such use.

**Governance Is Infrastructure, Not Process**

Governance decisions made late in ontology design are expensive.
Decisions about who owns which shapes, how conflicts are resolved, how
the schema is versioned, and what constitutes a breaking change should
be made before any schema work begins — and should be enforced through
the schema artefacts themselves, not just through team agreements.

**The Design Cycle**

The methodology is organised into two foundations and eight iterative
phases. The foundations (governance and namespace strategy) are
established once and do not iterate. The eight phases form a cycle:
Phases 3 through 7 repeat as needed until exit criteria are met, before
advancing to integration and ongoing governance.

|                 |                                                            |
|-----------------|------------------------------------------------------------|
| **FOUNDATIONS** | Phase 0: Governance & Scope \| Phase 1: Namespace Strategy |

|                 |                                                      |
|-----------------|------------------------------------------------------|
| **CYCLE START** | Phase 2: Use Case Development and Exemplar Sketching |

|       |                                                                         |
|-------|-------------------------------------------------------------------------|
| **↓** | Phase 3: Taxonomy and Reification Identification (coupled with Phase 2) |

|       |                                                                         |
|-------|-------------------------------------------------------------------------|
| **↓** | Phase 4: First-Pass Schema Generation (LLM-assisted, engineer-reviewed) |

|       |                                                         |
|-------|---------------------------------------------------------|
| **↓** | Phase 5: Abstract Shape and Upper Ontology Construction |

|       |                                              |
|-------|----------------------------------------------|
| **↓** | Phase 6: Validation, Testing, and Regression |

|         |                                                                       |
|---------|-----------------------------------------------------------------------|
| **↓ ↑** | Phase 7: Stakeholder Review, ERD Documentation, and Governed Revision |

|                |                                                                                 |
|----------------|---------------------------------------------------------------------------------|
| **POST-CYCLE** | Phase 8: Transformer and Integration Development \| Phase 9: Ongoing Governance |

Phases 2 through 7 are explicitly iterative. After Phase 7, the cycle
either advances (if exit criteria are fully met) or returns to Phase 2
or 3 depending on the nature of required revisions. Revisions to
exemplar data return to Phase 2. Revisions to schema structure without
exemplar changes return to Phase 4. Revisions triggered only by
validation failures return to Phase 5.

<table>
<colgroup>
<col style="width: 15%" />
<col style="width: 84%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p>PHASE</p>
<p><strong>0</strong></p></td>
<td><p><strong>Governance and Scope Foundation</strong></p>
<p><em>Establish before any schema work begins — this phase does not
iterate</em></p></td>
</tr>
</tbody>
</table>

**0.1 Scope Definition and Enforcement**

Scope is the most common failure mode in ontology design projects. The
scope definition produced in this phase must be specific enough to be
used as a filter in later phases. Vague scope statements ('we're
modelling the enterprise data model') are not actionable. Specific scope
statements are: 'We are modelling customer orders, product catalogue
items, and fulfilment events for the e-commerce platform. We are not
modelling financial transactions, logistics carrier data, or customer
identity.'

To make scope enforceable within the schema itself, introduce a custom
annotation property from the outset:

> ex:inScope a owl:AnnotationProperty ;
>
> rdfs:label "In Scope" ;
>
> rdfs:range xsd:boolean .

Every node shape produced in subsequent phases receives this annotation.
Shapes that represent boundary entities (things touched but not fully
modelled) receive ex:inScope false. This creates a machine-queryable
scope record that can be audited at any point.

**0.2 Governance Structure**

Governance decisions must be recorded before design begins. The
following table should be completed and distributed to all stakeholders:

|                            |                                                                                                                                                                                                                        |
|----------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Governance Dimension**   | **Decision / Responsible Party**                                                                                                                                                                                       |
| **Schema Owner**           | The individual or role with final authority over shape definitions. Responsible for approving structural changes.                                                                                                      |
| **Domain Stewards**        | Subject-matter experts per domain area. Responsible for approving that exemplars correctly represent domain reality.                                                                                                   |
| **Conflict Resolution**    | The defined process when stakeholder review produces contradictory requirements. Options include: owner decides, working group convenes, requirements are split into separate shapes.                                  |
| **Breaking Change Policy** | What constitutes a breaking change (removing a required property, tightening a constraint) vs. a non-breaking change (adding optional properties, relaxing constraints). Breaking changes require a version increment. |
| **Version Strategy**       | IRI versioning approach (see Phase 1). When versions are incremented, who is notified, and how are downstream consumers informed.                                                                                      |
| **Deprecation Policy**     | How shapes are deprecated: sh:deactivated, version-bearing IRI replacement, or formal owl:deprecated annotation.                                                                                                       |

**0.3 SHACL Severity as Governance Signal**

SHACL's sh:severity levels (sh:Violation, sh:Warning, sh:Info) should be
mapped to governance meaning from the outset, not assigned ad hoc per
shape. A reasonable default mapping is: sh:Violation for constraints
that represent data integrity requirements agreed upon by the Schema
Owner; sh:Warning for constraints that represent domain best practice
recommended by Domain Stewards; sh:Info for constraints that represent
documentation standards or optional enrichment.

SHACL 1.2 introduces sh:conformanceDisallows on the validation report,
allowing precise control over which severity levels trigger a
conformance failure. This should be configured as part of the governance
setup, not left to default.

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>✓ Exit Criteria</strong></p>
<ul>
<li><p>Scope statement is written, specific, and approved by all
stakeholders</p></li>
<li><p>Governance table is complete with named individuals or roles for
all dimensions</p></li>
<li><p>ex:inScope annotation property is defined in the base
namespace</p></li>
<li><p>Severity-to-governance mapping is documented and agreed</p></li>
<li><p>Breaking change policy is documented and understood by all
contributors</p></li>
</ul></td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 15%" />
<col style="width: 84%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p>PHASE</p>
<p><strong>1</strong></p></td>
<td><p><strong>Namespace Strategy</strong></p>
<p><em>Design once — consistency here prevents pain throughout the
project lifecycle</em></p></td>
</tr>
</tbody>
</table>

**1.1 Namespace Patterns**

Namespace strategy is not a bureaucratic formality — it is a fundamental
design decision that affects how the schema can be versioned,
modularised, extended, and imported. The three common patterns, with
their tradeoffs, are:

|                        |                                                                                                                                                                                                                  |
|------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Pattern**            | **Description and Tradeoffs**                                                                                                                                                                                    |
| **Single Namespace**   | All shapes, classes, and properties share one IRI prefix (e.g., https://example.org/schema#). Simple to manage. Becomes unwieldy for large schemas. Cannot be partially imported — the whole schema is one unit. |
| **Domain-Partitioned** | Separate prefixes per domain area (e.g., ex-order:, ex-product:, ex-fulfilment:). Enables selective owl:imports. Requires explicit cross-domain references. Recommended for medium-to-large schemas.             |
| **Version-Bearing**    | IRI includes version number (e.g., https://example.org/schema/v2/). Makes breaking changes explicit at the IRI level. Complicates owl:imports chains. Best combined with domain partitioning.                    |

For most enterprise SHACL projects, domain-partitioned namespaces with a
single unversioned base namespace for stable abstract shapes is the
recommended approach. Version-bearing IRIs should be reserved for
externally published shapes (those used by consumers outside your
organisation).

**1.2 Prefix Declarations and SPARQL Prefix Sharing**

Define your prefix set in a dedicated shared prefix declaration
resource, structured for SHACL 1.2's
sh:prefixes/owl:imports\*/sh:declare path. This allows all SPARQL-based
constraints and validators to share a common prefix registry without
duplication:

> \<https://example.org/prefixes\>
>
> a owl:Ontology ;
>
> sh:declare \[ sh:prefix "ex" ;
>
> sh:namespace "https://example.org/schema#"^^xsd:anyURI \] ;
>
> sh:declare \[ sh:prefix "ex-order" ;
>
> sh:namespace "https://example.org/orders#"^^xsd:anyURI \] .

**1.3 Shape IRI Conventions**

Establish a consistent naming convention for shapes, property shapes,
and reusable blank-node-replacing named shapes. A practical convention:
node shapes are named after their target class with a Shape suffix
(ex:PersonShape); named property shapes use the node shape name plus the
property local name (ex:PersonShape-email); abstract upper shapes use
Abstract as a prefix (ex:AbstractAgentShape).

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>✓ Exit Criteria</strong></p>
<ul>
<li><p>Namespace pattern is selected and documented with
rationale</p></li>
<li><p>All namespace prefixes are declared in a shared sh:prefixes
resource</p></li>
<li><p>IRI naming conventions for node shapes, property shapes, and
abstract shapes are documented</p></li>
<li><p>Import structure (owl:imports hierarchy) is sketched, even if not
yet populated</p></li>
</ul></td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 15%" />
<col style="width: 84%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p>PHASE</p>
<p><strong>2</strong></p></td>
<td><p><strong>Use Case Development and Exemplar Sketching</strong></p>
<p><em>The iterative cycle begins here — expect to return to this
phase</em></p></td>
</tr>
</tbody>
</table>

**2.1 Use Case Elicitation**

Use cases are the primary anchor of the ontology. Every shape, every
property, every reification decision should trace back to at least one
use case. Use cases that cannot be grounded in a concrete question the
data must answer, or a concrete operation the data must support, are
candidates for scope exclusion.

Each use case should be recorded with the following structure:

- ID: A short identifier (UC-001)

- Statement: A one-sentence description of what the user/system needs to
  do

- Entities Involved: The things this use case touches

- Questions Answered: The specific queries this use case must support

- Scope Confirmation: Explicit yes/no on whether each entity is in scope

- Domain Steward: The named person responsible for this use case's
  accuracy

|               |                                                                                                                                                                                                                                                                                                                                  |
|---------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **SHACL 1.2** | sh:targetWhere (new in 1.2) enables use-case-specific targeting: instead of targeting all instances of a class, you can target nodes that satisfy a specific pattern. This is worth considering during use case elicitation — some use cases are better modelled as targeted sub-shape validations than as separate node shapes. |

**2.2 Exemplar Sketching in Turtle**

For each use case, write two to four Turtle instances that represent
what the data should look like when the use case is satisfied. Do not
attempt to be comprehensive or correct — these are sketches. The goal is
to surface data shape intuitions before they are formalised.

Rules for exemplar sketching:

- Use descriptive, readable local names (ex:alice-order-001, not
  ex:inst1)

- Include both 'happy path' instances (valid data) and one 'edge case'
  instance per use case

- Do not apply any namespace conventions yet — use a flat ex: prefix
  throughout

- Represent relationships explicitly as nested objects, not as flat
  string values

- If you find yourself wanting to annotate a triple (add provenance,
  status, or context to a relationship), mark it clearly with a comment
  — these are reification candidates

**2.3 LLM Comparison Pass**

Once all use case exemplars are sketched, aggregate them into a single
Turtle document and submit to an LLM with the following prompt
structure. Note the explicit guard rails — these are not optional:

|                     |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
|---------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **PROMPT TEMPLATE** | Given the following Turtle exemplar data representing use cases for \[domain\], please: (1) identify any factual contradictions between instances; (2) identify any structural inconsistencies (e.g., the same relationship represented differently in different instances); (3) identify any entities that appear to play multiple distinct roles; (4) identify any properties that appear to be overloaded (carrying different semantic meanings in different contexts); (5) DO NOT generate SHACL yet; (6) DO NOT suggest ontology patterns or design improvements; report only what you observe in the data as provided. |

The constraint against generating SHACL or design suggestions at this
stage is important. LLMs will eagerly produce first-pass schema, but at
this stage you want analytical observation, not design prescription.

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>✓ Exit Criteria</strong></p>
<ul>
<li><p>At least two Turtle exemplars exist per use case</p></li>
<li><p>At least one edge-case exemplar exists per use case</p></li>
<li><p>LLM comparison pass completed and contradictions/inconsistencies
resolved</p></li>
<li><p>All relationship annotations (reification candidates) are marked
in comments</p></li>
<li><p>Every exemplar traces to a specific use case ID</p></li>
</ul></td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 15%" />
<col style="width: 84%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p>PHASE</p>
<p><strong>3</strong></p></td>
<td><p><strong>Taxonomy and Reification Identification</strong></p>
<p><em>This phase is tightly coupled with Phase 2 — expect bidirectional
iteration</em></p></td>
</tr>
</tbody>
</table>

**3.1 The Taxonomy-Reification Coupling**

Taxonomy identification and reification exploration are presented in
earlier methodologies as sequential steps. In practice, they are
bidirectional: discovering a role enumeration often reveals that what
looked like a simple property is actually a reified relationship
(because the role has its own properties), and identifying a reification
candidate often surfaces a taxonomy of relationship types that needs to
be captured.

Work through both simultaneously, using the following process:

1.  Review every property in the exemplars that takes a string or IRI
    value that appears to classify or categorise the subject. These are
    taxonomy candidates.

2.  For each taxonomy candidate, ask: does this category have attributes
    of its own, or does the relationship between the subject and this
    category have attributes? If yes to either, it may be a reification
    candidate rather than a taxonomy.

3.  Review every reification candidate comment from Phase 2. For each,
    ask: what properties would the reified relationship itself need to
    carry? List them. If the list is empty, the reification may be
    premature.

4.  Return to the exemplars and explicitly sketch the reified forms of
    confirmed reification candidates. These revised exemplars may
    surface new taxonomy needs.

**3.2 SKOS for Taxonomy**

Confirmed taxonomies — enumerations of classifying values with no
object-level attributes of their own — are well-served by SKOS rather
than OWL classes or SHACL sh:in lists. SKOS provides built-in
broader/narrower/related relationships, labels in multiple languages,
and scope notes. The SHACL constraint that a property value must be a
member of the taxonomy is then expressed as sh:class skos:Concept with
an sh:node reference to a SHACL shape that validates the concept is in
the correct SKOS scheme.

**3.3 SHACL 1.2 Reification with sh:reifierShape**

SHACL 1.2 introduces sh:reifierShape, which allows constraints to be
applied to the reifier of an RDF 1.2 triple (the resource that annotates
a specific triple). This is directly useful for relationship-level
metadata — provenance, confidence, temporal validity, approval status —
without requiring heavyweight reification vocabulary patterns.

A reifier shape on a property shape might look like:

> ex:PersonShape-employment
>
> a sh:PropertyShape ;
>
> sh:path ex:employedBy ;
>
> sh:reifierShape ex:EmploymentAnnotationShape ;
>
> sh:reificationRequired false .
>
> ex:EmploymentAnnotationShape
>
> a sh:NodeShape ;
>
> sh:property \[ sh:path ex:startDate ;
>
> sh:datatype xsd:date ; sh:minCount 1 \] ;
>
> sh:property \[ sh:path ex:role ;
>
> sh:class ex:EmploymentRole \] .

Note that sh:reificationRequired controls whether a reifier is
mandatory. Setting it false during early design allows the constraint to
be present without breaking validation against exemplars that predate
the annotation requirement.

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>✓ Exit Criteria</strong></p>
<ul>
<li><p>All taxonomy candidates are identified and either confirmed as
SKOS schemes or reclassified as reification candidates</p></li>
<li><p>All reification candidates have explicit sketched Turtle
representations in the exemplar set</p></li>
<li><p>Confirmed reifier shapes are documented with their required
annotation properties</p></li>
<li><p>No property in the exemplar set is carrying two semantically
distinct values (overloading is resolved)</p></li>
</ul></td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 15%" />
<col style="width: 84%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p>PHASE</p>
<p><strong>4</strong></p></td>
<td><p><strong>First-Pass Schema Generation</strong></p>
<p><em>LLM-assisted with mandatory engineer review — use the guard-rail
checklist</em></p></td>
</tr>
</tbody>
</table>

**4.1 Aggregation and LLM Generation**

With the exemplars revised to include reified forms and taxonomy
references, aggregate the complete Turtle exemplar set as input for
first-pass SHACL generation. The LLM prompt for this phase is more
prescriptive than Phase 2, because you now want structured output:

|                     |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
|---------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **PROMPT TEMPLATE** | Given the following Turtle exemplars representing \[domain\] data, generate a SHACL shapes graph in Turtle. Requirements: (1) Create a named sh:NodeShape for each distinct entity type; (2) Create named sh:PropertyShape resources (not anonymous blank nodes) for every property that appears on more than one entity type; (3) Include sh:name, sh:description, and ex:inScope annotations on all node shapes; (4) Use sh:reifierShape for all annotated relationships; (5) Assign sh:severity levels: sh:Violation for structural requirements, sh:Warning for domain best practices; (6) Include sh:minCount and sh:maxCount for all properties; (7) DO NOT generate sh:or, sh:xone, or sh:and constraints — flag any cases where you would have used these as comments instead. |

The prohibition on logical operators in the first pass is deliberate.
sh:or/sh:xone/sh:and are the most common sources of LLM SHACL errors,
and getting the basic structure correct is more valuable than getting
logical combinations wrong.

**4.2 LLM SHACL Guard-Rail Checklist**

Before accepting any LLM-generated SHACL, review each shape against the
following checklist. Items marked CRITICAL have been observed to produce
silent validation failures — the shape appears correct but does not
actually constrain what was intended.

|                                        |                                                                                                                                                                                             |
|----------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Check Item**                         | **What to Look For**                                                                                                                                                                        |
| **sh:node vs sh:class \[CRITICAL\]**   | sh:class checks rdf:type; sh:node checks conformance to a shape. LLMs frequently substitute one for the other. Verify every sh:node and sh:class usage is semantically correct.             |
| **sh:or / sh:xone \[CRITICAL\]**       | sh:or is satisfied if ANY branch is satisfied; sh:xone requires EXACTLY ONE branch. LLMs regularly swap these. Check every logical operator against the intended semantics.                 |
| **Property path syntax \[CRITICAL\]**  | SHACL property paths use RDF list encoding for sequences, not SPARQL slash notation. sh:path (ex:a ex:b) is a list; sh:path ex:a/ex:b is not valid. Review all sh:path values.              |
| **sh:minCount on optional properties** | sh:minCount 0 is the default — explicitly setting it is harmless but creates noise. sh:minCount 1 means required. Verify all cardinalities against the exemplars.                           |
| **Missing sh:targetClass**             | Node shapes without a target are valid SHACL but will never fire. Every node shape should have at least one target unless it is an abstract shape intended for use via sh:node.             |
| **Blank node property shapes**         | LLMs tend to generate anonymous blank node property shapes even when asked for named ones. Named property shapes are reusable; blank nodes are not. Verify all sh:property values are IRIs. |

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>✓ Exit Criteria</strong></p>
<ul>
<li><p>Guard-rail checklist completed for all generated shapes — all
CRITICAL items resolved</p></li>
<li><p>Every node shape has either a target declaration or is documented
as abstract</p></li>
<li><p>All property shapes are named (IRI-identified), not anonymous
blank nodes</p></li>
<li><p>sh:reifierShape applied to all confirmed reification
relationships</p></li>
<li><p>First-pass SHACL validates against the happy-path exemplars
without violations</p></li>
</ul></td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 15%" />
<col style="width: 84%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p>PHASE</p>
<p><strong>5</strong></p></td>
<td><p><strong>Abstract Shape and Upper Ontology
Construction</strong></p>
<p><em>Identify composition patterns that can reduce long-term
maintenance burden</em></p></td>
</tr>
</tbody>
</table>

**5.1 Identifying Abstract Shape Candidates**

After the first-pass schema is reviewed, examine the node shapes for
structural repetition. A group of shapes that share more than two or
three property shapes is a candidate for abstraction. The test is
simple: if you had to change a shared constraint (e.g., the pattern on
an identifier property), how many shapes would you need to edit? If the
answer is more than one, abstraction is justified.

SHACL's mechanism for shape composition is sh:and, not inheritance in
the OWL sense. An abstract shape is simply a node shape without a target
declaration; it is referenced by concrete shapes via sh:and:

> ex:AbstractNamedEntityShape
>
> a sh:NodeShape ;
>
> \# No sh:targetClass — this is abstract
>
> sh:property ex:AbstractNamedEntityShape-id ;
>
> sh:property ex:AbstractNamedEntityShape-label .
>
> ex:PersonShape
>
> a sh:NodeShape ;
>
> sh:targetClass ex:Person ;
>
> sh:and ( ex:AbstractNamedEntityShape ) ;
>
> sh:property ex:PersonShape-email .

**5.2 Composable vs Inferential Inheritance**

A critical design distinction: sh:and in SHACL is compositional, not
inferential. It does not mean 'PersonShape is a subtype of
AbstractNamedEntityShape' in any OWL sense. It means 'nodes that conform
to PersonShape must also conform to AbstractNamedEntityShape.' This
composability is powerful precisely because it is explicit — a node can
satisfy multiple abstract shapes without those shapes having any
hierarchical relationship to each other.

Avoid the temptation to build deep abstract hierarchies. In practice,
two or three levels of abstraction is the maximum that remains
comprehensible during stakeholder review. Deeper hierarchies tend to
obscure rather than clarify.

**5.3 owl:imports Modularisation**

Once abstract shapes are identified, consider whether they belong in a
separate imported shapes graph. Abstract shapes that are likely to be
reused across projects — common identifier patterns, standard provenance
annotations, geospatial constraints — are candidates for a dedicated
shared module:

> \<https://example.org/abstract-shapes\>
>
> a owl:Ontology .
>
> \<https://example.org/domain-shapes\>
>
> a owl:Ontology ;
>
> owl:imports \<https://example.org/abstract-shapes\> .

|          |                                                                                                                                                                                                                                                                                                |
|----------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **NOTE** | SHACL processors SHOULD (not MUST) follow owl:imports transitively. Verify your target processor's behaviour explicitly. Apache Jena's SHACL library follows owl:imports; MarkLogic's built-in SHACL engine does not auto-resolve imports and requires explicit graph merge before validation. |

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>✓ Exit Criteria</strong></p>
<ul>
<li><p>All node shapes with shared structure of 2+ property shapes have
been reviewed for abstraction</p></li>
<li><p>Abstract shapes are defined without target declarations</p></li>
<li><p>Concrete shapes reference abstract shapes via sh:and</p></li>
<li><p>Abstract shapes that will be reused across projects are extracted
to a separate owl:imports module</p></li>
<li><p>Abstract shape hierarchy is no deeper than three levels</p></li>
</ul></td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 15%" />
<col style="width: 84%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p>PHASE</p>
<p><strong>6</strong></p></td>
<td><p><strong>Validation, Testing, and Regression</strong></p>
<p><em>Build the test suite that makes future iterations
safe</em></p></td>
</tr>
</tbody>
</table>

**6.1 Test Suite Structure**

A persistent SHACL test suite is not optional — it is the mechanism that
makes iterative revision safe. Without it, every change to the schema is
a potential regression with no automated detection. The test suite
should follow the W3C test case format and be maintained in version
control alongside the shapes graphs.

Each test case consists of three files: a shapes graph (or import
reference to the main shapes graph), a data graph (the exemplar being
tested), and an expected validation report (stating whether conformance
is true or false, and for failure cases, the expected sh:focusNode and
sh:sourceConstraintComponent values).

Test categories required at minimum:

- Happy path: One valid instance per node shape — must produce
  sh:conforms true

- Required property violations: One instance per node shape missing each
  required property

- Datatype violations: One instance per property with a datatype
  constraint, with an incorrectly typed value

- Cardinality violations: One instance with too many values for each
  maxCount-constrained property

- Reifier shape violations: One instance per reifier shape with a
  missing required annotation

- Abstract shape composition: Instances that satisfy component shapes
  independently and in combination

**6.2 Validation Tooling**

For Node.js workflows, rdf-validate-shacl (npm) wraps the RDF.js
ecosystem and supports SHACL Core. For Python workflows, pyshacl
supports SHACL Core and SHACL-SPARQL, and can be called from the command
line or as a library. For integration testing, both can be scripted as
part of a CI pipeline that runs the full test suite on every commit to
the shapes graph.

**6.3 Validation Feedback Loop**

Validation failures do not necessarily mean the shapes are wrong — they
may mean the exemplars are wrong, or that the use case was
underspecified. The feedback routing is:

- Violation on a happy-path instance: Review the shape constraint first.
  If the constraint is correct, the exemplar is wrong — return to Phase
  2.

- Missing violation on a failure-case instance: The constraint is too
  loose. Review the shape and tighten it — return to Phase 4.

- Unexpected violation category (wrong sh:sourceConstraintComponent):
  Shape composition error — review abstract shape interactions in Phase
  5.

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>✓ Exit Criteria</strong></p>
<ul>
<li><p>Test suite exists in version control with at least one test per
category per node shape</p></li>
<li><p>All happy-path tests pass (sh:conforms true)</p></li>
<li><p>All violation tests produce the expected
sh:sourceConstraintComponent</p></li>
<li><p>CI pipeline executes test suite on every shapes graph
commit</p></li>
<li><p>Regression baseline is documented: zero happy-path violations on
the current exemplar set</p></li>
</ul></td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 15%" />
<col style="width: 84%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p>PHASE</p>
<p><strong>7</strong></p></td>
<td><p><strong>Stakeholder Review, ERD Documentation, and Governed
Revision</strong></p>
<p><em>The governed iteration gate — changes here must be traceable to
use cases</em></p></td>
</tr>
</tbody>
</table>

**7.1 ERD Generation**

Generate entity relationship diagrams at a per-node-shape granularity,
not as a single monolithic diagram for the entire schema. Large
ontologies visualised as a single diagram are unreadable. Use
case-scoped diagrams (showing only the shapes relevant to one or two use
cases) are far more effective for stakeholder review.

Recommended toolchain for automated ERD generation from SHACL:

- SHACL Play! (shacl-play.sparna.fr): Online, paste-in Turtle, generates
  PlantUML class diagrams immediately. Best for quick stakeholder-facing
  output.

- semanticz-shaclviz (Cognizone, GitHub): Java/Gradle,
  SPARQL-filterable, supports yEd TGF output for large complex schemas.
  Best for per-domain-area diagrams.

- shacl2plantuml (rosecky, GitHub): Follows owl:imports closure,
  integrates OWL and SHACL. Best when shapes are tightly coupled to an
  OWL ontology.

- Custom SPARQL-to-Mermaid: A 50-100 line SPARQL query against the
  shapes graph extracting (sh:targetClass, sh:path,
  sh:class/sh:datatype) can generate Mermaid classDiagram syntax,
  embeddable in Markdown and GitHub READMEs with no external tooling.

**7.2 Stakeholder Review Process**

Stakeholder reviews are governance events, not design sessions. The
schema engineer presents; stakeholders review for domain correctness,
not for technical SHACL correctness. The distinction matters: domain
stewards should be asked 'Does this diagram correctly represent how your
domain works?' not 'Is this SHACL correct?'

Each review session should produce one of three outcomes per shape under
review:

- Accepted: Shape is correct. No revision required.

- Revision required: Shape has a specific, documented error or gap.
  Revision is assigned to a specific person with a target date.

- Deferred: Shape is out of scope for the current iteration. Mark with
  ex:inScope false and note the deferred decision.

**7.3 Conflict Resolution in Review**

When stakeholder review produces conflicting requirements — Domain
Steward A requires a property to be mandatory; Domain Steward B says it
is optional in their context — the governance structure established in
Phase 0 defines the resolution path. Options available in SHACL:

- Severity compromise: Make the property required (sh:minCount 1) with
  sh:Violation, but also provide a Warning-severity shape that
  stakeholder B's data will produce — acceptable in their context.

- Shape bifurcation: Create two shapes targeting different subclasses or
  using sh:targetWhere to distinguish contexts.

- Owner decides: Schema Owner makes the final call, documented in the
  revision history.

**7.4 Revision Tracking in the Schema**

All revisions approved in the review session should be tracked within
the SHACL shapes themselves using a revision annotation pattern based on
RDF 1.2 reification. This creates a queryable history of schema changes:

> ex:PersonShape-email
>
> a sh:PropertyShape ;
>
> sh:path ex:email ;
>
> sh:minCount 1 ;
>
> ex:revisionNote "Made mandatory per UC-003 review 2026-02"^^xsd:string
> .

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>✓ Exit Criteria</strong></p>
<ul>
<li><p>ERDs generated for all use case groupings and distributed to
domain stewards before review</p></li>
<li><p>Stakeholder review completed with documented Accept / Revision
Required / Deferred per shape</p></li>
<li><p>All Revision Required items have assigned owners and target
dates</p></li>
<li><p>All approved revisions tracked with ex:revisionNote
annotations</p></li>
<li><p>Test suite passes after all revisions are applied (regression
baseline maintained)</p></li>
<li><p>Iteration decision made: advance to Phase 8, or return to Phase
2/3/4 as appropriate</p></li>
</ul></td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 15%" />
<col style="width: 84%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p>PHASE</p>
<p><strong>8</strong></p></td>
<td><p><strong>Transformer and Integration Development</strong></p>
<p><em>Connect the schema to external data sources — this phase has its
own sub-methodology</em></p></td>
</tr>
</tbody>
</table>

**8.1 Source-to-Schema Mapping**

Transformer development is a non-trivial phase that is often
underestimated. The core task is identifying, for each property shape in
the validated schema, where the corresponding value comes from in each
external source. This is a many-to-many problem: one source field may
contribute to multiple properties; one property may be assembled from
multiple source fields.

Build a mapping matrix before writing any transformation code. For each
source-schema pairing, record:

- Source field path (column name, XPath, JSON path)

- Target shape and property path in the SHACL schema

- Transformation required (none, string normalisation, IRI minting,
  vocabulary lookup, calculated value)

- Null handling (default value, skip triple, or validation failure)

- Confidence: is this mapping confirmed by the domain steward, or
  inferred?

**8.2 Tooling for Transformation**

SPARQL-Anything is the recommended tool for tabular and structured data
sources — it exposes CSV, JSON, XML, and other formats as virtual RDF
graphs that can be queried and transformed with SPARQL CONSTRUCT. TARQL
is appropriate for straightforward CSV-to-RDF mappings where the column
structure is stable and simple. For complex transformations, a Python
pipeline using rdflib with the mapping matrix as configuration is more
maintainable than complex SPARQL.

All transformers should produce output that is immediately validated
against the SHACL shapes before being committed to the target graph.
This makes transformer correctness verifiable and connects the
integration layer to the test suite.

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>✓ Exit Criteria</strong></p>
<ul>
<li><p>Source-to-schema mapping matrix completed and reviewed by domain
stewards</p></li>
<li><p>All confirmed mappings implemented as transformers</p></li>
<li><p>Transformer output passes SHACL validation for all in-scope node
shapes</p></li>
<li><p>Null handling behaviour is documented and tested for all optional
properties</p></li>
</ul></td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 15%" />
<col style="width: 84%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p>PHASE</p>
<p><strong>9</strong></p></td>
<td><p><strong>Ongoing Governance and Schema Evolution</strong></p>
<p><em>The schema is a living artefact — plan for change from the
beginning</em></p></td>
</tr>
</tbody>
</table>

**9.1 Regular Review Cadence**

Schema governance is not a one-time event at the end of the design
cycle. Establish a regular review cadence — quarterly at minimum for
active schemas — that brings together the Schema Owner and Domain
Stewards to review: proposed changes from the previous period,
deprecated shape status, and whether deferred shapes from earlier
iterations should be revisited.

**9.2 Breaking Change Management**

When a breaking change is required (removing a required property,
tightening a constraint in a way that would invalidate previously valid
data), the process should be:

5.  Announce the proposed change with a minimum 30-day notice period

6.  Add the new constraint as a Warning-severity shape alongside the
    existing Violation-severity shape

7.  Allow consumers to update their data to conform to the new
    constraint

8.  After the notice period, elevate the Warning to Violation and
    deprecate the old shape

The sh:deactivated property provides a mechanism to soft-deprecate a
shape without removing it: set sh:deactivated true in the importing
graph while retaining the shape definition in the source module.

**9.3 SHACL-on-SHACL Revision Tracking**

For schemas that require a formal audit trail, the revision annotation
pattern introduced in Phase 7 can be extended into a full revision
history queryable via SPARQL. Each shape revision is recorded with its
date, author (using an organisational IRI, not a personal name), the use
case that motivated the change, and whether it constitutes a breaking
change:

> ex:PersonShape-email
>
> ex:revision \[
>
> ex:revisionDate "2026-02-01"^^xsd:date ;
>
> ex:revisedBy ex:org/schema-team ;
>
> ex:motivatedBy ex:usecase/UC-003 ;
>
> ex:breakingChange false ;
>
> ex:revisionNote "sh:minCount increased to 1 per UC-003"
>
> \] .

This pattern uses standard RDF blank nodes rather than RDF 1.2
reification for broader compatibility, but could be converted to use
reifier-based annotation as SHACL 1.2 processor support matures.

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>✓ Exit Criteria</strong></p>
<ul>
<li><p>Review cadence is scheduled and calendar invites are
sent</p></li>
<li><p>Breaking change policy from Phase 0 is being followed in
practice</p></li>
<li><p>All schema changes in each review cycle are tracked with revision
annotations</p></li>
<li><p>Deprecated shapes are marked with sh:deactivated and documented
in release notes</p></li>
</ul></td>
</tr>
</tbody>
</table>

**Appendix A: SHACL 1.2 Feature Integration Guide**

The following SHACL 1.2 features materially affect this methodology. All
are from the Working Draft dated 05 January 2026 and should be validated
against your processor's conformance level before use in production.

|                             |                                                                                                                                                                                                                                                                |
|-----------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Feature**                 | **Phase Applicability and Usage Notes**                                                                                                                                                                                                                        |
| **sh:reifierShape**         | Phase 3, 4. Applies constraints to the reifier of an RDF 1.2 triple. Use for relationship-level annotations (provenance, temporal validity, confidence). Combined with sh:reificationRequired false during early design to avoid breaking existing test cases. |
| **sh:targetWhere**          | Phase 2, 7. Targets nodes that match a specific graph pattern, not just all instances of a class. Enables use-case-specific shapes without creating new subclasses.                                                                                            |
| **sh:conformanceDisallows** | Phase 0, 6. Controls which severity levels trigger sh:conforms false. Configure as part of governance setup to match your severity-to-governance mapping.                                                                                                      |
| **sh:codeIdentifier**       | Phase 4, 7. Provides a language-specific code binding name for a property shape, separate from sh:name. Use for GraphQL, TypeScript, or other code generation scenarios.                                                                                       |
| **sh:memberShape**          | Phase 5. Constrains all members of an RDF list to conform to a shape. Useful for ordered collections in the schema.                                                                                                                                            |
| **sh:singleLine**           | Phase 4. Constrains a string property to contain no newline characters. Useful for identifier and label properties.                                                                                                                                            |
| **IMPORTS in SHACLC**       | Phase 1. The compact syntax IMPORTS keyword desugars to owl:imports. Requires a BASE declaration. Use in .shaclc files for cleaner import declarations.                                                                                                        |

**Appendix B: Namespace Strategy Quick Reference**

|                        |                                                                                                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Pattern**            | **IRI Structure and Guidance**                                                                                                                                        |
| **Single namespace**   | https://example.org/schema# All shapes, classes, properties share one prefix. Use for: Small schemas (\<20 node shapes), single-team projects.                        |
| **Domain-partitioned** | https://example.org/orders# https://example.org/products# Separate prefix per domain. Selective owl:imports. Use for: Medium-large schemas, multiple domain stewards. |
| **Version-bearing**    | https://example.org/schema/v2/ Version in IRI. Breaking changes are explicit. Use for: Externally published schemas with downstream consumers.                        |
| **Abstract module**    | https://example.org/abstract# Separate namespace for upper/abstract shapes. Use for: Cross-project shape reuse, shared constraint libraries.                          |

**Appendix C: LLM Guard-Rail Summary**

Use this checklist for every LLM interaction involving SHACL generation
or analysis. Items marked CRITICAL produce silent errors that may pass
syntactic validation but fail semantically.

|                                     |                                                                                                                                                                                                     |
|-------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Interaction Point**               | **Required Constraints and Expected Output**                                                                                                                                                        |
| **Phase 2 analysis**                | Prohibit SHACL generation. Request only observation and comparison. Expect: contradiction list, structural inconsistency list, role/overloading flags.                                              |
| **Phase 4 generation \[CRITICAL\]** | Prohibit sh:or, sh:xone, sh:and in first pass. Require named (IRI) property shapes. Require sh:name and sh:description on all node shapes. Prohibit sh:class where sh:node is meant and vice versa. |
| **Phase 4 review \[CRITICAL\]**     | Manually verify: every sh:node vs sh:class usage; every property path for SHACL (not SPARQL) encoding; all sh:or/sh:xone semantics; all sh:minCount/sh:maxCount values against exemplars.           |
| **Phase 7 test generation**         | Provide shapes graph and ask for conforming and non-conforming instances. Verify generated instances against the actual validator — do not trust LLM-claimed conformance.                           |

*This methodology is a living document.*

*Revisions are tracked at github.com/kurtcagle/shacl-methodology*
