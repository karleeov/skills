---
illustration_id: 07
type: flowchart
style: sketch-notes
palette: inspecto-brand
references:
  - ref_id: 01
    filename: 01-ref-inspecto-logo.png
    usage: style
---

Hand-drawn loop flowchart. Inspecto brand. Diagram-only.

BRANDING: Inspecto mark top-left; faint "Inspecto" watermark bottom-right.

COLORS: Background (#F0F7F7); Black (#1A1A1A); Soft Teal steps; Brand Teal end state.
        Never show hex as text.

TITLE: "Case → recipe loop"

STEPS:
1. "Ticket / error" 
2. "/support-case SEARCH" — hit or miss
3. Resolve (DEBUG / FILL as needed)
4. "SAVE CASE?" — yes → cases/ref-*.md
5. "Repeatable SQL?" — yes → "/inspecto-sql ADD RECIPE"
6. "recipes/*.sql + INDEX.md"

Note chip: "Do not paste one-off SQL into knowledge.md"

BOTTOM: "Incidents become recipes when they repeat"
ASPECT: 16:9
