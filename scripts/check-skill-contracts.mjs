#!/usr/bin/env node
// Guards the completion and shipping workflows against accidental weakening.

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

function forbidText(content, pattern, message) {
  if (pattern.test(content)) fail(message);
}

const completionSkill = read("skills/complete-and-verify/SKILL.md");
const implementationSkill = read("skills/implement/SKILL.md");
const routerSkill = read("skills/ask-dev/SKILL.md");
const shipSkill = read("skills/ship/SKILL.md");
const shipRunbook = read("skills/ship/RUNBOOK.md");
const fixture = read("tests/fixtures/complete-and-verify.json");
const shipFixture = read("tests/fixtures/ship.json");

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
requireText(implementationSkill, /all three review axes/i, "implement does not re-review the final diff after fixes");
requireText(routerSkill, /complete-and-verify/i, "ask-dev does not describe the completion gate");
requireText(fixture, /"skill"\s*:\s*"complete-and-verify"/, "behavioral fixture does not target complete-and-verify");

requireText(shipSkill, /grill-with-docs/i, "ship does not invoke grill-with-docs");
requireText(shipSkill, /to-spec/i, "ship does not invoke to-spec");
requireText(shipSkill, /to-tickets/i, "ship does not invoke to-tickets");
requireText(shipSkill, /implement/i, "ship does not invoke implement");
requireText(shipSkill, /complete-and-verify/i, "ship does not invoke complete-and-verify");
requireText(shipSkill, /code-review/i, "ship does not invoke code-review");
requireText(shipSkill, /full test suite/i, "ship does not run a final full-suite verification");
requireText(shipSkill, /execute, do not recite/i, "ship can still stop at describing its workflow");
requireText(shipSkill, /resume before restarting/i, "ship does not resume durable work");
requireText(shipSkill, /adopted input or protected unrelated work/i, "ship cannot safely continue user-authored partial implementation");
requireText(shipSkill, /base SHA/i, "ship does not pin a review and integration baseline");
requireText(shipSkill, /feature-parity branch/i, "ship lacks a legacy/rewrite parity workflow");
requireText(shipRunbook, /\| ID \| Requirement \| Source evidence \| Ticket\(s\) \| Observable check \| Final evidence \| Status \|/i, "ship lacks end-to-end requirement traceability");
requireText(shipSkill, /dependency graph is acyclic and has a frontier/i, "ship does not validate or schedule ticket dependencies");
requireText(shipSkill, /rerun the completion gate and all three review axes/i, "ship does not re-review review fixes on all axes");
requireText(shipSkill, /rather than assuming the last ticket caused it/i, "ship misattributes final integration failures");
requireText(shipSkill, /declared endpoint is reached and verified/i, "ship can report Shipped before delivery");
requireText(shipSkill, /isolated worktree/i, "ship does not isolate protected dirty work");
requireText(shipSkill, /stage it so new files are visible/i, "ship can review a diff that omits untracked files");
requireText(shipSkill, /committed tree/i, "ship does not verify the committed result");
requireText(shipSkill, /live lease exists, report `Blocked`/i, "ship can duplicate an actively owned run");
requireText(shipSkill, /first run-state write atomically creates.*\.lock/is, "ship can report a lease without holding a physical lock");
requireText(shipSkill, /verified no-op evidence and the baseline SHA/i, "ship traceability cannot represent already-satisfied work");
requireText(shipSkill, /apply that mutation temporarily.*observe the new check fail/is, "ship does not require mutation-sensitive regression tests");
requireText(shipSkill, /never commit directly to the base\/default\/protected branch or detached `HEAD`/i, "ship can commit on an unsafe branch");
requireText(shipSkill, /persist the candidate tree hash, proof commands\/results.*before committing/is, "ship does not persist review evidence before commit");
requireText(shipSkill, /subject `<work-item ID>: <concise delivered behavior>`/i, "ship commits are not deterministically traceable to work items");
requireText(shipRunbook, /Final review Correctness: Pass - 0 blocking findings/i, "ship run records lack a deterministic final-review result");
requireText(shipRunbook, /ticket worker contract/i, "ship has no fresh-worker input/output contract");
requireText(shipRunbook, /exact commands, exit statuses, and meaningful results/i, "ship workers do not return executable evidence");
requireText(shipFixture, /completed feature-parity audit/i, "ship smoke fixture does not cover the former audit-only failure mode");
requireText(shipFixture, /ship every audited gap end to end now/i, "ship smoke fixture does not require implementation");
requireText(shipFixture, /"workspace"\s*:\s*"ship-parity"/i, "ship smoke fixture has no executable repository scenario");
requireText(shipFixture, /"requireSkillLoad"\s*:\s*true/i, "ship smoke fixture does not prove the checkout skill was loaded");
forbidText(shipSkill, /pure orchestrator/i, "ship still declares itself a non-executing orchestrator");
forbidText(shipSkill, /last ticket's completion gate was incomplete/i, "ship still blames final failures on the last ticket");
requireText(routerSkill, /\/ship/i, "ask-dev does not mention the ship skill");

if (failures) {
  console.error(`\n${failures} completion-contract check(s) failed.`);
  process.exit(1);
}

console.log("PASS  complete-and-verify keeps the full implementation and proof loop");
console.log("PASS  implement and ask-dev are wired to the completion gate");
console.log("PASS  behavioral fixture is present");
console.log("PASS  ship owns a durable, traceable delivery workflow");
