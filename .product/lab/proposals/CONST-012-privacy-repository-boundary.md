---
id: CONST-012
status: PROPOSED
apply_policy: HUMAN_ONLY
proposal_policy: AI_ALLOWED
baseline: v1.0.0
proposed_at: "2026-08-21T16:40:00Z"
revised_at: "2026-08-22T16:21:00Z"
title: Privacy and Repository Visibility Boundary
---

# CONST-012 — Privacy and Repository Visibility Boundary (PROPOSED)

AI may propose this invariant. AI must not apply it to `.product/constitution.yaml`.

## Proposed statement

Product OS Core may be PUBLIC-operable. Product Repositories are PRIVATE by default. PROMOTE does not grant PUBLIC visibility. AI must not change a Product Repository to PUBLIC. PUBLIC requires explicit human approval. Experience bodies are not Public Product OS durable artifacts: RAW stays local, automated sanitize admits only local-only LOCAL_SANITIZED files (`classification: PATTERN_REDACTED`, `publication_allowed: false`), and pattern-clean is not publication permission. Secrets, PII, client data, and Experience bodies must not be stored in the public-operable repository. Public git-tracked Lab artifacts are generalized observations and findings only.

## Why it is proposed

Runtime policy now exists in `.product/visibility.yaml`, hooks, gitignore, and CLI. Phase 11.2 (DEC-0008) further made Experience local-only after pattern sanitization. The Constitution still lists eleven v1.0.0 invariants. Elevating this twelfth invariant is a human Constitution apply, not an Agent write.

## Apply conditions

1. Human reviews this proposal, DEC-0007, and DEC-0008.
2. Human explicitly authorizes Constitution apply.
3. Verifier confirms no v1.0.0 invariant is weakened.
4. `.product/constitution.yaml` is updated only through the approved governance workflow.
5. Applied text must keep Experience local-only (`LOCAL_SANITIZED` / `publication_allowed: false`) and must not restore `REPOSITORY_SAFE` as a publication-allowed git-tracked inbox contract.
