---
illustration_id: 08
type: framework
style: sketch-notes
palette: inspecto-brand
references:
  - ref_id: 02
    filename: 02-ref-architecture-ops-trio.png
    usage: direct
  - ref_id: 01
    filename: 01-ref-inspecto-logo.png
    usage: style
  - ref_id: 03
    filename: 03-ref-flowchart-inspecto-sql.png
    usage: style
---

Redraw the Inspecto ops architecture diagram (reference image) as a hand-drawn
sketch-notes educational poster — keep the SAME structure and labels, adapt
visual style to light mint paper (not dark UI chrome).

BRANDING: Inspecto logo/wordmark top-left; faint "Inspecto" watermark bottom-right.

Follow reference layout (top → bottom):
1. TOP entry: "/ask-dev" — "routes intent"
2. THREE skill cards in a row:
   - "/inspecto-sql" — Cookbook recipes — RECIPE · FILL · DEBUG · NEW · ADD
   - "/inspecto-project-setup" — CSV → setup SQL — HANDOUT · VALIDATE · GENERATE · TOP-UP
   - "/support-case" — Helpdesk memory — SEARCH · SAVE · KNOWLEDGE · REVIEW
3. Hand-off arrows between cards (same meanings as reference):
   - sql ↔ setup: "NEW CONTRACT" / "TOP-UP / FILL"
   - setup ↔ support: "ADD RECIPE?" / "SEARCH cookbook"
4. Dashed region "Stores / outputs (never auto-run on live DB)" with four boxes:
   - recipes/ + INDEX.md
   - inspecto-5202-sql/
   - cases/ + lessons.md
   - knowledge.md
5. Bottom bar: "Client CSV intake (templates/blank + FORMATS.md)" feeding project-setup

PALETTE Inspecto:
COLORS: Background (#F0F7F7); Black (#1A1A1A) ink; Soft Teal fills (#D6E8E8, #C9EBEC);
        Brand Teal (#006164); Accent (#00979B). Never paint hex/color names as text.

TITLE: "Inspecto ops — architecture"

STYLE: sketch-notes — hand-lettered, slight wobble, rounded cards, airy white space.
Keep composition faithful to the SVG reference structure.
ASPECT: 16:9
