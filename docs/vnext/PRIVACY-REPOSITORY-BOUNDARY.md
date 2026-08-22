# Privacy & Repository Boundary — Phase 11 Foundation

Status: IMPLEMENTED (Lab foundation; not a v1.1 Stable change)
Baseline: v1.0.0 Stable Kernel remains unchanged
Constitution: no apply. CONST-012 remains a proposal until human-approved Constitution apply.

## Decision

Product OS Core may operate as a PUBLIC repository. Product Repositories created or managed by Product OS are PRIVATE by default. `PROMOTE` never implies PUBLIC. PUBLIC is a separate human-gated action. Experience that crosses from a private Product into Product OS must pass RAW → Scan → Redaction/Generalization → Repository-safe before it can be stored in a git-tracked public-operable path.

This is Phase 11 remaining foundation work, not Phase 12 Adaptive Reasoning and not a CAP-002 enablement.

## Why this is foundation, not a new Capability

- FACT: v1.0.0 promotion creates an independent repository, initializes Git on `main`, and does not create a remote (`docs/PHASE-9.md`).
- FACT: v1 secret scanning exists only for Codex advisory packets (`sensitiveMatches` in `scripts/product-os.mjs`).
- FACT: Product repository `.gitignore` did not ignore `.env` / credentials before this change, while Product OS already did.
- FACT: no machine-readable visibility policy existed; AI could attempt `gh repo create --public` with only generic production-publish `ask` coverage.
- INFERENCE: if Product OS is public and a private Product's raw experience is copied in, client data can leak. The architecture already forbids unrestricted dumps (`docs/vnext/VNEXT-LAB-ARCHITECTURE.md` §10, §27).
- DECISION: enforce the boundary with policy, gitignore, hooks, and CLI. Do not add agents or enable CAP-001–CAP-009.

## Invariants (runtime; Constitution apply is separate)

1. Product OS (`repository_kind: PRODUCT_OS`) is PUBLIC-operable. Its git-tracked content must not include secrets, PII, or client data.
2. Product Repositories (`repository_kind: PRODUCT`) default to `PRIVATE`, `public_allowed: false`.
3. `PROMOTE` copies the product template, records origin, starts at DISCOVERY / G1, and writes visibility PRIVATE. It does not create a hosting remote and does not set PUBLIC.
4. `ai_may_set_public` is always false. Direct Agent writes to `.product/visibility.yaml` are denied.
5. PUBLIC for a Product Repository requires `po visibility:set-public --human-approved --approved-by <human>`. That CLI records policy only; it does not call GitHub/Origin.
6. Hosting-provider commands that create or switch a repository to PUBLIC are hard-denied by the shell guard. AI must not perform PUBLIC hosting changes.
7. RAW experience stays in gitignored `experience-raw/` directories. Only `REPOSITORY_SAFE` artifacts may enter git-tracked inbox paths.
8. `.env`, credentials, local capability state, and RAW experience are not Git-managed.
9. v1.0.0 Promotion / Gate / State / Acceptance behavior is preserved. Codex `sensitiveMatches` is unchanged.

## PUBLIC-operable Product OS

Public Product OS may contain:

- Product OS runtime, rules, schemas, templates, tests;
- Product OS's own product artifacts;
- sanitized, generalized Lab observations.

Public Product OS must not contain:

- client identities, customer PII, secrets, credentials;
- RAW experience from a private Product;
- local-only files (`.env`, `credentials.json`, `.product/capabilities.local.json`).

Incubator ideas that live inside a public Product OS are therefore Product-OS-owned or synthetic. Client product discovery belongs in a PRIVATE Product Repository.

## Pipeline

```text
Private Product (PRIVATE)
   RAW experience  →  .product/experience-raw/     (gitignored)
        ↓
   po experience:scan
        ↓
   po experience:sanitize   (redact secrets/PII-like; require remaining findings = 0)
        ↓
   REPOSITORY_SAFE artifact (opaque source_id / EXP-SAFE-<32-hex>.md; no RAW basename)
   local RAW filename map stays in gitignored experience-raw/.local-map/
        ↓
   Product OS inbox         .product/lab/experience-inbox/   (git-tracked)
        ↓
   later Phase 13: OBS / FIND candidates (still not automatic Core change)
```

`po experience:ingest` is a gate, not a learning engine. It refuses RAW, unsanitized, or still-sensitive content.

## What this change does not do

- does not apply CONST-012 to `.product/constitution.yaml`;
- does not enable CAP-002 or add Lab Skills / Agents;
- does not call GitHub/Origin APIs;
- does not make `PUBLIC` a product stage gate like PROMOTE/RELEASE;
- does not claim PII detection is complete (pattern-based defense-in-depth only);
- does not move Lab phase to Phase 12.
