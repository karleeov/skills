---
name: complete-and-verify
description: Completion gate for code changes. Use when implementing or changing a function, feature, bug fix, or integration to define the full behavior, create an executable test plan, implement the complete vertical slice, self-review it, and prove it works before claiming completion.
compatibility: opencode
metadata:
  audience: developers
  workflow: implementation
---

# Complete and Verify

Treat **complete** as a claim backed by fresh evidence: every required observable behavior works through a public seam, and every planned check has a recorded result. This skill is the completion authority for implementation work.

## 1. Establish the implementation contract

Before editing, read the request, relevant spec or ticket, current implementation, callers, tests, and documented decisions. Translate them into a **completion matrix**.

For each required behavior, capture:

| ID | Requirement | Input / trigger | Observable result | Side effects / failures | Verification |
| --- | ----------- | --------------- | ----------------- | ----------------------- | ------------ |

Cover every applicable behavior class:

- Happy path
- Invalid input and error behavior
- Empty, null, minimum, maximum, and other meaningful boundaries
- State changes, persistence, I/O, and external calls
- Public types, schemas, configuration, API/UI contracts, and callers
- Existing behavior that must remain unchanged
- Explicitly agreed out-of-scope behavior

For a function, explicitly state its inputs, output, mutations or I/O, errors, invariants, dependencies, and callers. Resolve material ambiguity with the user; derive discoverable facts from the codebase.

**Completion criterion:** every stated requirement is represented by a matrix row or explicitly marked out of scope, and each row names an observable verification.

## 2. Write the executable test plan

Choose the highest stable public seam that can prove each behavior. Prefer automated tests; use a manual check only when the behavior cannot be automated in the available environment.

Write the plan before implementing:

| ID | Setup | Action | Expected result | Test or command | Status |
| -- | ----- | ------ | --------------- | --------------- | ------ |

The plan must include:

- One check for every completion-matrix row
- A focused test for each new or changed behavior
- At least one negative or adversarial case capable of catching an incomplete implementation
- Relevant typecheck, lint, build, and full-suite commands
- The original reproduction or end-to-end path for a bug or integration
- Precise human steps and expected observations for unavoidable manual checks

**Completion criterion:** every required behavior maps to a runnable check with a concrete expected result; every manual check explains why automation is unavailable.

## 3. Implement complete vertical slices

Work one matrix row at a time:

1. Add or identify a red-capable check at the chosen seam.
2. Run it and observe the current result. Record why it is red, or why an existing behavior is already green.
3. Implement the complete path needed for that behavior.
4. Run the focused check and record the result.
5. Update the matrix and test-plan status before moving on.

A complete path includes every affected layer: public entry point, validation, domain logic, side effects, error handling, types/contracts, and caller or UI/API integration. Placeholders, disconnected helpers, and unhandled required branches keep the row incomplete unless the user explicitly accepts them as follow-up scope.

Use `/tdd` for red-green slices where a correct test seam exists.

**Completion criterion:** every required row is connected end-to-end and green at its public seam.

## 4. Perform an adversarial self-check

Read the final diff as a skeptical reviewer and trace every completion-matrix row from input to observable result. Check specifically for:

- An updated function with a caller still using the old contract
- Missing branches, invalid-input handling, or async error propagation
- State, schema, migration, cache, permission, transaction, or rollback gaps
- Tests that only prove a helper while the real public path remains disconnected
- Assertions that would still pass if the core implementation were removed or broken
- Debug code, skipped tests, placeholders, and unrelated speculative changes

For the core behavior, name a small mutation that should break it and identify the test that would fail. Strengthen the test when no check detects that mutation.

**Completion criterion:** every requirement maps to both an implementation change and a sensitive test, and no required path depends on an unverified assumption.

## 5. Run the proof suite

Run fresh commands against the current worktree, in this order where applicable:

1. Focused tests for changed behavior
2. Typecheck and static analysis
3. Lint and formatting checks
4. Build or package validation
5. Full relevant test suite
6. Original reproduction or end-to-end workflow

Record the exact command, exit status, and meaningful result. A command that was not run is **unverified**, not assumed green. If a required command is unavailable, state the blocker and keep the overall status incomplete unless the user explicitly accepts that verification gap.

The completion gate passes only when:

- Every required matrix row is implemented
- Every planned automated check ran and passed
- Required manual checks ran and matched their expected observations
- Existing behavior and the new behavior are both covered
- The adversarial self-check found no uncovered required path
- Debug artifacts, skipped checks, and placeholders are accounted for

When any item fails, continue the loop. When blocked, report the work as incomplete with the exact blocker and next action.

## 6. Report evidence

End with:

1. **Status:** `Complete` or `Incomplete`
2. **Delivered:** each implemented behavior, not merely files changed
3. **Test plan and evidence:** requirement ID, command/check, and result
4. **Self-check:** the adversarial case and the test that catches it
5. **Unverified or remaining:** explicit gaps, blockers, or accepted follow-ups

Use “Complete” only after the completion gate passes with fresh evidence.
