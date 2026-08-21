---
id: DEC-0001
type: architecture
status: ACCEPTED
impact: HIGH
reversibility: MEDIUM
human_approval_required: false
human_approved: true
confidence: 0.9
title: Approve Cursor Product OS v1 baseline architecture
question: Should Cursor Product OS use Product OS Core + Incubator + one independent repository per promoted product, with optional Codex review?
stage: DEFINITION
decision: APPROVE_BASELINE_ARCHITECTURE
codex_status: SKIPPED
recorded_at: "2026-08-19T03:30:45Z"
approved_by: human
revisit_when:
  - Dogfooding shows that one-product-per-repository creates more coordination cost than value.
  - Cursor platform changes invalidate the Rules/Agents/Skills/Hooks architecture.
---

# DEC-0001 — v1 baseline architecture

## Final decision

Adopt the three-layer architecture:

1. Product OS Core as the reusable product-development runtime.
2. Incubator as the home for multiple early ideas.
3. One independent repository for each promoted product.

Use the Cursor main Agent as Product Orchestrator; specialist Subagents remain read-only. Use Rules for principles, Skills for methods, Hooks for runtime guardrails, State/Gates for lifecycle control, and Decision Council for difficult decisions. Codex CLI is an optional external advisor only when available.

## Historical provenance

This record was reconstructed during v1.0.0 baseline normalization from explicit human approvals in the initial design sequence. The decision predates the Decision Council implementation, so no historical `.product/council/DEC-0001/` workspace is claimed or fabricated.

## Rationale

The architecture isolates product contexts, keeps the operating method reusable, avoids making every raw idea a repository, and preserves Cloud portability by keeping Codex optional.
