import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const root = process.cwd();

function runHook(script, input, env = {}) {
  const result = spawnSync(process.execPath, [resolve(root, `.cursor/hooks/${script}`)], {
    cwd: root,
    input: JSON.stringify(input),
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout.trim() || '{}');
}

test('Phase 8 hook config contains fail-closed governance and shell guards', () => {
  const config = JSON.parse(readFileSync('.cursor/hooks.json', 'utf8'));
  assert.equal(config.version, 1);
  const governance = config.hooks.preToolUse.find((x) => x.command.includes('governance-guard.mjs'));
  const shell = config.hooks.beforeShellExecution.find((x) => x.command.includes('shell-guard.mjs'));
  assert.equal(governance.failClosed, true);
  assert.equal(shell.failClosed, true);
  assert.equal(config.hooks.stop[0].loop_limit, 2);
});

test('governance guard blocks direct Agent writes to protected state', () => {
  const denied = runHook('governance-guard.mjs', {
    tool_name: 'Write',
    tool_input: { file_path: resolve(root, '.product/state.yaml'), content: 'x' },
  });
  assert.equal(denied.permission, 'deny');

  const visibilityDenied = runHook('governance-guard.mjs', {
    tool_name: 'Write',
    tool_input: { file_path: resolve(root, '.product/visibility.yaml'), content: 'x' },
  });
  assert.equal(visibilityDenied.permission, 'deny');

  const allowed = runHook('governance-guard.mjs', {
    tool_name: 'Write',
    tool_input: { file_path: resolve(root, 'src/example.ts'), content: 'x' },
  });
  assert.equal(allowed.permission, 'allow');
});

test('shell guard denies catastrophic commands, asks on consequential commands, allows normal tests', () => {
  const denied = runHook('shell-guard.mjs', { command: 'rm -rf /', cwd: root, sandbox: false });
  assert.equal(denied.permission, 'deny');

  const ask = runHook('shell-guard.mjs', { command: 'git reset --hard HEAD~1', cwd: root, sandbox: false });
  assert.equal(ask.permission, 'ask');

  const deploy = runHook('shell-guard.mjs', { command: 'vercel --prod', cwd: root, sandbox: false });
  assert.equal(deploy.permission, 'ask');

  const promote = runHook('shell-guard.mjs', { command: 'npm run po -- promote IDEA-0001 --destination ../x --human-approved --approved-by human', cwd: root, sandbox: false });
  assert.equal(promote.permission, 'ask');

  const publicCreate = runHook('shell-guard.mjs', { command: 'gh repo create my-product --public', cwd: root, sandbox: false });
  assert.equal(publicCreate.permission, 'deny');

  const allowed = runHook('shell-guard.mjs', { command: 'npm test', cwd: root, sandbox: false });
  assert.equal(allowed.permission, 'allow');
});

test('artifact validator records structural errors without external npm dependencies', () => {
  const temp = mkdtempSync(join(tmpdir(), 'product-os-hook-test-'));
  mkdirSync(join(temp, '.product'), { recursive: true });
  mkdirSync(join(temp, 'product/05-product'), { recursive: true });
  writeFileSync(join(temp, '.product/artifact-policy.json'), JSON.stringify({
    version: 1,
    artifacts: {
      'product/05-product/prd.md': {
        min_chars: 100,
        required_heading_groups: [['Problem'], ['Requirements']],
        source_evidence: 'none',
        max_placeholders: 2,
      },
    },
  }));
  const file = join(temp, 'product/05-product/prd.md');
  writeFileSync(file, '# Problem\nToo short.\n');
  runHook('validate-artifact.mjs', { file_path: file, edits: [] }, { CURSOR_PROJECT_DIR: temp });
  const status = JSON.parse(readFileSync(join(temp, '.product/runtime/hook-status.json'), 'utf8'));
  assert.equal(status.checks['artifact:product/05-product/prd.md'].level, 'error');
});

test('quality stop requests repair when a validation error remains', () => {
  const temp = mkdtempSync(join(tmpdir(), 'product-os-stop-test-'));
  mkdirSync(join(temp, '.product/runtime'), { recursive: true });
  writeFileSync(join(temp, '.product/runtime/hook-status.json'), JSON.stringify({
    version: 1,
    updated_at: new Date().toISOString(),
    checks: {
      governance: { level: 'error', file: '.product/state.yaml', messages: ['invalid state'] },
    },
  }));
  const output = runHook('quality-stop.mjs', { status: 'completed', loop_count: 0 }, { CURSOR_PROJECT_DIR: temp });
  assert.match(output.followup_message, /invalid state/);
});
