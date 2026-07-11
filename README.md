# skills

My personal agent skills collection — forked from [mattpocock/skills](https://github.com/mattpocock/skills), then customized and grown.

Each skill lives in `skills/<name>/SKILL.md` and is auto-discovered by opencode via a junction into `~/.config/opencode/skills/`.

## Quick start

```powershell
# install / lint
npm install        # optional, no runtime deps
npm run lint       # structural validator (fast, free)

# behavioral smoke test (calls the model — costs tokens)
npm run smoke

# scaffold a new skill
npm run new <skill-name>
```

## Layout

```
skills/<name>/SKILL.md        one folder per skill (+ optional sibling .md/assets)
scripts/check-skills.mjs      structural lint
scripts/smoke-skills.mjs      behavioral smoke test via `opencode run`
scripts/new-skill.mjs         scaffolder
tests/fixtures/               per-skill smoke fixtures (prompt + expected substring)
.github/workflows/check-skills.yml   CI: lint on push
```

## Wiring into opencode

The repo's `skills/` is junction-linked into opencode's global discovery path:

```powershell
New-Item -ItemType Junction `
  -Path "$env:USERPROFILE\.config\opencode\skills" `
  -Target "$env:USERPROFILE\projects\skills\skills"
```

Edit skills here; they appear globally in opencode immediately.

## Skill frontmatter (opencode-recognized)

- `name` (required) — `^[a-z0-9]+(-[a-z0-9]+)*$`, 1–64 chars, must match the folder name
- `description` (required) — 1–1024 chars
- `license`, `compatibility`, `metadata` (optional)

> Note: fields like `disable-model-invocation` and `argument-hint` (used by the upstream mattpocock skills for Claude Code) are **ignored** by opencode. The linter warns about them. To make a skill user-only in opencode, use `permission.skill` rules in `opencode.json` instead.
