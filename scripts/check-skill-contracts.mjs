#!/usr/bin/env node
// Guards the completion loop against accidental weakening.

import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
let failures = 0;

function read(path) {
  const absolute = join(root, path);
  if (!existsSync(absolute)) {
    fail(`${path} is missing`);
    return "";
  }
  return readFileSync(absolute, "utf8");
}

function fail(message) {
  failures += 1;
  console.error(`FAIL  ${message}`);
}

function requireText(content, pattern, message) {
  if (!pattern.test(content)) fail(message);
}

const completionSkill = read("skills/complete-and-verify/SKILL.md");
const implementationSkill = read("skills/implement/SKILL.md");
const routerSkill = read("skills/ask-matt/SKILL.md");
const fixture = read("tests/fixtures/complete-and-verify.json");

const requiredSections = [
  "Establish the implementation contract",
  "Write the executable test plan",
  "Implement complete vertical slices",
  "Perform an adversarial self-check",
  "Run the proof suite",
  "Report evidence",
];

for (const section of requiredSections) {
  requireText(completionSkill, new RegExp(section, "i"), `complete-and-verify is missing: ${section}`);
}

for (const contractTerm of ["inputs", "output", "errors", "invariants", "dependencies", "callers"]) {
  requireText(completionSkill, new RegExp(`\\b${contractTerm}\\b`, "i"), `function contract is missing '${contractTerm}'`);
}

requireText(completionSkill, /exact command, exit status, and meaningful result/i, "proof suite does not require fresh command evidence");
requireText(completionSkill, /status:\*\* `Complete` or `Incomplete`/i, "final report lacks an explicit complete/incomplete status");
requireText(implementationSkill, /complete-and-verify/i, "implement does not invoke the completion gate");
requireText(implementationSkill, /re-run.*completion gate/i, "implement does not re-run verification after review fixes");
requireText(routerSkill, /complete-and-verify/i, "ask-matt does not describe the completion gate");
requireText(fixture, /"skill"\s*:\s*"complete-and-verify"/, "behavioral fixture does not target complete-and-verify");

if (failures) {
  console.error(`\n${failures} completion-contract check(s) failed.`);
  process.exit(1);
}

console.log("PASS  complete-and-verify keeps the full implementation and proof loop");
console.log("PASS  implement and ask-matt are wired to the completion gate");
console.log("PASS  behavioral fixture is present");
