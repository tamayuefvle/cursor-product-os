import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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

function git(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function writeProductVisibility(dir) {
  mkdirSync(resolve(dir, '.product'), { recursive: true });
  mkdirSync(resolve(dir, 'schemas'), { recursive: true });
  writeFileSync(resolve(dir, '.product/visibility.yaml'), readFileSync(resolve(SOURCE_ROOT, 'templates/product-repository/.product/visibility.yaml')));
  writeFileSync(resolve(dir, 'schemas/visibility.schema.json'), readFileSync(resolve(SOURCE_ROOT, 'schemas/visibility.schema.json')));
  writeFileSync(resolve(dir, '.gitignore'), readFileSync(resolve(SOURCE_ROOT, 'templates/product-repository/.gitignore')));
}

function writeOsPrivacyHarness(dir) {
  mkdirSync(resolve(dir, '.product/lab/experience-raw'), { recursive: true });
  mkdirSync(resolve(dir, '.product/lab/experience-inbox'), { recursive: true });
  mkdirSync(resolve(dir, 'schemas'), { recursive: true });
  writeFileSync(resolve(dir, '.product/visibility.yaml'), readFileSync(resolve(SOURCE_ROOT, '.product/visibility.yaml')));
  writeFileSync(resolve(dir, 'schemas/visibility.schema.json'), readFileSync(resolve(SOURCE_ROOT, 'schemas/visibility.schema.json')));
  writeFileSync(resolve(dir, '.gitignore'), readFileSync(resolve(SOURCE_ROOT, '.gitignore')));
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
  assert.match(gitignore, /experience-inbox/);
  assert.match(gitignore, /credentials\.json/);
  const templateGitignore = readFileSync(resolve(SOURCE_ROOT, 'templates/product-repository/.gitignore'), 'utf8');
  assert.match(templateGitignore, /^\.env$/m);
  assert.match(templateGitignore, /experience-inbox/);

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

test('experience scan/sanitize/ingest keep RAW secrets and PII out of the local inbox', () => {
  const temp = mkdtempSync(join(tmpdir(), 'product-os-experience-'));
  try {
    writeOsPrivacyHarness(temp);

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
    const inboxFiles = readdirSync(resolve(temp, '.product/lab/experience-inbox')).filter((name) => name.startsWith('EXP-LOCAL-'));
    assert.equal(inboxFiles.length, 1);
    assert.match(inboxFiles[0], /^EXP-LOCAL-[0-9a-f]{32}\.md$/);
    const safePath = resolve(temp, '.product/lab/experience-inbox', inboxFiles[0]);
    const safe = readFileSync(safePath, 'utf8');
    assert.match(safe, /status: LOCAL_SANITIZED/);
    assert.match(safe, /classification: PATTERN_REDACTED/);
    assert.match(safe, /publication_allowed: false/);
    assert.doesNotMatch(safe, /public_safe:/);
    assert.doesNotMatch(safe, /status: REPOSITORY_SAFE/);
    assert.match(safe, /source_id: [0-9a-f]{32}/);
    assert.doesNotMatch(safe, /source_basename/);
    assert.doesNotMatch(safe, /client-note/);
    assert.doesNotMatch(safe, /jane\.doe@clientcorp\.com/);
    assert.doesNotMatch(safe, /hunter2secret/);
    assert.doesNotMatch(safe, /\/home\/owner\//);
    assert.match(safe, /\[REDACTED:EMAIL\]/);

    const ingestBlocked = spawnCli(temp, ['experience:ingest', rawPath]);
    assert.equal(ingestBlocked.status, 0, ingestBlocked.stderr);
    assert.match(`${ingestBlocked.stdout}\n${ingestBlocked.stderr}`, /INGEST admitted local-sanitized experience; RAW file was not copied/);
    assert.match(readFileSync(rawPath, 'utf8'), /jane\.doe@clientcorp\.com/, 'RAW source must remain in the gitignored raw directory');

    const clean = run(temp, ['experience:scan', resolve(SOURCE_ROOT, '.env.example')]);
    assert.match(clean, /SCAN CLEAN/);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});

test('sanitize/ingest do not persist RAW filenames or client identifiers into local artifacts', () => {
  const temp = mkdtempSync(join(tmpdir(), 'product-os-experience-name-'));
  try {
    writeOsPrivacyHarness(temp);

    const rawName = 'Acme-Corp-jane.doe@clientcorp.com-interview.md';
    const rawPath = resolve(temp, '.product/lab/experience-raw', rawName);
    writeFileSync(rawPath, [
      '# RAW interview',
      'Contact jane.doe@clientcorp.com about client data.',
      'password: hunter2secret',
      'Notes at /home/owner/acme-notes/interview.md',
      'Generalized lesson: agents should not copy private customer records into the public OS.',
      '',
    ].join('\n'), 'utf8');

    const sanitized = run(temp, ['experience:sanitize', rawPath]);
    assert.match(sanitized, /SANITIZE OK/);

    const ingest = spawnCli(temp, ['experience:ingest', rawPath]);
    assert.equal(ingest.status, 0, ingest.stderr);
    assert.match(`${ingest.stdout}\n${ingest.stderr}`, /INGEST admitted local-sanitized experience; RAW file was not copied/);

    const inboxDir = resolve(temp, '.product/lab/experience-inbox');
    const localFiles = readdirSync(inboxDir).filter((name) => name !== 'README.md');
    assert.ok(localFiles.length >= 1);
    for (const name of localFiles) {
      assert.match(name, /^EXP-LOCAL-[0-9a-f]{32}\.md$/);
      assert.doesNotMatch(name, /^EXP-SAFE-/);
      assert.doesNotMatch(name, /Acme/i);
      assert.doesNotMatch(name, /jane/i);
      assert.doesNotMatch(name, /clientcorp/i);
      const artifact = readFileSync(resolve(inboxDir, name), 'utf8');
      assert.match(artifact, /status: LOCAL_SANITIZED/);
      assert.match(artifact, /publication_allowed: false/);
      assert.doesNotMatch(artifact, /source_basename/);
      assert.doesNotMatch(artifact, /Acme-Corp-jane\.doe@clientcorp\.com-interview\.md/);
      assert.doesNotMatch(artifact, /jane\.doe@clientcorp\.com/);
      assert.doesNotMatch(artifact, /hunter2secret/);
      assert.doesNotMatch(artifact, /\/home\/owner\//);
    }

    assert.match(readFileSync(rawPath, 'utf8'), /jane\.doe@clientcorp\.com/);
    const mapDir = resolve(temp, '.product/lab/experience-raw/.local-map');
    const maps = readdirSync(mapDir);
    assert.ok(maps.length >= 1);
    const map = readFileSync(resolve(mapDir, maps[0]), 'utf8');
    assert.match(map, /raw_basename: Acme-Corp-jane\.doe@clientcorp\.com-interview\.md/);

    const check = run(temp, ['privacy:check']);
    assert.match(check, /Privacy boundary: OK/);

    writeFileSync(resolve(inboxDir, 'EXP-SAFE-Acme-Corp-jane-doe-interview.md'), '---\nstatus: REPOSITORY_SAFE\n---\n\n# leak\n', 'utf8');
    const leaked = spawnCli(temp, ['privacy:check']);
    assert.notEqual(leaked.status, 0);
    assert.match(`${leaked.stdout}\n${leaked.stderr}`, /inbox filename must be EXP-LOCAL-/);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});

test('legacy REPOSITORY_SAFE / EXP-SAFE files remain readable locally', () => {
  const temp = mkdtempSync(join(tmpdir(), 'product-os-experience-legacy-'));
  try {
    writeOsPrivacyHarness(temp);
    const legacyId = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const legacyName = `EXP-SAFE-${legacyId}.md`;
    const inboxDir = resolve(temp, '.product/lab/experience-inbox');
    const legacyPath = resolve(inboxDir, legacyName);
    const legacyBody = [
      '---',
      'schema_version: 1',
      'status: REPOSITORY_SAFE',
      `source_id: ${legacyId}`,
      '---',
      '',
      '# Legacy local experience',
      '',
      'Pattern-redacted local note with no secrets.',
      '',
    ].join('\n');
    writeFileSync(legacyPath, legacyBody, 'utf8');
    const check = run(temp, ['privacy:check']);
    assert.match(check, /Privacy boundary: OK/);

    const ingest = spawnCli(temp, ['experience:ingest', legacyPath]);
    assert.equal(ingest.status, 0, ingest.stderr);
    assert.match(`${ingest.stdout}\n${ingest.stderr}`, /INGEST OK \(legacy read-only\)/);
    assert.equal(readFileSync(legacyPath, 'utf8'), legacyBody);
    const inboxFiles = readdirSync(inboxDir).filter((name) => name !== 'README.md');
    assert.deepEqual(inboxFiles, [legacyName]);
    assert.equal(readdirSync(inboxDir).some((name) => name.startsWith('EXP-LOCAL-')), false);

    const rewrite = spawnCli(temp, ['experience:ingest', legacyPath, '--output', resolve(inboxDir, `EXP-LOCAL-${legacyId}.md`)]);
    assert.notEqual(rewrite.status, 0);
    assert.match(`${rewrite.stdout}\n${rewrite.stderr}`, /legacy REPOSITORY_SAFE \/ EXP-SAFE-\* ingest is read-only/);
    assert.deepEqual(readdirSync(inboxDir).filter((name) => name !== 'README.md'), [legacyName]);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});

test('privacy:check fails when a git repository tracks experience bodies', () => {
  const temp = mkdtempSync(join(tmpdir(), 'product-os-experience-git-'));
  try {
    writeOsPrivacyHarness(temp);
    writeFileSync(resolve(temp, '.product/lab/experience-inbox/README.md'), '# inbox\n');
    const localId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
    const localName = `EXP-LOCAL-${localId}.md`;
    writeFileSync(resolve(temp, '.product/lab/experience-inbox', localName), [
      '---',
      'schema_version: 1',
      'status: LOCAL_SANITIZED',
      'classification: PATTERN_REDACTED',
      'publication_allowed: false',
      `source_id: ${localId}`,
      '---',
      '',
      '# Local sanitized experience',
      '',
    ].join('\n'), 'utf8');

    git(temp, ['init']);
    git(temp, ['add', '.gitignore', '.product/visibility.yaml', 'schemas/visibility.schema.json', '.product/lab/experience-inbox/README.md']);
    const untrackedCheck = run(temp, ['privacy:check']);
    assert.match(untrackedCheck, /Privacy boundary: OK/);

    git(temp, ['add', '-f', `.product/lab/experience-inbox/${localName}`]);
    const tracked = spawnCli(temp, ['privacy:check']);
    assert.notEqual(tracked.status, 0);
    assert.match(`${tracked.stdout}\n${tracked.stderr}`, /experience body is git-tracked/);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});

test('requiredGitignoreChecks fail when experience-inbox ignore is missing', () => {
  const temp = mkdtempSync(join(tmpdir(), 'product-os-gitignore-inbox-'));
  try {
    writeOsPrivacyHarness(temp);
    writeFileSync(resolve(temp, '.gitignore'), [
      '.env',
      '.product/capabilities.local.json',
      'experience-raw',
      'credentials.json',
      '*.pem',
      '',
    ].join('\n'), 'utf8');
    const missing = spawnCli(temp, ['privacy:check']);
    assert.notEqual(missing.status, 0);
    assert.match(`${missing.stdout}\n${missing.stderr}`, /experience-inbox/);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});

test('Phase 11.2 observations stay generalized and omit private dogfood context', () => {
  const obs3 = readFileSync(resolve(SOURCE_ROOT, '.product/lab/observations/OBS-0003-discovery-continuation-after-falsification.md'), 'utf8');
  const obs4 = readFileSync(resolve(SOURCE_ROOT, '.product/lab/observations/OBS-0004-sanitization-does-not-establish-public-safety.md'), 'utf8');
  const joined = `${obs3}\n${obs4}`;
  assert.doesNotMatch(joined, /45/);
  assert.doesNotMatch(joined, /Coloso/i);
  assert.doesNotMatch(joined, /Udemy/i);
  assert.doesNotMatch(joined, /IDEA-0001/);
  assert.doesNotMatch(joined, /成就/);
  assert.doesNotMatch(joined, /地力不足/);
  assert.match(obs3, /Phase 11\.2 does not implement a Discovery stop-rule/);
  assert.match(obs4, /publication-allowed/);
});

test('DEC-0008 does not authorize Constitution apply, Phase 12, merge, or Release', () => {
  const text = readFileSync(resolve(SOURCE_ROOT, 'product/09-decisions/DEC-0008-privacy-semantics-hardening.md'), 'utf8');
  assert.match(text, /Phase 11\.2 Privacy Semantics Hardening only/);
  assert.match(text, /does not authorize Constitution apply/);
  assert.match(text, /Lab phase remains `PHASE_11_LAB_FOUNDATION`/);
  assert.match(readFileSync(resolve(SOURCE_ROOT, '.product/state.yaml'), 'utf8'), /latest: DEC-0003/);
});

test('Codex secret detector remains narrower than the experience privacy scanner', () => {
  const cli = readFileSync(CLI, 'utf8');
  assert.match(cli, /function sensitiveMatches/);
  assert.match(cli, /function privacyMatches/);
  assert.match(cli, /const matches = sensitiveMatches\(request\)/);
  assert.doesNotMatch(cli, /privacyMatches\(request\)/);
});
