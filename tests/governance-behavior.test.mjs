import test from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { delimiter, resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import YAML from 'yaml';

const SOURCE_ROOT = process.cwd();
const CLI = resolve(SOURCE_ROOT, 'scripts/product-os.mjs');

function fixtureRoot(prefix) {
  const temp = mkdtempSync(join(tmpdir(), prefix));
  const fixture = resolve(temp, 'os');
  cpSync(SOURCE_ROOT, fixture, {
    recursive: true,
    filter: (source) => !source.includes(`${join('node_modules')}`) && !source.includes(`${join('.git')}`),
  });
  return { temp, fixture };
}

function run(cwd, args, extra = {}) {
  return execFileSync(process.execPath, [CLI, ...args], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...extra });
}

function createHumanGatedCouncil(fixture, action) {
  const output = run(fixture, [
    'council:create',
    '--title', `${action} gate behavior`,
    '--question', `May the product finalize ${action} without human approval?`,
    '--type', action === 'RELEASE' ? 'release' : 'product',
    '--impact', 'HIGH',
    '--reversibility', 'LOW',
    '--approval-action', action,
    '--option', action,
    '--option', `DO_NOT_${action}`,
  ]);
  const id = output.match(/(DEC-[0-9]{4,}) created/)?.[1];
  assert.ok(id, output);
  run(fixture, ['council:update', id, '--status', 'RECOMMENDED', '--confidence', '0.8']);
  return id;
}

test('KILL/PIVOT/READY_FOR_BUILD/RELEASE decisions cannot be recorded without explicit human approval', () => {
  const { temp, fixture } = fixtureRoot('product-os-human-gates-');
  try {
    for (const action of ['KILL', 'PIVOT', 'READY_FOR_BUILD', 'RELEASE']) {
      const id = createHumanGatedCouncil(fixture, action);
      const denied = spawnSync(process.execPath, [CLI, 'council:record', id, '--decision', action], { cwd: fixture, encoding: 'utf8' });
      assert.notEqual(denied.status, 0, `${action} must be blocked without human approval`);
      assert.match(`${denied.stdout}\n${denied.stderr}`, /requires explicit human approval/);
      const logs = readdirSync(resolve(fixture, 'product/09-decisions')).filter((name) => name.startsWith(`${id}-`));
      assert.equal(logs.length, 0, `${action} must not create a decision record without approval`);
    }
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});

test('sensitive Codex packet is blocked before the codex executable is invoked', () => {
  const { temp, fixture } = fixtureRoot('product-os-sensitive-codex-');
  try {
    const output = run(fixture, [
      'council:create',
      '--title', 'Sensitive packet test',
      '--question', 'Should an advisory packet containing credentials ever leave the repository?',
      '--type', 'security',
      '--impact', 'HIGH',
      '--reversibility', 'LOW',
      '--option', 'BLOCK',
      '--option', 'SEND',
    ]);
    const id = output.match(/(DEC-[0-9]{4,}) created/)?.[1];
    assert.ok(id, output);
    const councilDir = resolve(fixture, '.product/council', id);
    writeFileSync(resolve(councilDir, 'context.md'), '# Context\n\napi_key=supersecretvalue123456789\n', 'utf8');
    writeFileSync(resolve(councilDir, 'opinions/product-manager.md'), '# Opinion\n\nBlock any packet that contains credential-like material before external execution.\n', 'utf8');
    writeFileSync(resolve(councilDir, 'internal-synthesis.md'), '# Internal synthesis\n\nThe packet must be blocked before any external advisor process is invoked. This is a security boundary.\n', 'utf8');

    const bin = resolve(temp, 'bin');
    mkdirSync(bin, { recursive: true });
    const marker = resolve(temp, 'codex-invoked.txt');
    const unixStub = resolve(bin, 'codex');
    writeFileSync(unixStub, `#!/bin/sh\necho invoked > "${marker}"\nexit 0\n`, 'utf8');
    chmodSync(unixStub, 0o755);
    writeFileSync(resolve(bin, 'codex.cmd'), `@echo off\necho invoked>"${marker}"\nexit /b 0\n`, 'utf8');

    const env = { ...process.env, PATH: `${bin}${delimiter}${process.env.PATH || ''}` };
    const consulted = spawnSync(process.execPath, [CLI, 'codex:consult', id], { cwd: fixture, encoding: 'utf8', env });
    assert.equal(consulted.status, 0, `${consulted.stdout}\n${consulted.stderr}`);
    assert.equal(existsSync(marker), false, 'codex executable must not be invoked for a blocked packet');
    const metadata = JSON.parse(readFileSync(resolve(fixture, '.product/advisory/codex', id, 'metadata.json'), 'utf8'));
    assert.equal(metadata.status, 'BLOCKED_SENSITIVE');
    const council = YAML.parse(readFileSync(resolve(councilDir, 'council.yaml'), 'utf8'));
    assert.equal(council.external_advisor.status, 'BLOCKED_SENSITIVE');
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});
