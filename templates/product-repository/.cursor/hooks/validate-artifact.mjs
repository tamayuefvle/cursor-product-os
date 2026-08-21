import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PROJECT_ROOT, emit, projectRelative, readHookInput, saveCheck } from './hook-utils.mjs';

const input = await readHookInput();
const rel = projectRelative(input.file_path || '');
const policyPath = resolve(PROJECT_ROOT, '.product/artifact-policy.json');
if (!rel || !existsSync(policyPath)) {
  emit({});
  process.exit(0);
}

let policy;
try { policy = JSON.parse(readFileSync(policyPath, 'utf8')); }
catch (error) {
  saveCheck('artifact-policy', { level: 'error', file: '.product/artifact-policy.json', messages: [`Invalid artifact policy JSON: ${error.message}`] });
  emit({});
  process.exit(0);
}

const rule = policy.artifacts?.[rel];
if (!rule) {
  emit({});
  process.exit(0);
}

const filePath = resolve(PROJECT_ROOT, rel);
if (!existsSync(filePath)) {
  saveCheck(`artifact:${rel}`, { level: 'error', file: rel, messages: ['Artifact no longer exists.'] });
  emit({});
  process.exit(0);
}

const text = readFileSync(filePath, 'utf8');
const compactLength = text.replace(/\s+/g, ' ').trim().length;
const headings = [...text.matchAll(/^#{1,6}\s+(.+?)\s*$/gm)].map((match) => match[1].toLowerCase().replace(/[`*_:#：]/g, '').trim());
const errors = [];
const warnings = [];

if (compactLength < (rule.min_chars || 0)) errors.push(`Content is too short (${compactLength}/${rule.min_chars} chars).`);

for (const group of rule.required_heading_groups || []) {
  const alternatives = group.map((x) => String(x).toLowerCase());
  const found = headings.some((heading) => alternatives.some((candidate) => heading.includes(candidate)));
  if (!found) errors.push(`Missing required section (one of: ${group.join(' | ')}).`);
}

if (rule.source_evidence === 'required') {
  const hasSource = /https?:\/\/|\[[^\]]+\]\([^\)]+\)|\bsource(?:s)?\b|出典|根拠|evidence/i.test(text);
  if (!hasSource) errors.push('No source/evidence marker found.');
} else if (rule.source_evidence === 'recommended') {
  const hasSource = /https?:\/\/|\[[^\]]+\]\([^\)]+\)|\bsource(?:s)?\b|出典|根拠|evidence/i.test(text);
  if (!hasSource) warnings.push('Consider adding explicit sources/evidence.');
}

const placeholders = [...text.matchAll(/\b(?:TBD|TODO|FIXME)\b|未定|要確認/gi)].length;
if (placeholders > (rule.max_placeholders ?? 5)) warnings.push(`Many unresolved placeholders remain (${placeholders}).`);

saveCheck(`artifact:${rel}`, {
  level: errors.length ? 'error' : warnings.length ? 'warning' : 'ok',
  file: rel,
  messages: [...errors, ...warnings].length ? [...errors, ...warnings] : ['Artifact structure passed.'],
});

emit({});
