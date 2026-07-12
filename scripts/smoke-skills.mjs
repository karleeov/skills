#!/usr/bin/env node
// Behavioral smoke test for skills.
//
// For each fixture in tests/fixtures/*.json, run `opencode run --format json --auto`
// with the fixture's prompt, collect the assistant's text output, and assert it
// contains the expected substring(s).
//
// Fixtures (tests/fixtures/<anything>.json):
//   {
//     "skill": "wayfinder",                      // which skill this exercises
//     "prompt": "...",                           // sent to the agent
//     "expectContains": ["...", "..."],          // substrings that must appear (array or string)
//     "timeoutMs": 120000                        // optional, default 120000
//   }
//
// Usage:
//   npm run smoke                  run all fixtures
//   npm run smoke -- --dry         validate fixtures only (no model calls)
//   npm run smoke -- --only wayfinder   run fixtures whose skill matches
//
// NOTE: live runs call the model and cost tokens. CI validates fixture structure only.

import { readdirSync, readFileSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const FIXTURES_DIR = join(ROOT, "tests", "fixtures");
const CACHE_DIR = join(ROOT, ".smoke-cache");
const EMPTY_GIT_CONFIG = join(CACHE_DIR, "empty-gitconfig");
const WORKSPACES = new Set(["ship-parity"]);

const SHIP_PARITY_BASELINE = [
  "export function invoiceTotal(lines) {",
  "  return lines.reduce((sum, line) => sum + line.amount, 0);",
  "}",
  "",
].join("\n");

const G = { red: (s) => `\x1b[31m${s}\x1b[0m`, green: (s) => `\x1b[32m${s}\x1b[0m`, yellow: (s) => `\x1b[33m${s}\x1b[0m`, dim: (s) => `\x1b[2m${s}\x1b[0m`, bold: (s) => `\x1b[1m${s}\x1b[0m`, cyan: (s) => `\x1b[36m${s}\x1b[0m` };

const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const onlyIdx = args.indexOf("--only");
const ONLY = onlyIdx >= 0 ? args[onlyIdx + 1] : null;

function loadFixtures() {
  if (!existsSync(FIXTURES_DIR)) return [];
  return readdirSync(FIXTURES_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const data = JSON.parse(readFileSync(join(FIXTURES_DIR, f), "utf8"));
      return { file: f, ...data };
    });
}

function validateFixture(fx) {
  const errs = [];
  if (!fx.skill) errs.push("missing 'skill'");
  if (!fx.prompt) errs.push("missing 'prompt'");
  if (!fx.expectContains || (Array.isArray(fx.expectContains) ? fx.expectContains.length === 0 : !fx.expectContains))
    errs.push("missing/empty 'expectContains'");
  if (fx.workspace !== undefined && !WORKSPACES.has(fx.workspace))
    errs.push(`unknown 'workspace': ${fx.workspace}`);
  if (fx.requireSkillLoad !== undefined && typeof fx.requireSkillLoad !== "boolean")
    errs.push("'requireSkillLoad' must be boolean");
  return errs;
}

function opencodeCommand() {
  if (process.env.OPENCODE_BIN) return process.env.OPENCODE_BIN;
  if (process.platform === "win32") {
    const native = join(dirname(process.execPath), "node_modules", "opencode-ai", "bin", "opencode.exe");
    if (existsSync(native)) return native;
  }
  return "opencode";
}

function killPidTree(pid, fallback) {
  if (!pid) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(pid), "/t", "/f"], { stdio: "ignore" });
    return;
  }
  try {
    process.kill(-pid, "SIGTERM");
  } catch {
    if (fallback) fallback();
    else {
      try { process.kill(pid, "SIGTERM"); } catch {}
    }
  }
}

function killProcessTree(proc) {
  killPidTree(proc.pid, () => proc.kill("SIGTERM"));
}

