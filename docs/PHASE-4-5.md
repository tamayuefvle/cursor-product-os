# Phase 4–5 implementation

## Phase 4 — Custom Subagents

Implemented nine project-level Cursor subagents under `.cursor/agents/`. Each uses a clean context window and is `readonly: true` so specialist work cannot mutate durable Product OS state. The main Cursor Agent remains the Product Orchestrator.

Implemented specialists:

1. problem-analyst
2. market-researcher
3. competitor-analyst
4. business-analyst
5. product-manager
6. ux-strategist
7. tech-lead
8. devils-advocate
9. verifier

Each prompt includes mission, method, evidence discipline, and a structured output contract.

## Phase 5 — Agent Skills

Implemented ten reusable workflows under `.cursor/skills/`, each with a `SKILL.md` and a focused on-demand reference file:

1. intake-idea
2. research-problem
3. analyze-market
4. evaluate-idea
5. run-decision-council
6. consult-codex
7. promote-product
8. create-prd
9. define-mvp
10. review-build-readiness

`promote-product` has `disable-model-invocation: true` because promotion is a human-gated, explicit action.

## Architecture choices

- **Subagents analyze; Orchestrator writes.** This reduces race conditions and accidental state changes during parallel work.
- **Skills orchestrate procedures.** They may invoke several subagents but cannot bypass Product OS Rules or Gates.
- **Codex remains optional.** The Phase 5 skill defines the external-advisor contract. Actual hardened CLI execution/tooling remains Phase 6–7 work.
- **Product template mirrors Phase 4–5.** A promoted one-product repository receives the same agents and skills, so it is independently operable.

## Deliberately deferred

- hardened Decision Council persistence/CLI command;
- actual `codex exec --ephemeral` wrapper, timeout handling, and response storage automation;
- Hook scripts and `.cursor/hooks.json`;
- automated promotion command;
- end-to-end Cursor runtime smoke test.
