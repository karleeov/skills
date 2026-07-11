#!/usr/bin/env node
// Structural validator for skills/<name>/SKILL.md
// Fast, deterministic, no network. Checks everything opencode needs to load a skill.
//
// Rules (from https://opencode.ai/docs/skills/):
//   - frontmatter present, valid YAML
//   - name: required, ^[a-z0-9]+(-[a-z0-9]+)*$, 1-64 chars, MUST equal the folder name
//   - description: required, 1-1024 chars
//   - recognized fields: name, description, license, compatibility, metadata
//     (unknown fields like disable-model-invocation / argument-hint are IGNORED by opencode -> WARN)
//   - relative markdown links must resolve within the repo
//   - no duplicate skill names
// Exit code: 0 if no errors (warnings ok), 1 if any error.

import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join, dirname, resolve, basename, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SKILLS_DIR = join(ROOT, "skills");

const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const RECOGNIZED = new Set(["name", "description", "license", "compatibility", "metadata"]);
const MAX_NAME = 64;
const MAX_DESC = 1024;

const G = { red: (s) => `\x1b[31m${s}\x1b[0m`, green: (s) => `\x1b[32m${s}\x1b[0m`, yellow: (s) => `\x1b[33m${s}\x1b[0m`, dim: (s) => `\x1b[2m${s}\x1b[0m`, bold: (s) => `\x1b[1m${s}\x1b[0m` };

let errors = 0;
let warnings = 0;
const seenNames = new Map(); // name -> folder

function parseFrontmatter(text) {
  // matches leading ---\n ... \n---
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { ok: false, fm: null, body: text, raw: null };
  const raw = m[1];
  const fm = {};
  let curKey = null;
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue;
    // metadata is a string->string map; skip its nested lines
    if (/^\s/.test(line)) {
      if (curKey === "metadata") continue; // accept nested map under metadata
      continue;
    }
    const kv = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (!kv) continue;
    const key = kv[1];
    let val = kv[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    fm[key] = val;
    curKey = key;
  }
  return { ok: true, fm, body: text.slice(m[0].length), raw };
}

function extractLinks(body) {
  // Strip fenced code blocks (``` or ~~~) and inline `code` so placeholders
  // and examples inside templates aren't mistaken for real links.
  const stripped = body
    .replace(/```[\s\S]*?```/g, "")
    .replace(/~~~[\s\S]*?~~~/g, "")
    .replace(/`[^`\n]*`/g, "");
  const links = [];
  const re = /\[[^\]]*\]\(([^)]+)\)/g;
  let m;
  while ((m = re.exec(stripped)) !== null) {
    links.push(m[1]);
  }
  return links;
}

function skillFolders() {
  if (!existsSync(SKILLS_DIR)) return [];
  return readdirSync(SKILLS_DIR)
    .map((n) => join(SKILLS_DIR, n))
    .filter((p) => statSync(p).isDirectory());
}

function check(folder) {
  const name = basename(folder);
  const skillFile = join(folder, "SKILL.md");
  const local = { errors: 0, warnings: 0, notes: [] };
  const e = (msg) => { local.errors++; local.notes.push(G.red("  ERROR ") + msg); };
  const w = (msg) => { local.warnings++; local.notes.push(G.yellow("  warn  ") + msg); };

  if (!existsSync(skillFile)) {
    e(`SKILL.md missing in ${name}/`);
    return local;
  }
  const text = readFileSync(skillFile, "utf8");
  const { ok, fm, body } = parseFrontmatter(text);
  if (!ok || !fm) {
    e(`${name}/SKILL.md: missing or malformed YAML frontmatter (must start with ---)`);
    return local;
  }

  // name
  const n = fm.name;
  if (!n) e(`${name}/: frontmatter missing 'name'`);
  else {
    if (!NAME_RE.test(n)) e(`${name}/: name "${n}" fails regex ^[a-z0-9]+(-[a-z0-9]+)*$`);
    if (n.length > MAX_NAME) e(`${name}/: name exceeds ${MAX_NAME} chars`);
    if (n !== name) e(`${name}/: frontmatter name "${n}" != folder name "${name}"`);
  }

  // description
  const d = fm.description;
  if (d === undefined || d === null || d === "") e(`${name}/: frontmatter missing 'description'`);
  else if (d.length > MAX_DESC) e(`${name}/: description exceeds ${MAX_DESC} chars (${d.length})`);

  // unknown fields (opencode ignores them)
  for (const k of Object.keys(fm)) {
    if (!RECOGNIZED.has(k)) {
      const hint = (k === "disable-model-invocation" || k === "argument-hint")
        ? " (ignored by opencode — Claude Code only)"
        : "";
      w(`${name}/: unknown frontmatter field '${k}'${hint}`);
    }
  }

  // links resolve
  for (const link of extractLinks(body)) {
    if (/^https?:\/\//i.test(link) || link.startsWith("#") || link.startsWith("mailto:")) continue;
    const target = link.split("#")[0].split("?")[0];
    if (!target) continue;
    const abs = resolve(folder, target);
    if (!existsSync(abs)) e(`${name}/: broken link -> ${target}`);
  }

  // dup names
  if (n) {
    if (seenNames.has(n) && seenNames.get(n) !== name) {
      e(`${name}/: duplicate skill name "${n}" (also in ${seenNames.get(n)}/)`);
    } else {
      seenNames.set(n, name);
    }
  }

  return local;
}

function main() {
  const folders = skillFolders();
  if (folders.length === 0) {
    console.log(G.yellow("No skills found under skills/"));
    process.exit(0);
  }
  console.log(G.bold(`\nChecking ${folders.length} skill(s)\n`));

  const results = folders.map((f) => ({ name: basename(f), ...check(f) }));

  for (const r of results) {
    const tag = r.errors ? G.red("FAIL") : r.warnings ? G.yellow("warn") : G.green(" ok ");
    console.log(`${tag}  ${r.name}`);
    for (const note of r.notes) console.log(note);
  }

  errors = results.reduce((a, r) => a + r.errors, 0);
  warnings = results.reduce((a, r) => a + r.warnings, 0);

  const okFolders = results.filter((r) => r.errors === 0).length;
  console.log(G.dim(`\n${okFolders}/${results.length} skills passed`) +
    (warnings ? G.yellow(`, ${warnings} warning(s)`) : "") +
    (errors ? G.red(`, ${errors} error(s)`) : G.green(", 0 errors")));

  process.exit(errors ? 1 : 0);
}

main();
