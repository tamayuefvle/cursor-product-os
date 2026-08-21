import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const read = (p) => readFileSync(resolve(root, p), 'utf8');

test('vNext Phase 11 preserves the v1 Stable Kernel surface', () => {
  const agents = readdirSync(resolve(root, '.cursor/agents')).filter((x) => x.endsWith('.md') && x !== 'README.md');
  const skills = readdirSync(resolve(root, '.cursor/skills')).filter((x) => existsSync(resolve(root, '.cursor/skills', x, 'SKILL.md')));
  assert.equal(agents.length, 9);
  assert.equal(skills.length, 10);
  assert.match(read('package.json'), /"version": "1\.0\.0"/);
  assert.equal(existsSync(resolve(root, 'docs/vnext/VNEXT-LAB-ARCHITECTURE.md')), true);
});

test('vNext Phase 11 establishes a protected Constitution', () => {
  const text = read('.product/constitution.yaml');
  assert.match(text, /status: PROTECTED/);
  assert.match(text, /apply_policy: HUMAN_ONLY/);
  assert.match(text, /No Self Approval/);
  assert.match(text, /Repository Source of Truth/);
});

test('vNext Phase 11 capability registry is isolated and disabled by default', () => {
  const text = read('.product/capabilities.yaml');
  const ids = [...text.matchAll(/- id: (CAP-\d{3})/g)].map((m) => m[1]);
  assert.deepEqual(ids, ['CAP-001','CAP-002','CAP-003','CAP-004','CAP-005','CAP-006','CAP-007','CAP-008','CAP-009']);
  const enabledTrue = [...text.matchAll(/^\s+enabled: true$/gm)].length;
  const enabledFalse = [...text.matchAll(/^\s+enabled: false$/gm)].length;
  assert.equal(enabledTrue, 1, 'only Lab runtime itself is enabled');
  assert.equal(enabledFalse, 9, 'all nine capabilities start disabled');
});

test('vNext Phase 11 records first dogfood observation and accepted architecture decisions', () => {
  assert.match(read('.product/lab/observations/OBS-0001-v1-reasoning-breadth.md'), /MISSED_PERSPECTIVE/);
  for (const id of ['DEC-0004','DEC-0005','DEC-0006']) {
    const file = readdirSync(resolve(root, 'product/09-decisions')).find((name) => name.startsWith(`${id}-`));
    assert.ok(file, `${id} decision must exist`);
    const text = read(`product/09-decisions/${file}`);
    assert.match(text, /status: ACCEPTED/);
    assert.match(text, /human_approved: true/);
  }
  assert.match(read('.product/state.yaml'), /latest: DEC-0003/);
  assert.match(read('.product/lab/state.yaml'), /latest_decision: DEC-0006/);
});