// Parse opencode's NDJSON event stream into concatenated assistant text.
// Handles the observed shape: { type:"text", part:{ text:"..." } } plus a
// few liberal fallbacks in case the event schema shifts.
function parseText(raw) {
  let text = "";
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let ev;
    try { ev = JSON.parse(trimmed); } catch { continue; }
    const parts = ev?.parts || ev?.message?.parts || ev?.content || [];
    if (Array.isArray(parts)) {
      for (const p of parts) {
        const t = typeof p === "string" ? p : p?.text ?? p?.content ?? null;
        if (typeof t === "string") text += t;
      }
    }
    const partText = ev?.part?.text ?? ev?.part?.content;
    if (typeof partText === "string") text += partText;
    if (typeof ev?.text === "string") text += ev.text;
  }
  return text;
}

function loadedSkill(raw, skill) {
  const expectedDir = join(ROOT, "skills", skill).replace(/\\/g, "/").toLowerCase();
  for (const line of raw.split(/\r?\n/)) {
    let event;
    try { event = JSON.parse(line); } catch { continue; }
    const candidates = [event, event?.part, ...(Array.isArray(event?.parts) ? event.parts : [])];
    for (const part of candidates) {
      const output = String(part?.state?.output || "");
      const normalizedOutput = output.replace(/\\/g, "/").toLowerCase();
      if (
        part?.type === "tool" &&
        part?.tool === "skill" &&
        part?.state?.status === "completed" &&
        part?.state?.input?.name === skill &&
        normalizedOutput.includes(expectedDir) &&
        /execute, do not recite/i.test(output)
      ) return true;
    }
  }
  return false;
}

function snippet(s, n = 160) {
  const clean = s.replace(/\s+/g, " ").trim();
  return clean.length > n ? clean.slice(0, n) + "…" : clean;
}

