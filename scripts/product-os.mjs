#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import process from 'node:process';
import YAML from 'yaml';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const ROOT = process.cwd();
const STATE_PATH = resolve(ROOT, '.product/state.yaml');
const GATES_PATH = resolve(ROOT, '.product/gates.yaml');
const COUNCIL_POLICY_PATH = resolve(ROOT, '.product/council-policy.yaml');
const COUNCIL_ROOT = resolve(ROOT, '.product/council');
const CODEX_ADVISORY_ROOT = resolve(ROOT, '.product/advisory/codex');
const CAPABILITIES_PATH = resolve(ROOT, '.product/capabilities.local.json');
const ARTIFACT_POLICY_PATH = resolve(ROOT, '.product/artifact-policy.json');
const HOOKS_CONFIG_PATH = resolve(ROOT, '.cursor/hooks.json');
const HOOK_STATUS_PATH = resolve(ROOT, '.product/runtime/hook-status.json');
const INCUBATOR_ROOT = resolve(ROOT, 'incubator');
const INCUBATOR_IDEAS_ROOT = resolve(INCUBATOR_ROOT, 'ideas');
const INCUBATOR_TEMPLATE_ROOT = resolve(INCUBATOR_ROOT, '_template');
const PRODUCT_TEMPLATE_ROOT = resolve(ROOT, 'templates/product-repository');
const VISIBILITY_PATH = resolve(ROOT, '.product/visibility.yaml');
const CONSTITUTION_PATH = resolve(ROOT, '.product/constitution.yaml');
const EMAIL_ALLOWLIST_DOMAINS = new Set(['example.com', 'example.org', 'example.net', 'localhost']);

function nowIso() {
  return new Date().toISOString();
}

function readYaml(path) {
  return YAML.parse(readFileSync(path, 'utf8'));
}

function writeYaml(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, YAML.stringify(data, { lineWidth: 0 }), 'utf8');
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function commandAvailable(command, args = ['--version']) {
  try {
    const output = execFileSync(command, args, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 5000,
    }).trim();
    return { available: true, detail: output.split(/\r?\n/)[0] || 'available' };
  } catch (error) {
    const detail = error?.code === 'ENOENT' ? 'not installed' : String(error?.stderr || error?.message || 'unavailable').trim().split(/\r?\n/)[0];
    return { available: false, detail: detail || 'unavailable' };
  }
}

function makeAjv() {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  return ajv;
}

function validateData(data, schemaPath) {
  const ajv = makeAjv();
  const validate = ajv.compile(readJson(schemaPath));
  const ok = validate(data);
  return { ok, errors: validate.errors ?? [] };
}

function validateYaml(yamlPath, schemaPath) {
  return validateData(readYaml(yamlPath), schemaPath);
}

function parseFrontmatter(path) {
  const text = readFileSync(path, 'utf8');
  if (!text.startsWith('---\n')) return { data: null, body: text, error: 'missing YAML frontmatter' };
  const end = text.indexOf('\n---', 4);
  if (end < 0) return { data: null, body: text, error: 'unterminated YAML frontmatter' };
  try {
    const bodyStart = end + 4;
    return { data: YAML.parse(text.slice(4, end)), body: text.slice(bodyStart).replace(/^\r?\n/, ''), error: null };
  } catch (error) {
    return { data: null, body: text, error: `invalid YAML frontmatter: ${error.message}` };
  }
}

function collectFiles(dir, predicate) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir)) {
    const path = resolve(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) out.push(...collectFiles(path, predicate));
    else if (predicate(path)) out.push(path);
  }
  return out;
}

function validateCursorCustomization() {
  const errors = [];
  const agentDir = resolve(ROOT, '.cursor/agents');
  const skillDir = resolve(ROOT, '.cursor/skills');
  const agentFiles = collectFiles(agentDir, (p) => p.endsWith('.md') && basename(p) !== 'README.md');
  const skillFiles = collectFiles(skillDir, (p) => basename(p) === 'SKILL.md');

  for (const path of agentFiles) {
    const { data, error } = parseFrontmatter(path);
    if (error) { errors.push(`${relative(ROOT, path)}: ${error}`); continue; }
    if (!data?.name || !/^[a-z0-9-]+$/.test(data.name)) errors.push(`${relative(ROOT, path)}: invalid or missing name`);
    if (!data?.description || typeof data.description !== 'string') errors.push(`${relative(ROOT, path)}: missing description`);
    if (data?.readonly !== true) errors.push(`${relative(ROOT, path)}: v1 Product OS specialists must be readonly: true`);
  }

  for (const path of skillFiles) {
    const { data, error } = parseFrontmatter(path);
    if (error) { errors.push(`${relative(ROOT, path)}: ${error}`); continue; }
    const folder = basename(dirname(path));
    if (!data?.name || data.name !== folder) errors.push(`${relative(ROOT, path)}: name must match parent folder (${folder})`);
    if (!data?.description || typeof data.description !== 'string') errors.push(`${relative(ROOT, path)}: missing description`);
  }

  if (agentFiles.length !== 9) errors.push(`expected 9 custom subagents, found ${agentFiles.length}`);
  if (skillFiles.length !== 10) errors.push(`expected 10 Product OS skills, found ${skillFiles.length}`);

  return { ok: errors.length === 0, errors, agentCount: agentFiles.length, skillCount: skillFiles.length };
}


function validateHooksRuntime() {
  const errors = [];
  if (!existsSync(HOOKS_CONFIG_PATH)) return { ok: false, errors: ['missing .cursor/hooks.json'] };
  let config;
  try { config = readJson(HOOKS_CONFIG_PATH); }
  catch (error) { return { ok: false, errors: [`invalid .cursor/hooks.json: ${error.message}`] }; }
  if (config.version !== 1) errors.push('hooks config version must be 1');
  const hooks = config.hooks || {};
  const required = {
    preToolUse: ['governance-guard.mjs'],
    beforeShellExecution: ['shell-guard.mjs'],
    afterFileEdit: ['validate-state.mjs', 'validate-artifact.mjs'],
    afterShellExecution: ['validate-state.mjs'],
    stop: ['quality-stop.mjs'],
  };
  for (const [event, scripts] of Object.entries(required)) {
    const defs = Array.isArray(hooks[event]) ? hooks[event] : [];
    for (const script of scripts) {
      if (!defs.some((item) => typeof item?.command === 'string' && item.command.includes(script))) {
        errors.push(`${event} must include ${script}`);
      }
      if (!existsSync(resolve(ROOT, `.cursor/hooks/${script}`))) errors.push(`missing .cursor/hooks/${script}`);
    }
  }
  const shell = (hooks.beforeShellExecution || []).find((item) => String(item.command || '').includes('shell-guard.mjs'));
  const governance = (hooks.preToolUse || []).find((item) => String(item.command || '').includes('governance-guard.mjs'));
  if (shell?.failClosed !== true) errors.push('shell guard must use failClosed: true');
  if (governance?.failClosed !== true) errors.push('governance guard must use failClosed: true');
  return { ok: errors.length === 0, errors };
}

function hookStatus() {
  if (!existsSync(HOOK_STATUS_PATH)) {
    console.log('No runtime hook validation status has been recorded yet.');
    return;
  }
  const status = readJson(HOOK_STATUS_PATH);
  console.log(`Hook status updated: ${status.updated_at ?? '-'}`);
  for (const [key, check] of Object.entries(status.checks || {})) {
    const marker = check.level === 'ok' ? 'OK ' : check.level === 'warning' ? 'WARN' : 'ERR';
    console.log(`${marker} ${check.file || key}`);
    for (const message of check.messages || []) console.log(`    ${message}`);
  }
}

function formatValidationErrors(errors) {
  return errors.map((e) => `  - ${e.instancePath || '/'} ${e.message}`).join('\n');
}

function parseArgs(argv) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) {
      positional.push(token);
      continue;
    }
    const key = token.slice(2);
    const next = argv[i + 1];
    const value = next && !next.startsWith('--') ? (i += 1, next) : true;
    if (Object.hasOwn(flags, key)) {
      flags[key] = Array.isArray(flags[key]) ? [...flags[key], value] : [flags[key], value];
    } else {
      flags[key] = value;
    }
  }
  return { flags, positional };
}

function flagValues(flags, key) {
  if (!Object.hasOwn(flags, key)) return [];
  return Array.isArray(flags[key]) ? flags[key] : [flags[key]];
}

function requireString(flags, key) {
  const value = flags[key];
  if (!value || value === true || Array.isArray(value)) throw new Error(`Missing required --${key} <value>`);
  return value;
}

function enumValue(value, allowed, label) {
  const normalized = String(value).toUpperCase();
  if (!allowed.includes(normalized)) throw new Error(`${label} must be one of: ${allowed.join(', ')}`);
  return normalized;
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'decision';
}


function pathIsInside(parent, child) {
  const rel = relative(resolve(parent), resolve(child));
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
}

function pendingPublicApproval() {
  return { status: 'PENDING', approved_by: null, approved_at: null, decision_id: null };
}

function defaultVisibility(kind) {
  if (kind === 'PRODUCT_OS') {
    return {
      schema_version: 1,
      repository_kind: 'PRODUCT_OS',
      default_visibility: 'PUBLIC_ALLOWED',
      current_visibility: 'UNDECLARED',
      public_allowed: true,
      promotion_implies_public: false,
      public_requires_human_approval: true,
      ai_may_set_public: false,
      public_approval: pendingPublicApproval(),
    };
  }
  return {
    schema_version: 1,
    repository_kind: 'PRODUCT',
    default_visibility: 'PRIVATE',
    current_visibility: 'PRIVATE',
    public_allowed: false,
    promotion_implies_public: false,
    public_requires_human_approval: true,
    ai_may_set_public: false,
    public_approval: pendingPublicApproval(),
  };
}

function visibilitySchemaPath() {
  return resolve(ROOT, 'schemas/visibility.schema.json');
}

function loadVisibility() {
  if (!existsSync(VISIBILITY_PATH)) throw new Error('Missing .product/visibility.yaml');
  const data = readYaml(VISIBILITY_PATH);
  if (!existsSync(visibilitySchemaPath())) return data;
  const result = validateData(data, visibilitySchemaPath());
  if (!result.ok) throw new Error(`visibility.yaml invalid: ${result.errors.map((e) => `${e.instancePath || '/'} ${e.message}`).join('; ')}`);
  return data;
}

function saveVisibility(data) {
  if (existsSync(visibilitySchemaPath())) {
    const result = validateData(data, visibilitySchemaPath());
    if (!result.ok) throw new Error(`visibility.yaml invalid: ${result.errors.map((e) => `${e.instancePath || '/'} ${e.message}`).join('; ')}`);
  }
  writeYaml(VISIBILITY_PATH, data);
}

function experienceDirs() {
  if (existsSync(resolve(ROOT, '.product/lab'))) {
    return {
      raw: resolve(ROOT, '.product/lab/experience-raw'),
      inbox: resolve(ROOT, '.product/lab/experience-inbox'),
    };
  }
  return {
    raw: resolve(ROOT, '.product/experience-raw'),
    inbox: resolve(ROOT, '.product/experience-inbox'),
  };
}

