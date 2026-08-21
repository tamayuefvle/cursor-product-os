# Decision Council workspaces

Each `DEC-####/` directory is a temporary, auditable workspace for one difficult decision.

The Orchestrator creates it with `npm run po -- council:create ...`, delegates independent opinions into `opinions/`, synthesizes them, optionally asks Codex, verifies the result, then records the final decision under `product/09-decisions/` when governance allows it.
