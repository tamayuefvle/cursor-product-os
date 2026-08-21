---
name: evaluate-idea
description: Synthesize incubator evidence into a PROMOTE, PARK, KILL, or RESEARCH-MORE recommendation. Use after problem and market evidence has been gathered or when deciding whether an idea deserves a dedicated product repository.
---
# Evaluate Idea

Evaluate an idea adversarially. This workflow recommends; it does not finalize human-controlled transitions.

## Workflow

1. Read every relevant incubator artifact and latest state.
2. Ask `/product-manager` for the best constructive case.
3. Ask `/business-analyst` when monetization or sustainability matters.
4. Always ask `/devils-advocate` for the strongest case against.
5. Use `references/evaluation-rubric.md` to structure the synthesis.
6. If specialist opinions materially disagree or overall confidence is below threshold, run `/run-decision-council`.
7. Ask `/verifier` whether the evidence actually supports the recommendation.
8. Write `evaluation.md` with the recommendation and unresolved risks.
9. Do not change status to `PROMOTE` or `KILL` without explicit human approval.

## Recommendation values

- `PROMOTE-RECOMMENDED`
- `PARK-RECOMMENDED`
- `KILL-RECOMMENDED`
- `RESEARCH-MORE`

State why the losing alternatives were rejected.
