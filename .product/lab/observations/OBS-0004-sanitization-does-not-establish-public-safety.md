---
id: OBS-0004
timestamp: "2026-08-22T12:20:00Z"
runtime_version: 1.0.0
task_class: PROCESS_IMPROVEMENT
source_scope: LOCAL
type: DEFECT
impact: HIGH
capability_context:
  - STABLE_KERNEL
human_feedback: true
evidence_refs:
  - USER-DOGFOOD-REVIEW-2026-08-22
  - docs/vnext/PRIVACY-REPOSITORY-BOUNDARY.md
  - scripts/product-os.mjs
  - product/09-decisions/DEC-0008-privacy-semantics-hardening.md
---

# OBS-0004 — Sanitization does not establish public safety

## Observation

Phase 11 added a RAW → scan → sanitize → inbox path. The admitted label was `REPOSITORY_SAFE`, and the inbox was documented as git-tracked. The scanner matches credentials, tokens, emails, filesystem home paths, and similar patterns. It does not detect semantic private context (identity narrative, private life detail, or other meaning that is not a secret pattern).

Dogfood review showed scan-clean Experience could still be unfit for a PUBLIC-operable Product OS. The overclaim was the label and the tracked placement, not the absence of a pattern gate.

## Supported interpretation

Pattern redaction is a local hygiene gate. It is not a publication decision. `REPOSITORY_SAFE` and a git-tracked inbox implied that pattern-clean Experience could be a durable Public artifact. That contract was false.

OBS-0002 recorded that v1.0.0 lacked a sanitization path. This observation records the post-implementation gap: the path exists and still does not make Experience publication-allowed.

## Improvement hypothesis

Keep automated sanitize. Stop treating Experience bodies as git-tracked Public artifacts. Name admitted files `LOCAL_SANITIZED` / `EXP-LOCAL-*` with `publication_allowed: false`. Fail `privacy:check` when Experience bodies are tracked. Public Product OS may keep generalized observations and findings only.

Phase 11.2 implements this hypothesis. It does not add a semantic DLP engine or a publication classifier.

## First eval question

After Experience bodies are local-only and `privacy:check` rejects tracked bodies, can Product OS remain PUBLIC-operable without committing pattern-clean private context?

## Related deferred observations (not implemented in Phase 11.2)

- Active Scope selection across Core / Lab / incubator idea
- Artifact drift between narrative files and machine state
- early PARK machine-state reconciliation
- Experience ingest granularity (one utterance per file)

These remain recurrence watches. They are not part of the Phase 11.2 privacy semantics change.
