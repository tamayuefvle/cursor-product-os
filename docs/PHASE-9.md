# Phase 9 — Incubator → Independent Product Repository

## Goal

Turn a human-approved Incubator idea into an independent one-product repository without losing provenance or accidentally granting later product gates.

## Promotion invariant

`PROMOTE recommendation + verifier PASS + required artifacts + explicit human approval` are separate conditions. No confidence threshold can automatically replace any of them.

## Source bundle

Each new idea contains:

- `idea.yaml`
- `brief.md`
- `problem.md`
- `evidence.md`
- `market.md`
- `competitors.md`
- `alternatives.md`
- `value-proposition.md`
- `evaluation.md`
- `promotion-readiness.yaml`

## Commands

```bash
npm run po -- idea:new --title "..." --user "..." --problem "..."
npm run po -- idea:status [IDEA-####]
npm run po -- promote:check IDEA-#### --destination ../product-repo
npm run po -- promote IDEA-#### --destination ../product-repo --name "Product" --human-approved --approved-by human
```

`promote` may also receive `--decision-id DEC-####`, `--product-id <id>`, and intentional `--skip-git-init`.

## Deterministic preflight

Promotion is blocked when any of the following applies:

- idea is not in `EVALUATING` or `PROMOTE`;
- user/problem hypothesis is empty;
- recommendation is not `PROMOTE`;
- verifier is not `PASS`;
- verifier has blocking gaps;
- a required artifact is missing or still effectively a placeholder;
- destination is inside Product OS;
- destination already exists.

## Atomic bootstrap

The product is first built in a staging directory beside the destination. Only after customization and schema validation succeed is it renamed to the requested destination. A failure removes staging and never overwrites an existing target.

## Provenance

Every source Incubator file is copied byte-for-byte to:

`product/00-origin/incubator/`

`.product/origin.yaml` records:

- idea identity;
- Product OS version;
- human approval metadata;
- optional Decision Council ID;
- SHA-256 and byte count for every source artifact;
- source → working-document mappings;
- initial Product State.

Selected Incubator documents are also copied into normal `product/` working paths with an explicit provenance warning. These inherited files are inputs, not evidence that product gates have passed.

## Initial Product State

Every promoted product starts with:

```yaml
stage: DISCOVERY
current_gate: G1_PROBLEM
build:
  allowed: false
release:
  allowed: false
```

Open Incubator questions become initial OPEN critical assumptions. Product confidence fields may inherit bounded decision-support scores, but those values are not probabilities and do not pass gates.

## Git

Git is initialized on `main` by default. Phase 9 does not create a GitHub/GitLab/Origin remote and does not commit, because remote choice and Git identity are separate human decisions.

## Visibility

Promoted Product Repositories are PRIVATE by default. `PROMOTE` does not grant PUBLIC visibility. PUBLIC is a separate human-gated action (`visibility:set-public`) and is not performed by Phase 9.

## Non-goals

Phase 9 does not:

- create a remote repository;
- set repository visibility to PUBLIC;
- choose a framework or cloud provider;
- start implementation;
- mark G1/G3/G4/G5 passed;
- permit build or release;
- overwrite existing work.
