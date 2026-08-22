---
id: OBS-0002
timestamp: "2026-08-21T16:40:00Z"
runtime_version: 1.0.0
task_class: PROCESS_IMPROVEMENT
source_scope: LOCAL
type: DEFECT
impact: HIGH
capability_context:
  - STABLE_KERNEL
human_feedback: true
evidence_refs:
  - docs/PHASE-9.md
  - scripts/product-os.mjs
  - templates/product-repository/.gitignore
  - docs/vnext/VNEXT-LAB-ARCHITECTURE.md
---

# OBS-0002 — Privacy and repository boundary missing from v1 promotion

## Observation

v1.0.0 can promote an independent Product Repository and can itself be operated as a public codebase, but it has no machine-readable separation between those two facts. Promotion initializes Git and explicitly does not create a remote; it also does not record PRIVATE-by-default visibility. Secret scanning exists for Codex packets only. The product-repository template `.gitignore` did not ignore `.env` / credentials. There is no RAW → Scan → Redaction path before Lab experience would be committed to Product OS.

## Supported interpretation

If Product OS is public and a promoted Product later contains client work, an Agent can leak secrets or client data by (a) creating a public hosting remote, (b) committing local credentials, or (c) copying raw private experience into git-tracked Lab artifacts. This is a foundation gap, not evidence that Adaptive Reasoning or a new specialist is required.

## Improvement hypothesis

Add a Phase 11 visibility policy, shell/governance guards, gitignore alignment, and an experience sanitization gate without enabling CAP-002 or changing the Constitution.

## First eval question

Can Product OS remain v1-compatible and PUBLIC-operable while promoted Product Repositories stay PRIVATE unless a human explicitly records PUBLIC approval?
