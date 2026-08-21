# Security

## Data / assets

Protected assets include product decisions, repository source code, credentials, API keys, private research, product state, gate policy, hooks, and external-advisor packets. Product OS itself does not need production secrets to operate its core workflow.

## Threats / risks

- An Agent directly changes governance state to bypass a gate.
- A destructive shell command removes files, history, infrastructure, or production data.
- Sensitive credentials are included in a Codex advisory packet.
- Promotion overwrites an existing repository or leaves a partial repository after failure.
- A malformed external-advisor response is treated as trusted product evidence.

## Authentication / authorization

v1 delegates authentication to the surrounding Cursor, operating-system, Git, cloud, and external-provider environments. Product OS authorization is workflow-level: human-gated actions require explicit approval metadata, protected files are guarded by hooks, and external-impact shell operations are denied or require human confirmation.

## Secrets / privacy

Codex advisory packets are assembled from explicit Council context rather than exposing the repository. Common credential patterns are scanned before external execution; suspicious packets are marked `BLOCKED_SENSITIVE`. Codex runs ephemerally outside the repository and structured output is schema-validated. Secret detection is defense-in-depth and does not replace proper secret management or repository permissions.

## Abuse / misuse

Hooks deny catastrophic commands and ask for human approval on destructive or production-impacting actions. Promotion refuses existing destinations and paths inside Product OS. State transitions should remain explicit and auditable. Future integrations must preserve least privilege and must not weaken the current fail-open/fail-closed boundaries without a recorded security decision.
