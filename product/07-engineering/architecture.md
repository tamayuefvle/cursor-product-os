# Architecture

## Architecture context

Cursor Product OS is a framework-agnostic repository runtime. It does not host a web application in v1; instead it combines Cursor-native configuration, machine-readable product state, Markdown product artifacts, a Node CLI, deterministic schemas, runtime hooks, and tests. The root repository also dogfoods the same product lifecycle used by promoted repositories.

## Components

- **`AGENTS.md`** — Product Orchestrator operating contract.
- **`.cursor/rules/`** — product, evidence, state, engineering, and portability principles.
- **`.cursor/agents/`** — nine read-only specialist Subagents.
- **`.cursor/skills/`** — ten reusable workflows.
- **`.cursor/hooks.json` + `.cursor/hooks/`** — runtime governance and shell safety.
- **`.product/`** — machine-readable state, gates, council policy, artifact policy, council/advisory runtime records.
- **`product/`** — human-readable Source of Truth for problem, evidence, market, JTBD, strategy, PRD, UX, architecture, experiments, and decisions.
- **`incubator/`** — multiple pre-product ideas and promotion readiness.
- **`templates/product-repository/`** — portable one-product runtime used during promotion.
- **`schemas/`** — Draft 2020-12 JSON Schemas.
- **`scripts/product-os.mjs`** — repository-local CLI.
- **`tests/`** — foundation, hooks, promotion, security/human-gate behavior, offline, and E2E acceptance.

## Data flow

User intent enters through Cursor or the CLI. Orchestrator reads `.product/state.yaml` and relevant product artifacts, delegates analysis to read-only agents, and writes/updates authoritative artifacts through governed workflows. Decision Council stores independent opinions and final recommendation. Promotion uses an external staging directory, copies the Product Repository template, writes origin hashes/provenance, validates the result, optionally initializes Git, then atomically renames staging to the final destination.

Codex receives only a constructed advisory packet after secret scanning. It runs outside the repository and is never required for the internal Council to continue.

## Trade-offs

Repository-first architecture is portable, transparent, Git-friendly, and easy to inspect, but Markdown/YAML workflows are less ergonomic than a dedicated UI. Static schemas and hooks provide deterministic safety but cannot judge product truth. Keeping Subagents read-only reduces accidental state mutation but concentrates official updates in the Orchestrator/CLI.

## Alternatives rejected / deferred

- A hosted database/UI as the v1 source of truth: deferred until dogfooding demonstrates need.
- One monorepo containing many promoted products: rejected for v1 because product contexts would mix and independent lifecycle ownership would weaken.
- Mandatory Codex or multi-model consensus: rejected because Cloud/local portability and fail-open operation are required.
- Framework-specific Product OS runtime: rejected so promoted products remain free to choose their own stack.
