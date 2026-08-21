# Product OS Project Hooks — Phase 8

These command hooks are committed with the repository and are designed to work in Cursor Desktop/CLI and Cursor Cloud Agents where the corresponding hook event is supported.

## Guardrails

- `preToolUse` → `governance-guard.mjs`: blocks direct Agent Write/Delete operations on protected governance files. Use Product OS CLI workflows instead.
- `beforeShellExecution` → `shell-guard.mjs`: hard-denies catastrophic commands and requires explicit approval for destructive or externally consequential commands.
- `afterFileEdit` → `validate-state.mjs`: runs Product OS validation when governance files are edited.
- `afterFileEdit` → `validate-artifact.mjs`: checks important product artifacts against `.product/artifact-policy.json`.
- `afterShellExecution` → `validate-state.mjs --after-shell`: revalidates governance after Product OS CLI commands.
- `stop` → `quality-stop.mjs`: if a hook has recorded unresolved validation errors, asks the Agent to repair them before concluding. Loop limit is 2.

Runtime hook status is written to `.product/runtime/hook-status.json` and is intentionally ignored by Git.

The shell guard does not replace operating-system permissions, Cursor sandboxing, Git review, or human approval. It is an additional repository-level safety layer.
