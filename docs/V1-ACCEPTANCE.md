# Cursor Product OS v1.0.0 — Acceptance Criteria

## Release decision

**v1 scope:** Product OS Core + Incubator + one-product-per-repository promotion + product governance runtime.

A release is accepted only when the following invariants are represented by executable tests or deterministic validation. The root Product OS also dogfoods its own lifecycle and must not claim a stage/decision that cannot be reconstructed from repository artifacts.

## Acceptance matrix

| Area | Acceptance criterion | Verification |
|---|---|---|
| Governance | AI cannot finalize PROMOTE/KILL/PIVOT/READY_FOR_BUILD/RELEASE without human approval | Rules, Gates, Hooks, governance behavior tests |
| Evidence | Hypotheses and synthetic inputs are not silently promoted to facts | Rules, Verifier, E2E fixture |
| Specialists | Exactly 9 read-only specialist Subagents are present | `po validate` + deterministic count |
| Workflows | Exactly 10 Product Skills are present | `po validate` + deterministic count |
| Baseline integrity | Root Product OS current gate has its required artifacts and `state.decisions.latest` resolves to one valid decision record | `po validate`, offline release-surface test, independent schema validation |
| Decision | Council retains independent opinions, synthesis, verification, final recommendation | Phase 6 + E2E |
| External review | Codex success is structured and schema-validated | Phase 7 + E2E stub |
| Resilience | Codex absence/failure never blocks the internal decision workflow | Phase 7 + E2E unavailable branch |
| Security | Sensitive advisory packets are blocked before external transmission and the Codex executable is not invoked | Governance behavior test |
| Runtime guardrails | Catastrophic shell operations deny; destructive operations ask human | Phase 8 standalone tests |
| State integrity | Protected governance files are not directly mutated by Agent tools | Phase 8 Hooks |
| Promotion | Destination must be new and outside Product OS | Phase 9 + E2E |
| Promotion | PROMOTE requires recommendation + verifier PASS + evidence + human approval | Phase 9 + E2E |
| Decision provenance | Linked promotion DEC must be ACCEPTED, human-approved PROMOTE | Phase 10 E2E |
| Provenance | Incubator snapshot and linked Decision snapshot are SHA-256 recorded | Phase 9/10 E2E |
| Atomicity | Promotion failure leaves no destination/staging repository and does not falsely persist Incubator PROMOTE/approval state | Promotion rollback behavior test |
| Product boundary | Promoted repo starts at DISCOVERY/G1 with build/release blocked | Phase 9/10 E2E |
| Product boundary | Promoted repo is not an Incubator | Phase 10 E2E |
| Portability | Product Repository contains Rules, Agents, Skills, Hooks, Schemas, CLI | Promotion/E2E |

## Required commands before a release tag

```bash
npm install
npm run po -- validate
npm test
```

Expected test classes:

- foundation validation;
- Phase 8 Hook standalone safety tests;
- Phase 9 promotion success and rollback tests;
- Phase 10 full lifecycle test;
- Phase 10 Codex-unavailable fail-open test;
- Phase 10 offline release-surface test;
- human-gate behavior tests for KILL/PIVOT/READY_FOR_BUILD/RELEASE;
- sensitive Codex packet blocking behavior test.

## Baseline normalization — 2026-08-19

The first v1.0.0 release package was re-audited after being moved into a persistent ChatGPT project. The audit correctly identified release-package and baseline-integrity defects: six root Phase documents were omitted, the root Product OS had lifecycle state without corresponding `product/` Source-of-Truth artifacts, `state.decisions.latest` referenced a missing decision, `foundation.test.mjs` had undefined imports, and several acceptance claims lacked behavior-level coverage.

Normalization corrected these together rather than patching only `PHASE-10.md`:

- restored `PHASE-1-3.md`, `PHASE-4-5.md`, `PHASE-6-7.md`, `PHASE-8.md`, `PHASE-9.md`, and `PHASE-10.md`;
- added root Product OS artifacts through G5 validation scope;
- created explicit `DEC-0001`/`DEC-0002` reconstructed records without inventing historical Council workspaces;
- recorded direct human release authorization as `DEC-0003` and normalized root state to `MVP_VALIDATION / G5_RELEASE`;
- fixed `foundation.test.mjs` imports and state expectations;
- hardened `po validate` to detect missing current-gate artifacts and dangling latest-decision references;
- hardened promotion rollback so failed bootstrap does not persist false Incubator promotion state;
- added atomic rollback, sensitive Codex, and human-gate behavior tests;
- regenerated the release manifest after normalization.

## Packaging-environment verification status — 2026-08-19

The packaging environment could not reach the npm registry, so real `yaml`, `ajv`, and `ajv-formats` packages could not be installed here. Verification was therefore split into independent layers:

- Root Product OS offline acceptance: **7/7 PASS**.
- Promoted Product Repository template offline acceptance: **7/7 PASS**.
- Full Node test suite using temporary local dependency adapters for execution-path testing: **25/25 PASS**.
- Human-gate behavior: **PASS** for KILL / PIVOT / READY_FOR_BUILD / RELEASE without approval being rejected.
- Sensitive Codex packet behavior: **PASS**; `BLOCKED_SENSITIVE` occurs before the fake Codex executable is invoked.
- Promotion happy path: **PASS**.
- Promotion rollback path: **PASS**; destination and staging are removed and Incubator lifecycle state remains unpromoted.
- Phase 10 full lifecycle including structured Codex success and human-approved promotion: **PASS**.
- Phase 10 Codex-unavailable fail-open branch: **PASS**.
- Product state, gate policy, council policy, idea template, promotion-readiness template, and decision records: **PASS** against Draft 2020-12 schemas using an independent Python validator.
- Root artifact policy structural requirements: **PASS**.
- All JSON Schema files parse successfully.
- All JavaScript/MJS files pass syntax checks.

The temporary dependency adapters are verification-only and **must not be present in the release ZIP**. The authoritative reproducible full-suite command on a normal development/CI environment remains:

```bash
npm install && npm run po -- validate && npm test
```
