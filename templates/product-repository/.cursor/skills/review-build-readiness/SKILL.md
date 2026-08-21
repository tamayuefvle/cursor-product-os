---
name: review-build-readiness
description: Review G4 BUILD readiness before implementation. Use after PRD, MVP scope, UX flow, and architecture are drafted, or whenever the human asks whether the product is ready to build.
---
# Review Build Readiness

This workflow can recommend `READY_FOR_BUILD`; only the human can approve it and enable build state.

## Workflow

1. Read `.product/state.yaml`, `.product/gates.yaml`, PRD, MVP scope, user flow, architecture, security, experiments/metrics, and relevant decisions.
2. Ask `/product-manager`, `/ux-strategist`, and `/tech-lead` for focused readiness reviews. Run in parallel where practical.
3. Always ask `/devils-advocate` whether implementation is premature or scope can be reduced.
4. Ask `/verifier` to evaluate every G4 criterion against concrete artifacts/evidence.
5. Use `references/build-readiness-checklist.md` to synthesize PASS/FAIL/UNVERIFIED.
6. If the decision is disputed, high-impact, or low-confidence, invoke `/run-decision-council` and optionally `/consult-codex` when available.
7. Recommend one of:
   - `READY_FOR_BUILD-RECOMMENDED`
   - `NOT_READY`
   - `REDUCE_SCOPE`
   - `RUN_SPIKE_FIRST`
8. If ready, present the evidence and strongest counterargument, then stop for explicit human approval.
9. Only after human approval may the Orchestrator update build permission according to the gate/state rules.

Do not start implementation in the same step unless the human explicitly approves the transition and requests implementation.
