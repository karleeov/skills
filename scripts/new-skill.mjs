#!/usr/bin/env node
// Scaffold a new skill: npm run new <skill-name>
// Creates skills/<name>/SKILL.md from a minimal, opencode-valid template.

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILLS_DIR = resolve(__dirname, "..", "skills");

const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const name = process.argv[2];
if (!name) {
  console.error("Usage: npm run new <skill-name>");
  process.exit(1);
}
if (!NAME_RE.test(name) || name.length > 64) {
  console.error(`Invalid name "${name}". Must match ^[a-z0-9]+(-[a-z0-9]+)*$ and be <= 64 chars.`);
  process.exit(1);
}

const dir = join(SKILLS_DIR, name);
if (existsSync(dir)) {
  console.error(`Already exists: skills/${name}/`);
  process.exit(1);
}

mkdirSync(dir, { recursive: true });

const template = `---
name: ${name}
description: One sentence: what this skill does and when to use it. Keep under 1024 chars; front-load the leading trigger word.
---

# ${name}

Describe what the agent should do here. Lead with the behaviour, then the steps.

## When to use

- Trigger phrase or situation
- Another situation

## Process

1. First step — ends on a clear completion criterion
2. Second step
3. ...

## Notes

- Keep it tight; push reference into sibling .md files and link to them.
`;

writeFileSync(join(dir, "SKILL.md"), template, "utf8");
console.log(`Created skills/${name}/SKILL.md`);
console.log(`Next: edit it, then run \`npm run lint\`.`);
