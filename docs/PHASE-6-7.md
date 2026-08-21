# Phase 6–7 — Decision Council and Codex Optional Advisor

## Phase 6: Decision Council runtime

Phase 6 turns the existing workflow contract into an auditable repository runtime. A difficult decision receives a unique `DEC-####` workspace under `.product/council/`. Independent Cursor specialist outputs are stored before synthesis so later reviewers can distinguish original opinions from consensus effects. The verifier remains separate from voting and synthesis.

### Workspace

```text
.product/council/DEC-####/
├── council.yaml
├── context.md
├── opinions/
├── internal-synthesis.md
├── verification.md
└── final-recommendation.md
```

### Durable decision

`council:record` writes a Markdown decision record with validated YAML frontmatter under `product/09-decisions/`. Human-gated decisions cannot be recorded without an explicit `--human-approved` flag, and the command deliberately does not modify stage, `build.allowed`, or `release.allowed`.

## Phase 7: Codex Optional Advisor runtime

The Codex adapter is deliberately optional and isolated. It checks only whether `codex` is callable before attempting a review. The actual consultation may still fail due to authentication, network, rate limits, or environment restrictions; all such failures are recorded and the internal council continues.

The adapter:

1. assembles only explicit council material;
2. rejects common secret/credential patterns;
3. enforces a prompt byte limit;
4. runs `codex exec --ephemeral` from a temporary directory outside the repository;
5. relies on Codex's default read-only sandbox;
6. uses `--ignore-user-config` and `--skip-git-repo-check` for an isolated non-repository advisory run;
7. requests JSON conforming to `schemas/codex-advisor-response.schema.json`;
8. validates the structured response before storing it;
9. writes request/response/metadata under `.product/advisory/codex/DEC-####/`;
10. never gives Codex authority to update Product OS state.

## Fail-open states

- `UNAVAILABLE` — CLI not callable / auth or runtime unavailable
- `FAILED` — execution or response validation failed
- `BLOCKED_SENSITIVE` — outgoing packet looked like it contained credentials or secrets
- `SUCCESS` — a validated structured advisory response was stored

All states except `SUCCESS` continue with the Cursor internal Decision Council.
