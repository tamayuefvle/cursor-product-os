---
name: consult-codex
description: Ask Codex CLI for an independent, structured external second opinion when the local runtime can access it. Use only after a Cursor-side evidence packet and internal synthesis exist. Codex is optional and failures never block Product OS.
---
# Consult Codex

Codex is an **external advisor**, not a decision maker and never a required runtime dependency.

## Preferred execution

For a Decision Council workspace, use:

```bash
npm run po -- codex:check
npm run po -- codex:consult DEC-####
```

`codex:consult` automatically:

1. verifies the council workspace;
2. builds a bounded advisory request from `context.md`, independent opinions, and `internal-synthesis.md`;
3. scans the outgoing packet for common credential/secret patterns;
4. checks whether the `codex` executable is present;
5. runs Codex outside the product repository in an ephemeral temporary directory;
6. uses non-interactive `codex exec --ephemeral` and the default read-only sandbox;
7. ignores user Codex configuration for a more isolated advisory run;
8. requests structured output using `schemas/codex-advisor-response.schema.json`;
9. validates and stores the result under `.product/advisory/codex/DEC-####/`;
10. updates advisor status in the council metadata.

## Privacy and safety

Never add credentials, tokens, `.env` contents, private keys, passwords, or unnecessary personal/private data to the advisory packet. The adapter intentionally sends only the explicitly assembled decision packet, not the entire repository.

If the packet trips the secret detector, external consultation is skipped and the internal council continues.

## Failure policy

All external-advisor failures are fail-open:

`missing command | auth error | network error | timeout | non-zero exit | malformed structured output | secret detection` → record status + continue with Cursor internal council.

Do not automatically adopt Codex's recommendation. Compare its assumptions and evidence with the internal council, then let the Orchestrator synthesize.
