---
id: DEC-0004
type: architecture
status: ACCEPTED
impact: HIGH
reversibility: HIGH
human_approval_required: true
human_approved: true
confidence: 0.95
title: Establish vNext Lab Architecture
question: Should Cursor Product OS preserve v1.0.0 as the Stable Kernel and create a capability-based vNext Lab for experimental self-improvement?
stage: MVP_VALIDATION
decision: Establish vNext Lab as an experimental overlay while preserving the v1.0.0 Stable Kernel.
codex_status: NOT_REQUESTED
recorded_at: "2026-08-21T01:40:32Z"
approved_by: human
revisit_when:
  - Dogfooding shows the overlay prevents reliable Stable Kernel fallback.
  - Capability isolation or provenance cannot be maintained.
---

# DEC-0004 — Establish vNext Lab Architecture

## Final decision

Keep v1.0.0 as an immutable historical Stable Kernel baseline and develop vNext Lab on a separate experimental line. vNext capabilities are isolated, independently testable hypotheses and do not automatically redefine v1.1 Stable.

## Human approval

The user explicitly requested the vNext Lab Architecture to be formally designed and then instructed the project to execute the design as far as safely possible within the current project environment.

## Source artifact

- `docs/vnext/VNEXT-LAB-ARCHITECTURE.md`
