import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import process from 'node:process';

export const PROJECT_ROOT = resolve(process.env.CURSOR_PROJECT_DIR || process.cwd());
export const RUNTIME_DIR = resolve(PROJECT_ROOT, '.product/runtime');
export const STATUS_PATH = resolve(RUNTIME_DIR, 'hook-status.json');

export async function readHookInput() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const text = Buffer.concat(chunks.map((x) => Buffer.isBuffer(x) ? x : Buffer.from(x))).toString('utf8').trim();
  if (!text) return {};
  try { return JSON.parse(text); }
  catch (error) { throw new Error(`Invalid hook JSON input: ${error.message}`); }
}

export function emit(output = {}) {
  process.stdout.write(`${JSON.stringify(output)}\n`);
}

export function projectRelative(path) {
  if (!path) return '';
  const absolute = resolve(String(path));
  const rel = relative(PROJECT_ROOT, absolute).replaceAll('\\', '/');
  return rel.startsWith('../') ? absolute.replaceAll('\\', '/') : rel;
}

export function loadStatus() {
  if (!existsSync(STATUS_PATH)) return { version: 1, updated_at: null, checks: {} };
  try { return JSON.parse(readFileSync(STATUS_PATH, 'utf8')); }
  catch { return { version: 1, updated_at: null, checks: {} }; }
}

export function saveCheck(key, check) {
  const state = loadStatus();
  state.version = 1;
  state.updated_at = new Date().toISOString();
  state.checks ??= {};
  state.checks[key] = { checked_at: state.updated_at, ...check };
  mkdirSync(dirname(STATUS_PATH), { recursive: true });
  writeFileSync(STATUS_PATH, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  return state;
}

export function collectLikelyPaths(value, key = '', out = []) {
  if (typeof value === 'string') {
    if (/(path|file|target|destination|source)/i.test(key)) out.push(value);
    return out;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectLikelyPaths(item, key, out);
    return out;
  }
  if (value && typeof value === 'object') {
    for (const [childKey, childValue] of Object.entries(value)) collectLikelyPaths(childValue, childKey, out);
  }
  return out;
}

export function normalizedRelativeCandidate(value) {
  if (!value || typeof value !== 'string') return '';
  const normalized = value.replaceAll('\\', '/').trim();
  if (normalized.startsWith('/')) return projectRelative(normalized);
  return normalized.replace(/^\.\//, '');
}

export function readText(path) {
  return readFileSync(resolve(PROJECT_ROOT, path), 'utf8');
}
