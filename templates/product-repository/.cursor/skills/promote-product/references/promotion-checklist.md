# Promotion checklist

## Before deterministic preflight

- [ ] Idea ID and title are stable.
- [ ] Idea status is `EVALUATING` or `PROMOTE`.
- [ ] Target-user hypothesis is explicit.
- [ ] Problem hypothesis is explicit.
- [ ] `problem.md` is populated.
- [ ] `evidence.md` contains supporting and counter-evidence or explicit evidence gaps.
- [ ] `market.md` is populated with sourced context where factual claims are made.
- [ ] `competitors.md` includes direct, indirect, workaround, and do-nothing alternatives where relevant.
- [ ] `value-proposition.md` states value and differentiation as hypotheses where not validated.
- [ ] `evaluation.md` explains the recommendation and strongest counterargument.
- [ ] `promotion-readiness.yaml` recommendation is `PROMOTE`.
- [ ] Verifier status is `PASS`.
- [ ] Verifier blocking gaps are empty.

## Human boundary

- [ ] Human explicitly approved `PROMOTE`.
- [ ] `--human-approved` is present only because that approval actually occurred.
- [ ] `--approved-by` identifies the approving human/process truthfully.
- [ ] Existing Decision Council ID is linked when one exists.

## Destination safety

- [ ] Destination is outside the Product OS repository.
- [ ] Destination does not already exist.
- [ ] No unrelated repository can be overwritten.
- [ ] Git initialization is desired, or `--skip-git-init` is intentional.

## After promotion

- [ ] `.product/origin.yaml` exists and validates.
- [ ] `product/00-origin/incubator/` preserves the source snapshot.
- [ ] `.product/state.yaml` says `DISCOVERY` and `G1_PROBLEM`.
- [ ] `build.allowed` remains `false`.
- [ ] `release.allowed` remains `false`.
- [ ] Product repository has its own `AGENTS.md`, Rules, Subagents, Skills, Hooks, schemas, and CLI.
- [ ] Working artifacts show promotion provenance.
- [ ] Product-level discovery continues instead of treating incubation as final validation.
