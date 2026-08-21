# Evidence

## Evidence ledger

1. During the initial design sequence, repeated requests were made to grow small web-product ideas through discovery, research, critique, product definition, architecture, MVP delivery, and validation rather than jumping directly to implementation.
2. The v1 implementation required explicit state, gates, specialist agents, reusable skills, a Decision Council, optional Codex review, runtime hooks, and a promotion boundary. The need to coordinate these concerns is itself evidence that chat-only state is insufficient for a long-running product workflow.
3. The v1 release-package audit found a concrete failure mode: the release claimed Phase 1–10 completion while phase documents, root product artifacts, and the latest decision record were absent. This defect demonstrates why repository artifacts and deterministic acceptance checks must be the source of truth rather than release prose alone.
4. Product Repository template tests and offline acceptance checks provide implementation evidence that the repository-first runtime can be copied into an independent one-product repository while preserving guardrails.

## Sources

- `README.md` — declared architecture and lifecycle.
- `AGENTS.md` and `.cursor/rules/` — orchestration and governance contract.
- `.product/gates.yaml` — explicit stage and human-approval boundaries.
- `tests/` and `docs/V1-ACCEPTANCE.md` — executable/deterministic acceptance surface.
- Baseline normalization audit performed on the v1.0.0 release package — discovered missing phase docs, root artifacts, dangling decision provenance, and test defects.

These are first-party product-development sources. v1 deliberately does not claim externally validated market size or general adoption behavior.

## Gaps and unknowns

- No broad external user study has yet established willingness to adopt this workflow.
- No longitudinal data yet quantifies whether repository-first orchestration reduces rework or decision loss.
- The optimal amount of ceremony for solo developers versus teams is unknown.
- The value of Codex second opinions versus additional Cursor subagents remains to be measured during dogfooding.