function markdownSection(markdown, heading, level = 2) {
  const lines = markdown.split(/\r?\n/);
  const marker = `${"#".repeat(level)} ${heading}`;
  let start = -1;
  let inFence = false;

  for (let index = 0; index < lines.length; index += 1) {
    if (/^\s*```/.test(lines[index])) inFence = !inFence;
    if (!inFence && lines[index].trimEnd() === marker) {
      start = index + 1;
      break;
    }
  }
  if (start < 0) return "";

  inFence = false;
  let end = lines.length;
  const boundary = new RegExp(`^#{1,${level}}\\s+`);
  for (let index = start; index < lines.length; index += 1) {
    if (/^\s*```/.test(lines[index])) inFence = !inFence;
    if (!inFence && boundary.test(lines[index])) {
      end = index;
      break;
    }
  }
  return lines.slice(start, end).join("\n");
}

function parseIsoTimestamp(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!match) return Number.NaN;
  const [, year, month, day, hour, minute, second, , zone] = match;
  const daysInMonth = new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate();
  const zoneMatch = zone === "Z" ? null : /^([+-])(\d{2}):(\d{2})$/.exec(zone);
  if (
    Number(month) < 1 || Number(month) > 12 ||
    Number(day) < 1 || Number(day) > daysInMonth ||
    Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59 ||
    (zoneMatch && (Number(zoneMatch[2]) > 23 || Number(zoneMatch[3]) > 59))
  ) return Number.NaN;
  return Date.parse(value);
}

function isolatedGitEnv() {
  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
  if (!existsSync(EMPTY_GIT_CONFIG)) writeFileSync(EMPTY_GIT_CONFIG, "");
  const env = {
    ...process.env,
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_CONFIG_GLOBAL: EMPTY_GIT_CONFIG,
  };
  for (const key of Object.keys(env)) {
    if (/^GIT_(?:DIR|WORK_TREE|INDEX_FILE|OBJECT_DIRECTORY|ALTERNATE_OBJECT_DIRECTORIES|COMMON_DIR|CEILING_DIRECTORIES|PREFIX|CONFIG_PARAMETERS)$/i.test(key)) delete env[key];
    if (/^GIT_CONFIG_(?:COUNT|KEY_\d+|VALUE_\d+|SYSTEM)$/i.test(key)) delete env[key];
  }
  return env;
}

function runCommand(command, args, cwd, { allowFailure = false, timeoutMs = 120000, env = process.env } = {}) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    shell: false,
    timeout: timeoutMs,
    windowsHide: true,
    detached: process.platform !== "win32",
    env,
  });
  if (result.error) {
    if (result.error.code === "ETIMEDOUT") killPidTree(result.pid);
    throw new Error(`${command} ${args.join(" ")} failed: ${result.error.message}`);
  }
  if (!allowFailure && result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed: ${result.stderr || result.stdout}`);
  }
  return result;
}

function prepareWorkspace(fx, tmpDir) {
  if (fx.workspace !== "ship-parity") return;

  writeFileSync(join(tmpDir, "package.json"), JSON.stringify({
    type: "module",
    scripts: { test: "node --test" },
  }, null, 2) + "\n");
  writeFileSync(join(tmpDir, "invoice.js"), SHIP_PARITY_BASELINE);
  writeFileSync(join(tmpDir, "invoice.test.js"), [
    "import test from 'node:test';",
    "import assert from 'node:assert/strict';",
    "import { invoiceTotal } from './invoice.js';",
    "",
    "test('adds same-currency invoice lines', () => {",
    "  assert.equal(invoiceTotal([{ amount: 2, currency: 'USD' }, { amount: 3, currency: 'USD' }]), 5);",
    "});",
    "",
  ].join("\n"));
  writeFileSync(join(tmpDir, "PARITY-AUDIT.md"), [
    "# Invoice parity audit",
    "",
    "- INV-01 gap: the legacy endpoint rejects mixed currencies; invoiceTotal currently aggregates them (`invoice.js:1-3`).",
    "- Required result: throw an Error containing `mixed currencies` when line currencies differ.",
    "- Preserve same-currency aggregation.",
    "",
  ].join("\n"));

  const gitOptions = { env: isolatedGitEnv() };
  runCommand("git", ["init", "--template="], tmpDir, gitOptions);
  runCommand("git", ["config", "user.email", "smoke@example.com"], tmpDir, gitOptions);
  runCommand("git", ["config", "user.name", "Smoke Test"], tmpDir, gitOptions);
  mkdirSync(join(tmpDir, ".git", "disabled-hooks"), { recursive: true });
  runCommand("git", ["config", "core.hooksPath", ".git/disabled-hooks"], tmpDir, gitOptions);
  runCommand("git", ["config", "commit.gpgSign", "false"], tmpDir, gitOptions);
  runCommand("git", ["add", "."], tmpDir, gitOptions);
  runCommand("git", ["commit", "--no-verify", "--no-gpg-sign", "-m", "baseline"], tmpDir, gitOptions);
  runCommand("git", ["branch", "-M", "main"], tmpDir, gitOptions);
  fx.baselineSha = runCommand("git", ["rev-parse", "HEAD"], tmpDir, gitOptions).stdout.trim();
}

function verifyCommittedBehavior(tmpDir, finalSha, gitOptions) {
  const verifyDir = join(CACHE_DIR, "verify-" + Math.random().toString(36).slice(2, 10));
  let added = false;

  try {
    runCommand("git", ["worktree", "add", "--detach", verifyDir, finalSha], tmpDir, gitOptions);
    added = true;
    runCommand(process.execPath, ["--test"], verifyDir);
    runCommand(process.execPath, [
      "--input-type=module",
      "-e",
      [
        "const { invoiceTotal } = await import('./invoice.js');",
        "if (invoiceTotal([{ amount: 7, currency: 'USD' }, { amount: 11, currency: 'USD' }]) !== 18) process.exit(1);",
        "if (invoiceTotal([{ amount: -4, currency: 'USD' }, { amount: 9, currency: 'USD' }]) !== 5) process.exit(1);",
        "if (invoiceTotal([{ amount: 13, currency: 'EUR' }, { amount: 17, currency: 'EUR' }]) !== 30) process.exit(1);",
        "let passed = false;",
        "try {",
        "  invoiceTotal([{ amount: 2, currency: 'USD' }, { amount: 3, currency: 'EUR' }]);",
        "} catch (error) {",
        "  passed = /mixed currencies/i.test(String(error.message));",
        "}",
        "if (!passed) process.exit(1);",
      ].join("\n"),
    ], verifyDir);

    const checkedHead = runCommand("git", ["rev-parse", "HEAD"], verifyDir, gitOptions).stdout.trim();
    if (checkedHead !== finalSha) throw new Error("ship fixture tests moved the clean-checkout HEAD");
    const postTestStatus = runCommand(
      "git",
      ["status", "--porcelain", "--untracked-files=all", "--ignored=matching"],
      verifyDir,
      gitOptions,
    );
    if (postTestStatus.stdout.trim()) throw new Error(`ship fixture tests changed the clean checkout: ${postTestStatus.stdout}`);

    const implementation = runCommand("git", ["show", `${finalSha}:invoice.js`], tmpDir, gitOptions).stdout;
    if (!/mixed currencies/i.test(implementation)) {
      throw new Error("ship fixture did not implement the audited currency rule");
    }
    const tests = runCommand("git", ["show", `${finalSha}:invoice.test.js`], tmpDir, gitOptions).stdout;
    if (!/assert\.throws/i.test(tests) || !/USD/i.test(tests) || !/EUR/i.test(tests) || !/mixed currencies/i.test(tests)) {
      throw new Error("ship fixture did not add a specific mixed-currency regression test");
    }

    let mutantResult;
    try {
      writeFileSync(join(verifyDir, "invoice.js"), SHIP_PARITY_BASELINE);
      mutantResult = runCommand(
        process.execPath,
        ["--test"],
        verifyDir,
        { allowFailure: true },
      );
    } finally {
      runCommand("git", ["restore", "--source=HEAD", "--", "invoice.js"], verifyDir, gitOptions);
    }
    const mutantOutput = `${mutantResult.stdout}\n${mutantResult.stderr}`;
    if (
      mutantResult.status === 0 ||
      !/ERR_ASSERTION/i.test(mutantOutput) ||
      !/Missing expected exception/i.test(mutantOutput)
    ) {
      throw new Error("ship fixture mixed-currency test does not fail when the audited rule is removed");
    }

    const restored = runCommand(
      "git",
      ["status", "--porcelain", "--untracked-files=all", "--ignored=matching"],
      verifyDir,
      gitOptions,
    );
    if (restored.stdout.trim()) {
      throw new Error(`ship fixture clean-checkout proof left artifacts: ${restored.stdout}`);
    }
    const restoredHead = runCommand("git", ["rev-parse", "HEAD"], verifyDir, gitOptions).stdout.trim();
    if (restoredHead !== finalSha) throw new Error("ship fixture mutation check moved the clean-checkout HEAD");
  } finally {
    if (added) {
      try {
        runCommand("git", ["worktree", "remove", "--force", verifyDir], tmpDir, gitOptions);
      } catch {
        rmSync(verifyDir, { recursive: true, force: true });
        runCommand("git", ["worktree", "prune", "--expire", "now"], tmpDir, gitOptions);
      }
    } else {
      rmSync(verifyDir, { recursive: true, force: true });
    }
    const registered = runCommand("git", ["worktree", "list", "--porcelain"], tmpDir, gitOptions).stdout.replace(/\\/g, "/").toLowerCase();
    if (existsSync(verifyDir) || registered.includes(verifyDir.replace(/\\/g, "/").toLowerCase())) {
      throw new Error(`ship fixture leaked verification worktree ${verifyDir}`);
    }
  }
}

function verifyWorkspace(fx, tmpDir) {
  if (fx.workspace !== "ship-parity") return;

  const gitOptions = { env: isolatedGitEnv() };
  const count = runCommand("git", ["rev-list", "--count", "HEAD"], tmpDir, gitOptions);
  if (Number.parseInt(count.stdout.trim(), 10) < 2) {
    throw new Error("ship fixture did not create an implementation commit");
  }
  const status = runCommand("git", ["-c", "status.showUntrackedFiles=all", "status", "--porcelain", "--untracked-files=all"], tmpDir, gitOptions);
  if (status.stdout.trim()) {
    throw new Error(`ship fixture left a dirty worktree: ${status.stdout || status.stderr}`);
  }
  const branch = runCommand("git", ["branch", "--show-current"], tmpDir, gitOptions).stdout.trim();
  if (!branch || branch === "main" || branch === "master") {
    throw new Error(`ship fixture committed on an unsafe branch: ${branch || "detached HEAD"}`);
  }
  const mainSha = runCommand("git", ["rev-parse", "main"], tmpDir, gitOptions).stdout.trim();
  if (!fx.baselineSha || mainSha !== fx.baselineSha) throw new Error("ship fixture changed the baseline branch");
  const ancestry = runCommand("git", ["merge-base", "--is-ancestor", mainSha, "HEAD"], tmpDir, { ...gitOptions, allowFailure: true });
  if (ancestry.status !== 0) throw new Error("ship fixture final HEAD does not descend from the baseline");
  const finalSha = runCommand("git", ["rev-parse", "HEAD"], tmpDir, gitOptions).stdout.trim();
  const finalTree = runCommand("git", ["rev-parse", "HEAD^{tree}"], tmpDir, gitOptions).stdout.trim();
  const featureCommits = runCommand("git", ["log", "--format=%H%n%B%n--END--", "main..HEAD"], tmpDir, gitOptions).stdout.trim();
  if (!featureCommits) throw new Error("ship fixture feature branch has no implementation commit");
  const commitBodies = featureCommits.split("--END--").map((body) => body.trim()).filter(Boolean);
  const exactItem = /(?:^|[^A-Z0-9_-])INV-01(?:$|[^A-Z0-9_-])/i;
  if (commitBodies.some((body) => !exactItem.test(body))) throw new Error("ship fixture has a feature commit without the exact INV-01 work-item reference");
  const mainReflog = runCommand("git", ["reflog", "show", "--format=%H", "main"], tmpDir, gitOptions).stdout.trim().split(/\r?\n/).filter(Boolean);
  if (mainReflog.some((sha) => sha !== fx.baselineSha)) throw new Error("ship fixture committed on or rewrote the baseline branch");
  const featureReflog = runCommand("git", ["reflog", "show", "--format=%H%x09%gs", branch], tmpDir, gitOptions).stdout.trim().split(/\r?\n/).filter(Boolean).reverse();
  const creationIndex = featureReflog.findIndex((line) => /\tbranch: Created from\b/i.test(line));
  const commitIndex = featureReflog.findIndex((line) => /\tcommit(?: \([^)]*\))?:/i.test(line));
  if (creationIndex < 0 || commitIndex < 0 || creationIndex > commitIndex || !featureReflog[creationIndex].startsWith(fx.baselineSha)) {
    throw new Error("ship fixture feature branch was not created from the baseline before commits");
  }
  verifyCommittedBehavior(tmpDir, finalSha, gitOptions);
  const root = resolve(tmpDir).replace(/\\/g, "/").toLowerCase();
  const registeredWorktrees = runCommand("git", ["worktree", "list", "--porcelain"], tmpDir, gitOptions).stdout
    .split(/\r?\n/)
    .filter((line) => line.startsWith("worktree "))
    .map((line) => resolve(line.slice("worktree ".length)).replace(/\\/g, "/").toLowerCase());
  const leakedWorktrees = registeredWorktrees.filter((path) => path !== root);
  if (leakedWorktrees.length) {
    for (const path of leakedWorktrees) {
      try { runCommand("git", ["worktree", "remove", "--force", path], tmpDir, gitOptions); } catch {
        try { rmSync(path, { recursive: true, force: true }); } catch {}
      }
    }
    runCommand("git", ["worktree", "prune", "--expire", "now"], tmpDir, gitOptions);
    throw new Error(`ship fixture leaked linked worktree(s): ${leakedWorktrees.join(", ")}`);
  }
  const commonDir = runCommand("git", ["rev-parse", "--git-common-dir"], tmpDir, gitOptions).stdout.trim();
  const runDir = resolve(tmpDir, commonDir, "ship-runs");
  if (!existsSync(runDir)) throw new Error("ship fixture did not create a durable run record");
  const names = readdirSync(runDir);
  if (names.some((name) => name.endsWith(".lock"))) throw new Error("ship fixture left an active run lease");
  const records = names.filter((name) => name.endsWith(".md")).map((name) => ({ name, content: readFileSync(join(runDir, name), "utf8") }));
  const terminal = records.filter((record) => /^- Status:\s*Shipped\s*$/im.test(record.content));
  if (terminal.length !== 1) throw new Error(`ship fixture expected one terminal Shipped record, found ${terminal.length}`);
  const { name: recordName, content: evidence } = terminal[0];
  const escaped = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const runIdMatch = evidence.match(/^- Run ID:\s*([^<>\r\n]+?)\s*$/im);
  if (!runIdMatch) throw new Error("ship fixture run record has no concrete Run ID");
  const expectedLock = `${recordName.slice(0, -3)}.lock`;
  const observedLock = fx.observedLeases?.[expectedLock];
  if (!observedLock) throw new Error(`ship fixture never observed associated lease ${expectedLock}`);
  const iso = "\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d{1,3})?(?:Z|[+-]\\d{2}:\\d{2})";
  const acquiredMatch = evidence.match(new RegExp(`^- Lease acquired:\\s*([^<>\\r\\n]+?)\\s+at\\s+(${iso})\\s*$`, "im"));
  const releaseMatch = evidence.match(new RegExp(`^- Lease release:\\s*Shipped\\s+at\\s+(${iso})\\s*$`, "im"));
  const lockLines = observedLock.trim().split(/\r?\n/);
  const lockRunId = lockLines.length === 3 ? lockLines[0].match(/^Run ID:\s*([^<>]+?)\s*$/)?.[1] : undefined;
  const lockOwner = lockLines.length === 3 ? lockLines[1].match(/^Owner:\s*([^<>]+?)\s*$/)?.[1] : undefined;
  const lockAcquired = lockLines.length === 3 ? lockLines[2].match(new RegExp(`^Acquired:\\s*(${iso})\\s*$`))?.[1] : undefined;
  const acquiredTime = parseIsoTimestamp(acquiredMatch?.[2] || "");
  const releaseTime = parseIsoTimestamp(releaseMatch?.[1] || "");
  if (
    !acquiredMatch || !releaseMatch ||
    lockRunId !== runIdMatch[1] || lockOwner !== acquiredMatch[1] || lockAcquired !== acquiredMatch[2] ||
    !Number.isFinite(acquiredTime) || !Number.isFinite(releaseTime) || acquiredTime > releaseTime
  ) {
    throw new Error(`ship fixture run record has an invalid lease lifecycle: record=${runIdMatch[1]}, lockRun=${lockRunId}, acquiredOwner=${acquiredMatch?.[1]}, lockOwner=${lockOwner}, acquired=${acquiredMatch?.[2]}, lockAcquired=${lockAcquired}, release=${releaseMatch?.[1]}`);
  }
  const topLevelLines = [
    /^- Status:\s*Shipped\s*$/im,
    /^- Phase:\s*Deliver\s*$/im,
    /^- Endpoint:\s*committed\s*$/im,
  ];
  for (const pattern of topLevelLines) {
    if (!pattern.test(evidence)) throw new Error(`ship fixture run record is missing top-level terminal evidence matching ${pattern}`);
  }
  const itemEvidence = markdownSection(evidence, "Item evidence");
  const item = markdownSection(itemEvidence, "INV-01", 3);
  const delivery = markdownSection(evidence, "Delivery evidence");
  if (!item || !delivery) throw new Error("ship fixture run record is missing scoped item or delivery evidence sections");
  const itemLines = [
    new RegExp(`^- Candidate tree:\\s*${escaped(finalTree)}\\s*$`, "im"),
    new RegExp(`^- Commit:\\s*${escaped(finalSha)}\\s*$`, "im"),
    /^- Proof:\s*`(?:node\s+--test|npm\s+test)`\s*->\s*exit\s+0\b/im,
    /^- Review Correctness:\s*Pass - 0 blocking findings\b/im,
    /^- Review Standards:\s*Pass - 0 blocking findings\b/im,
    /^- Review Spec:\s*Pass - 0 blocking findings\b/im,
  ];
  for (const pattern of itemLines) {
    if (!pattern.test(item)) throw new Error(`ship fixture item evidence is missing ${pattern}`);
  }
  const deliveryLines = [
    new RegExp(`^- Final HEAD:\\s*${escaped(finalSha)}\\s*$`, "im"),
    new RegExp(`^- Final tree:\\s*${escaped(finalTree)}\\s*$`, "im"),
    new RegExp(`^- Requirement INV-01:\\s*${escaped(finalSha)}\\s*$`, "im"),
    /^- Final proof:\s*`(?:node\s+--test|npm\s+test)`\s*->\s*exit\s+0\b/im,
    /^- Final review Correctness:\s*Pass - 0 blocking findings\s*$/im,
    /^- Final review Standards:\s*Pass - 0 blocking findings\s*$/im,
    /^- Final review Spec:\s*Pass - 0 blocking findings\s*$/im,
    /^- Endpoint verified:\s*committed\b/im,
  ];
  for (const pattern of deliveryLines) {
    if (!pattern.test(delivery)) throw new Error(`ship fixture delivery evidence is missing ${pattern}`);
  }
}

// Run opencode headless; resolve with concatenated assistant text.
function runOpencode(prompt, { timeoutMs = 120000, model, fixture } = {}) {
  return new Promise((resolveP, rejectP) => {
    const tmpDir = join(CACHE_DIR, "run-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8));
    mkdirSync(tmpDir, { recursive: true });

    writeFileSync(join(tmpDir, "opencode.json"), JSON.stringify({
      $schema: "https://opencode.ai/config.json",
      skills: { paths: [join(ROOT, "skills")] },
    }, null, 2) + "\n");

    try {
      prepareWorkspace(fixture, tmpDir);
    } catch (e) {
      try { rmSync(tmpDir, { recursive: true, force: true }); } catch {}
      rejectP(e);
      return;
    }

    const cliArgs = ["run", "--format", "json", "--auto", "--pure"];
    if (model) cliArgs.push("--model", model);
    cliArgs.push(prompt);
    const proc = spawn(opencodeCommand(), cliArgs, {
      cwd: tmpDir,
      shell: false,
      detached: process.platform !== "win32",
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...isolatedGitEnv(),
        OPENCODE_DISABLE_EXTERNAL_SKILLS: "1",
        OPENCODE_DISABLE_CLAUDE_CODE_SKILLS: "1",
      },
    });

    let raw = "";
    let stderr = "";
    let settled = false;
    if (fixture?.workspace === "ship-parity") fixture.observedLeases = {};
    const leaseMonitor = fixture?.workspace === "ship-parity"
      ? setInterval(() => {
          const runDir = join(tmpDir, ".git", "ship-runs");
          if (!existsSync(runDir)) return;
          for (const name of readdirSync(runDir).filter((entry) => entry.endsWith(".lock"))) {
            try {
              fixture.observedLeases[name] ??= readFileSync(join(runDir, name), "utf8");
            } catch {}
          }
        }, 25)
      : null;
    const finish = (fn) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (leaseMonitor) clearInterval(leaseMonitor);
      fn();
    };

    const timer = setTimeout(() => {
      killProcessTree(proc);
      const partial = parseText(raw);
      try { rmSync(tmpDir, { recursive: true, force: true }); } catch {}
      finish(() => rejectP(new Error(
        `timeout after ${timeoutMs}ms${stderr.trim() ? `; stderr: ${snippet(stderr)}` : ""}` +
        (partial ? `; partial: ${snippet(partial)}` : " (no output captured)")
      )));
    }, timeoutMs);

    proc.stdout.on("data", (d) => { raw += d.toString(); });
    proc.stderr.on("data", (d) => { stderr += d.toString(); });
    proc.on("error", (e) => {
      try { rmSync(tmpDir, { recursive: true, force: true }); } catch {}
      finish(() => rejectP(e));
    });
    proc.on("close", (code) => {
      if (settled) {
        try { rmSync(tmpDir, { recursive: true, force: true }); } catch {}
        return;
      }
      const text = parseText(raw) || raw;
      if (code !== 0) {
        try { rmSync(tmpDir, { recursive: true, force: true }); } catch {}
        finish(() => rejectP(new Error(`opencode exited ${code}${stderr.trim() ? `; stderr: ${snippet(stderr)}` : ""}`)));
        return;
      }
      try {
        verifyWorkspace(fixture, tmpDir);
        rmSync(tmpDir, { recursive: true, force: true });
        finish(() => resolveP({ text, code, raw }));
      } catch (e) {
        try { rmSync(tmpDir, { recursive: true, force: true }); } catch {}
        finish(() => rejectP(new Error(`${e.message}; assistant: ${snippet(text, 500)}`)));
      }
    });
  });
}

