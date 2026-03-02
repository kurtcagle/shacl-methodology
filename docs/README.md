# Document Formats

The methodology is available in three formats, all generated from the same source.

## Files

| File | Format | Best For |
|---|---|---|
| `shacl_methodology_v2.md` | GitHub-Flavoured Markdown | Reading online, linking sections, version control diffs |
| `shacl_methodology_v2.docx` | Microsoft Word (.docx) | Editing, commenting, tracked-changes review, printing |
| `shacl_methodology_v2.pdf` | PDF | Distribution, archiving, presentation |

## Reading Order

If you are new to this methodology, the recommended reading path is:

1. Start with the **README.md** at the repository root for the overview and cycle diagram
2. Read **Core Principles** in the methodology before diving into phases
3. Work through **Phase 0 and Phase 1** (the foundations) in full — these are not skippable
4. Read the **Phase 2/3 coupling** section carefully before starting any exemplar work
5. Return to later phases as needed

## Generating Updated Formats

The `.docx` is the primary source. To regenerate the other formats:

```bash
# Markdown from DOCX
pandoc shacl_methodology_v2.docx -t gfm -o shacl_methodology_v2.md

# PDF from DOCX (requires LibreOffice)
libreoffice --headless --convert-to pdf shacl_methodology_v2.docx
```

## Version Notes

The document header states the SHACL 1.2 alignment version. As the SHACL 1.2 Working Draft advances toward Recommendation, section references and feature availability notes will be updated. Check the repository changelog for revision history.