function privacyPatterns() {
  return [
    ['PRIVATE_KEY', /-----BEGIN [A-Z ]*PRIVATE KEY-----/i],
    ['CERTIFICATE', /-----BEGIN CERTIFICATE-----/i],
    ['OPENAI_KEY', /\bsk-[A-Za-z0-9_-]{20,}\b/],
    ['GITHUB_TOKEN', /\bgh[pousr]_[A-Za-z0-9]{20,}\b/],
    ['AWS_ACCESS_KEY', /\bAKIA[0-9A-Z]{16}\b/],
    ['SLACK_TOKEN', /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/],
    ['JWT', /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/],
    ['CREDENTIAL', /\b(password|passwd|secret|api[_-]?key|access[_-]?token|refresh[_-]?token)\b\s*[:=]\s*[^\s<]{8,}/i],
    ['EMAIL', /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i],
    ['GOV_ID', /\b\d{3}-\d{2}-\d{4}\b/],
    ['CLIENT_RECORD', /\b(?:client[_ -]?data|customer[_ -]?pii|social security number)\b/i],
    ['LOCAL_PATH', /\/(?:home|Users)\/[A-Za-z0-9._-]+\//],
  ];
}

function isAllowlistedEmail(match) {
  const domain = String(match.split('@')[1] || '').toLowerCase();
  return EMAIL_ALLOWLIST_DOMAINS.has(domain);
}

function privacyMatches(text) {
  const findings = [];
  for (const [name, rx] of privacyPatterns()) {
    const global = new RegExp(rx.source, rx.flags.includes('g') ? rx.flags : `${rx.flags}g`);
    const hits = [...String(text || '').matchAll(global)].map((m) => m[0]);
    const filtered = name === 'EMAIL' ? hits.filter((hit) => !isAllowlistedEmail(hit)) : hits;
    if (filtered.length) findings.push({ type: name, count: filtered.length, samples: filtered.slice(0, 3) });
  }
  return findings;
}

function redactPrivacy(text) {
  let out = String(text || '');
  const redactions = [];
  for (const [name, rx] of privacyPatterns()) {
    const global = new RegExp(rx.source, rx.flags.includes('g') ? rx.flags : `${rx.flags}g`);
    out = out.replace(global, (match) => {
      if (name === 'EMAIL' && isAllowlistedEmail(match)) return match;
      redactions.push(name);
      return `[REDACTED:${name}]`;
    });
  }
  const counts = {};
  for (const type of redactions) counts[type] = (counts[type] || 0) + 1;
  return { text: out, redactions: Object.entries(counts).map(([type, count]) => ({ type, count })) };
}

function requiredGitignoreChecks(text) {
  return [
    ['dotenv', /^\s*\.env(\.\*)?\s*$/m.test(text)],
    ['capabilities-local', text.includes('.product/capabilities.local.json')],
    ['experience-raw', text.includes('experience-raw')],
    ['experience-inbox', text.includes('experience-inbox')],
    ['credentials', /credentials\.json|\.pem/.test(text)],
  ];
}

function isGitWorkTree() {
  try {
    execFileSync('git', ['rev-parse', '--is-inside-work-tree'], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 5000,
    });
    return true;
  } catch {
    return false;
  }
}

function trackedExperienceBodies() {
  if (!isGitWorkTree()) return { git: false, files: [] };
  try {
    const output = execFileSync(
      'git',
      ['ls-files', '-z', '--', '.product/lab/experience-inbox', '.product/experience-inbox'],
      { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 10000 },
    );
    const files = String(output || '')
      .split('\0')
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((rel) => basename(rel) !== 'README.md');
    return { git: true, files };
  } catch (error) {
    return { git: true, files: [], error: error.message || String(error) };
  }
}

function isLegacyExperienceFilename(name) {
  return /^EXP-SAFE-[0-9a-f]{32}\.md$/.test(name);
}

function isLocalExperienceFilename(name) {
  return /^EXP-LOCAL-[0-9a-f]{32}\.md$/.test(name);
}

function isAdmittedExperienceFilename(name) {
  return isLocalExperienceFilename(name) || isLegacyExperienceFilename(name);
}

function isAdmittedExperienceStatus(status) {
  return status === 'LOCAL_SANITIZED' || status === 'REPOSITORY_SAFE';
}

function isLegacyExperienceArtifact(parsed, name) {
  return parsed?.data?.status === 'REPOSITORY_SAFE' || isLegacyExperienceFilename(name);
}

function npmPackageName(value, fallback) {
  const candidate = String(value).toLowerCase().normalize('NFKD').replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100);
  return candidate && candidate !== 'decision' ? candidate : fallback;
}

function productOsVersion() {
  try { return String(readJson(resolve(ROOT, 'package.json')).version || 'unknown'); }
  catch { return 'unknown'; }
}

function ideaPath(id) {
  if (!/^IDEA-[0-9]{4,}$/.test(id || '')) throw new Error('Idea id must look like IDEA-0001');
  return resolve(INCUBATOR_IDEAS_ROOT, id);
}

function listIdeaIds() {
  if (!existsSync(INCUBATOR_IDEAS_ROOT)) return [];
  return readdirSync(INCUBATOR_IDEAS_ROOT)
    .filter((name) => /^IDEA-[0-9]{4,}$/.test(name) && existsSync(resolve(INCUBATOR_IDEAS_ROOT, name, 'idea.yaml')))
    .sort();
}

function nextIdeaId() {
  const nums = listIdeaIds().map((id) => Number(id.slice(5))).filter(Number.isFinite);
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `IDEA-${String(next).padStart(4, '0')}`;
}

function loadIdea(id) {
  const dir = ideaPath(id);
  const path = resolve(dir, 'idea.yaml');
  if (!existsSync(path)) throw new Error(`Incubator idea not found: ${id}`);
  return readYaml(path);
}

function loadPromotionReadiness(id) {
  const path = resolve(ideaPath(id), 'promotion-readiness.yaml');
  if (!existsSync(path)) throw new Error(`Missing promotion-readiness.yaml for ${id}`);
  return readYaml(path);
}

function saveIdea(id, data) {
  data.updated_at = nowIso();
  writeYaml(resolve(ideaPath(id), 'idea.yaml'), data);
}

function savePromotionReadiness(id, data) {
  data.updated_at = nowIso();
  writeYaml(resolve(ideaPath(id), 'promotion-readiness.yaml'), data);
}

function ideaNew(flags) {
  if (!existsSync(INCUBATOR_TEMPLATE_ROOT)) throw new Error('This repository does not contain an Incubator template');
  const title = requireString(flags, 'title');
  const id = nextIdeaId();
  const dir = ideaPath(id);
  if (existsSync(dir)) throw new Error(`Idea directory already exists: ${id}`);
  cpSync(INCUBATOR_TEMPLATE_ROOT, dir, { recursive: true, force: false, errorOnExist: true });
  const timestamp = nowIso();
  const idea = readYaml(resolve(dir, 'idea.yaml'));
  idea.id = id;
  idea.title = title;
  idea.status = 'INBOX';
  idea.hypothesis.user = typeof flags.user === 'string' ? flags.user : '';
  idea.hypothesis.problem = typeof flags.problem === 'string' ? flags.problem : '';
  idea.hypothesis.solution = typeof flags.solution === 'string' ? flags.solution : '';
  idea.created_at = timestamp;
  idea.updated_at = timestamp;
  writeYaml(resolve(dir, 'idea.yaml'), idea);
  const readiness = readYaml(resolve(dir, 'promotion-readiness.yaml'));
  readiness.idea_id = id;
  readiness.updated_at = timestamp;
  writeYaml(resolve(dir, 'promotion-readiness.yaml'), readiness);
  console.log(`${id} created at ${relative(ROOT, dir)}`);
  console.log(`Title: ${title}`);
  return id;
}

function ideaStatus(id) {
  if (!id) {
    const ids = listIdeaIds();
    if (!ids.length) { console.log('No incubator ideas yet.'); return; }
    for (const item of ids) {
      const idea = loadIdea(item);
      let readiness = null;
      try { readiness = loadPromotionReadiness(item); } catch {}
      console.log(`${item}  ${String(idea.status).padEnd(11)}  ${String(readiness?.recommendation || '-').padEnd(13)}  ${idea.title}`);
    }
    return;
  }
  const idea = loadIdea(id);
  const readiness = loadPromotionReadiness(id);
  console.log(`${id} — ${idea.title}`);
  console.log(`Status:          ${idea.status}`);
  console.log(`Recommendation:  ${readiness.recommendation}`);
  console.log(`Verifier:        ${readiness.verifier.status}`);
  console.log(`Blocking gaps:   ${readiness.verifier.blocking_gaps.length}`);
  console.log(`Human approval:  ${readiness.human_approval.status}`);
  console.log(`Problem score:   ${idea.confidence.problem}`);
  console.log(`Evidence score:  ${idea.confidence.evidence}`);
  console.log(`Overall score:   ${idea.confidence.overall}`);
  if (readiness.product) console.log(`Promoted product: ${readiness.product.name} (${readiness.product.repository_basename})`);
}

