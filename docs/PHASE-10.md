# Phase 10 — End-to-End Scenario and v1 Acceptance

Phase 10 closes Cursor Product OS v1 by testing the full product lifecycle rather than isolated components.

## Acceptance scenario

The canonical synthetic scenario is `tests/fixtures-phase10-scenario.json`.

It models a small AI-assisted product team considering a repository-native product decision journal. The fixture is intentionally synthetic: its market/evidence text exists to exercise evidence labeling, provenance, gates, and decision mechanics; it must never be interpreted as real customer or market evidence.

The happy-path lifecycle is:

```text
Idea intake
  ↓
Incubator artifacts populated
  ↓
Evaluation → PROMOTE recommendation
  ↓
Verifier PASS
  ↓
Decision Council
  ├─ Product Manager
  ├─ Business Analyst
  └─ Devil's Advocate
  ↓
Internal synthesis
  ↓
Codex optional external review
  ↓
Verifier / final recommendation
  ↓
Human ACCEPTED PROMOTE decision
  ↓
Promotion preflight
  ↓
Atomic Product Repository bootstrap
  ↓
DISCOVERY / G1_PROBLEM
Build = BLOCKED
Release = BLOCKED
```

## What the E2E test proves

`tests/e2e-product-lifecycle.test.mjs` verifies:

1. an Incubator idea can be created and populated;
2. a Decision Council can be created with independent opinions and explicit dissent;
3. structured Codex review can succeed without allowing Codex to modify the repository;
4. Codex unavailability is fail-open and does not block the internal council;
5. a human-gated PROMOTE decision is recorded before promotion;
6. a linked `--decision-id` must refer to an ACCEPTED, human-approved `PROMOTE` decision;
7. promotion creates an independent repository outside Product OS;
8. Incubator source artifacts are preserved with SHA-256 provenance;
9. the promotion Decision record is preserved byte-for-byte under `product/00-origin/decision/` and hashed in `.product/origin.yaml`;
10. the promoted repository starts at `DISCOVERY / G1_PROBLEM` with build and release blocked;
11. unresolved Incubator questions become OPEN critical assumptions;
12. the Incubator promotion decision does not become the Product Repository's active decision (`state.decisions.latest` remains `null`);
13. a promoted Product Repository does not contain an Incubator and cannot create another idea;
14. the promoted repository validates with the same 9 Subagents, 10 Skills, schemas, and guardrails.

## Codex testing strategy

The success branch uses a deterministic local `codex` stub injected through `PATH`. This tests the Product OS adapter contract without requiring an OpenAI login, internet access, or consuming model usage during CI.

A separate branch removes Codex from `PATH` and asserts that `codex:consult` exits successfully while recording `UNAVAILABLE` and continuing with the internal council.

This does not replace optional manual integration testing with a real Codex CLI installation.

## Promotion decision hardening discovered by E2E

Phase 10 exposed a provenance gap in Phase 9: `--decision-id` could be recorded without proving that the linked record was the approved PROMOTE decision, and the promoted repository did not preserve the original Decision record.

The v1 hardening now requires, when `--decision-id` is supplied:

- exactly one matching Decision Log record;
- schema-valid Decision frontmatter;
- `status: ACCEPTED`;
- `decision: PROMOTE`;
- `human_approval_required: true`;
- `human_approved: true`.

The accepted Decision record is copied into the promoted repository and its SHA-256 is recorded as `decision_artifact` in `.product/origin.yaml`.

## Test commands

```bash
npm install
npm test
```

Focused commands:

```bash
npm run test:e2e
npm run test:offline
npm run po -- validate
```

`test:offline` is intentionally dependency-light and checks release-surface invariants plus the existing standalone Hook tests. The full lifecycle test requires the normal npm dependencies used by Product OS.

## v1 boundary

Passing Phase 10 means the Product OS governance/runtime lifecycle is accepted. It does **not** claim that a particular product idea is market-validated, that a specific implementation stack should be chosen, or that autonomous production deployment is safe. Those remain product-specific decisions behind later gates and human approval.

## Packaging verification result

The artifact packaging environment could not reach the npm registry, so the complete normal-dependency `npm test` run could not be performed there. Offline acceptance was executed for both the Product OS root and promoted Product Repository template, and targeted CLI paths for Codex structured review plus decision-linked promotion were exercised using temporary local test adapters. Those adapters are not shipped.

On a normal local/CI environment, `npm install && npm test` is the required final acceptance command.
