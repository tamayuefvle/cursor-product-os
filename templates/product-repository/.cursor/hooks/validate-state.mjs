import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { PROJECT_ROOT, emit, projectRelative, readHookInput, saveCheck } from './hook-utils.mjs';

const input = await readHookInput();
const rel = projectRelative(input.file_path || '');
const watched = new Set([
  '.product/state.yaml',
  '.product/gates.yaml',
  '.product/council-policy.yaml',
  '.product/artifact-policy.json',
  '.cursor/hooks.json',
]);
const afterShell = process.argv.includes('--after-shell');

if (!afterShell && !watched.has(rel)) {
  emit({});
  process.exit(0);
}

const cli = resolve(PROJECT_ROOT, 'scripts/product-os.mjs');
if (!existsSync(cli)) {
  saveCheck('governance', { level: 'error', file: rel || null, messages: ['Missing scripts/product-os.mjs'] });
  emit({});
  process.exit(0);
}

try {
  const output = execFileSync(process.execPath, [cli, 'validate'], {
    cwd: PROJECT_ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 15000,
    maxBuffer: 2 * 1024 * 1024,
  });
  saveCheck('governance', { level: 'ok', file: rel || null, messages: ['Product OS schema/customization validation passed.'], detail: output.trim().slice(0, 2000) });
} catch (error) {
  const detail = `${error?.stderr || ''}\n${error?.stdout || ''}\n${error?.message || ''}`.trim();
  const dependencyMissing = /ERR_MODULE_NOT_FOUND|Cannot find package ['"](?:yaml|ajv|ajv-formats)/i.test(detail);
  saveCheck('governance', {
    level: dependencyMissing ? 'warning' : 'error',
    file: rel || null,
    messages: [dependencyMissing ? 'Full validation unavailable until npm dependencies are installed.' : 'Product OS governance validation failed.'],
    detail: detail.slice(0, 4000),
  });
}

emit({});
