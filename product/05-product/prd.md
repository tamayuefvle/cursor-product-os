# Product Requirements Document

## Problem

AI-assisted developers can move from idea to code faster than product reasoning is captured. Important assumptions, evidence, alternatives, approvals, and historical decisions may remain scattered across chat or external tools. This creates context loss, premature implementation, and weak auditability when work spans multiple agents or sessions.

## Users / JTBD

Primary users are developers and small technical product teams using Cursor. Their job is to grow a small web-product idea into a validated MVP decision while preserving enough context to resume, challenge, and explain the work later.

## Goals

- Keep product state, evidence, decisions, and implementation governance in the repository.
- Prevent a raw idea from automatically becoming implementation work.
- Enable independent specialist analysis without allowing specialists to mutate authoritative state.
- Require human approval for PROMOTE, KILL, PIVOT, READY_FOR_BUILD, and RELEASE decisions.
- Provide auditable Decision Council workspaces and optional Codex CLI second opinions.
- Promote a qualified incubator idea into a clean independent Product Repository.
- Keep Local and Cloud workflows portable when optional local capabilities are absent.
- Make v1 testable through deterministic schemas, offline acceptance checks, and end-to-end lifecycle tests.

## Non-goals

- Replace general-purpose project-management, documentation, analytics, or source-hosting products.
- Choose application frameworks such as Next.js for every promoted product.
- Automatically finalize irreversible product decisions.
- Require Codex CLI or any other external advisor.
- Provide a hosted multi-product dashboard in v1.
- Automate market facts or synthetic personas into evidence without verification.

## Requirements

### Governance
1. Repository Rules and AGENTS instructions define immutable product-development principles.
2. Product stage, current gate, critical assumptions, latest decision, build permission, and release permission are machine-readable.
3. Protected governance files cannot be freely mutated by Agent tools.

### Intelligence
4. Exactly nine read-only specialist agents cover problem, market, competitors, business, product, UX, technology, adversarial review, and verification.
5. Exactly ten Skills encode reusable workflows from idea intake through build readiness.
6. Difficult decisions can create an auditable Decision Council with independent opinions, synthesis, verification, and final recommendation.
7. Codex CLI is optional, receives only an explicit advisory packet, is secret-scanned before external execution, and fails open to Cursor internal review.

### Incubator and product boundary
8. Multiple ideas may exist in the Incubator without each becoming a Git repository.
9. PROMOTE requires recommendation, verifier PASS, required evidence, and human approval.
10. Promotion must be atomic, must not overwrite an existing destination, and must create a repository outside Product OS.
11. Promoted products start at DISCOVERY / G1_PROBLEM with build and release blocked and with provenance retained under `product/00-origin/`.

### Validation
12. JSON Schemas validate authoritative YAML/JSON structures.
13. Artifact policies validate minimum document structure without pretending that presence equals semantic gate passage.
14. Release acceptance includes foundation, hooks, promotion, E2E, Codex fail-open, and offline checks.

## Success metrics

For v1 dogfooding, success is measured operationally rather than through market adoption:
- Release package contains every artifact referenced by README/tests/manifest.
- No dangling `state.decisions.latest` reference.
- `npm run po -- validate` and `npm test` pass on a normal dependency-enabled environment.
- Offline acceptance passes without npm dependencies.
- A full idea lifecycle can reach an independent Product Repository while retaining human gates and provenance.
- During dogfooding, important product decisions can be reconstructed from repository artifacts without relying on chat history.

## Risks / assumptions

- The workflow may become overly ceremonial for simple products.
- Agent/tool APIs may change and require migration.
- Structural validation cannot replace human judgment about evidence quality.
- Users may bypass controls if CLI and gate ergonomics are poor.
- Optional external review may add cost/noise without measurable decision benefit.

## Open questions

- Which gates create the most friction during real product dogfooding?
- Which evidence artifacts actually prevent rework?
- Should v1.1 introduce explicit transition commands for KILL/PIVOT/READY_FOR_BUILD/RELEASE?
- When does a hosted UI add enough value to justify moving beyond repository-first CLI workflows?
