import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();

test('promoted Product Repository retains the v1.0.0 runtime surface', () => {
  const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8'));
  assert.equal(pkg.version, '1.0.0');
  for (const path of [
    'AGENTS.md',
    '.cursor/hooks.json',
    '.cursor/agents/problem-analyst.md',
    '.cursor/skills/intake-idea/SKILL.md',
    'schemas/product-origin.schema.json',
    'scripts/product-os.mjs',
    'docs/PHASE-10.md',
  ]) assert.equal(existsSync(resolve(ROOT, path)), true, `missing ${path}`);
});

test('a Product Repository is not an Incubator', () => {
  assert.equal(existsSync(resolve(ROOT, 'incubator/_template')), false);
});
