# Validation Metrics

## Metrics

1. **Artifact completeness:** percentage of required gate artifacts present and structurally valid when a stage is claimed.
2. **Decision provenance:** percentage of `state.decisions.latest` references that resolve to exactly one valid Decision record.
3. **Acceptance reliability:** release candidate passes offline acceptance and, in a dependency-enabled environment, the full `npm test` suite.
4. **Context recovery:** during dogfooding, number of times prior chat history is required because repository artifacts are insufficient.
5. **Gate bypass incidents:** number of irreversible actions performed without the required human approval record.
6. **Review yield:** proportion of Decision Councils where Devil's Advocate, Verifier, or Codex finds a new material risk/assumption.

## Baseline

v1 baseline normalization discovered missing phase documents, missing root product artifacts, a dangling latest-decision reference, and test-coverage defects. Therefore the pre-normalization baseline for artifact completeness and decision provenance was not acceptable for a formal release package.

## Targets / thresholds

- Required release artifacts: 100% present.
- Dangling latest-decision references: 0.
- Offline acceptance: 100% PASS.
- Full test suite on normal development/CI environment: 100% PASS before tagging/releasing.
- Human-gated transition bypasses: 0.
- Context-recovery metric: establish empirical baseline during v1.1 dogfooding, then set a reduction target rather than inventing one now.
