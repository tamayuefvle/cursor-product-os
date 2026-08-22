import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import YAML from 'yaml';

const ROOT = process.cwd();
const cwd = ROOT;

test('root Product OS self-state is normalized to release-authorized MVP validation', () => {
  const state = YAML.parse(readFileSync('.product/state.yaml', 'utf8'));
  assert.equal(state.schema_version, 1);
  assert.equal(state.product.stage, 'MVP_VALIDATION');
  assert.equal(state.current_gate, 'G5_RELEASE');
  assert.equal(state.decisions.latest, 'DEC-0003');
  assert.equal(state.build.allowed, true);
  assert.equal(state.release.allowed, true);
});

test('schema validation command succeeds', () => {
  const output = execFileSync('node', ['scripts/product-os.mjs', 'validate'], { cwd, encoding: 'utf8' });
  assert.match(output, /OK\s+state/);
  assert.match(output, /OK\s+gates/);
  assert.match(output, /OK\s+idea template/);
  assert.match(output, /Privacy boundary: OK/);
});

test('Phase 4 defines exactly nine read-only specialist subagents', async () => {
  const { readdirSync, readFileSync } = await import('node:fs');
  const files = readdirSync('.cursor/agents').filter((name) => name.endsWith('.md') && name !== 'README.md');
  assert.equal(files.length, 9);
  for (const name of files) {
    const text = readFileSync(`.cursor/agents/${name}`, 'utf8');
    assert.match(text, /^---\n/);
    assert.match(text, /\nreadonly:\s*true\n/);
    assert.match(text, /\nmodel:\s*inherit\n/);
  }
});

test('Phase 5 defines exactly ten skills with matching names', async () => {
  const { readdirSync, readFileSync, existsSync } = await import('node:fs');
  const dirs = readdirSync('.cursor/skills', { withFileTypes: true }).filter((entry) => entry.isDirectory());
  assert.equal(dirs.length, 10);
  for (const entry of dirs) {
    const path = `.cursor/skills/${entry.name}/SKILL.md`;
    assert.equal(existsSync(path), true);
    const text = readFileSync(path, 'utf8');
    assert.match(text, new RegExp(`\\nname:\\s*${entry.name}\\n`));
    assert.match(text, /\ndescription:\s*.+\n/);
  }
  const promote = readFileSync('.cursor/skills/promote-product/SKILL.md', 'utf8');
  assert.match(promote, /\ndisable-model-invocation:\s*true\n/);
});

test('Phase 6 defines Decision Council policy and auditable workspace tooling', async () => {
  const { existsSync, readFileSync } = await import('node:fs');
  assert.equal(existsSync('.product/council-policy.yaml'), true);
  assert.equal(existsSync('schemas/council.schema.json'), true);
  const policy = YAML.parse(readFileSync('.product/council-policy.yaml', 'utf8'));
  assert.equal(policy.codex.fail_open, true);
  assert.equal(policy.codex.read_only, true);
  assert.equal(policy.decision_council.verify_with, 'verifier');
  const cli = readFileSync('scripts/product-os.mjs', 'utf8');
  assert.match(cli, /council:create/);
  assert.match(cli, /council:update/);
  assert.match(cli, /council:record/);
  assert.match(cli, /human-approved/);
});

test('Phase 7 implements fail-open structured Codex external review', async () => {
  const { existsSync, readFileSync } = await import('node:fs');
  assert.equal(existsSync('schemas/codex-advisor-response.schema.json'), true);
  const cli = readFileSync('scripts/product-os.mjs', 'utf8');
  assert.match(cli, /codex:consult/);
  assert.match(cli, /--ephemeral/);
  assert.match(cli, /--output-schema/);
  assert.match(cli, /--ignore-user-config/);
  assert.match(cli, /--skip-git-repo-check/);
  assert.match(cli, /BLOCKED_SENSITIVE/);
  assert.match(cli, /continuing with internal council/);
});

test('Phase 6-7 runtime is mirrored into promoted Product Repository template', async () => {
  const { readFileSync, existsSync } = await import('node:fs');
  assert.equal(existsSync('templates/product-repository/.product/council-policy.yaml'), true);
  assert.equal(existsSync('templates/product-repository/schemas/council.schema.json'), true);
  assert.equal(existsSync('templates/product-repository/schemas/codex-advisor-response.schema.json'), true);
  assert.equal(
    readFileSync('scripts/product-os.mjs', 'utf8'),
    readFileSync('templates/product-repository/scripts/product-os.mjs', 'utf8'),
  );
});

