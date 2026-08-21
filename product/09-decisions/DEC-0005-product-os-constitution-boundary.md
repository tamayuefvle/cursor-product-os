---
id: DEC-0005
type: security
status: ACCEPTED
impact: HIGH
reversibility: MEDIUM
human_approval_required: true
human_approved: true
confidence: 0.95
title: Establish Product OS Constitution Boundary
question: May self-improvement change protected Product OS governance without an independent human approval boundary?
stage: MVP_VALIDATION
decision: Self-improvement may propose constitutional changes but cannot approve or apply them autonomously.
codex_status: NOT_REQUESTED
recorded_at: "2026-08-21T01:40:32Z"
approved_by: human
revisit_when:
  - A new governance model provides equivalent or stronger independently verified control.
---

# DEC-0005 — Product OS Constitution Boundary

## Final decision

Create a protected Constitution layer derived from v1.0.0 invariants. AI may analyze and propose changes to this layer, but application is HUMAN_ONLY. No self-approval path is permitted.

## Source artifact

- `.product/constitution.yaml`
- `docs/vnext/VNEXT-LAB-ARCHITECTURE.md`
