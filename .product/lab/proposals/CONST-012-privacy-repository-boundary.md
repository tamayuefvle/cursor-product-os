---
id: CONST-012
status: PROPOSED
apply_policy: HUMAN_ONLY
proposal_policy: AI_ALLOWED
baseline: v1.0.0
proposed_at: "2026-08-21T16:40:00Z"
title: Privacy and Repository Visibility Boundary
---

# CONST-012 — Privacy and Repository Visibility Boundary (PROPOSED)

AI may propose this invariant. AI must not apply it to `.product/constitution.yaml`.

## Proposed statement

Product OS Core may be PUBLIC-operable. Product Repositories are PRIVATE by default. PROMOTE does not grant PUBLIC visibility. AI must not change a Product Repository to PUBLIC. PUBLIC requires explicit human approval. Experience copied from a private Product into Product OS must be scanned and redacted or generalized so that secrets, PII, and client data are not stored in the public-operable repository.

## Why it is proposed

Runtime policy now exists in `.product/visibility.yaml`, hooks, gitignore, and CLI. The Constitution still lists eleven v1.0.0 invariants. Elevating this twelfth invariant is a human Constitution apply, not an Agent write.

## Apply conditions

1. Human reviews this proposal and DEC-0007.
2. Human explicitly authorizes Constitution apply.
3. Verifier confirms no v1.0.0 invariant is weakened.
4. `.product/constitution.yaml` is updated only through the approved governance workflow.
