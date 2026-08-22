import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import YAML from 'yaml';

const SOURCE_ROOT = process.cwd();
const CLI = resolve(SOURCE_ROOT, 'scripts/product-os.mjs');

function run(cwd, args) {
  return execFileSync(process.execPath, [CLI, ...args], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function spawnCli(cwd, args) {
  return spawnSync(process.execPath, [CLI, ...args], { cwd, encoding: 'utf8' });
}

function writeProductVisibility(dir) {
  mkdirSync(resolve(dir, '.product'), { recursive: true });
  mkdirSync(resolve(dir, 'schemas'), { recursive: true });
  writeFileSync(resolve(dir, '.product/visibility.yaml'), readFileSync(resolve(SOURCE_ROOT, 'templates/product-repository/.product/visibility.yaml')));
  writeFileSync(resolve(dir, 'schemas/visibility.schema.json'), readFileSync(resolve(SOURCE_ROOT, 'schemas/visibility.schema.json')));
  writeFileSync(resolve(dir, '.gitignore'), readFileSync(resolve(SOURCE_ROOT, 'templates/product-repository/.gitignore')));
}

test('Phase 11 privacy boundary keeps Product OS public-operable and Product repos private by default', () => {
  const osVisibility = YAML.parse(readFileSync(resolve(SOURCE_ROOT, '.product/visibility.yaml'), 'utf8'));
  assert.equal(osVisibility.repository_kind, 'PRODUCT_OS');
  assert.equal(osVisibility.default_visibility, 'PUBLIC_ALLOWED');
  assert.equal(osVisibility.public_allowed, true);
  assert.equal(osVisibility.promotion_implies_public, false);
  assert.equal(osVisibility.ai_may_set_public, false);

  const productVisibility = YAML.parse(readFileSync(resolve(SOURCE_ROOT, 'templates/product-repository/.product/visibility.yaml'), 'utf8'));
  assert.equal(productVisibility.repository_kind, 'PRODUCT');
  assert.equal(productVisibility.current_visibility, 'PRIVATE');
  assert.equal(productVisibility.public_allowed, false);

  const gitignore = readFileSync(resolve(SOURCE_ROOT, '.gitignore'), 'utf8');
  assert.match(gitignore, /^\.env$/m);
  assert.match(gitignore, /experience-raw/);
  assert.match(gitignore, /credentials\.json/);
  assert.match(readFileSync(resolve(SOURCE_ROOT, 'templates/product-repository/.gitignore'), 'utf8'), /^\.env$/m);

  const check = run(SOURCE_ROOT, ['privacy:check']);
  assert.match(check, /Privacy boundary: OK/);
});

test('visibility:set-public requires human approval and does not call hosting providers', () => {
  const temp = mkdtempSync(join(tmpdir(), 'product-os-visibility-'));
  try {
    writeProductVisibility(temp);
    const denied = spawnCli(temp, ['visibility:set-public', '--approved-by', 'test-human']);
    assert.notEqual(denied.status, 0);
    assert.match(`${denied.stdout}\n${denied.stderr}`, /PUBLIC requires explicit --human-approved/);

    const approved = run(temp, ['visibility:set-public', '--human-approved', '--approved-by', 'test-human']);
    assert.match(approved, /PUBLIC policy recorded/);
    assert.match(approved, /Hosting remotes are not changed/);
    const visibility = YAML.parse(readFileSync(resolve(temp, '.product/visibility.yaml'), 'utf8'));
    assert.equal(visibility.current_visibility, 'PUBLIC');
    assert.equal(visibility.public_allowed, true);
    assert.equal(visibility.public_approval.status, 'APPROVED');
    assert.equal(visibility.public_approval.approved_by, 'test-human');
    assert.equal(visibility.ai_may_set_public, false);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});

test('experience scan/sanitize/ingest keep RAW secrets and PII out of the inbox', () => {
  const temp = mkdtempSync(join(tmpdir(), 'product-os-experience-'));
  try {
    mkdirSync(resolve(temp, '.product/lab/experience-raw'), { recursive: true });
    mkdirSync(resolve(temp, '.product/lab/experience-inbox'), { recursive: true });
    mkdirSync(resolve(temp, 'schemas'), { recursive: true });
    writeFileSync(resolve(temp, '.product/visibility.yaml'), readFileSync(resolve(SOURCE_ROOT, '.product/visibility.yaml')));
    writeFileSync(resolve(temp, 'schemas/visibility.schema.json'), readFileSync(resolve(SOURCE_ROOT, 'schemas/visibility.schema.json')));
    writeFileSync(resolve(temp, '.gitignore'), readFileSync(resolve(SOURCE_ROOT, '.gitignore')));

    const rawPath = resolve(temp, '.product/lab/experience-raw/client-note.md');
    writeFileSync(rawPath, [
      '# RAW note',
      'Contact jane.doe@clientcorp.com about client data.',
      'password: hunter2secret',
      'Path /home/owner/secret-project/notes.md',
      'Generalized lesson: agents should not copy private customer records into the public OS.',
      '',
    ].join('\n'), 'utf8');

    const blockedScan = spawnCli(temp, ['experience:scan', rawPath]);
    assert.notEqual(blockedScan.status, 0);
    assert.match(`${blockedScan.stdout}\n${blockedScan.stderr}`, /SCAN BLOCKED/);
    assert.match(`${blockedScan.stdout}\n${blockedScan.stderr}`, /EMAIL/);

    const sanitized = run(temp, ['experience:sanitize', rawPath]);
    assert.match(sanitized, /SANITIZE OK/);
    const safePath = resolve(temp, '.product/lab/experience-inbox/EXP-SAFE-client-note.md');
    const safe = readFileSync(safePath, 'utf8');
    assert.match(safe, /status: REPOSITORY_SAFE/);
    assert.doesNotMatch(safe, /jane\.doe@clientcorp\.com/);
    assert.doesNotMatch(safe, /hunter2secret/);
    assert.doesNotMatch(safe, /\/home\/owner\//);
    assert.match(safe, /\[REDACTED:EMAIL\]/);

    const ingestBlocked = spawnCli(temp, ['experience:ingest', rawPath]);
    assert.equal(ingestBlocked.status, 0, ingestBlocked.stderr);
    assert.match(`${ingestBlocked.stdout}\n${ingestBlocked.stderr}`, /INGEST admitted sanitized experience; RAW file was not copied/);
    assert.match(readFileSync(rawPath, 'utf8'), /jane\.doe@clientcorp\.com/, 'RAW source must remain in the gitignored raw directory');

    const clean = run(temp, ['experience:scan', resolve(SOURCE_ROOT, '.env.example')]);
    assert.match(clean, /SCAN CLEAN/);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});

test('Codex secret detector remains narrower than the experience privacy scanner', () => {
  const cli = readFileSync(CLI, 'utf8');
  assert.match(cli, /function sensitiveMatches/);
  assert.match(cli, /function privacyMatches/);
  assert.match(cli, /const matches = sensitiveMatches\(request\)/);
  assert.doesNotMatch(cli, /privacyMatches\(request\)/);
});