async function runFixture(fx) {
  const expects = Array.isArray(fx.expectContains) ? fx.expectContains : [fx.expectContains];
  const result = { name: `${fx.skill} (${fx.file})`, missing: [], textLen: 0, ok: false, error: null };

  try {
    const { text, raw } = await runOpencode(fx.prompt, {
      timeoutMs: fx.timeoutMs ?? 120000,
      model: fx.model,
      fixture: fx,
    });
    result.textLen = text.length;
    if (fx.requireSkillLoad && !loadedSkill(raw, fx.skill)) {
      result.error = `skill tool did not load '${fx.skill}' from the configured checkout`;
      return result;
    }
    for (const exp of expects) {
      if (!text.toLowerCase().includes(String(exp).toLowerCase())) result.missing.push(exp);
    }
    result.ok = result.missing.length === 0;
  } catch (e) {
    result.error = e.message || String(e);
    result.ok = false;
  }
  return result;
}

async function main() {
  let fixtures = loadFixtures();
  if (ONLY) fixtures = fixtures.filter((f) => f.skill === ONLY || f.file.includes(ONLY));

  if (fixtures.length === 0) {
    console.log(G.yellow("\nNo smoke fixtures found in tests/fixtures/."));
    console.log(G.dim("Create one: see tests/fixtures/README.md. Nothing to run.\n"));
    process.exit(0);
  }

  // Validate all fixtures first.
  const invalid = fixtures.map((f) => ({ f, errs: validateFixture(f) })).filter((x) => x.errs.length);
  if (invalid.length) {
    console.log(G.red("\nInvalid fixture(s):"));
    for (const { f, errs } of invalid) console.log(`  ${f.file}: ${errs.join(", ")}`);
    process.exit(1);
  }

  console.log(G.bold(`\n${DRY ? "Validating" : "Running"} ${fixtures.length} smoke fixture(s)\n`));

  if (DRY) {
    if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
    for (const f of fixtures) {
      if (f.workspace) {
        const tmpDir = join(CACHE_DIR, "dry-" + f.workspace + "-" + Math.random().toString(36).slice(2, 8));
        mkdirSync(tmpDir, { recursive: true });
        try {
          prepareWorkspace(f, tmpDir);
          runCommand(process.execPath, ["--test"], tmpDir);
        } finally {
          try { rmSync(tmpDir, { recursive: true, force: true }); } catch {}
        }
      }
      console.log(G.green("  ok   ") + `${f.skill} — ${f.file}`);
    }
    console.log(G.dim("\n--dry: no model calls made. Remove --dry to run."));
    process.exit(0);
  }

  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });

  let pass = 0;
  const results = [];
  for (const fx of fixtures) {
    process.stdout.write(G.cyan(`  run  `) + `${fx.skill} — ${fx.file} ... `);
    const r = await runFixture(fx);
    results.push(r);
    if (r.ok) { pass++; console.log(G.green("PASS") + G.dim(` (${r.textLen} chars)`)); }
    else if (r.error) console.log(G.red("FAIL") + G.dim(` error: ${r.error}`));
    else console.log(G.red("FAIL") + G.dim(` missing: ${r.missing.join(" | ").slice(0, 120)}`));
  }

  console.log(G.dim(`\n${pass}/${results.length} fixtures passed`));
  process.exitCode = pass === results.length ? 0 : 1;
}

main();
