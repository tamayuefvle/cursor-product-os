---
name: create-prd
description: Create or revise a product requirements document from established discovery, strategy, JTBD, evidence, and approved decisions. Use in DEFINITION after the problem/opportunity is sufficiently understood; never invent missing validation to complete the PRD.
---
# Create PRD

A PRD is a decision artifact, not a feature wish list.

## Workflow

1. Read discovery, market, JTBD, strategy/value proposition, decisions, and current state.
2. Ask `/product-manager` for a synthesis.
3. Ask `/ux-strategist` for critical journey implications when needed.
4. Draft/update `product/05-product/prd.md` using `references/prd-template.md`.
5. Keep implementation technologies out unless an approved constraint makes them a product requirement.
6. Mark unsupported requirements as assumptions or open questions instead of presenting them as settled.
7. Define explicit non-goals and success measures.
8. Ask `/devils-advocate` to challenge scope and necessity.
9. Ask `/verifier` whether the PRD is traceable to evidence/decisions and sufficient for G3 recommendation.

Do not move to BUILDING and do not set `build.allowed` here.
