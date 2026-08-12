---
type: mixed
density: rich
style: sketch-notes
palette: inspecto-brand
image_count: 7
source: skills/README.md
language: en
article_mode: update
---

# Outline: How agent skills work

## Illustration 1
**Position**: Skill Catalog (after TOC / before Install)
**Purpose**: Show the whole skill map as grouped purpose zones
**Visual Content**: Six rounded zones — Main flow, On-ramps, Codebase health, Vocabulary, Session, Learning/Setup — with 1–3 skill command chips each
**Type Application**: infographic overview
**Filename**: 01-infographic-skill-catalog.png

## Illustration 2
**Position**: How to Use Skills — main flow
**Purpose**: Teach `/ship` as owner of idea → reviewed commits
**Visual Content**: Left-to-right flowchart: preflight → grill-with-docs → to-spec → to-tickets → implement frontier → integration proof
**Type Application**: flowchart
**Filename**: 02-flowchart-main-ship-flow.png

## Illustration 3
**Position**: implement per frontier ticket (nested under main flow)
**Purpose**: Show the implement inner loop never ships partial work
**Visual Content**: Cycle: complete-and-verify → tdd (red-green-refactor) → code-review (Correctness · Standards · Spec) → next ticket
**Type Application**: flowchart
**Filename**: 03-flowchart-implement-loop.png

## Illustration 4
**Position**: On-ramps section
**Purpose**: Show starting situations that merge onto the main flow
**Visual Content**: Hub `/ship` / main flow with six on-ramp arrows: triage, diagnosing-bugs, support-case, inspecto-sql, inspecto-project-setup, wayfinder
**Type Application**: framework
**Filename**: 04-framework-on-ramps.png

## Illustration 5
**Position**: Skills that fire automatically
**Purpose**: Clarify model-invoked vs user-typed commands
**Visual Content**: Three cards — complete-and-verify, grilling, codebase-design — each with “auto” badge and parent command
**Type Application**: infographic
**Filename**: 05-infographic-auto-skills.png

## Illustration 6
**Position**: When you're stuck
**Purpose**: Quick router for common stuck states
**Visual Content**: Decision flowchart from stuck situations to the right skill command
**Type Application**: flowchart
**Filename**: 06-flowchart-when-stuck.png

## Illustration 7
**Position**: Install + How to Create a New Skill
**Purpose**: Show discovery path: install globally → agent loads SKILL.md → optional scaffold/lint
**Visual Content**: Pipeline: `npx skills add` → `~/.agents/skills/` → agent discovery → `/ask-dev` or command; side note `npm run new`
**Type Application**: infographic
**Filename**: 07-infographic-install-discover.png
