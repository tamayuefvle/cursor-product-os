# Privacy & Repository Boundary — Phase 11 Foundation

Status: IMPLEMENTED (Lab foundation; Phase 11.2 Privacy Semantics Hardening; not a v1.1 Stable change)
Baseline: v1.0.0 Stable Kernel remains unchanged
Constitution: no apply. CONST-012 remains a proposal until human-approved Constitution apply.

## Decision

Product OS Core may operate as a PUBLIC repository. Product Repositories created or managed by Product OS are PRIVATE by default. `PROMOTE` never implies PUBLIC. PUBLIC is a separate human-gated action.

Experience is not a Public Product OS durable artifact. RAW stays gitignored. Automated sanitize produces local-only `LOCAL_SANITIZED` files (`classification: PATTERN_REDACTED`, `publication_allowed: false`). Pattern-clean is not publication permission. Public git-tracked Lab artifacts are generalized observations and findings after a human/review boundary.

This is Phase 11 remaining foundation work, including Phase 11.2 semantics hardening. It is not Phase 12 Adaptive Reasoning and not a CAP-002 enablement.

## Why this is foundation, not a new Capability

- FACT: v1.0.0 promotion creates an independent repository, initializes Git on `main`, and does not create a remote (`docs/PHASE-9.md`).
- FACT: v1 secret scanning exists only for Codex advisory packets (`sensitiveMatches` in `scripts/product-os.mjs`).
- FACT: Product repository `.gitignore` did not ignore `.env` / credentials before Phase 11, while Product OS already did.
- FACT: no machine-readable visibility policy existed; AI could attempt `gh repo create --public` with only generic production-publish `ask` coverage.
- FACT: pattern sanitization cannot prove the absence of semantic private context (OBS-0004).
- INFERENCE: if Product OS is public and a private Product's raw or merely pattern-redacted experience is copied in, private context can leak. The architecture already forbids unrestricted dumps (`docs/vnext/VNEXT-LAB-ARCHITECTURE.md` §10, §27).
- DECISION: enforce the boundary with policy, gitignore, hooks, and CLI. Do not add agents or enable CAP-001–CAP-009. Do not treat sanitized Experience as publication-allowed.

## Invariants (runtime; Constitution apply is separate)

1. Product OS (`repository_kind: PRODUCT_OS`) is PUBLIC-operable. Its git-tracked content must not include secrets, PII, client data, or Experience bodies.
2. Product Repositories (`repository_kind: PRODUCT`) default to `PRIVATE`, `public_allowed: false`.
3. `PROMOTE` copies the product template, records origin, starts at DISCOVERY / G1, and writes visibility PRIVATE. It does not create a hosting remote and does not set PUBLIC.
4. `ai_may_set_public` is always false. Direct Agent writes to `.product/visibility.yaml` are denied.
5. PUBLIC for a Product Repository requires `po visibility:set-public --human-approved --approved-by <human>`. That CLI records policy only; it does not call GitHub/Origin.
6. Hosting-provider commands that create or switch a repository to PUBLIC are hard-denied by the shell guard. AI must not perform PUBLIC hosting changes.
7. RAW experience stays in gitignored `experience-raw/` directories. Sanitized experience stays in gitignored `experience-inbox/` directories except README. New files are `LOCAL_SANITIZED` / `EXP-LOCAL-<32-hex>.md`. Legacy `REPOSITORY_SAFE` / `EXP-SAFE-*` remain readable locally and must not be newly written.
8. `.env`, credentials, local capability state, RAW experience, and Experience bodies are not Git-managed. `privacy:check` fails if Experience bodies are git-tracked.
9. v1.0.0 Promotion / Gate / State / Acceptance behavior is preserved. Codex `sensitiveMatches` is unchanged.

## PUBLIC-operable Product OS

Public Product OS may contain:

- Product OS runtime, rules, schemas, templates, tests;
- Product OS's own product artifacts;
- sanitized, generalized Lab observations and findings.

Public Product OS must not contain:

- client identities, customer PII, secrets, credentials;
- RAW experience;
- `LOCAL_SANITIZED` or legacy `REPOSITORY_SAFE` Experience bodies;
- local-only files (`.env`, `credentials.json`, `.product/capabilities.local.json`).

Incubator ideas that live inside a public Product OS are therefore Product-OS-owned or synthetic. Client product discovery belongs in a PRIVATE Product Repository.

## Pipeline

```text
Private / local experience
   RAW experience  →  experience-raw/     (gitignored)
        ↓
   po experience:scan
        ↓
   po experience:sanitize   (pattern redaction; remaining pattern findings = 0)
        ↓
   LOCAL_SANITIZED artifact (EXP-LOCAL-<32-hex>.md; publication_allowed: false)
   local RAW filename map stays in gitignored experience-raw/.local-map/
        ↓
   Local inbox              experience-inbox/   (gitignored except README)
        ↓
   human / review boundary
        ↓
   generalized OBS / FIND   (git-tracked)
```

`po experience:ingest` is a gate, not a learning engine. It refuses RAW, unsanitized, or still pattern-sensitive content. Admission is local-only.

## What this change does not do

- does not apply CONST-012 to `.product/constitution.yaml`;
- does not enable CAP-002 or add Lab Skills / Agents;
- does not call GitHub/Origin APIs;
- does not make `PUBLIC` a product stage gate like PROMOTE/RELEASE;
- does not claim PII detection is complete (pattern-based defense-in-depth only);
- does not add a semantic DLP engine or a publication classifier;
- does not move Lab phase to Phase 12.
