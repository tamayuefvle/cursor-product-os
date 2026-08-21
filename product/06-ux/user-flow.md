# User Flow

## Primary flow

1. User captures a small idea in the Incubator.
2. Product Orchestrator reads current idea/product state and chooses the appropriate Skill.
3. Read-only specialist agents independently analyze the problem, market, alternatives, business, UX, and technical feasibility as needed.
4. Devil's Advocate challenges the strongest assumptions; Verifier checks evidence fidelity.
5. Difficult or high-impact decisions open a Decision Council. Codex may be consulted when locally available.
6. Human explicitly chooses PROMOTE/PARK/KILL or later gated transitions.
7. PROMOTE creates an independent Product Repository with provenance and resets product work to DISCOVERY / G1_PROBLEM.
8. Product artifacts mature through strategy, definition, UX, architecture, build readiness, MVP implementation, and validation.

## Edge / failure flows

- Codex unavailable: record UNAVAILABLE and continue internal Council.
- Sensitive advisory packet: block external transmission and continue internally.
- Promotion destination exists or is inside Product OS: block promotion.
- Promotion staging failure: remove staging, do not create destination, do not falsely mark the idea as promoted.
- Protected state file direct edit: hook denies the Agent action.
- Dangerous shell operation: deny or ask for explicit human approval according to severity.

## Accessibility / usability

v1 is primarily repository/CLI based. Commands and failure messages should be explicit, deterministic, and readable without color. Human approval boundaries must use clear action names rather than ambiguous confirmations. Markdown artifacts should use semantic headings and plain-text structures so they remain accessible in Cursor, GitHub, and terminal tooling.
