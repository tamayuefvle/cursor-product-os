---
id: DEC-0008
type: security
status: ACCEPTED
impact: HIGH
reversibility: HIGH
human_approval_required: true
human_approved: true
confidence: 0.86
title: Phase 11.2 Privacy Semantics Hardening
question: Should Phase 11 remaining work stop treating pattern-redacted Experience as a Public Product OS durable artifact, without applying CONST-012 or starting Phase 12?
stage: MVP_VALIDATION
decision: Keep Experience local-only after pattern sanitize. Rename admission to LOCAL_SANITIZED with publication_allowed false. Reject git-tracked Experience bodies in privacy:check. Record generalized OBS-0003 and OBS-0004. Do not apply CONST-012, enable capabilities, add agents, merge to main, or release.
codex_status: NOT_REQUESTED
recorded_at: "2026-08-22T12:20:00Z"
approved_by: human
revisit_when:
  - Agents copy private semantic context into git-tracked observations despite local-only Experience.
  - Gitignore exceptions accidentally re-track Experience bodies.
  - Humans approve applying CONST-012 to the Constitution.
---

# DEC-0008 — Phase 11.2 Privacy Semantics Hardening

## Final decision

Keep v1.0.0 Promotion, Gates, State, Acceptance, agent set, and Core skills unchanged. Harden Phase 11 privacy semantics so that:

- RAW experience stays gitignored;
- automated sanitize remains pattern-based only;
- admitted Experience is `LOCAL_SANITIZED` / `EXP-LOCAL-<32-hex>.md` with `classification: PATTERN_REDACTED` and `publication_allowed: false`;
- Experience inbox bodies are gitignored except README;
- `privacy:check` uses `git ls-files` in a Git repository and fails if Experience bodies are tracked;
- legacy `REPOSITORY_SAFE` / `EXP-SAFE-*` remain readable locally and are not used for new output;
- Public Product OS durable Lab artifacts are generalized observations and findings, not Experience bodies.

## Human approval

Scope of this record: the human authorized implementation of Phase 11.2 Privacy Semantics Hardening only.

`human_approved: true` records that implementation authorization. It does not authorize Constitution apply, Phase 12, CAP-001 or CAP-002 enablement, Agent or Core Skill addition, semantic DLP, a publication classifier, main merge, Release, or human PARK of any incubator idea.

## Source artifacts

- `.product/lab/observations/OBS-0004-sanitization-does-not-establish-public-safety.md`
- `.product/lab/observations/OBS-0003-discovery-continuation-after-falsification.md`
- `docs/vnext/PRIVACY-REPOSITORY-BOUNDARY.md`
- `product/09-decisions/DEC-0007-privacy-repository-boundary.md`

## What was not decided

CONST-012 remains proposed, not applied. CAP-001 and CAP-002 remain disabled. Lab phase remains `PHASE_11_LAB_FOUNDATION`. Root `.product/state.yaml` remains `DEC-0003` / `G5_RELEASE`. Merge to `lab/vnext` or `main` is not authorized by this record. Discovery stop-rule text is not changed. F-02 through F-05 remain deferred recurrence watches.
