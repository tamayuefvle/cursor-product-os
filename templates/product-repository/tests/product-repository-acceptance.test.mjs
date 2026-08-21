import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import YAML from 'yaml';

const ROOT = process.cwd();

test('promotion provenance is internally consistent', () => {
  const originPath = resolve(ROOT, '.product/origin.yaml');
  assert.equal(existsSync(originPath), true, 'missing .product/origin.yaml; this acceptance test is for a promoted Product Repository');
  const origin = YAML.parse(readFileSync(originPath, 'utf8'));
  assert.equal(origin.initial_state.stage, 'DISCOVERY');
  assert.equal(origin.initial_state.current_gate, 'G1_PROBLEM');
  assert.equal(origin.initial_state.build_allowed, false);
  assert.equal(origin.initial_state.release_allowed, false);
  assert.equal(existsSync(resolve(ROOT, 'product/00-origin/incubator/idea.yaml')), true);
  if (origin.decision_artifact) {
    const decisionPath = resolve(ROOT, origin.decision_artifact.path);
    assert.equal(existsSync(decisionPath), true);
    const digest = createHash('sha256').update(readFileSync(decisionPath)).digest('hex');
    assert.equal(digest, origin.decision_artifact.sha256);
  }
});

test('Product Repository runtime has 9 agents, 10 skills, and no Incubator', () => {
  const agents = readdirSync(resolve(ROOT, '.cursor/agents')).filter((name) => name.endsWith('.md') && name !== 'README.md');
  const skills = readdirSync(resolve(ROOT, '.cursor/skills')).filter((name) => existsSync(resolve(ROOT, '.cursor/skills', name, 'SKILL.md')));
  assert.equal(agents.length, 9);
  assert.equal(skills.length, 10);
  assert.equal(existsSync(resolve(ROOT, 'incubator')), false);
});