function markdownHasContent(path, minimum = 40) {
  if (!existsSync(path)) return false;
  const text = readFileSync(path, 'utf8')
    .replace(/<!--[^]*?-->/g, '')
    .replace(/^\s*#{1,6}\s+.*$/gm, '')
    .replace(/^\s*[-*+]\s*$/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length >= minimum;
}

function decisionLogPathForId(id) {
  if (!/^DEC-[0-9]{4,}$/.test(id || '')) return null;
  const dir = resolve(ROOT, 'product/09-decisions');
  if (!existsSync(dir)) return null;
  const matches = readdirSync(dir).filter((name) => name.startsWith(`${id}-`) && name.endsWith('.md'));
  if (matches.length !== 1) return null;
  return resolve(dir, matches[0]);
}

function validatedPromotionDecision(id) {
  if (!id) return null;
  const path = decisionLogPathForId(id);
  if (!path) throw new Error(`linked promotion decision not found or ambiguous: ${id}`);
  const parsed = parseFrontmatter(path);
  if (parsed.error) throw new Error(`linked promotion decision ${id} is invalid: ${parsed.error}`);
  const validation = validateData(parsed.data, resolve(ROOT, 'schemas/decision.schema.json'));
  if (!validation.ok) throw new Error(`linked promotion decision ${id} failed schema validation`);
  if (parsed.data.status !== 'ACCEPTED') throw new Error(`linked promotion decision ${id} must be ACCEPTED`);
  if (parsed.data.decision !== 'PROMOTE') throw new Error(`linked promotion decision ${id} must record decision: PROMOTE`);
  if (parsed.data.human_approval_required !== true || parsed.data.human_approved !== true) {
    throw new Error(`linked promotion decision ${id} must contain explicit human approval`);
  }
  return { id, path, metadata: parsed.data };
}

const PROMOTION_REQUIRED_ARTIFACTS = [
  'problem.md',
  'evidence.md',
  'market.md',
  'competitors.md',
  'value-proposition.md',
  'evaluation.md',
];

function promotionPreflight(id, destination = null) {
  const errors = [];
  const warnings = [];
  if (!existsSync(PRODUCT_TEMPLATE_ROOT)) errors.push('missing templates/product-repository');
  let idea;
  let readiness;
  try { idea = loadIdea(id); } catch (error) { errors.push(error.message); return { ok: false, errors, warnings }; }
  try { readiness = loadPromotionReadiness(id); } catch (error) { errors.push(error.message); return { ok: false, errors, warnings, idea }; }

  const ideaValidation = validateData(idea, resolve(ROOT, 'schemas/idea.schema.json'));
  if (!ideaValidation.ok) errors.push(...ideaValidation.errors.map((e) => `idea.yaml ${e.instancePath || '/'} ${e.message}`));
  const readinessValidation = validateData(readiness, resolve(ROOT, 'schemas/promotion-readiness.schema.json'));
  if (!readinessValidation.ok) errors.push(...readinessValidation.errors.map((e) => `promotion-readiness.yaml ${e.instancePath || '/'} ${e.message}`));

  if (!['EVALUATING', 'PROMOTE'].includes(idea.status)) errors.push(`idea status must be EVALUATING or PROMOTE, found ${idea.status}`);
  if (!String(idea.hypothesis.user || '').trim()) errors.push('target user hypothesis is empty');
  if (!String(idea.hypothesis.problem || '').trim()) errors.push('problem hypothesis is empty');
  if (readiness.idea_id !== id) errors.push(`promotion readiness idea_id mismatch: ${readiness.idea_id}`);
  if (readiness.product) errors.push(`idea is already promoted to ${readiness.product.name} (${readiness.product.repository_basename})`);
  if (readiness.recommendation !== 'PROMOTE') errors.push(`promotion recommendation must be PROMOTE, found ${readiness.recommendation}`);
  if (readiness.verifier.status !== 'PASS') errors.push(`verifier status must be PASS, found ${readiness.verifier.status}`);
  if (readiness.verifier.status === 'PASS' && !readiness.verifier.reviewed_at) errors.push('verifier PASS requires reviewed_at');
  if (readiness.verifier.blocking_gaps.length) errors.push(`verifier reports ${readiness.verifier.blocking_gaps.length} blocking gap(s)`);

  const dir = ideaPath(id);
  for (const name of PROMOTION_REQUIRED_ARTIFACTS) {
    const path = resolve(dir, name);
    if (!existsSync(path)) errors.push(`missing incubator artifact: ${name}`);
    else if (!markdownHasContent(path)) errors.push(`incubator artifact is still placeholder/too thin: ${name}`);
  }

  if (readiness.human_approval.status === 'APPROVED') warnings.push('PROMOTE human approval is already recorded for this idea');
  else warnings.push('PROMOTE human approval is not yet recorded; the promote command requires --human-approved');

  if (destination) {
    const target = resolve(destination);
    if (pathIsInside(ROOT, target)) errors.push('destination must be outside the Product OS repository so the promoted product is independent');
    if (existsSync(target)) errors.push(`destination already exists: ${target}`);
  }
  return { ok: errors.length === 0, errors, warnings, idea, readiness };
}

function promoteCheck(id, flags) {
  const destination = typeof flags.destination === 'string' ? flags.destination : null;
  const result = promotionPreflight(id, destination);
  console.log(`${id} promotion readiness: ${result.ok ? 'READY FOR HUMAN-GATED PROMOTION' : 'BLOCKED'}`);
  for (const warning of result.warnings) console.log(`WARN ${warning}`);
  for (const error of result.errors) console.log(`FAIL ${error}`);
  if (!result.ok) process.exitCode = 1;
  return result.ok;
}

function safeIdeaArtifactFiles(dir) {
  const out = [];
  function walk(current) {
    for (const name of readdirSync(current)) {
      const path = resolve(current, name);
      const stat = lstatSync(path);
      if (stat.isSymbolicLink()) throw new Error(`Symlinks are not allowed in incubator promotion snapshots: ${relative(dir, path)}`);
      if (stat.isDirectory()) walk(path);
      else if (stat.isFile()) out.push(path);
    }
  }
  walk(dir);
  return out.sort();
}

function sha256File(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function copyImportedMarkdown(source, destination, ideaId) {
  mkdirSync(dirname(destination), { recursive: true });
  const provenance = `<!-- Imported from Incubator ${ideaId} during human-approved promotion. This inherited artifact is evidence/input, not proof that a Product Repository gate has passed. Canonical source snapshot: product/00-origin/incubator/${basename(source)} -->\n\n`;
  writeFileSync(destination, provenance + readFileSync(source, 'utf8'), 'utf8');
}

function customizePromotedRepository(staging, id, idea, readiness, productName, productId, approvedBy, approvedAt, decisionId, promotionDecision = null) {
  const sourceDir = ideaPath(id);
  const originSnapshot = resolve(staging, 'product/00-origin/incubator');
  mkdirSync(originSnapshot, { recursive: true });
  const sourceFiles = safeIdeaArtifactFiles(sourceDir);
  for (const source of sourceFiles) {
    const rel = relative(sourceDir, source);
    const target = resolve(originSnapshot, rel);
    mkdirSync(dirname(target), { recursive: true });
    cpSync(source, target, { force: false, errorOnExist: true });
  }

  let decisionArtifact = null;
  if (promotionDecision) {
    const decisionDir = resolve(staging, 'product/00-origin/decision');
    mkdirSync(decisionDir, { recursive: true });
    const decisionTarget = resolve(decisionDir, basename(promotionDecision.path));
    cpSync(promotionDecision.path, decisionTarget, { force: false, errorOnExist: true });
    decisionArtifact = {
      id: promotionDecision.id,
      path: relative(staging, decisionTarget).replaceAll('\\', '/'),
      sha256: sha256File(promotionDecision.path),
      bytes: statSync(promotionDecision.path).size,
    };
  }

  const mappings = [
    ['problem.md', 'product/01-discovery/problem.md'],
    ['evidence.md', 'product/01-discovery/evidence.md'],
    ['market.md', 'product/02-market/market.md'],
    ['competitors.md', 'product/02-market/competitors.md'],
    ['alternatives.md', 'product/02-market/alternatives.md'],
    ['value-proposition.md', 'product/04-strategy/value-proposition.md'],
  ].filter(([source]) => existsSync(resolve(sourceDir, source)) && markdownHasContent(resolve(sourceDir, source), source === 'alternatives.md' ? 20 : 40));
  for (const [source, destination] of mappings) copyImportedMarkdown(resolve(sourceDir, source), resolve(staging, destination), id);

  const statePath = resolve(staging, '.product/state.yaml');
  const state = readYaml(statePath);
  state.product.id = productId;
  state.product.name = productName;
  state.product.stage = 'DISCOVERY';
  state.product.status = 'ACTIVE';
  state.current_gate = 'G1_PROBLEM';
  state.confidence.problem = Number(idea.confidence.problem || 0);
  state.confidence.opportunity = Number(((Number(idea.confidence.evidence || 0) + Number(idea.confidence.differentiation || 0)) / 2).toFixed(3));
  state.confidence.solution = 0;
  state.confidence.feasibility = Number(idea.confidence.feasibility || 0);
  state.assumptions.critical = idea.open_questions.map((question, index) => ({ id: `ASM-${String(index + 1).padStart(3, '0')}`, statement: question, status: 'OPEN' }));
  state.decisions.latest = null;
  state.build.allowed = false;
  state.release.allowed = false;
  writeYaml(statePath, state);

  const packagePath = resolve(staging, 'package.json');
  const pkg = readJson(packagePath);
  pkg.name = npmPackageName(productName, `product-${id.slice(5).toLowerCase()}`);
  pkg.description = `Product repository for ${productName}, promoted from Cursor Product OS ${id}.`;
  writeJson(packagePath, pkg);

  const readmePath = resolve(staging, 'README.md');
  const existingReadme = readFileSync(readmePath, 'utf8');
  const readme = existingReadme.replace(/^# Product Repository — Cursor Product OS/, `# ${productName}`)
    .replace('This repository template is generated from Cursor Product OS after a product is promoted from the Incubator.', `This product was promoted from Cursor Product OS Incubator ${id}.`);
  writeFileSync(readmePath, readme, 'utf8');

  const artifacts = sourceFiles.map((path) => ({
    path: relative(sourceDir, path).replaceAll('\\', '/'),
    sha256: sha256File(path),
    bytes: statSync(path).size,
  }));
  const origin = {
    schema_version: 1,
    product: { id: productId, name: productName },
    source: {
      idea_id: id,
      idea_title: idea.title,
      source_path: `incubator/ideas/${id}`,
      product_os_version: productOsVersion(),
    },
    promotion: { approved_by: approvedBy, approved_at: approvedAt, decision_id: decisionId },
    decision_artifact: decisionArtifact,
    artifacts,
    mapped_artifacts: mappings.map(([source, destination]) => ({ source, destination })),
    initial_state: { stage: 'DISCOVERY', current_gate: 'G1_PROBLEM', build_allowed: false, release_allowed: false },
  };
  writeYaml(resolve(staging, '.product/origin.yaml'), origin);
  writeYaml(resolve(staging, '.product/visibility.yaml'), defaultVisibility('PRODUCT'));
  const report = `# Promotion origin\n\n- Source idea: **${id} — ${idea.title}**\n- Human approval: **${approvedBy}** at ${approvedAt}\n- Promotion decision: ${decisionId || 'not linked to a DEC record'}\n- Decision snapshot: ${decisionArtifact ? `\`${decisionArtifact.path}\`` : 'none'}\n- Initial stage: **DISCOVERY**\n- Initial gate: **G1_PROBLEM**\n- Build allowed: **false**\n- Release allowed: **false**\n- Visibility: **PRIVATE** (PUBLIC is a separate human-gated action; promotion does not create a remote)\n\nIncubator artifacts are preserved byte-for-byte under \`product/00-origin/incubator/\`. Selected artifacts are also copied into Product Repository working locations with a provenance warning. Promotion does not imply later gates are passed and does not imply PUBLIC visibility.\n`;
  writeFileSync(resolve(staging, 'product/00-origin/PROMOTION.md'), report, 'utf8');

  const stateValidation = validateYaml(statePath, resolve(ROOT, 'schemas/state.schema.json'));
  if (!stateValidation.ok) throw new Error(`promoted state failed schema validation: ${stateValidation.errors.map((e) => `${e.instancePath || '/'} ${e.message}`).join('; ')}`);
  const originValidation = validateYaml(resolve(staging, '.product/origin.yaml'), resolve(ROOT, 'schemas/product-origin.schema.json'));
  if (!originValidation.ok) throw new Error(`product origin failed schema validation: ${originValidation.errors.map((e) => `${e.instancePath || '/'} ${e.message}`).join('; ')}`);
  const visibilityValidation = validateYaml(resolve(staging, '.product/visibility.yaml'), resolve(ROOT, 'schemas/visibility.schema.json'));
  if (!visibilityValidation.ok) throw new Error(`product visibility failed schema validation: ${visibilityValidation.errors.map((e) => `${e.instancePath || '/'} ${e.message}`).join('; ')}`);
  for (const required of ['AGENTS.md', '.cursor/hooks.json', '.cursor/agents/problem-analyst.md', '.cursor/skills/intake-idea/SKILL.md', 'scripts/product-os.mjs']) {
    if (!existsSync(resolve(staging, required))) throw new Error(`promoted repository missing runtime file: ${required}`);
  }
  return origin;
}

function promoteIdea(id, flags) {
  const destinationArg = requireString(flags, 'destination');
  const destination = resolve(destinationArg);
  const productName = typeof flags.name === 'string' ? flags.name.trim() : loadIdea(id).title.trim();
  if (!productName) throw new Error('Product name is empty; pass --name <product name>');
  const approvedBy = requireString(flags, 'approved-by');
  if (flags['human-approved'] !== true) throw new Error('PROMOTE requires explicit --human-approved');
  const preflight = promotionPreflight(id, destination);
  if (!preflight.ok) throw new Error(`Promotion blocked:\n${preflight.errors.map((e) => `- ${e}`).join('\n')}`);

  const idea = preflight.idea;
  const readiness = preflight.readiness;
  const decisionCandidate = typeof flags['decision-id'] === 'string' ? flags['decision-id'] : idea.decision.latest;
  const decisionId = /^DEC-[0-9]{4,}$/.test(decisionCandidate || '') ? decisionCandidate : null;
  const promotionDecision = decisionId ? validatedPromotionDecision(decisionId) : null;
  const ideaNumber = id.slice(5);
  const productId = typeof flags['product-id'] === 'string' ? flags['product-id'] : `PRODUCT-${ideaNumber}`;
  const approvedAt = nowIso();

  // Keep Incubator source state unchanged until the promoted repository is fully staged,
  // validated, optionally Git-initialized, and atomically renamed into place. This makes
  // promotion rollback cover both destination filesystem state and source lifecycle state.
  const approvedReadiness = structuredClone(readiness);
  approvedReadiness.human_approval = { status: 'APPROVED', approved_by: approvedBy, approved_at: approvedAt, decision_id: decisionId };
  const promotedIdea = structuredClone(idea);
  promotedIdea.status = 'PROMOTE';

  mkdirSync(dirname(destination), { recursive: true });
  const staging = mkdtempSync(join(dirname(destination), `.product-os-promote-${slugify(productName)}-`));
  let completed = false;
  try {
    cpSync(PRODUCT_TEMPLATE_ROOT, staging, { recursive: true, force: false });
    customizePromotedRepository(staging, id, promotedIdea, approvedReadiness, productName, productId, approvedBy, approvedAt, decisionId, promotionDecision);

    if (flags['skip-git-init'] !== true) {
      const git = commandAvailable('git');
      if (!git.available) throw new Error('Git is unavailable; use --skip-git-init only if you intentionally do not want repository initialization');
      try {
        execFileSync('git', ['init', '-b', 'main'], { cwd: staging, stdio: ['ignore', 'pipe', 'pipe'], timeout: 10000 });
      } catch {
        execFileSync('git', ['init'], { cwd: staging, stdio: ['ignore', 'pipe', 'pipe'], timeout: 10000 });
      }
    }

    if (existsSync(destination)) throw new Error(`destination appeared during promotion: ${destination}`);
    renameSync(staging, destination);
    completed = true;

    approvedReadiness.product = { id: productId, name: productName, repository_basename: basename(destination), promoted_at: approvedAt };
    saveIdea(id, promotedIdea);
    savePromotionReadiness(id, approvedReadiness);
    console.log(`${id}: PROMOTED`);
    console.log(`Product:      ${productId} — ${productName}`);
    console.log(`Destination:  ${destination}`);
    console.log(`Initial gate: G1_PROBLEM`);
    console.log('Build:        BLOCKED until G4 + human approval');
    console.log('Release:      BLOCKED until G5 + human approval');
    console.log('Visibility:   PRIVATE (PUBLIC is a separate human-gated action)');
    console.log('Remote:       not created');
  } finally {
    if (!completed && existsSync(staging)) rmSync(staging, { recursive: true, force: true });
  }
}

function readState() {
  if (!existsSync(STATE_PATH)) throw new Error('Missing .product/state.yaml');
  return readYaml(STATE_PATH);
}

function readCouncilPolicy() {
  if (!existsSync(COUNCIL_POLICY_PATH)) throw new Error('Missing .product/council-policy.yaml');
  return readYaml(COUNCIL_POLICY_PATH);
}

function councilPath(id) {
  return resolve(COUNCIL_ROOT, id);
}

function councilYamlPath(id) {
  return resolve(councilPath(id), 'council.yaml');
}

function assertDecisionId(id) {
  if (!/^DEC-[0-9]{4,}$/.test(id || '')) throw new Error('Decision id must look like DEC-0001');
  return id;
}

function listDecisionIds() {
  const ids = new Set();
  if (existsSync(COUNCIL_ROOT)) {
    for (const name of readdirSync(COUNCIL_ROOT)) if (/^DEC-[0-9]{4,}$/.test(name)) ids.add(name);
  }
  const logDir = resolve(ROOT, 'product/09-decisions');
  if (existsSync(logDir)) {
    for (const name of readdirSync(logDir)) {
      const m = name.match(/^(DEC-[0-9]{4,})/);
      if (m) ids.add(m[1]);
    }
  }
  return [...ids].sort();
}

function nextDecisionId() {
  const nums = listDecisionIds().map((id) => Number(id.slice(4))).filter(Number.isFinite);
  if (existsSync(STATE_PATH)) {
    const latest = readYaml(STATE_PATH)?.decisions?.latest;
    if (/^DEC-[0-9]{4,}$/.test(latest || '')) nums.push(Number(latest.slice(4)));
  }
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `DEC-${String(next).padStart(4, '0')}`;
}

function suggestedMembers(type) {
  const map = {
    product: ['product-manager', 'business-analyst', 'devils-advocate'],
    strategy: ['product-manager', 'business-analyst', 'market-researcher', 'devils-advocate'],
    ux: ['ux-strategist', 'product-manager', 'devils-advocate'],
    architecture: ['tech-lead', 'product-manager', 'devils-advocate'],
    security: ['tech-lead', 'product-manager', 'devils-advocate'],
    release: ['tech-lead', 'product-manager', 'devils-advocate'],
    other: ['product-manager', 'devils-advocate'],
  };
  return map[type] ?? map.other;
}

function createCouncil(flags) {
  const title = requireString(flags, 'title');
  const question = requireString(flags, 'question');
  const type = String(flags.type || 'other').toLowerCase();
  if (!['product', 'strategy', 'ux', 'architecture', 'security', 'release', 'other'].includes(type)) throw new Error('Invalid --type');
  const impact = enumValue(flags.impact || 'MEDIUM', ['LOW', 'MEDIUM', 'HIGH'], '--impact');
  const reversibility = enumValue(flags.reversibility || 'MEDIUM', ['LOW', 'MEDIUM', 'HIGH'], '--reversibility');
  const evidenceQuality = enumValue(flags['evidence-quality'] || 'UNKNOWN', ['UNKNOWN', 'LOW', 'MEDIUM', 'HIGH'], '--evidence-quality');
  const options = flagValues(flags, 'option').map(String).filter(Boolean);
  if (options.length < 2) throw new Error('Provide at least two --option values');
  if (new Set(options).size !== options.length) throw new Error('--option values must be unique');

  const id = nextDecisionId();
  const state = readState();
  const policy = readCouncilPolicy();
  const approvalAction = typeof flags['approval-action'] === 'string' ? String(flags['approval-action']).toUpperCase() : null;
  const humanApproval = Boolean(approvalAction || flags['human-approval'] === true);
  const confidence = flags.confidence && flags.confidence !== true ? Number(flags.confidence) : null;
  if (confidence !== null && (!Number.isFinite(confidence) || confidence < 0 || confidence > 1)) throw new Error('--confidence must be between 0 and 1');

  const triggers = flagValues(flags, 'trigger').map(String);
  if (impact === 'HIGH' && reversibility === 'LOW' && !triggers.includes('HIGH_IMPACT_LOW_REVERSIBILITY')) triggers.push('HIGH_IMPACT_LOW_REVERSIBILITY');
  if (humanApproval && !triggers.includes('HUMAN_GATED_TRANSITION')) triggers.push('HUMAN_GATED_TRANSITION');
  if (confidence !== null && confidence < policy.decision_council.confidence_below && !triggers.includes('LOW_CONFIDENCE')) triggers.push('LOW_CONFIDENCE');

  const timestamp = nowIso();
  const data = {
    schema_version: 1,
    id,
    title,
    question,
    type,
    status: 'OPEN',
    stage: state.product.stage,
    impact,
    reversibility,
    evidence_quality: evidenceQuality,
    options,
    human_approval_required: humanApproval,
    approval_action: approvalAction,
    confidence,
    members: suggestedMembers(type),
    verifier: 'verifier',
    triggers,
    external_advisor: {
      policy: policy.codex.mode,
      status: 'NOT_REQUESTED',
      detail: null,
      last_attempt_at: null,
    },
    final_decision: null,
    final_decision_path: null,
    created_at: timestamp,
    updated_at: timestamp,
  };

  const dir = councilPath(id);
  mkdirSync(resolve(dir, 'opinions'), { recursive: true });
  writeYaml(resolve(dir, 'council.yaml'), data);
  writeFileSync(resolve(dir, 'context.md'), `# ${id} — Context packet\n\n## Decision question\n\n${question}\n\n## Options\n\n${options.map((x) => `- ${x}`).join('\n')}\n\n## FACTS / EVIDENCE\n\n<!-- Add source-backed facts and evidence only. -->\n\n## ASSUMPTIONS / INFERENCES\n\n<!-- Keep unverified beliefs separate from evidence. -->\n\n## Constraints\n\n## Known unknowns\n`, 'utf8');
  writeFileSync(resolve(dir, 'opinions/README.md'), `# Independent council opinions\n\nExpected suggested members: ${data.members.join(', ')}.\n\nSave each independent opinion as \`<agent-name>.md\` before reading other member opinions.\n`, 'utf8');
  writeFileSync(resolve(dir, 'internal-synthesis.md'), '# Internal synthesis\n\n## Agreements\n\n## Disagreements\n\n## Hidden assumptions\n\n## Missing evidence\n\n## Reversibility analysis\n\n## Preliminary recommendation\n\n## Strongest counterargument\n\n## Confidence\n\n', 'utf8');
  writeFileSync(resolve(dir, 'verification.md'), '# Verifier review\n\n## Evidence fidelity\n\n## Opinion fidelity\n\n## Unresolved contradictions\n\n## Governance check\n\n## Verdict\n\n', 'utf8');
  writeFileSync(resolve(dir, 'final-recommendation.md'), '# Final recommendation\n\n## Recommendation\n\n## Evidence\n\n## Open assumptions\n\n## Strongest counterargument\n\n## Confidence\n\n## Human approval\n\n', 'utf8');

  console.log(`${id} created at ${relative(ROOT, dir)}`);
  console.log(`Suggested members: ${data.members.join(', ')}`);
  if (humanApproval) console.log(`Human approval: REQUIRED (${approvalAction || 'decision'})`);
  return id;
}

function loadCouncil(id) {
  assertDecisionId(id);
  const path = councilYamlPath(id);
  if (!existsSync(path)) throw new Error(`Council workspace not found: ${id}`);
  return readYaml(path);
}

function saveCouncil(id, data) {
  data.updated_at = nowIso();
  writeYaml(councilYamlPath(id), data);
}

function updateCouncil(id, flags) {
  const c = loadCouncil(id);
  if (flags.status && flags.status !== true) {
    const next = enumValue(flags.status, ['OPEN', 'SYNTHESIZED', 'VERIFIED', 'RECOMMENDED', 'CANCELLED'], '--status');
    c.status = next;
  }
  if (flags['evidence-quality'] && flags['evidence-quality'] !== true) {
    c.evidence_quality = enumValue(flags['evidence-quality'], ['UNKNOWN', 'LOW', 'MEDIUM', 'HIGH'], '--evidence-quality');
  }
  if (flags.confidence && flags.confidence !== true) {
    const value = Number(flags.confidence);
    if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error('--confidence must be between 0 and 1');
    c.confidence = value;
  }
  for (const trigger of flagValues(flags, 'trigger').map(String)) {
    if (!c.triggers.includes(trigger)) c.triggers.push(trigger);
  }
  saveCouncil(id, c);
  const validation = validateYaml(councilYamlPath(id), resolve(ROOT, 'schemas/council.schema.json'));
  if (!validation.ok) throw new Error(`Updated council metadata is invalid: ${validation.errors.map((e) => `${e.instancePath || '/'} ${e.message}`).join('; ')}`);
  console.log(`${id}: updated — status=${c.status}, evidence=${c.evidence_quality}, confidence=${c.confidence ?? '-'}`);
}

function councilStatus(id) {
  if (!id) {
    const ids = listDecisionIds();
    if (!ids.length) {
      console.log('No Decision Council workspaces yet.');
      return;
    }
    for (const item of ids) {
      if (!existsSync(councilYamlPath(item))) continue;
      const c = loadCouncil(item);
      console.log(`${item}  ${c.status.padEnd(11)}  ${c.impact}/${c.reversibility}  ${c.title}`);
    }
    return;
  }
  const c = loadCouncil(id);
  console.log(`${c.id} — ${c.title}`);
  console.log(`Question:       ${c.question}`);
  console.log(`Status:         ${c.status}`);
  console.log(`Stage:          ${c.stage}`);
  console.log(`Impact:         ${c.impact}`);
  console.log(`Reversibility:  ${c.reversibility}`);
  console.log(`Evidence:       ${c.evidence_quality}`);
  console.log(`Confidence:     ${c.confidence ?? '-'}`);
  console.log(`Options:        ${c.options.join(' | ')}`);
  console.log(`Members:        ${c.members.join(', ')}`);
  console.log(`Codex:          ${c.external_advisor.status}${c.external_advisor.detail ? ` — ${c.external_advisor.detail}` : ''}`);
  console.log(`Human approval: ${c.human_approval_required ? `REQUIRED (${c.approval_action || 'decision'})` : 'not required by this record'}`);
  if (c.final_decision) console.log(`Final decision: ${c.final_decision}`);
}

function validateCouncil(id) {
  const path = councilYamlPath(id);
  const result = validateYaml(path, resolve(ROOT, 'schemas/council.schema.json'));
  if (!result.ok) {
    console.log(`FAIL ${id} council metadata`);
    console.log(formatValidationErrors(result.errors));
    process.exitCode = 1;
    return false;
  }

  const requiredFiles = ['context.md', 'internal-synthesis.md', 'verification.md', 'final-recommendation.md'];
  const missing = requiredFiles.filter((name) => !existsSync(resolve(councilPath(id), name)));
  if (missing.length) {
    console.log(`FAIL ${id} workspace files: ${missing.join(', ')}`);
    process.exitCode = 1;
    return false;
  }
  console.log(`OK   ${id} council workspace`);
  return true;
}

function doctor() {
  const required = [
    ['Node', commandAvailable('node')],
    ['Git', commandAvailable('git')],
    ['Cursor rules', { available: existsSync(resolve(ROOT, '.cursor/rules')), detail: '.cursor/rules' }],
    ['Cursor agents', { available: existsSync(resolve(ROOT, '.cursor/agents/problem-analyst.md')), detail: '.cursor/agents (9 specialists)' }],
    ['Cursor skills', { available: existsSync(resolve(ROOT, '.cursor/skills/intake-idea/SKILL.md')), detail: '.cursor/skills (10 workflows)' }],
    ['State schema', { available: existsSync(resolve(ROOT, 'schemas/state.schema.json')), detail: 'schemas/state.schema.json' }],
    ['Gate schema', { available: existsSync(resolve(ROOT, 'schemas/gate.schema.json')), detail: 'schemas/gate.schema.json' }],
    ['Council policy', { available: existsSync(COUNCIL_POLICY_PATH), detail: '.product/council-policy.yaml' }],
    ['Council schema', { available: existsSync(resolve(ROOT, 'schemas/council.schema.json')), detail: 'schemas/council.schema.json' }],
    ['Codex schema', { available: existsSync(resolve(ROOT, 'schemas/codex-advisor-response.schema.json')), detail: 'schemas/codex-advisor-response.schema.json' }],
    ['Project hooks', { available: existsSync(HOOKS_CONFIG_PATH), detail: '.cursor/hooks.json' }],
    ['Artifact policy', { available: existsSync(ARTIFACT_POLICY_PATH), detail: '.product/artifact-policy.json' }],
  ];
  const optional = [
    ['Codex CLI', commandAvailable('codex')],
    ['GitHub CLI', commandAvailable('gh')],
  ];

  console.log('Cursor Product OS Doctor\n');
  for (const [name, result] of required) console.log(`${result.available ? 'OK ' : 'ERR'} ${name.padEnd(16)} ${result.detail}`);
  console.log('\nOptional capabilities');
  for (const [name, result] of optional) console.log(`${result.available ? 'YES' : ' - '} ${name.padEnd(16)} ${result.detail}`);

  if (required.some(([, r]) => !r.available)) {
    console.error('\nSystem is not ready: a required capability is missing.');
    process.exitCode = 1;
  } else {
    console.log('\nSystem ready. Optional capabilities do not affect readiness.');
  }
}

function status() {
  const state = readState();
  console.log(`Product:      ${state.product.name} (${state.product.id})`);
  console.log(`Stage:        ${state.product.stage}`);
  console.log(`Status:       ${state.product.status}`);
  console.log(`Current gate: ${state.current_gate}`);
  console.log(`Build:        ${state.build.allowed ? 'ALLOWED' : 'BLOCKED'}`);
  console.log(`Release:      ${state.release.allowed ? 'ALLOWED' : 'BLOCKED'}`);
  console.log(`Latest DEC:   ${state.decisions.latest ?? '-'}`);
  const open = state.assumptions.critical.filter((a) => a.status === 'OPEN');
  console.log(`Open critical assumptions: ${open.length}`);
  for (const item of open) console.log(`  - ${item.id}: ${item.statement}`);
}

function validateStateReferences() {
  const errors = [];
  const state = readState();
  const gateConfig = readYaml(GATES_PATH);
  const current = gateConfig.gates.find((g) => g.id === state.current_gate);
  if (!current) {
    errors.push(`current gate is not defined: ${state.current_gate}`);
  } else {
    for (const artifact of current.required_artifacts || []) {
      if (!existsSync(resolve(ROOT, artifact))) errors.push(`current gate ${state.current_gate} missing required artifact: ${artifact}`);
    }
  }

  if (state.decisions.latest !== null) {
    const decisionPath = decisionLogPathForId(state.decisions.latest);
    if (!decisionPath) {
      errors.push(`state.decisions.latest does not resolve to exactly one decision record: ${state.decisions.latest}`);
    } else {
      const parsed = parseFrontmatter(decisionPath);
      if (parsed.error) errors.push(`${state.decisions.latest}: ${parsed.error}`);
      else {
        const result = validateData(parsed.data, resolve(ROOT, 'schemas/decision.schema.json'));
        if (!result.ok) errors.push(`${state.decisions.latest}: decision record failed schema validation`);
      }
    }
  }
  return { ok: errors.length === 0, errors };
}

function validateDecisionLogs() {
  const dir = resolve(ROOT, 'product/09-decisions');
  if (!existsSync(dir)) return { ok: true, count: 0, errors: [] };
  const errors = [];
  let count = 0;
  for (const file of readdirSync(dir)) {
    if (!file.startsWith('DEC-') || !file.endsWith('.md')) continue;
    count += 1;
    const path = resolve(dir, file);
    const parsed = parseFrontmatter(path);
    if (parsed.error) { errors.push(`${file}: ${parsed.error}`); continue; }
    const result = validateData(parsed.data, resolve(ROOT, 'schemas/decision.schema.json'));
    if (!result.ok) errors.push(`${file}: ${result.errors.map((e) => `${e.instancePath || '/'} ${e.message}`).join('; ')}`);
  }
  return { ok: errors.length === 0, count, errors };
}

function validateAll() {
  const targets = [
    [STATE_PATH, resolve(ROOT, 'schemas/state.schema.json'), 'state', true],
    [GATES_PATH, resolve(ROOT, 'schemas/gate.schema.json'), 'gates', true],
    [COUNCIL_POLICY_PATH, resolve(ROOT, 'schemas/council-policy.schema.json'), 'council policy', true],
    [resolve(ROOT, 'incubator/_template/idea.yaml'), resolve(ROOT, 'schemas/idea.schema.json'), 'idea template', false],
    [resolve(ROOT, 'incubator/_template/promotion-readiness.yaml'), resolve(ROOT, 'schemas/promotion-readiness.schema.json'), 'promotion readiness template', false],
    [resolve(ROOT, '.product/origin.yaml'), resolve(ROOT, 'schemas/product-origin.schema.json'), 'product origin', false],
  ];
  let allOk = true;
  for (const [yamlPath, schemaPath, label, required] of targets) {
    if (!existsSync(yamlPath) || !existsSync(schemaPath)) {
      console.log(`SKIP ${label}: missing file`);
      if (required) allOk = false;
      continue;
    }
    const result = validateYaml(yamlPath, schemaPath);
    if (result.ok) console.log(`OK   ${label}`);
    else {
      allOk = false;
      console.log(`FAIL ${label}`);
      console.log(formatValidationErrors(result.errors));
    }
  }

  if (!existsSync(ARTIFACT_POLICY_PATH) || !existsSync(resolve(ROOT, 'schemas/artifact-policy.schema.json'))) {
    allOk = false;
    console.log('FAIL artifact policy: missing file/schema');
  } else {
    const artifactPolicy = validateData(readJson(ARTIFACT_POLICY_PATH), resolve(ROOT, 'schemas/artifact-policy.schema.json'));
    if (artifactPolicy.ok) console.log('OK   artifact policy');
    else {
      allOk = false;
      console.log('FAIL artifact policy');
      console.log(formatValidationErrors(artifactPolicy.errors));
    }
  }

  const hooksRuntime = validateHooksRuntime();
  if (hooksRuntime.ok) console.log('OK   Phase 8 hooks runtime');
  else {
    allOk = false;
    console.log('FAIL Phase 8 hooks runtime');
    for (const error of hooksRuntime.errors) console.log(`  - ${error}`);
  }

  const customization = validateCursorCustomization();
  if (customization.ok) console.log(`OK   Cursor customization (${customization.agentCount} agents, ${customization.skillCount} skills)`);
  else {
    allOk = false;
    console.log('FAIL Cursor customization');
    for (const error of customization.errors) console.log(`  - ${error}`);
  }

  const councilIds = existsSync(COUNCIL_ROOT) ? readdirSync(COUNCIL_ROOT).filter((name) => /^DEC-[0-9]{4,}$/.test(name)) : [];
  for (const id of councilIds) {
    const result = validateYaml(councilYamlPath(id), resolve(ROOT, 'schemas/council.schema.json'));
    if (result.ok) console.log(`OK   council ${id}`);
    else {
      allOk = false;
      console.log(`FAIL council ${id}`);
      console.log(formatValidationErrors(result.errors));
    }
  }

  if (existsSync(INCUBATOR_IDEAS_ROOT)) {
    for (const id of listIdeaIds()) {
      const ideaResult = validateYaml(resolve(ideaPath(id), 'idea.yaml'), resolve(ROOT, 'schemas/idea.schema.json'));
      const readinessPath = resolve(ideaPath(id), 'promotion-readiness.yaml');
      const readinessResult = existsSync(readinessPath)
        ? validateYaml(readinessPath, resolve(ROOT, 'schemas/promotion-readiness.schema.json'))
        : { ok: false, errors: [{ instancePath: '/', message: 'missing promotion-readiness.yaml' }] };
      if (ideaResult.ok && readinessResult.ok) console.log(`OK   incubator ${id}`);
      else {
        allOk = false;
        console.log(`FAIL incubator ${id}`);
        if (!ideaResult.ok) console.log(formatValidationErrors(ideaResult.errors));
        if (!readinessResult.ok) console.log(formatValidationErrors(readinessResult.errors));
      }
    }
  }

  const stateReferences = validateStateReferences();
  if (stateReferences.ok) console.log('OK   state references and current-gate artifacts');
  else {
    allOk = false;
    console.log('FAIL state references/current-gate artifacts');
    for (const error of stateReferences.errors) console.log(`  - ${error}`);
  }

  const decisions = validateDecisionLogs();
  if (decisions.ok) console.log(`OK   decision logs (${decisions.count})`);
  else {
    allOk = false;
    console.log('FAIL decision logs');
    for (const error of decisions.errors) console.log(`  - ${error}`);
  }

  const optionalContracts = [
    [CONSTITUTION_PATH, resolve(ROOT, 'schemas/constitution.schema.json'), 'constitution'],
    [resolve(ROOT, '.product/capabilities.yaml'), resolve(ROOT, 'schemas/capabilities.schema.json'), 'capabilities'],
    [resolve(ROOT, '.product/runtime-version.yaml'), resolve(ROOT, 'schemas/runtime-version.schema.json'), 'runtime version'],
    [VISIBILITY_PATH, visibilitySchemaPath(), 'visibility'],
  ];
  for (const [yamlPath, schemaPath, label] of optionalContracts) {
    if (!existsSync(yamlPath) && !existsSync(schemaPath)) continue;
    if (!existsSync(yamlPath) || !existsSync(schemaPath)) {
      allOk = false;
      console.log(`FAIL ${label}: missing file/schema`);
      continue;
    }
    const result = validateYaml(yamlPath, schemaPath);
    if (result.ok) console.log(`OK   ${label}`);
    else {
      allOk = false;
      console.log(`FAIL ${label}`);
      console.log(formatValidationErrors(result.errors));
    }
  }

  if (existsSync(VISIBILITY_PATH)) {
    if (!privacyCheck()) allOk = false;
  }

  if (!allOk) process.exitCode = 1;
}

function gate() {
  const state = readState();
  const gateConfig = readYaml(GATES_PATH);
  const current = gateConfig.gates.find((g) => g.id === state.current_gate);
  if (!current) throw new Error(`Gate ${state.current_gate} is not defined in .product/gates.yaml`);

  console.log(`${current.id} — ${current.purpose}`);
  console.log(`Stage: ${current.stage}`);
  console.log(`Human approval: ${current.human_approval ? `REQUIRED (${current.approval_action})` : 'not required by policy'}`);
  console.log('\nRequired artifacts:');
  for (const path of current.required_artifacts) console.log(`  ${existsSync(resolve(ROOT, path)) ? '✓' : '✗'} ${path}`);
  console.log('\nChecks (judgment required):');
  for (const check of current.checks) console.log(`  - ${check}`);

  const missing = current.required_artifacts.filter((p) => !existsSync(resolve(ROOT, p)));
  console.log(`\nArtifact readiness: ${missing.length === 0 ? 'COMPLETE' : `INCOMPLETE (${missing.length} missing)`}`);
  console.log('Note: artifact presence alone never proves that a gate has passed.');
}

function codexCheck({ quiet = false } = {}) {
  const result = commandAvailable('codex');
  const existing = existsSync(CAPABILITIES_PATH) ? readJson(CAPABILITIES_PATH) : {};
  existing.checked_at = nowIso();
  existing.codex_cli = result;
  writeJson(CAPABILITIES_PATH, existing);
  if (!quiet) console.log(`Codex CLI: ${result.available ? 'AVAILABLE' : 'UNAVAILABLE'} — ${result.detail}`);
  return result;
}

function readTextIfExists(path) {
  return existsSync(path) ? readFileSync(path, 'utf8').trim() : '';
}

function buildCodexRequest(id) {
  const c = loadCouncil(id);
  const dir = councilPath(id);
  const context = readTextIfExists(resolve(dir, 'context.md'));
  const synthesis = readTextIfExists(resolve(dir, 'internal-synthesis.md'));
  if (!synthesis || synthesis.replace(/^# Internal synthesis\s*/i, '').trim().length < 20) {
    throw new Error('internal-synthesis.md is not populated enough for external review');
  }

  const opinionDir = resolve(dir, 'opinions');
  const opinions = existsSync(opinionDir)
    ? readdirSync(opinionDir).filter((name) => name.endsWith('.md') && name !== 'README.md').sort().map((name) => `### ${name.replace(/\.md$/, '')}\n${readTextIfExists(resolve(opinionDir, name))}`).join('\n\n')
    : '';
  if (!opinions) throw new Error('No independent council opinions found under opinions/');

  return `INDEPENDENT PRODUCT DECISION REVIEW\n\nDecision ID: ${c.id}\nTitle: ${c.title}\nQuestion: ${c.question}\nProduct stage: ${c.stage}\nImpact: ${c.impact}\nReversibility: ${c.reversibility}\nEvidence quality: ${c.evidence_quality}\n\nOPTIONS\n${c.options.map((x) => `- ${x}`).join('\n')}\n\nCURSOR COUNCIL FACTUAL PACKET\n${context}\n\nINDEPENDENT CURSOR MEMBER VIEWS\n${opinions}\n\nCURSOR INTERNAL SYNTHESIS\n${synthesis}\n\nROLE\nAct as an independent external reviewer. Do not agree with the Cursor council by default. Evaluate the actual evidence and assumptions. Do not modify files, run project code, or search the local repository. Return only a JSON object conforming to the supplied output schema. The confidence field is a decision-support score from 0 to 100, not a calibrated probability.\n`;
}

function sensitiveMatches(text) {
  const patterns = [
    ['private-key', /-----BEGIN [A-Z ]*PRIVATE KEY-----/i],
    ['openai-key-like', /\bsk-[A-Za-z0-9_-]{20,}\b/],
    ['github-token-like', /\bgh[pousr]_[A-Za-z0-9]{20,}\b/],
    ['aws-access-key-like', /\bAKIA[0-9A-Z]{16}\b/],
    ['credential-assignment', /\b(password|passwd|secret|api[_-]?key|access[_-]?token|refresh[_-]?token)\b\s*[:=]\s*[^\s<]{8,}/i],
  ];
  return patterns.filter(([, rx]) => rx.test(text)).map(([name]) => name);
}

function advisoryDir(id) {
  return resolve(CODEX_ADVISORY_ROOT, id);
}

function updateAdvisorStatus(id, status, detail = null) {
  const c = loadCouncil(id);
  c.external_advisor.status = status;
  c.external_advisor.detail = detail;
  c.external_advisor.last_attempt_at = nowIso();
  saveCouncil(id, c);
}

function prepareCodex(id) {
  assertDecisionId(id);
  const policy = readCouncilPolicy();
  const c = loadCouncil(id);
  if (c.external_advisor.policy === 'NEVER' || policy.codex.mode === 'NEVER') {
    updateAdvisorStatus(id, 'SKIPPED', 'Codex advisor disabled by policy');
    console.log(`${id}: Codex advisor skipped by policy.`);
    return null;
  }

  const request = buildCodexRequest(id);
  const bytes = Buffer.byteLength(request, 'utf8');
  if (bytes > policy.codex.max_prompt_bytes) {
    updateAdvisorStatus(id, 'FAILED', `Advisory packet ${bytes} bytes exceeds ${policy.codex.max_prompt_bytes} byte policy limit`);
    console.warn(`${id}: Codex skipped — packet exceeds configured byte limit.`);
    return null;
  }

  const matches = sensitiveMatches(request);
  if (matches.length) {
    const detail = `Outgoing advisory packet blocked by secret detector: ${matches.join(', ')}`;
    updateAdvisorStatus(id, 'BLOCKED_SENSITIVE', detail);
    const dir = advisoryDir(id);
    mkdirSync(dir, { recursive: true });
    writeJson(resolve(dir, 'metadata.json'), { status: 'BLOCKED_SENSITIVE', attempted_at: nowIso(), detail, prompt_bytes: bytes });
    console.warn(`${id}: Codex skipped — advisory packet may contain sensitive credentials.`);
    return null;
  }

  const dir = advisoryDir(id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'request.md'), request, 'utf8');
  return { request, bytes, dir };
}

function responseMarkdown(data) {
  const list = (values) => values.length ? values.map((v) => `- ${v}`).join('\n') : '- None identified';
  return `# Codex external advisor\n\n## Recommended option\n\n${data.recommended_option}\n\n## Strongest supporting argument\n\n${data.supporting_argument}\n\n## Strongest opposing argument\n\n${data.opposing_argument}\n\n## Hidden assumptions\n\n${list(data.hidden_assumptions)}\n\n## Missing evidence\n\n${list(data.missing_evidence)}\n\n## Overlooked risks\n\n${list(data.overlooked_risks)}\n\n## Confidence\n\n${data.confidence}/100 (decision-support score)\n\n## Evidence that would change the recommendation\n\n${list(data.change_evidence)}\n`;
}

function classifyCodexError(error) {
  const raw = `${error?.stderr || ''}\n${error?.message || ''}`.toLowerCase();
  if (error?.code === 'ETIMEDOUT' || /timed out|timeout/.test(raw)) return 'timeout';
  if (/login|auth|unauthorized|401|token/.test(raw)) return 'authentication/runtime unavailable';
  if (error?.code === 'ENOENT') return 'codex executable not found';
  return 'codex execution failed';
}

function visibilityStatus() {
  const visibility = loadVisibility();
  console.log(`Repository:   ${visibility.repository_kind}`);
  console.log(`Default:      ${visibility.default_visibility}`);
  console.log(`Current:      ${visibility.current_visibility}`);
  console.log(`Public allowed: ${visibility.public_allowed ? 'YES' : 'NO'}`);
  console.log(`PROMOTE implies PUBLIC: ${visibility.promotion_implies_public}`);
  console.log(`AI may set PUBLIC: ${visibility.ai_may_set_public}`);
  console.log(`Human approval required: ${visibility.public_requires_human_approval}`);
  console.log(`Public approval: ${visibility.public_approval.status}${visibility.public_approval.approved_by ? ` by ${visibility.public_approval.approved_by}` : ''}`);
}

function visibilitySetPublic(flags) {
  if (flags['human-approved'] !== true) throw new Error('PUBLIC requires explicit --human-approved');
  const approvedBy = requireString(flags, 'approved-by');
  const visibility = loadVisibility();
  if (visibility.ai_may_set_public !== false) throw new Error('ai_may_set_public must remain false');
  if (visibility.repository_kind === 'PRODUCT' && visibility.promotion_implies_public !== false) {
    throw new Error('promotion_implies_public must remain false');
  }
  const decisionCandidate = typeof flags['decision-id'] === 'string' ? flags['decision-id'] : null;
  const decisionId = /^DEC-[0-9]{4,}$/.test(decisionCandidate || '') ? decisionCandidate : null;
  visibility.current_visibility = 'PUBLIC';
  visibility.public_allowed = true;
  visibility.public_approval = {
    status: 'APPROVED',
    approved_by: approvedBy,
    approved_at: nowIso(),
    decision_id: decisionId,
  };
  saveVisibility(visibility);
  console.log('PUBLIC policy recorded. Hosting remotes are not changed.');
  console.log('AI must not run GitHub/Origin visibility commands; a human performs provider-side publication if desired.');
}

function readGitignore() {
  const path = resolve(ROOT, '.gitignore');
  if (!existsSync(path)) throw new Error('Missing .gitignore');
  return readFileSync(path, 'utf8');
}

function privacyCheck() {
  const errors = [];
  const warnings = [];
  if (!existsSync(VISIBILITY_PATH)) errors.push('missing .product/visibility.yaml');
  else {
    try {
      const visibility = loadVisibility();
      if (visibility.ai_may_set_public !== false) errors.push('ai_may_set_public must be false');
      if (visibility.promotion_implies_public !== false) errors.push('promotion_implies_public must be false');
      if (visibility.repository_kind === 'PRODUCT' && visibility.current_visibility === 'PUBLIC' && visibility.public_approval.status !== 'APPROVED') {
        errors.push('PRODUCT PUBLIC visibility requires recorded human approval');
      }
    } catch (error) {
      errors.push(error.message);
    }
  }

  try {
    const gitignore = readGitignore();
    for (const [id, ok] of requiredGitignoreChecks(gitignore)) {
      if (!ok) errors.push(`.gitignore missing required pattern: ${id}`);
    }
  } catch (error) {
    errors.push(error.message);
  }

  const tracked = trackedExperienceBodies();
  if (tracked.git) {
    if (tracked.error) errors.push(`could not list tracked experience files: ${tracked.error}`);
    for (const rel of tracked.files) {
      errors.push(`experience body is git-tracked (local-only; publication_allowed is false): ${rel}`);
    }
  }

  const { inbox, raw } = experienceDirs();
  if (existsSync(inbox)) {
    for (const name of readdirSync(inbox)) {
      if (name === 'README.md' || !name.endsWith('.md')) continue;
      const path = resolve(inbox, name);
      const nameFindings = privacyMatches(name);
      if (nameFindings.length) errors.push(`inbox filename is not local-sanitized: ${name} (${nameFindings.map((f) => f.type).join(', ')})`);
      if (!isAdmittedExperienceFilename(name)) {
        errors.push(`inbox filename must be EXP-LOCAL-<32-hex>.md (legacy EXP-SAFE-<32-hex>.md is read-only): ${name}`);
      }
      const parsed = parseFrontmatter(path);
      if (parsed.data && Object.hasOwn(parsed.data, 'source_basename')) {
        errors.push(`inbox artifact must not store RAW basename: ${name}`);
      }
      if (parsed.data?.status && !isAdmittedExperienceStatus(parsed.data.status)) {
        errors.push(`inbox status must be LOCAL_SANITIZED (legacy REPOSITORY_SAFE is read-only): ${name}`);
      }
      if (isLocalExperienceFilename(name) && parsed.data?.publication_allowed !== false) {
        errors.push(`LOCAL_SANITIZED artifacts must set publication_allowed: false: ${name}`);
      }
      const findings = privacyMatches(readFileSync(path, 'utf8'));
      if (findings.length) errors.push(`inbox is not pattern-redacted: ${name} (${findings.map((f) => f.type).join(', ')})`);
    }
  }
  if (existsSync(raw)) warnings.push(`RAW experience directory present at ${relative(ROOT, raw)} (must stay gitignored)`);

  console.log(`Privacy boundary: ${errors.length === 0 ? 'OK' : 'BLOCKED'}`);
  for (const warning of warnings) console.log(`WARN ${warning}`);
  for (const error of errors) console.log(`FAIL ${error}`);
  if (errors.length) process.exitCode = 1;
  return errors.length === 0;
}

function experienceScan(targetPath) {
  if (!targetPath) throw new Error('experience:scan requires a file path');
  const path = resolve(targetPath);
  if (!existsSync(path)) throw new Error(`file not found: ${path}`);
  const findings = privacyMatches(readFileSync(path, 'utf8'));
  if (findings.length) {
    console.log(`SCAN BLOCKED ${relative(ROOT, path)}`);
    for (const finding of findings) console.log(`  - ${finding.type} (${finding.count})`);
    process.exitCode = 1;
    return { ok: false, findings };
  }
  console.log(`SCAN CLEAN ${relative(ROOT, path)}`);
  return { ok: true, findings: [] };
}

function newExperienceSourceId() {
  return randomBytes(16).toString('hex');
}

function opaqueLocalFilename(sourceId) {
  return `EXP-LOCAL-${sourceId}.md`;
}

function writeLocalSourceMap(sourceId, rawPath) {
  const { raw } = experienceDirs();
  const mapDir = resolve(raw, '.local-map');
  mkdirSync(mapDir, { recursive: true });
  writeYaml(resolve(mapDir, `${sourceId}.yaml`), {
    source_id: sourceId,
    raw_basename: basename(rawPath),
    raw_relpath: relative(ROOT, rawPath).replaceAll('\\', '/'),
    recorded_at: nowIso(),
  });
}

function localSanitizedDocument(sourceId, body, redactions) {
  const metadata = {
    schema_version: 1,
    status: 'LOCAL_SANITIZED',
    classification: 'PATTERN_REDACTED',
    publication_allowed: false,
    source_id: sourceId,
    scanned_at: nowIso(),
    findings: [],
    redactions,
  };
  return `---\n${YAML.stringify(metadata, { lineWidth: 0 }).trimEnd()}\n---\n\n# Local sanitized experience\n\nThis artifact passed Product OS pattern redaction. It is local-only. Pattern-clean is not publication permission. Do not commit it to Public Product OS.\n\n${body.trim()}\n`;
}

function resolveLocalOutputPath(flags, sourceId) {
  const { inbox } = experienceDirs();
  mkdirSync(inbox, { recursive: true });
  const opaque = resolve(inbox, opaqueLocalFilename(sourceId));
  if (typeof flags.output !== 'string') return opaque;
  const outputPath = resolve(flags.output);
  const outputName = basename(outputPath);
  if (privacyMatches(outputName).length) {
    throw new Error(`refusing output filename that matches privacy patterns: ${outputName}`);
  }
  if (pathIsInside(inbox, outputPath)) {
    if (!isLocalExperienceFilename(outputName)) {
      throw new Error('inbox output filename must be an opaque EXP-LOCAL-<32-hex>.md and must not be derived from a RAW filename');
    }
    return outputPath;
  }
  return outputPath;
}

function experienceSanitize(targetPath, flags = {}) {
  if (!targetPath) throw new Error('experience:sanitize requires a file path');
  const path = resolve(targetPath);
  if (!existsSync(path)) throw new Error(`file not found: ${path}`);
  const raw = readFileSync(path, 'utf8');
  const redacted = redactPrivacy(raw);
  const remaining = privacyMatches(redacted.text);
  if (remaining.length) {
    console.error('SANITIZE BLOCKED: remaining sensitive findings after redaction');
    for (const finding of remaining) console.error(`  - ${finding.type} (${finding.count})`);
    process.exitCode = 1;
    return { ok: false };
  }
  const sourceId = newExperienceSourceId();
  const outputPath = resolveLocalOutputPath(flags, sourceId);
  const { raw: rawDir } = experienceDirs();
  if (pathIsInside(rawDir, outputPath) && relative(rawDir, outputPath) !== '') {
    throw new Error('refusing to write local-sanitized output into experience-raw');
  }
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, localSanitizedDocument(sourceId, redacted.text, redacted.redactions), 'utf8');
  const verify = privacyMatches(readFileSync(outputPath, 'utf8'));
  if (verify.length) {
    rmSync(outputPath, { force: true });
    throw new Error(`refusing to keep output that still matches privacy patterns: ${verify.map((f) => f.type).join(', ')}`);
  }
  writeLocalSourceMap(sourceId, path);
  console.log(`SANITIZE OK ${relative(ROOT, outputPath)}`);
  return { ok: true, outputPath, sourceId };
}

function experienceIngest(targetPath, flags = {}) {
  if (!targetPath) throw new Error('experience:ingest requires a file path');
  const path = resolve(targetPath);
  if (!existsSync(path)) throw new Error(`file not found: ${path}`);
  const { raw: rawDir } = experienceDirs();
  const parsed = parseFrontmatter(path);
  const alreadyAdmitted = parsed.error == null && isAdmittedExperienceStatus(parsed.data?.status);
  if (alreadyAdmitted && isLegacyExperienceArtifact(parsed, basename(path))) {
    const findings = privacyMatches(readFileSync(path, 'utf8'));
    if (findings.length) {
      console.error('INGEST BLOCKED: file is not pattern-redacted');
      for (const finding of findings) console.error(`  - ${finding.type} (${finding.count})`);
      process.exitCode = 1;
      return;
    }
    if (parsed.data && Object.hasOwn(parsed.data, 'source_basename')) {
      throw new Error('INGEST BLOCKED: local-sanitized artifacts must not carry RAW basename');
    }
    if (typeof flags.output === 'string' && resolve(flags.output) !== path) {
      throw new Error('INGEST BLOCKED: legacy REPOSITORY_SAFE / EXP-SAFE-* ingest is read-only and must not write new output');
    }
    console.log(`INGEST OK (legacy read-only) ${relative(ROOT, path)}`);
    return;
  }
  if (pathIsInside(rawDir, path) && !alreadyAdmitted) {
    const sanitized = experienceSanitize(path, flags);
    if (!sanitized?.ok) throw new Error('RAW experience was not admitted to the inbox');
    console.log('INGEST admitted local-sanitized experience; RAW file was not copied.');
    return;
  }
  const findings = privacyMatches(readFileSync(path, 'utf8'));
  if (findings.length) {
    console.error('INGEST BLOCKED: file is not pattern-redacted');
    for (const finding of findings) console.error(`  - ${finding.type} (${finding.count})`);
    process.exitCode = 1;
    return;
  }
  if (!alreadyAdmitted) {
    const sanitized = experienceSanitize(path, flags);
    if (!sanitized?.ok) throw new Error('experience ingest refused unsanitized input');
    console.log('INGEST admitted after sanitize.');
    return;
  }
  if (parsed.data && Object.hasOwn(parsed.data, 'source_basename')) {
    throw new Error('INGEST BLOCKED: local-sanitized artifacts must not carry RAW basename');
  }
  const sourceId = typeof parsed.data?.source_id === 'string' && /^[0-9a-f]{32}$/.test(parsed.data.source_id)
    ? parsed.data.source_id
    : newExperienceSourceId();
  const dest = resolveLocalOutputPath(flags, sourceId);
  mkdirSync(dirname(dest), { recursive: true });
  if (resolve(path) !== dest) writeFileSync(dest, readFileSync(path, 'utf8'), 'utf8');
  console.log(`INGEST OK ${relative(ROOT, dest)}`);
}

function codexConsult(id) {
  assertDecisionId(id);
  const policy = readCouncilPolicy();
  const prepared = prepareCodex(id);
  if (!prepared) return;

  const capability = codexCheck({ quiet: true });
  if (!capability.available) {
    updateAdvisorStatus(id, 'UNAVAILABLE', capability.detail);
    writeJson(resolve(prepared.dir, 'metadata.json'), {
      status: 'UNAVAILABLE',
      attempted_at: nowIso(),
      detail: capability.detail,
      prompt_bytes: prepared.bytes,
    });
    console.warn(`${id}: Codex unavailable; continuing with internal council.`);
    return;
  }

  updateAdvisorStatus(id, 'AVAILABLE', capability.detail);
  const temp = mkdtempSync(join(tmpdir(), 'cursor-product-os-codex-'));
  const started = nowIso();
  try {
    const schemaPath = resolve(ROOT, 'schemas/codex-advisor-response.schema.json');
    const args = ['exec'];
    if (policy.codex.ephemeral) args.push('--ephemeral');
    if (policy.codex.ignore_user_config) args.push('--ignore-user-config');
    if (policy.codex.run_outside_repository) args.push('--skip-git-repo-check');
    args.push('--output-schema', schemaPath, prepared.request);

    const stdout = execFileSync('codex', args, {
      cwd: temp,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: policy.codex.timeout_ms,
      maxBuffer: 4 * 1024 * 1024,
      env: process.env,
    }).trim();

    let parsed;
    try { parsed = JSON.parse(stdout); }
    catch { throw new Error('Codex returned malformed JSON despite output schema request'); }

    const validation = validateData(parsed, schemaPath);
    if (!validation.ok) throw new Error(`Codex structured output failed schema validation: ${validation.errors.map((e) => `${e.instancePath || '/'} ${e.message}`).join('; ')}`);

    writeJson(resolve(prepared.dir, 'response.json'), parsed);
    writeFileSync(resolve(prepared.dir, 'response.md'), responseMarkdown(parsed), 'utf8');
    writeJson(resolve(prepared.dir, 'metadata.json'), {
      status: 'SUCCESS',
      started_at: started,
      completed_at: nowIso(),
      codex_version: capability.detail,
      prompt_bytes: prepared.bytes,
      execution: {
        mode: 'codex exec',
        ephemeral: Boolean(policy.codex.ephemeral),
        sandbox: 'read-only (Codex default)',
        ignore_user_config: Boolean(policy.codex.ignore_user_config),
        outside_repository: Boolean(policy.codex.run_outside_repository),
        timeout_ms: policy.codex.timeout_ms,
      },
    });
    updateAdvisorStatus(id, 'SUCCESS', `Validated external review; recommendation: ${parsed.recommended_option}`);
    console.log(`${id}: Codex external review SUCCESS`);
    console.log(`Recommendation: ${parsed.recommended_option}`);
    console.log(`Confidence: ${parsed.confidence}/100`);
  } catch (error) {
    const detail = classifyCodexError(error);
    writeJson(resolve(prepared.dir, 'metadata.json'), {
      status: 'FAILED',
      started_at: started,
      completed_at: nowIso(),
      codex_version: capability.detail,
      prompt_bytes: prepared.bytes,
      detail,
    });
    updateAdvisorStatus(id, detail.includes('unavailable') ? 'UNAVAILABLE' : 'FAILED', detail);
    console.warn(`${id}: Codex advisor ${detail}; continuing with internal council.`);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}

function recordCouncilDecision(id, flags) {
  const c = loadCouncil(id);
  if (c.status !== 'RECOMMENDED') throw new Error(`${id} must reach RECOMMENDED status before it can be recorded`);
  const decision = requireString(flags, 'decision');
  const statusValue = enumValue(flags.status || 'ACCEPTED', ['ACCEPTED', 'REJECTED'], '--status');
  const humanApproved = flags['human-approved'] === true;
  const approvedBy = humanApproved ? String(flags['approved-by'] && flags['approved-by'] !== true ? flags['approved-by'] : 'human') : null;
  if (c.human_approval_required && !humanApproved) {
    throw new Error(`${id} requires explicit human approval. Re-run only after approval with --human-approved --approved-by human`);
  }
  if (!c.options.includes(decision) && statusValue === 'ACCEPTED') {
    console.warn(`Warning: recorded decision is not an exact option string from the original council: ${decision}`);
  }

  const confidence = flags.confidence && flags.confidence !== true ? Number(flags.confidence) : c.confidence;
  if (confidence !== null && confidence !== undefined && (!Number.isFinite(confidence) || confidence < 0 || confidence > 1)) throw new Error('--confidence must be between 0 and 1');

  const metadata = {
    id: c.id,
    type: c.type,
    status: statusValue,
    impact: c.impact,
    reversibility: c.reversibility,
    human_approval_required: c.human_approval_required,
    human_approved: humanApproved,
    title: c.title,
    question: c.question,
    stage: c.stage,
    decision,
    codex_status: c.external_advisor.status,
    recorded_at: nowIso(),
    approved_by: approvedBy,
    revisit_when: flagValues(flags, 'revisit-when').map(String),
  };
  if (confidence !== null && confidence !== undefined) metadata.confidence = confidence;
  const validation = validateData(metadata, resolve(ROOT, 'schemas/decision.schema.json'));
  if (!validation.ok) throw new Error(`Decision record metadata invalid: ${validation.errors.map((e) => `${e.instancePath || '/'} ${e.message}`).join('; ')}`);

  const synthesis = readTextIfExists(resolve(councilPath(id), 'internal-synthesis.md'));
  const recommendation = readTextIfExists(resolve(councilPath(id), 'final-recommendation.md'));
  const verification = readTextIfExists(resolve(councilPath(id), 'verification.md'));
  const codexResponse = readTextIfExists(resolve(advisoryDir(id), 'response.md'));
  const frontmatter = YAML.stringify(metadata, { lineWidth: 0 }).trimEnd();
  const body = `---\n${frontmatter}\n---\n\n# ${c.id} — ${c.title}\n\n## Final decision\n\n${decision}\n\n## Original question\n\n${c.question}\n\n## Options considered\n\n${c.options.map((x) => `- ${x}`).join('\n')}\n\n## Final recommendation packet\n\n${recommendation || '_Not populated._'}\n\n## Internal synthesis\n\n${synthesis || '_Not populated._'}\n\n## Verification\n\n${verification || '_Not populated._'}\n\n## Codex external advisor\n\n${codexResponse || `Status: ${c.external_advisor.status}`}\n`;

  const logDir = resolve(ROOT, 'product/09-decisions');
  mkdirSync(logDir, { recursive: true });
  const filename = `${c.id}-${slugify(c.title)}.md`;
  const path = resolve(logDir, filename);
  writeFileSync(path, body, 'utf8');

  c.status = 'RECORDED';
  c.final_decision = decision;
  c.final_decision_path = relative(ROOT, path).replaceAll('\\', '/');
  saveCouncil(id, c);

  const state = readState();
  state.decisions.latest = c.id;
  writeYaml(STATE_PATH, state);

  console.log(`${id}: recorded at ${relative(ROOT, path)}`);
  if (c.human_approval_required) console.log(`Human approval recorded: ${approvedBy}`);
  console.log('State stage/build/release permissions were not changed.');
}

function help() {
  console.log(`Cursor Product OS CLI\n\nUsage:\n  npm run po -- <command> [args]\n\nFoundation:\n  doctor                              Check required and optional runtime capabilities\n  status                              Show current product state\n  validate                            Validate schemas, customization, incubator, councils, and decisions\n  gate                                Show current gate requirements\n  hooks:status                        Show latest Phase 8 runtime guardrail results\n\nIncubator & Promotion (Phase 9):\n  idea:new --title <t> [--user <u>] [--problem <p>] [--solution <s>]\n  idea:status [IDEA-####]              List or inspect incubator ideas\n  promote:check IDEA-#### [--destination <path>]\n  promote IDEA-#### --destination <outside-path> [--name <product>] --human-approved --approved-by <human> [--decision-id DEC-####] [--product-id <id>] [--skip-git-init]\n\nPrivacy & Repository Boundary:\n  visibility:status                    Show repository visibility policy\n  visibility:set-public --human-approved --approved-by <human> [--decision-id DEC-####]\n  privacy:check                        Check gitignore, visibility, and inbox safety\n  experience:scan <file>               Scan a file for secrets/PII-like content\n  experience:sanitize <file> [--output <path>]\n  experience:ingest <file> [--output <path>]\n\nDecision Council (Phase 6):\n  council:create --title <t> --question <q> --type <type> --impact <LOW|MEDIUM|HIGH> --reversibility <LOW|MEDIUM|HIGH> --option <a> --option <b>\n  council:status [DEC-####]            List or show council workspace status\n  council:validate DEC-####            Validate a council workspace\n  council:prepare-codex DEC-####       Assemble and secret-scan the Codex advisory packet\n  council:record DEC-#### --decision <option> [--human-approved --approved-by human]\n\nCodex Optional Advisor (Phase 7):\n  codex:check                          Detect local Codex CLI capability\n  codex:consult DEC-####               Run fail-open structured external review when usable\n\nNotes:\n  - Promotion requires a PROMOTE recommendation, verifier PASS, complete incubation artifacts, and explicit human approval.\n  - Promoted repositories start at DISCOVERY / G1_PROBLEM with build.allowed=false and release.allowed=false.\n  - Promoted repositories are PRIVATE by default. PROMOTE does not imply PUBLIC and does not create a hosting remote.\n  - PUBLIC requires explicit --human-approved and does not call GitHub/Origin.\n  - RAW experience cannot be ingested. Sanitized experience is local-only (LOCAL_SANITIZED; publication_allowed: false) and must not be git-tracked. Legacy REPOSITORY_SAFE / EXP-SAFE-* files remain readable locally; ingest is read-only for them and must not write new copies.\n  - Promotion never overwrites an existing destination and refuses destinations inside the Product OS repository.\n  - Git is initialized on main by default; use --skip-git-init only intentionally.\n  - Codex is optional. Any advisor failure continues the internal Cursor council.\n  - council:record never changes stage, build.allowed, or release.allowed.\n`);
}

const command = process.argv[2] ?? 'help';
const parsed = parseArgs(process.argv.slice(3));
try {
  if (command === 'doctor') doctor();
  else if (command === 'status') status();
  else if (command === 'validate') validateAll();
  else if (command === 'gate') gate();
  else if (command === 'hooks:status') hookStatus();
  else if (command === 'idea:new') ideaNew(parsed.flags);
  else if (command === 'idea:status') ideaStatus(parsed.positional[0]);
  else if (command === 'promote:check') promoteCheck(parsed.positional[0], parsed.flags);
  else if (command === 'promote') promoteIdea(parsed.positional[0], parsed.flags);
  else if (command === 'visibility:status') visibilityStatus();
  else if (command === 'visibility:set-public') visibilitySetPublic(parsed.flags);
  else if (command === 'privacy:check') privacyCheck();
  else if (command === 'experience:scan') experienceScan(parsed.positional[0]);
  else if (command === 'experience:sanitize') experienceSanitize(parsed.positional[0], parsed.flags);
  else if (command === 'experience:ingest') experienceIngest(parsed.positional[0], parsed.flags);
  else if (command === 'council:create') createCouncil(parsed.flags);
  else if (command === 'council:status') councilStatus(parsed.positional[0]);
  else if (command === 'council:update') updateCouncil(assertDecisionId(parsed.positional[0]), parsed.flags);
  else if (command === 'council:validate') validateCouncil(assertDecisionId(parsed.positional[0]));
  else if (command === 'council:prepare-codex') {
    const prepared = prepareCodex(assertDecisionId(parsed.positional[0]));
    if (prepared) console.log(`${parsed.positional[0]}: advisory packet prepared (${prepared.bytes} bytes)`);
  }
  else if (command === 'council:record') recordCouncilDecision(assertDecisionId(parsed.positional[0]), parsed.flags);
  else if (command === 'codex:check') codexCheck();
  else if (command === 'codex:consult') codexConsult(assertDecisionId(parsed.positional[0]));
  else if (command === 'help' || command === '--help' || command === '-h') help();
  else {
    console.error(`Unknown command: ${command}\n`);
    help();
    process.exitCode = 1;
  }
} catch (error) {
  console.error(`Product OS error: ${error.message}`);
  process.exitCode = 1;
}
