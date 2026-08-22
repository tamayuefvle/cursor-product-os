import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import YAML from 'yaml';

const SOURCE_ROOT = process.cwd();
const CLI = resolve(SOURCE_ROOT, 'scripts/product-os.mjs');

function run(cwd, args) {
  return execFileSync(process.execPath, [CLI, ...args], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function populateIdea(root, id) {
  const dir = resolve(root, 'incubator/ideas', id);
  const ideaPath = resolve(dir, 'idea.yaml');
  const idea = YAML.parse(readFileSync(ideaPath, 'utf8'));
  idea.status = 'EVALUATING';
  idea.confidence = { problem: 0.7, evidence: 0.6, differentiation: 0.5, feasibility: 0.8, overall: 0.65 };
  idea.open_questions = ['Will target users switch from their existing workaround?'];
  writeFileSync(ideaPath, YAML.stringify(idea), 'utf8');

  const readinessPath = resolve(dir, 'promotion-readiness.yaml');
  const readiness = YAML.parse(readFileSync(readinessPath, 'utf8'));
  readiness.recommendation = 'PROMOTE';
  readiness.verifier = { status: 'PASS', blocking_gaps: [], reviewed_at: new Date().toISOString() };
  writeFileSync(readinessPath, YAML.stringify(readiness), 'utf8');

  const docs = {
    'problem.md': '# Problem\n\nTarget users repeatedly lose time reconciling product decisions across disconnected notes and code changes. The current workaround is manual cross-checking and it creates avoidable rework.',
    'evidence.md': '# Evidence\n\nSupporting observations and counter-evidence are recorded with their sources. The remaining uncertainty is whether this pain is strong enough to trigger switching behavior.',
    'market.md': '# Market\n\nThe relevant market context is teams using AI-assisted development workflows. This document records sourced context and explicitly separates current evidence from speculative market sizing.',
    'competitors.md': '# Competitors\n\nAlternatives include general documentation tools, issue trackers, AI coding environments, spreadsheets, manual notes, and choosing not to change the current workflow.',
    'value-proposition.md': '# Value Proposition\n\nThe hypothesis is that a repository-native product decision system reduces context loss while keeping human approval at irreversible transitions. This remains a product hypothesis.',
    'evaluation.md': '# Idea Evaluation\n\nRecommendation: PROMOTE for deeper product-level discovery. The strongest counterargument is that disciplined use of existing tools may already solve enough of the problem.',
  };
  for (const [name, content] of Object.entries(docs)) writeFileSync(resolve(dir, name), `${content}\n`, 'utf8');
}

test('Phase 9 promotes a ready idea into an independent guarded repository', () => {
  const temp = mkdtempSync(join(tmpdir(), 'product-os-promotion-test-'));
  const fixture = resolve(temp, 'os');
  const destination = resolve(temp, 'my-product');
  try {
    cpSync(SOURCE_ROOT, fixture, {
      recursive: true,
      filter: (source) => !source.includes(`${join('node_modules')}`) && !source.includes(`${join('.git')}`),
    });

    const created = run(fixture, ['idea:new', '--title', 'Test Product', '--user', 'Small product teams', '--problem', 'Product decisions lose context']);
    assert.match(created, /IDEA-0001 created/);
    populateIdea(fixture, 'IDEA-0001');

    const inside = spawnSync(process.execPath, [CLI, 'promote:check', 'IDEA-0001', '--destination', resolve(fixture, 'products/test')], { cwd: fixture, encoding: 'utf8' });
    assert.notEqual(inside.status, 0);
    assert.match(`${inside.stdout}\n${inside.stderr}`, /destination must be outside/);

    const check = run(fixture, ['promote:check', 'IDEA-0001', '--destination', destination]);
    assert.match(check, /READY FOR HUMAN-GATED PROMOTION/);

    const promoted = run(fixture, ['promote', 'IDEA-0001', '--destination', destination, '--name', 'Test Product', '--human-approved', '--approved-by', 'test-human', '--skip-git-init']);
    assert.match(promoted, /PROMOTED/);
    assert.equal(existsSync(resolve(destination, 'AGENTS.md')), true);
    assert.equal(existsSync(resolve(destination, '.product/origin.yaml')), true);
    assert.equal(existsSync(resolve(destination, 'product/00-origin/incubator/idea.yaml')), true);

    const state = YAML.parse(readFileSync(resolve(destination, '.product/state.yaml'), 'utf8'));
    assert.equal(state.product.name, 'Test Product');
    assert.equal(state.product.stage, 'DISCOVERY');
    assert.equal(state.current_gate, 'G1_PROBLEM');
    assert.equal(state.build.allowed, false);
    assert.equal(state.release.allowed, false);

    const origin = YAML.parse(readFileSync(resolve(destination, '.product/origin.yaml'), 'utf8'));
    assert.equal(origin.source.idea_id, 'IDEA-0001');
    assert.equal(origin.promotion.approved_by, 'test-human');
    assert.ok(origin.artifacts.length >= 8);
    assert.ok(origin.artifacts.every((item) => /^[a-f0-9]{64}$/.test(item.sha256)));

    const visibility = YAML.parse(readFileSync(resolve(destination, '.product/visibility.yaml'), 'utf8'));
    assert.equal(visibility.repository_kind, 'PRODUCT');
    assert.equal(visibility.current_visibility, 'PRIVATE');
    assert.equal(visibility.public_allowed, false);
    assert.equal(visibility.promotion_implies_public, false);
    assert.equal(visibility.ai_may_set_public, false);
    assert.equal(visibility.public_approval.status, 'PENDING');
    assert.match(readFileSync(resolve(destination, 'product/00-origin/PROMOTION.md'), 'utf8'), /Visibility: \*\*PRIVATE\*\*/);
    assert.match(promoted, /Visibility:\s+PRIVATE/);
    assert.match(promoted, /Remote:\s+not created/);

    const readiness = YAML.parse(readFileSync(resolve(fixture, 'incubator/ideas/IDEA-0001/promotion-readiness.yaml'), 'utf8'));
    assert.equal(readiness.human_approval.status, 'APPROVED');
    assert.equal(readiness.product.name, 'Test Product');
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});


test('Phase 9 promotion failure rolls back destination, staging, and Incubator lifecycle state', () => {
  const temp = mkdtempSync(join(tmpdir(), 'product-os-promotion-rollback-'));
  const fixture = resolve(temp, 'os');
  const destination = resolve(temp, 'broken-product');
  try {
    cpSync(SOURCE_ROOT, fixture, {
      recursive: true,
      filter: (source) => !source.includes(`${join('node_modules')}`) && !source.includes(`${join('.git')}`),
    });

    run(fixture, ['idea:new', '--title', 'Rollback Product', '--user', 'Small product teams', '--problem', 'Promotion must be atomic']);
    populateIdea(fixture, 'IDEA-0001');

    // Force failure after staging/template copy by removing a runtime file that customizePromotedRepository requires.
    rmSync(resolve(fixture, 'templates/product-repository/AGENTS.md'));
    const failed = spawnSync(process.execPath, [CLI, 'promote', 'IDEA-0001', '--destination', destination, '--name', 'Rollback Product', '--human-approved', '--approved-by', 'test-human', '--skip-git-init'], { cwd: fixture, encoding: 'utf8' });
    assert.notEqual(failed.status, 0);
    assert.equal(existsSync(destination), false, 'partial destination repository must not remain');

    const siblings = readdirSync(temp);
    assert.equal(siblings.some((name) => name.startsWith('.product-os-promote-')), false, 'staging directory must be removed');

    const idea = YAML.parse(readFileSync(resolve(fixture, 'incubator/ideas/IDEA-0001/idea.yaml'), 'utf8'));
    const readiness = YAML.parse(readFileSync(resolve(fixture, 'incubator/ideas/IDEA-0001/promotion-readiness.yaml'), 'utf8'));
    assert.equal(idea.status, 'EVALUATING', 'failed promotion must not mark source idea PROMOTE');
    assert.equal(readiness.human_approval.status, 'PENDING', 'failed promotion must not persist approval as completed promotion state');
    assert.equal(readiness.product, null);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});
