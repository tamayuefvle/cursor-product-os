---
id: DEC-0003
type: release
status: ACCEPTED
impact: HIGH
reversibility: MEDIUM
human_approval_required: true
human_approved: true
confidence: 0.95
title: Normalize and submit Cursor Product OS v1.0.0 baseline
question: Should the identified baseline-integrity and test defects be corrected together and a normalized v1.0.0 ZIP be submitted?
stage: MVP_VALIDATION
decision: RELEASE
codex_status: SKIPPED
recorded_at: "2026-08-19T03:30:45Z"
approved_by: human
revisit_when:
  - Reproducible npm test fails in a normal dependency-enabled environment.
  - Dogfooding exposes a release-blocking governance or provenance defect.
---

# DEC-0003 — Normalize and submit v1.0.0 baseline

## Final decision

Correct the v1.0.0 release as one baseline-normalization change set and submit a new ZIP. The correction includes Phase documentation restoration, root Product OS Source of Truth, decision provenance, state normalization, foundation-test repair, atomic promotion hardening, sensitive-packet behavior coverage, human-gate behavior coverage, Acceptance update, and Manifest regeneration.

## Human approval

The human explicitly instructed: proceed in this direction, with ZIP submission as the goal. This record captures that current release authorization; it is not a reconstructed historical Council decision.

## Release condition

The normalized package must pass all available offline/deterministic checks in the packaging environment and retain `npm install && npm test` as the authoritative reproducible full-suite command for a normal development/CI environment.
