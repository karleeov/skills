---
illustration_id: 04
type: flowchart
style: sketch-notes
palette: inspecto-brand
references:
  - ref_id: 01
    filename: 01-ref-inspecto-logo.png
    usage: style
---

Hand-drawn decision flowchart. Inspecto brand. Diagram-only.

BRANDING: Inspecto mark top-left; faint "Inspecto" watermark bottom-right.

COLORS: Background (#F0F7F7); Black (#1A1A1A); Soft Teal process; Amber-tint decision
        optional (#FFF3CD) or Soft Teal; Brand Teal accent. Never show hex as text.

TITLE: "GENERATE — skeleton gate"

FLOW:
Start "VALIDATE pass" → Diamond "skeleton exists?"
Yes → "Full WF SQL" — WF_WORKFLOW · groups · members · SIS_USER_ROLES (e.g. SiteDiary)
No → "Members + roles only" — say gap; use /inspecto-sql patterns (e.g. RISC v1)
Side label: "Scope: ONE module | ALL modules"
Also note: "TOP-UP if groups already live"

BOTTOM: "Never invent StatusId / SignatureKey without a skeleton"
ASPECT: 16:9
