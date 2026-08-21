---
id: DEC-0006
type: strategy
status: ACCEPTED
impact: HIGH
reversibility: HIGH
human_approval_required: true
human_approved: true
confidence: 0.95
title: Establish Evidence-Based Stable Graduation
question: Should v1.1 be defined by the old sequential feature roadmap or by Lab capabilities that demonstrate value through evidence and regression-safe experiments?
stage: MVP_VALIDATION
decision: Define v1.1 by evidence-backed Stable graduation from vNext Lab rather than implementation completeness.
codex_status: NOT_REQUESTED
recorded_at: "2026-08-21T01:40:32Z"
approved_by: human
revisit_when:
  - Stable graduation cannot be evaluated reproducibly.
  - The experiment model adds more operational cost than decision value.
---

# DEC-0006 — Evidence-Based Stable Graduation

## Final decision

A vNext capability graduates only after a real observation exists, an eval is reproducible, target dimensions improve, governance/security hard constraints remain intact, rollback or migration is viable, verification passes, and required human approval is recorded.

## Consequence

The previous v1.1-to-v2 sequential feature roadmap becomes a hypothesis inventory for vNext Lab rather than an automatic release plan.
