# Competitors and alternatives

## Competitors / alternatives

Cursor Product OS competes primarily with workflows, not with one single product category.

1. **Chat-only AI coding workflow** — fast and low ceremony, but important context can remain transient.
2. **README/Markdown/ADR discipline** — simple and repository-native, but lacks orchestration, stage gates, specialist-agent roles, and runtime guardrails unless teams build them manually.
3. **Issue trackers and product-management tools** — strong for backlog, collaboration, and planning; weaker at directly governing the AI coding agent inside the repository.
4. **Notion / docs / spreadsheets** — flexible for research and product thinking, but require manual synchronization with code and AI agent state.
5. **Custom agent frameworks or coding-agent rule packs** — can orchestrate AI work, but may emphasize implementation rather than problem validation and product evidence.
6. **Do nothing / rely on developer judgment** — the strongest alternative for experienced individuals when the product is small and decisions are easily reversible.

## Comparison and trade-offs

Cursor Product OS differentiates on repository-first product state, explicit human gates, read-only specialist agents, Decision Council provenance, optional fail-open Codex review, and promotion into a one-product repository. The trade-off is added structure: if a product does not need long-running evidence or multiple agent perspectives, this workflow can be unnecessary overhead.

## Sources and evidence

This comparison is based on the v1 problem definition, actual Product OS architecture, and observed workflow categories used during development. It intentionally avoids unsupported claims about commercial products' current feature sets. Future competitor research should add dated external sources when market positioning becomes a release decision rather than a design hypothesis.
