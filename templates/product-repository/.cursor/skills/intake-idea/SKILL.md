---
name: intake-idea
description: Capture a raw web-product idea without jumping to implementation. Use when the human introduces a new idea or wants to formalize an idea in the incubator.
---
# Intake Idea

Convert a raw idea into an incubator entry while preserving uncertainty.

## Preconditions

- This is an idea-stage workflow, not implementation planning.
- If no incubator entry exists, allocate the next `IDEA-####` identifier by inspecting `incubator/ideas/`.

## Workflow

1. Capture the user's original idea in plain language without "improving" it into a different product.
2. Extract three hypotheses: `user`, `problem`, `solution`.
3. Explicitly list assumptions and unanswered questions.
4. Invoke `/problem-analyst` when the problem is vague or solution-led.
5. Create/update the idea directory using `references/idea-artifacts.md`.
6. Set status to `FRAMING` only after the basic user/problem/solution hypotheses exist.
7. Do not research the whole market yet; identify the smallest next discovery action.

## Required result

Return a short intake summary containing:

- idea ID;
- one-sentence idea;
- user/problem/solution hypotheses;
- top assumptions;
- next smallest validation action.

Do not recommend technology or create a Product Repository.
