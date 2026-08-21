---
name: promote-product
description: Human-gated bootstrap from an incubator idea into an independent one-product repository using the Phase 9 promotion CLI. Use only after the idea recommendation is PROMOTE, verifier status is PASS, and the human explicitly approves promotion.
disable-model-invocation: true
---
# Promote Product

Promotion is a human-gated transition. Never infer approval from confidence, enthusiasm, a verifier result, or an agent recommendation.

## Preconditions

Read:

- `incubator/ideas/<IDEA-ID>/idea.yaml`;
- `incubator/ideas/<IDEA-ID>/promotion-readiness.yaml`;
- the required incubator evidence artifacts;
- `references/promotion-checklist.md`.

The deterministic Phase 9 preflight requires:

- idea status `EVALUATING` or `PROMOTE`;
- recommendation `PROMOTE`;
- verifier status `PASS` with no blocking gaps;
- target user and problem hypotheses;
- populated `problem.md`, `evidence.md`, `market.md`, `competitors.md`, `value-proposition.md`, and `evaluation.md`;
- a destination outside the Product OS repository that does not already exist.

Run:

```bash
npm run po -- promote:check IDEA-0001 --destination ../my-product
```

A successful preflight does **not** constitute human approval.

## Human-approved execution

Only after the human explicitly approves `PROMOTE`, execute:

```bash
npm run po -- promote IDEA-0001 \
  --destination ../my-product \
  --name "My Product" \
  --human-approved \
  --approved-by human
```

Optionally link the approval to an existing Decision Council record with `--decision-id DEC-####`.

## What Phase 9 does

1. Records the explicit human approval in the source idea.
2. Stages a fresh copy of `templates/product-repository/` outside the Product OS repository.
3. Preserves all incubator source artifacts byte-for-byte under `product/00-origin/incubator/`.
4. Copies selected product inputs into their working product paths with provenance warnings.
5. Writes `.product/origin.yaml` with source metadata and SHA-256 artifact hashes.
6. Initializes the product at `DISCOVERY / G1_PROBLEM`.
7. Keeps `build.allowed=false` and `release.allowed=false`.
8. Initializes Git on branch `main` by default.
9. Refuses to overwrite any existing destination.

Promotion does not mean G1, G3, G4, or G5 has passed. Incubator evidence becomes inherited input that must still survive product-level scrutiny.

Do not choose a framework, hosting platform, database, or implementation stack during promotion.
