# Cursor Product OS v1

Cursor Product OS is a repository-first operating system for growing small web-product ideas into validated product definitions and, only when justified, MVP implementations.

This package contains **Cursor Product OS v1.0.0 — Phase 1–10 complete**:

- product state and gate model;
- JSON Schema validation;
- root `AGENTS.md` Product Orchestrator;
- seven Cursor Project Rules;
- nine read-only specialist Cursor Subagents;
- ten reusable Agent Skills;
- Decision Council workspaces and decision logging;
- optional local Codex CLI external review;
- Product Repository template containing the same runtime;
- executable Phase 8 project Hooks for governance, artifact validation, and shell safety;
- human-gated Incubator → independent Product Repository promotion;
- Phase 10 end-to-end lifecycle acceptance tests, including Codex success and fail-open branches.

## Core principle

The OS is framework-agnostic. Next.js, React, databases, hosting, auth, analytics, and other implementation technologies belong to the individual Product Repository and are selected only after product constraints justify them.

## Quick start

```bash
npm install
npm run po -- doctor
npm run po -- validate
npm run po -- status
npm run po -- gate
```

`doctor` treats Codex CLI as optional. A missing or unusable Codex environment never makes Product OS unhealthy.

## Structure

```text
.
├── AGENTS.md
├── .cursor/
│   ├── rules/
│   ├── agents/
│   ├── skills/
│   ├── hooks/
│   └── hooks.json
├── .product/
│   ├── state.yaml
│   ├── gates.yaml
│   ├── council-policy.yaml
│   ├── artifact-policy.json
│   ├── council/
│   └── advisory/codex/
├── incubator/
├── product/
├── schemas/
├── scripts/
└── templates/product-repository/
```

The root `.product/` files are the development/reference state for Product OS itself. A promoted product receives its own independent repository from `templates/product-repository/`.

## Root Product OS self-state

Cursor Product OS dogfoods its own lifecycle. The normalized v1.0.0 baseline is recorded at **`MVP_VALIDATION / G5_RELEASE`** with `build.allowed=true` and `release.allowed=true` after explicit human approval. The authoritative product rationale now lives under `product/`, and `.product/state.yaml` resolves its latest decision to `product/09-decisions/DEC-0003-v1-release-baseline-normalization.md`.

`DEC-0001` and `DEC-0002` were reconstructed from explicit human approvals that predated the Decision Council implementation. Their records state this provenance; no historical Council workspace is fabricated. `DEC-0003` is the direct human authorization to normalize and submit the corrected v1.0.0 package.

This self-state is separate from promoted Product Repository initialization. Newly promoted products still start at `DISCOVERY / G1_PROBLEM` with build and release blocked.

## Product stage model

`DISCOVERY → STRATEGY → DEFINITION → DESIGN → READY_FOR_BUILD → BUILDING → MVP_VALIDATION → ITERATING → GROWING`

Side states: `PARKED`, `PIVOTING`, `TERMINATED`.

AI may recommend but must not finalize: `PROMOTE`, `KILL`, `PIVOT`, `READY_FOR_BUILD`, `RELEASE`.

## Decision Council

Create a difficult decision as an auditable workspace:

```bash
npm run po -- council:create \
  --title "Auth provider" \
  --question "Which auth approach best fits the MVP?" \
  --type architecture \
  --impact HIGH \
  --reversibility MEDIUM \
  --option "Auth.js" \
  --option "Clerk"
```

Then use the `run-decision-council` Skill to populate independent specialist opinions, internal synthesis, and verifier review.

Useful commands:

```bash
npm run po -- council:status
npm run po -- council:status DEC-0002
npm run po -- council:update DEC-0002 --status SYNTHESIZED --evidence-quality MEDIUM --confidence 0.65
npm run po -- council:validate DEC-0002
npm run po -- council:prepare-codex DEC-0002
npm run po -- council:record DEC-0002 --decision "Auth.js"
```

Human-gated decisions require explicit approval metadata when recorded:

```bash
npm run po -- council:record DEC-0002 \
  --decision "Proceed" \
  --human-approved \
  --approved-by human
```

Recording a decision updates `state.decisions.latest` only. It does not automatically change stage, `build.allowed`, or `release.allowed`.

## Codex Optional Advisor

When a difficult decision benefits from an external second opinion:

```bash
npm run po -- codex:check
npm run po -- codex:consult DEC-0002
```

The adapter is deliberately fail-open. It assembles only the explicit Decision Council packet, scans it for common secret patterns, enforces a prompt-size limit, runs `codex exec --ephemeral` from a temporary directory outside the repository, relies on Codex's default read-only sandbox, requests structured output with a JSON Schema, validates the response, and stores the advisory record under `.product/advisory/codex/DEC-####/`.

If Codex is missing, unauthenticated, unavailable in Cloud, times out, or returns invalid output, Cursor's internal Decision Council continues normally.

## Phase 8 Runtime Guardrails

Project-level command hooks live in `.cursor/hooks.json` and are version controlled with the repository. They are designed to remain active in both local Cursor and Cursor Cloud Agents for hook events supported by Cloud.

```text
Agent Write/Delete
  ↓
preToolUse governance guard
  ↓
protected Product OS files → DENY direct mutation

Shell command
  ↓
beforeShellExecution
  ├─ catastrophic → DENY
  ├─ destructive / production-impacting → ASK human
  └─ ordinary → ALLOW

Agent file edit
  ↓
afterFileEdit
  ├─ governance validation
  └─ artifact structure validation
        ↓
.product/runtime/hook-status.json
        ↓
stop hook (max 2 follow-ups)
        ↓
repair unresolved validation errors
```

The protected governance files are `.product/state.yaml`, `.product/gates.yaml`, `.product/council-policy.yaml`, `.product/artifact-policy.json`, and `.cursor/hooks.json`. The intent is to route state/policy mutations through auditable Product OS workflows rather than ad-hoc Agent edits.

Inspect the latest guardrail state with:

```bash
npm run po -- hooks:status
```

Runtime hook status is local/transient and is ignored by Git. The shell guard is additive; it does not replace Cursor sandboxing, OS permissions, Git review, or human approval.

## Implemented AI team

The main Cursor Agent is the Product Orchestrator. Nine read-only specialists provide independent analysis: problem, market, competitors, business, product, UX, technology, adversarial review, and verification. Ten Skills encode the incubator-to-build-readiness workflows.

See:

- `docs/PHASE-1-3.md`
- `docs/PHASE-4-5.md`
- `docs/PHASE-6-7.md`
- `docs/PHASE-8.md`
- `docs/PHASE-9.md`
- `docs/PHASE-10.md`
- `docs/V1-ACCEPTANCE.md`
- `product/08-experiments/results/v1-baseline-normalization.md`

## Phase 9 — Incubator promotion

Create and inspect ideas:

```bash
npm run po -- idea:new --title "Idea title" --user "Target user" --problem "Problem hypothesis"
npm run po -- idea:status
```

After the recommendation is `PROMOTE`, the verifier is `PASS`, and required evidence artifacts are populated, run deterministic preflight:

```bash
npm run po -- promote:check IDEA-0001 --destination ../my-product
```

Only after explicit human approval:

```bash
npm run po -- promote IDEA-0001 \
  --destination ../my-product \
  --name "My Product" \
  --human-approved \
  --approved-by human
```

The generated repository is independent, never overwrites an existing destination, preserves the complete incubator snapshot under `product/00-origin/incubator/`, writes `.product/origin.yaml` with SHA-256 provenance, initializes Git by default, and starts at `DISCOVERY / G1_PROBLEM` with build and release blocked.


## Phase 10 — v1 end-to-end acceptance

The release includes a deterministic lifecycle scenario that exercises:

`Idea → evaluation → Decision Council → optional Codex review → verifier → human PROMOTE decision → independent Product Repository → DISCOVERY / G1_PROBLEM`.

Run after installing dependencies:

```bash
npm test
# or only the full lifecycle
npm run test:e2e
```

The scenario uses a local Codex stub for the success branch so CI does not require an OpenAI login, and separately verifies the real fail-open behavior when Codex is unavailable. Production Codex usage remains optional and uses the Phase 7 adapter.

Promotion linked to a Decision Council now requires an **ACCEPTED**, explicitly human-approved `PROMOTE` decision. A byte-identical snapshot of that decision record is preserved under `product/00-origin/decision/` and hashed in `.product/origin.yaml`. The Incubator promotion decision is provenance only; the promoted Product Repository still starts with `state.decisions.latest: null`.
