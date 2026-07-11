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
// NOTE: calls the model — costs tokens. CI runs lint only; smoke is local/opt-in.

import { readdirSync, readFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const FIXTURES_DIR = join(ROOT, "tests", "fixtures");
const CACHE_DIR = join(ROOT, ".smoke-cache");

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
  return errs;
}

// Run opencode headless; resolve with concatenated assistant text.
function runOpencode(prompt, { timeoutMs = 120000 } = {}) {
  return new Promise((resolveP, rejectP) => {
    const tmpDir = join(CACHE_DIR, "run-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8));
    mkdirSync(tmpDir, { recursive: true });

    const proc = spawn("opencode", ["run", "--format", "json", "--auto", prompt], {
      cwd: tmpDir,
      shell: true,
      env: { ...process.env },
    });

    let raw = "";
    const timer = setTimeout(() => {
      proc.kill("SIGTERM");
      rejectP(new Error(`timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    proc.stdout.on("data", (d) => { raw += d.toString(); });
    proc.stderr.on("data", () => { /* ignore */ });
    proc.on("error", (e) => { clearTimeout(timer); rejectP(e); });
    proc.on("close", (code) => {
      clearTimeout(timer);
      // clean up temp dir best-effort
      try { rmSync(tmpDir, { recursive: true, force: true }); } catch {}

      // Parse NDJSON events; concatenate assistant text content.
      let text = "";
      for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        let ev;
        try { ev = JSON.parse(trimmed); } catch { continue; }
        // Be liberal: pull text from common event shapes.
        const parts = ev?.parts || ev?.message?.parts || ev?.content || [];
        if (Array.isArray(parts)) {
          for (const p of parts) {
            const t = typeof p === "string" ? p : p?.text ?? p?.content ?? null;
            if (typeof t === "string") text += t;
          }
        }
        if (typeof ev?.text === "string") text += ev.text;
      }
      // If we couldn't parse structured text, fall back to raw so assertions still work.
      resolveP({ text: text || raw, code });
    });
  });
}

async function runFixture(fx) {
  const expects = Array.isArray(fx.expectContains) ? fx.expectContains : [fx.expectContains];
  const result = { name: `${fx.skill} (${fx.file})`, missing: [], textLen: 0, ok: false, error: null };

  try {
    const { text } = await runOpencode(fx.prompt, { timeoutMs: fx.timeoutMs ?? 120000 });
    result.textLen = text.length;
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
    for (const f of fixtures) console.log(G.green("  ok   ") + `${f.skill} — ${f.file}`);
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
  process.exit(pass === results.length ? 0 : 1);
}

main();