test('Phase 8 installs project runtime guardrails and artifact policy', async () => {
  const { existsSync, readFileSync } = await import('node:fs');
  assert.equal(existsSync('.cursor/hooks.json'), true);
  assert.equal(existsSync('.product/artifact-policy.json'), true);
  assert.equal(existsSync('schemas/artifact-policy.schema.json'), true);
  for (const script of [
    'governance-guard.mjs',
    'shell-guard.mjs',
    'validate-state.mjs',
    'validate-artifact.mjs',
    'quality-stop.mjs',
  ]) assert.equal(existsSync(`.cursor/hooks/${script}`), true);
  const config = JSON.parse(readFileSync('.cursor/hooks.json', 'utf8'));
  assert.equal(config.hooks.beforeShellExecution[0].failClosed, true);
  assert.equal(config.hooks.preToolUse[0].failClosed, true);
  assert.equal(config.hooks.stop[0].loop_limit, 2);
});

test('Phase 8 runtime is mirrored into promoted Product Repository template', async () => {
  const { readFileSync, existsSync } = await import('node:fs');
  assert.equal(existsSync('templates/product-repository/.cursor/hooks.json'), true);
  assert.equal(existsSync('templates/product-repository/.product/artifact-policy.json'), true);
  assert.equal(existsSync('templates/product-repository/schemas/artifact-policy.schema.json'), true);
  assert.equal(
    readFileSync('.cursor/hooks/shell-guard.mjs', 'utf8'),
    readFileSync('templates/product-repository/.cursor/hooks/shell-guard.mjs', 'utf8'),
  );
});

test('Phase 9 defines guarded Incubator promotion and provenance schemas', async () => {
  const { existsSync, readFileSync } = await import('node:fs');
  assert.equal(existsSync('incubator/_template/promotion-readiness.yaml'), true);
  assert.equal(existsSync('schemas/promotion-readiness.schema.json'), true);
  assert.equal(existsSync('schemas/product-origin.schema.json'), true);
  assert.equal(existsSync('docs/PHASE-9.md'), true);
  const cli = readFileSync('scripts/product-os.mjs', 'utf8');
  assert.match(cli, /idea:new/);
  assert.match(cli, /promote:check/);
  assert.match(cli, /--human-approved/);
  assert.match(cli, /destination must be outside the Product OS repository/);
  assert.match(cli, /G1_PROBLEM/);
  assert.match(cli, /sha256/);
  const shellGuard = readFileSync('.cursor/hooks/shell-guard.mjs', 'utf8');
  assert.match(shellGuard, /human-gated Product OS promotion/);
});

test('Phase 9 runtime and origin schema are mirrored into promoted Product Repository template', async () => {
  const { readFileSync, existsSync } = await import('node:fs');
  assert.equal(existsSync('templates/product-repository/schemas/product-origin.schema.json'), true);
  assert.equal(existsSync('templates/product-repository/docs/PHASE-9.md'), true);
  assert.equal(
    readFileSync('scripts/product-os.mjs', 'utf8'),
    readFileSync('templates/product-repository/scripts/product-os.mjs', 'utf8'),
  );
  assert.equal(
    readFileSync('.cursor/skills/promote-product/SKILL.md', 'utf8'),
    readFileSync('templates/product-repository/.cursor/skills/promote-product/SKILL.md', 'utf8'),
  );
});


test('Phase 10 closes v1 with lifecycle acceptance and decision provenance hardening', () => {
  const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8'));
  assert.equal(pkg.version, '1.0.0');
  assert.equal(existsSync(resolve(ROOT, 'tests/e2e-product-lifecycle.test.mjs')), true);
  assert.equal(existsSync(resolve(ROOT, 'docs/PHASE-10.md')), true);
  const cli = readFileSync(resolve(ROOT, 'scripts/product-os.mjs'), 'utf8');
  assert.match(cli, /function validatedPromotionDecision/);
  assert.match(cli, /decision_artifact: decisionArtifact/);
  const originSchema = JSON.parse(readFileSync(resolve(ROOT, 'schemas/product-origin.schema.json'), 'utf8'));
  assert.ok(originSchema.required.includes('decision_artifact'));
});
