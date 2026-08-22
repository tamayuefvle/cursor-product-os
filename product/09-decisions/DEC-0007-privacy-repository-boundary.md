---
id: DEC-0007
type: security
status: ACCEPTED
impact: HIGH
reversibility: HIGH
human_approval_required: true
human_approved: true
confidence: 0.88
title: Establish Privacy and Repository Boundary in Phase 11
question: Should Phase 11 remaining work add a Privacy and Repository Boundary so Product OS can be public-operable while Product Repositories stay private by default, without changing the v1.0.0 Constitution?
stage: MVP_VALIDATION
decision: Implement the Phase 11 Privacy and Repository Boundary as runtime policy, gitignore, hooks, and CLI. Do not apply a Constitution change. Do not treat PROMOTE as PUBLIC. Do not enable new capabilities or agents.
codex_status: NOT_REQUESTED
recorded_at: "2026-08-21T16:45:00Z"
approved_by: human
revisit_when:
  - Pattern-based PII/secret detection produces blocking false positives or missed client data in dogfooding.
  - A hosting provider requires Product OS to create remotes during promotion.
  - Humans approve applying CONST-012 to the Constitution.
---

# DEC-0007 — Establish Privacy and Repository Boundary in Phase 11

## Final decision

Keep v1.0.0 Promotion, Gates, State, and Acceptance unchanged. Add a Lab-foundation boundary that:

- allows Product OS to be operated as a public repository;
- makes promoted Product Repositories PRIVATE by default;
- separates PROMOTE from PUBLIC;
- denies AI-driven PUBLIC hosting changes;
- records PUBLIC only after explicit `--human-approved`;
- keeps RAW experience gitignored and admits only scanned, redacted, repository-safe experience into git-tracked Lab inbox paths.

## Human approval

Scope of this record: the human instructed the Orchestrator to design, implement, and verify the Phase 11 Privacy & Repository Boundary as remaining Lab foundation work.

`human_approved: true` records that implementation authorization only. It does not authorize Constitution apply, merge to `lab/vnext` or `main`, Phase 12, PUBLIC hosting-provider publication, or Release change.

The human separately forbade Constitution apply, governance weakening, merge to main, and Release finalization without further approval.

## Source artifacts

- `docs/vnext/PRIVACY-REPOSITORY-BOUNDARY.md`
- `.product/visibility.yaml`
- `.product/lab/observations/OBS-0002-privacy-repository-boundary.md`
- `.product/lab/proposals/CONST-012-privacy-repository-boundary.md`

## What was not decided

CONST-012 is proposed, not applied. CAP-002 remains disabled. Phase remains `PHASE_11_LAB_FOUNDATION`. Root `.product/state.yaml` remains `DEC-0003` / `G5_RELEASE`. Merge to `lab/vnext` or `main` is not authorized by this record.
