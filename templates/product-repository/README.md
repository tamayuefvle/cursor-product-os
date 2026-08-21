# Product Repository — Cursor Product OS

This repository template is generated from Cursor Product OS after a product is promoted from the Incubator. It contains an independent copy of the Product OS runtime: Rules, specialist Subagents, Skills, Decision Council, optional Codex Advisor, schemas, CLI, and Phase 8 Project Hooks and Phase 9 provenance support.

## Start

```bash
npm install
npm run po -- doctor
npm run po -- validate
npm run po -- status
npm run po -- gate
npm test
```

## Runtime guardrails

Project hooks are configured in `.cursor/hooks.json`. Protected governance files cannot be directly rewritten by Agent Write/Delete operations, risky shell commands are denied or require explicit approval, and important product artifacts are validated after Agent edits.

```bash
npm run po -- hooks:status
```

Do not disable guardrails to make a task pass. Policy changes should be deliberate and human-reviewed.

## Promotion provenance

When this template is instantiated by Phase 9, the bootstrap writes `.product/origin.yaml` and `product/00-origin/` with a hashed Incubator snapshot. The new product still begins at `DISCOVERY / G1_PROBLEM`; promotion does not unlock build or release.


## v1.0.0 acceptance guarantees

This repository is generated only after human-gated promotion. It starts at `DISCOVERY / G1_PROBLEM`; `build.allowed` and `release.allowed` remain false. Promotion provenance is under `product/00-origin/`, including the Incubator snapshot and, when linked, the accepted human-approved PROMOTE decision snapshot.
