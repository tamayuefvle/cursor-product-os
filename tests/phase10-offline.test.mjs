import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const text = (path) => readFileSync(resolve(ROOT, path), 'utf8');

test('Phase 10 release surface is complete without loading npm dependencies', () => {
  const pkg = JSON.parse(text('package.json'));
  assert.equal(pkg.version, '1.0.0');
  assert.equal(JSON.parse(text('templates/product-repository/package.json')).version, '1.0.0');
  for (const path of [
    'docs/PHASE-1-3.md',
    'docs/PHASE-4-5.md',
    'docs/PHASE-6-7.md',
    'docs/PHASE-8.md',
    'docs/PHASE-9.md',
    'docs/PHASE-10.md',
    'docs/V1-ACCEPTANCE.md',
    'product/01-discovery/problem.md',
    'product/01-discovery/evidence.md',
    'product/01-discovery/assumptions.md',
    'product/02-market/market.md',
    'product/02-market/competitors.md',
    'product/03-users/jtbd.md',
    'product/04-strategy/value-proposition.md',
    'product/05-product/prd.md',
    'product/05-product/mvp-scope.md',
    'product/06-ux/user-flow.md',
    'product/07-engineering/architecture.md',
    'product/07-engineering/security.md',
    'product/08-experiments/hypotheses.md',
    'product/08-experiments/metrics.md',
    'product/09-decisions/DEC-0001-v1-baseline-architecture.md',
    'product/09-decisions/DEC-0002-ready-for-build.md',
    'product/09-decisions/DEC-0003-v1-release-baseline-normalization.md',
    'tests/e2e-product-lifecycle.test.mjs',
    'tests/fixtures-phase10-scenario.json',
    'schemas/product-origin.schema.json',
  ]) assert.equal(existsSync(resolve(ROOT, path)), true, `missing ${path}`);

  const state = text('.product/state.yaml');
  assert.match(state, /stage:\s*MVP_VALIDATION/);
  assert.match(state, /current_gate:\s*G5_RELEASE/);
  assert.match(state, /latest:\s*DEC-0003/);
  assert.ok(state.includes('build:\n  allowed: true'));
  assert.ok(state.includes('release:\n  allowed: true'));
});

test('Phase 10 hardening preserves decision provenance and fail-open Codex behavior', () => {
  const cli = text('scripts/product-os.mjs');
  assert.match(cli, /validatedPromotionDecision/);
  assert.match(cli, /must record decision: PROMOTE/);
  assert.match(cli, /decision_artifact: decisionArtifact/);
  assert.match(cli, /Codex unavailable; continuing with internal council/);
  assert.match(cli, /state\.build\.allowed = false/);
  assert.match(cli, /state\.release\.allowed = false/);
});
