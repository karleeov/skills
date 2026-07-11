# skills

My personal agent skills collection — forked from [mattpocock/skills](https://github.com/mattpocock/skills), rebranded, customized, and grown.

Each skill lives in `skills/<name>/SKILL.md` and is auto-discovered by opencode, Claude Code, and 70+ other agents.

---

## Table of Contents

- [Install](#install)
- [Skill Catalog](#skill-catalog)
- [How to Use Skills](#how-to-use-skills)
- [How to Create a New Skill](#how-to-create-a-new-skill)
- [Testing](#testing)
- [Wiring into opencode](#wiring-into-opencode)
- [Repo Layout](#repo-layout)

---

## Install

### One-command install (recommended)

```powershell
npx skills add karleeov/skills -y -g
```

This clones the repo, discovers all 23 skills, and installs them globally into `~/.agents/skills/` — visible to every supported agent (opencode, Claude Code, Codex, GitHub Copilot, and more).

**Flags:**
- `-y` / `--yes` — skip the interactive picker, install everything
- `-g` / `--global` — install to `~/.agents/skills/` (all projects)
- Without `-g` — installs into the current project's `.agents/skills/` instead

### Manual install (clone + junction)

```powershell
git clone https://github.com/karleeov/skills.git "$env:USERPROFILE\projects\skills"

# Link into opencode's global discovery path
New-Item -ItemType Junction `
  -Path "$env:USERPROFILE\.config\opencode\skills" `
  -Target "$env:USERPROFILE\projects\skills\skills"
```

Edit skills in the clone; they appear in opencode immediately. No build step.

---

## Skill Catalog

23 skills, grouped by purpose:

### Main flow: idea to shipped code

| Skill | Command | When to use |
|-------|---------|-------------|
| **ask-dev** | `/ask-dev` | You don't know which skill to use — it routes you |
| **grill-with-docs** | `/grill-with-docs` | Sharpen an idea by interview. **Has a codebase** (stateful: saves to CONTEXT.md + ADRs) |
| **grill-me** | `/grill-me` | Same relentless interview, **no codebase** (stateless) |
| **to-spec** | `/to-spec` | Turn a conversation into a formal spec |
| **to-tickets** | `/to-tickets` | Split a spec into tracer-bullet tickets with blocking edges |
| **implement** | `/implement` | Build a ticket — starts with complete-and-verify, drives TDD, ends with code-review |
| **complete-and-verify** | auto-invoked | Define the full behavior contract + executable test plan before coding. **Never produces partial work** |
| **tdd** | `/tdd` | Red-green-refactor, one complete slice at a time |
| **code-review** | `/code-review` | Review a branch/PR on two axes: Standards + Spec |

### On-ramps (starting situations that merge onto the main flow)

| Skill | Command | When to use |
|-------|---------|-------------|
| **triage** | `/triage` | Bugs and requests piling up — sort incoming issues into agent-ready briefs |
| **diagnosing-bugs** | `/diagnosing-bugs` | Something's broken and a first glance doesn't fix it — hard bugs, flakes, regressions |
| **wayfinder** | `/wayfinder` | A huge foggy effort (greenfield, massive feature) — chart a map of investigation tickets |

### Codebase health

| Skill | Command | When to use |
|-------|---------|-------------|
| **improve-codebase-architecture** | `/improve-codebase-architecture` | Scan for deepening opportunities, pick one to work on |
| **codebase-design** | auto-invoked | The deep-module vocabulary (module, interface, depth, seam) for designing a module's shape |

### Vocabulary and references

| Skill | Command | When to use |
|-------|---------|-------------|
| **domain-modeling** | `/domain-modeling` | Sharpen domain language, resolve overloaded words, record decisions as ADRs |
| **writing-great-skills** | `/writing-great-skills` | Reference for writing and editing skills well |
| **grilling** | auto-invoked | The relentless interview primitive underneath grill-me and grill-with-docs |

### Session management

| Skill | Command | When to use |
|-------|---------|-------------|
| **handoff** | `/handoff` | Context full? Compact the conversation into a file, start fresh in a new session |
| **prototype** | `/prototype` | Build throwaway code to answer one design question, then delete it |

### Learning and research

| Skill | Command | When to use |
|-------|---------|-------------|
| **research** | `/research` | Delegate reading legwork to a background agent — it leaves a cited Markdown file |
| **teach** | `/teach` | Learn a concept over multiple sessions using the current directory as a workspace |

### Setup and tooling

| Skill | Command | When to use |
|-------|---------|-------------|
| **setup-skills** | `/setup-skills` | Run once before first engineering flow — configures issue tracker, triage labels, doc layout |
| **skill-check** | `/skill-check` | Validate skills in this repo — run `npm run lint` and report issues |

---

## How to Use Skills

### The simplest way: just ask

```
/ask-dev
```

This opens the router. Describe what you want to do, and it points you to the right skill.

### The main flow (idea to ship)

A typical journey from "I have an idea" to "it's shipped":

```
1. /grill-with-docs     ← interview sharpens the idea (saves to CONTEXT.md)
2. /to-spec              ← turn the conversation into a spec
3. /to-tickets           ← split into tickets with blocking edges
4. /implement (per ticket) ← build each one:
   ├── complete-and-verify  ← define contract + test plan first
   ├── tdd                   ← red-green-refactor, one slice at a time
   └── code-review           ← review Standards + Spec
5. Commit and ship
```

**Key rule:** keep steps 1–3 in one context window. Each `/implement` starts fresh.

### When you're stuck

- **Bug you didn't create** incoming? → `/triage`
- **Something broken** and won't fix easily? → `/diagnosing-bugs`
- **Huge foggy project** too big for one session? → `/wayfinder`
- **Context window full?** → `/handoff` to a new session

### Skills that fire automatically

Some skills are **model-invoked** — the agent loads them when it detects the situation, without you typing a command:

- **complete-and-verify** — fires during `/implement` to enforce full implementation + proof
- **grilling** — fires underneath `/grill-me` and `/grill-with-docs`
- **codebase-design** — fires when `/tdd` or `/improve-codebase-architecture` needs the vocabulary

You can still invoke them manually with `/complete-and-verify`, `/grilling`, `/codebase-design`.

---

## How to Create a New Skill

### Step 1: Scaffold

```powershell
npm run new my-skill
```

This creates `skills/my-skill/SKILL.md` from a valid template:

```markdown
---
name: my-skill
description: One sentence: what this skill does and when to use it.
---

# my-skill

Describe what the agent should do here. Lead with the behaviour, then the steps.

## When to use
- Trigger phrase or situation

## Process
1. First step — ends on a clear completion criterion
2. Second step
3. ...

## Notes
- Keep it tight; push reference into sibling .md files and link to them.
```

### Step 2: Write the skill

**Frontmatter rules (opencode-enforced):**
- `name` — lowercase kebab-case (`^[a-z0-9]+(-[a-z0-9]+)*$`), must match the folder name, max 64 chars
- `description` — 1–1024 chars. Front-load the trigger word (what makes the agent reach for this skill)

**Writing tips:**
- Lead with **behaviour**, not background
- Each step ends on a **completion criterion** — a checkable condition that tells the agent "this step is done"
- Push long reference material into sibling `.md` files and link to them (keeps SKILL.md scannable)
- For a model-invoked skill (agent discovers it automatically), omit `disable-model-invocation`
- For a user-only skill, the field is ignored by opencode anyway — use `permission.skill` rules in `opencode.json` instead

### Step 3: Validate

```powershell
npm run lint          # structural check (fast, free)
npm test              # lint + contract + fixture validation
```

### Step 4: Add a smoke test (optional but recommended)

Create `tests/fixtures/my-skill.json`:

```json
{
  "skill": "my-skill",
  "prompt": "Load the my-skill skill, then summarize what it does in one sentence.",
  "expectContains": ["key phrase that should appear"],
  "model": "github-copilot/gpt-5-mini",
  "timeoutMs": 120000
}
```

Run it:

```powershell
npm run smoke -- --only my-skill
```

### Step 5: Commit and push

```powershell
git add -A
git commit -m "Add my-skill"
git push
```

Done — it's live in opencode immediately via the junction, and installable via `npx skills add karleeov/skills`.

---

## Testing

Three layers, fast to slow:

| Command | What it does | Cost |
|---------|-------------|------|
| `npm run lint` | Structural validator: frontmatter, name regex, links, duplicates | Free, instant |
| `npm run contract` | Contract test: guards the completion loop integrity | Free, instant |
| `npm run smoke:dry` | Validate smoke fixtures exist and are well-formed | Free, instant |
| `npm test` | All three above combined | Free, instant |
| `npm run smoke` | **Live behavioral test**: runs each fixture through the model via `opencode run` | Costs tokens, ~30s per fixture |

### Smoke test details

The smoke harness spawns `opencode run --format json --auto` with each fixture's prompt, captures the model's output, and checks it contains the expected substrings.

- Fixtures live in `tests/fixtures/<skill-name>.json`
- The harness uses `stdio: ['ignore', 'pipe', 'pipe']` to prevent the native opencode binary from blocking on stdin
- On timeout, partial output is captured and reported for debugging
- Run a single fixture: `npm run smoke -- --only complete-and-verify`

### CI

GitHub Actions (`.github/workflows/check-skills.yml`) runs `npm test` on every push — structural lint, contract checks, and fixture validation. Smoke (live model calls) is local-only to avoid token costs in CI.

---

## Wiring into opencode

If you used `npx skills add karleeov/skills -g`, skills are already in `~/.agents/skills/` and opencode discovers them.

For development (edit and see changes instantly), use a junction. **Do not** delete `~/.agents/skills/` — it may contain unrelated skills from other repos.

```powershell
# Remove ONLY the skills from this repo (not the entire directory)
$repo = "karleeov/skills"
$lockFile = "$env:USERPROFILE\.agents\.skill-lock.json"
if (Test-Path $lockFile) {
  (Get-Content $lockFile | ConvertFrom-Json).PSObject.Properties |
    Where-Object { $_.Value.source -eq $repo } |
    ForEach-Object { Remove-Item -Recurse -Force "$env:USERPROFILE\.agents\skills\$($_.Name)" -ErrorAction SilentlyContinue }
}

# If the opencode junction doesn't exist yet, create it
$junctionPath = "$env:USERPROFILE\.config\opencode\skills"
if (-not (Test-Path $junctionPath)) {
  New-Item -ItemType Junction -Path $junctionPath -Target "$env:USERPROFILE\projects\skills\skills"
}
```

Now edits in the repo are live immediately — no rebuild, no reinstall.

### Safe removal of this repo's skills

To remove only skills installed from this repo (leaving other repos' skills intact):

```powershell
npx skills remove karleeov/skills
```

Or manually, remove only the named skill folders listed in `~/.agents/.skill-lock.json` whose `source` is `karleeov/skills`.

### Skill frontmatter (opencode-recognized)

| Field | Required | Notes |
|-------|----------|-------|
| `name` | Yes | `^[a-z0-9]+(-[a-z0-9]+)*$`, 1–64 chars, must match folder name |
| `description` | Yes | 1–1024 chars |
| `license` | No | SPDX identifier |
| `compatibility` | No | Agent compatibility list |
| `metadata` | No | Freeform key-value |

> **Note:** Fields like `disable-model-invocation` and `argument-hint` (used by upstream for Claude Code) are **ignored** by opencode. The linter warns about them. To make a skill user-only in opencode, use `permission.skill` rules in `opencode.json` instead.

---

## Repo Layout

```
skills/<name>/                  one folder per skill
  SKILL.md                      the skill definition (required)
  *.md                          optional reference docs, templates

scripts/
  check-skills.mjs              structural lint (frontmatter, names, links)
  check-skill-contracts.mjs     contract test (completion loop integrity)
  smoke-skills.mjs              behavioral smoke test via opencode run
  new-skill.mjs                 scaffolder for new skills

tests/fixtures/
  <skill>.json                  smoke test prompt + expected output

.github/workflows/
  check-skills.yml              CI: npm test on push
```
