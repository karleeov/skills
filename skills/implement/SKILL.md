---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
---

Implement the work described by the user in the spec or tickets.

Run `/complete-and-verify` as the completion authority. Before editing, it must establish the full implementation contract and executable test plan so the work covers complete behavior rather than one disconnected layer.

Use `/tdd` where possible, at pre-agreed seams. Implement one complete vertical slice at a time and keep its focused check green before moving on.

Once the completion gate passes, use `/code-review` to review the work. Resolve its findings, then re-run the completion gate and all three review axes against the final diff. Repeat until verification is green and the final reviewed diff has no blocking finding.

Commit only after the final completion gate passes. If verification remains blocked, report the work as incomplete instead of committing it as finished.
