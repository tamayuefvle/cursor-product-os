# MVP Scope

## Hypothesis

A repository-first Cursor workflow with explicit artifacts, specialist agents, human gates, and deterministic promotion can preserve product context and prevent premature implementation without requiring a separate hosted application.

## In scope

- Product OS Core with Rules, AGENTS, State/Gates, Schemas, Skills, Agents, Hooks, CLI, and tests.
- Incubator lifecycle and evidence artifacts.
- Decision Council and optional Codex advisor.
- Human-gated, atomic promotion to one independent Product Repository.
- Runtime guardrails for protected files and dangerous shell commands.
- End-to-end acceptance and baseline release packaging.

## Out of scope / non-goals

- Hosted product portfolio UI.
- Automatic market surveillance or analytics ingestion.
- Mandatory external integrations or MCP dependencies.
- Automated product-release decisions.
- Enterprise administration, billing, or multi-tenant product management.

## Validation / experiment

Dogfood Cursor Product OS on itself and on at least one real product idea. Track where context is lost, which gates are bypassed, which artifacts are actually consulted, and whether independent critique changes decisions. v1.1 should prioritize fixes supported by this evidence rather than feature expansion.
