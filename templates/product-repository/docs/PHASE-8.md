# Phase 8 — Runtime Guardrails

## Goal

Convert Product OS governance from prompt-only guidance into repository-level runtime enforcement using Cursor Project Hooks.

Phase 8 implements five runtime behaviors:

1. protect governance files before Agent Write/Delete operations;
2. deny catastrophic shell commands;
3. require human approval for destructive or externally consequential shell commands;
4. validate governance and product artifacts after changes;
5. make unresolved validation errors visible to the Agent before it concludes.

## Cursor hooks configuration

`.cursor/hooks.json` registers command-based hooks only so the same repository policy can run in Cursor Cloud Agents on supported hook events.

- `preToolUse` → `governance-guard.mjs`, matcher `Write|Delete`, `failClosed: true`;
- `beforeShellExecution` → `shell-guard.mjs`, `failClosed: true`;
- `afterFileEdit` → governance and artifact validators;
- `afterShellExecution` → governance validation after Product OS CLI commands;
- `stop` → bounded repair loop with `loop_limit: 2`.

## Governance protection

Direct Agent Write/Delete is blocked for:

- `.product/state.yaml`;
- `.product/gates.yaml`;
- `.product/council-policy.yaml`;
- `.product/artifact-policy.json`;
- `.cursor/hooks.json`.

The guard does not prohibit humans from editing policy deliberately. It prevents an Agent from casually rewriting its own controls and directs state changes through auditable workflows.

## Shell safety model

### Hard deny

Examples include filesystem-formatting commands, raw device writes, root/home recursive deletion, fork bombs, and system shutdown/reboot commands.

### Human approval (`ask`)

Examples include:

- `git reset --hard`, `git clean -f*`, force push, branch deletion;
- destructive SQL such as `DROP DATABASE` / `TRUNCATE`;
- infrastructure destroy operations;
- destructive Kubernetes/Docker cleanup;
- production deploy/publish commands such as `vercel --prod`, `npm publish`, `terraform apply`, and `kubectl apply`.

Ordinary development commands are allowed.

## Artifact policy

`.product/artifact-policy.json` defines lightweight structural contracts for gate-relevant Markdown artifacts. Validation checks minimum useful content, required section groups, source/evidence markers where relevant, and excessive unresolved placeholders.

The policy is intentionally structural rather than semantic. Passing a hook does **not** prove that the artifact is correct or that a Gate passes. Subagent/Verifier judgment remains required.

## Validation status

Hooks write transient results to:

`.product/runtime/hook-status.json`

This path is gitignored. Inspect it through:

`npm run po -- hooks:status`

`quality-stop.mjs` only reacts to checks currently recorded at `level: error` and can request at most two automatic repair follow-ups per Agent stop sequence.

## Failure behavior

Security-critical pre-action guards use `failClosed: true`. Post-edit validation is non-blocking because the edit already happened; failures are recorded and surfaced for repair. If full schema validation cannot run because npm dependencies are not installed, governance validation records a warning rather than fabricating success.

## Cloud portability

The implementation uses project-level command hooks with repository-relative commands. This matches Cursor Cloud Agent support for project hooks such as `preToolUse`, `beforeShellExecution`, `afterFileEdit`, `afterShellExecution`, and `stop`. IDE-only hooks are not required by Product OS Phase 8.
