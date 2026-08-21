---
name: define-mvp
description: Define the smallest MVP or experiment that tests the riskiest product assumptions. Use after product definition exists and before architecture/build readiness.
---
# Define MVP

The MVP exists to learn, not to approximate the future full product.

## Workflow

1. Read PRD, assumptions, evidence, user journey, and success measures.
2. Identify the riskiest assumption(s) whose failure would invalidate the product direction.
3. Ask `/product-manager` to propose the minimum product boundary.
4. Ask `/ux-strategist` for the minimum coherent critical journey.
5. Ask `/tech-lead` for feasibility and cheaper validation options.
6. Ask `/devils-advocate` what can be removed and whether code is needed at all.
7. Write/update `product/05-product/mvp-scope.md` using `references/mvp-template.md`.
8. Define explicit `IN`, `OUT`, and `LATER` scope.
9. Define how the MVP will produce evidence and what result leads to CONTINUE/PIVOT/KILL consideration.
10. Ask `/verifier` to check that the MVP tests the intended hypothesis rather than merely demonstrating functionality.

Prefer concierge, prototype, fake-door, manual, or limited-scope validation when they can answer the question before production code.
