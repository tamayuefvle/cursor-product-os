import test from 'node:test';
import assert from 'node:assert/strict';
import {
  chmodSync,
  cpSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { basename, delimiter, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import YAML from 'yaml';

const SOURCE_ROOT = process.cwd();
const CLI = resolve(SOURCE_ROOT, 'scripts/product-os.mjs');
const SCENARIO = JSON.parse(readFileSync(resolve(SOURCE_ROOT, 'tests/fixtures-phase10-scenario.json'), 'utf8'));

function run(cwd, args, env = process.env) {
  const output = execFileSync(process.execPath, [CLI, ...args], {
    cwd,
    env,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 60000,
  });
  return output;
}

function writeYaml(path, data) {
  writeFileSync(path, YAML.stringify(data, { lineWidth: 0 }), 'utf8');
}

function populateIdea(root, id) {
  const dir = resolve(root, 'incubator/ideas', id);
  const ideaPath = resolve(dir, 'idea.yaml');
  const idea = YAML.parse(readFileSync(ideaPath, 'utf8'));
  idea.status = 'EVALUATING';
  idea.confidence = { problem: 0.76, evidence: 0.64, differentiation: 0.61, feasibility: 0.86, overall: 0.72 };
  idea.open_questions = [
    'Will teams switch from disciplined use of existing issue trackers and docs?',
    'Does repository-native governance reduce enough rework to justify adoption friction?',
  ];
  writeYaml(ideaPath, idea);

  const readinessPath = resolve(dir, 'promotion-readiness.yaml');
  const readiness = YAML.parse(readFileSync(readinessPath, 'utf8'));
  readiness.recommendation = 'PROMOTE';
  readiness.verifier = {
    status: 'PASS',
    blocking_gaps: [],
    reviewed_at: new Date().toISOString(),
  };
  writeYaml(readinessPath, readiness);

  const docs = {
    'brief.md': '# Idea brief\n\nSynthetic Phase 10 acceptance fixture for testing the Product OS lifecycle. It is not market evidence.\n',
    'problem.md': '# Problem\n\nSmall AI-assisted product teams can lose the rationale behind product decisions when evidence, chat history, issue tracking, and implementation changes live in different places. The fixture treats this as a hypothesis to investigate, not as a validated market fact.\n',
    'evidence.md': '# Evidence\n\nThis is deliberately synthetic acceptance-test evidence. It represents the expected shape of sourced observations, counter-evidence, uncertainty, and open questions without pretending the fixture is real customer research.\n',
    'market.md': '# Market\n\nThe acceptance fixture models teams using AI-assisted software-development workflows. No market-size claim in this document should be interpreted as factual research; the purpose is to test evidence separation and artifact movement.\n',
    'competitors.md': '# Competitors\n\nModeled alternatives include issue trackers, documentation systems, spreadsheets, AI coding tools, manual decision logs, and doing nothing. The test verifies that alternatives survive promotion as provenance inputs.\n',
    'alternatives.md': '# Alternatives\n\nUse existing documentation discipline, keep ADRs only for technical choices, or avoid introducing another workflow layer.\n',
    'value-proposition.md': '# Value Proposition\n\nHypothesis: repository-native product governance can reduce context loss while keeping high-impact transitions human-approved. The test intentionally preserves this as a hypothesis after promotion.\n',
    'evaluation.md': '# Idea Evaluation\n\nRecommendation: PROMOTE for deeper discovery. Strongest counterargument: disciplined use of existing tools may solve enough of the coordination problem without a dedicated Product OS.\n',
  };
  for (const [name, body] of Object.entries(docs)) writeFileSync(resolve(dir, name), body, 'utf8');
}

function createFakeCodex(temp) {
  const bin = resolve(temp, 'fake-bin');
  mkdirSync(bin, { recursive: true });
  const posix = resolve(bin, 'codex');
  const response = JSON.stringify({
    recommended_option: 'PROMOTE',
    supporting_argument: 'The idea has enough problem framing and reversibility to justify deeper discovery without authorizing implementation.',
    opposing_argument: 'Existing documentation and issue-tracking discipline may capture most of the value with less process overhead.',
    hidden_assumptions: ['Teams will maintain repository-native product artifacts consistently.'],
    missing_evidence: ['Observed switching behavior from current workflows.'],
    overlooked_risks: ['Governance overhead could exceed the rework it prevents.'],
    confidence: 74,
    change_evidence: ['Evidence that teams do not revisit or lose decision context would favor PARK.'],
  });
  writeFileSync(posix, `#!/usr/bin/env node\nconst args = process.argv.slice(2);\nif (args.includes('--version')) { console.log('codex-cli 99.0.0-phase10-stub'); process.exit(0); }\nif (args[0] === 'exec') { console.log(${JSON.stringify(response)}); process.exit(0); }\nprocess.exit(2);\n`, 'utf8');
  chmodSync(posix, 0o755);
  writeFileSync(resolve(bin, 'codex.cmd'), `@echo off\r\nnode "%~dp0\\codex" %*\r\n`, 'utf8');
  return { ...process.env, PATH: `${bin}${delimiter}${process.env.PATH || ''}` };
}

function createUnavailableCodex(temp) {
  const bin = resolve(temp, 'unavailable-codex-bin');
  mkdirSync(bin, { recursive: true });
  const posix = resolve(bin, 'codex');
  writeFileSync(posix, `#!/usr/bin/env node
console.error('phase10 simulated codex unavailable');
process.exit(42);
`, 'utf8');
  chmodSync(posix, 0o755);
  writeFileSync(resolve(bin, 'codex.cmd'), `@echo off
echo phase10 simulated codex unavailable 1>&2
exit /b 42
`, 'utf8');
  return { ...process.env, PATH: `${bin}${delimiter}${process.env.PATH || ''}` };
}

function populateCouncil(root, id) {
  const dir = resolve(root, '.product/council', id);
  writeFileSync(resolve(dir, 'context.md'), `# ${id} — Context packet\n\n## FACTS / EVIDENCE\n\nThe Incubator contains a non-placeholder problem statement, alternatives, market context, and explicit uncertainty. The verifier found no blocking promotion gaps. Promotion authorizes deeper discovery only.\n\n## ASSUMPTIONS / INFERENCES\n\nThe modeled pain is not yet validated by customer interviews.\n\n## Constraints\n\nOne product per repository. Build remains blocked after promotion.\n\n## Known unknowns\n\nSwitching behavior and willingness to adopt a repository-native governance workflow.\n`, 'utf8');
  mkdirSync(resolve(dir, 'opinions'), { recursive: true });
  writeFileSync(resolve(dir, 'opinions/product-manager.md'), '# Product Manager\n\nRecommend PROMOTE. The next step is deeper discovery, not implementation; the unresolved adoption risk remains explicit.\n', 'utf8');
  writeFileSync(resolve(dir, 'opinions/business-analyst.md'), '# Business Analyst\n\nRecommend PROMOTE with caution. The value case is plausible but no willingness-to-pay claim is established by this synthetic fixture.\n', 'utf8');
  writeFileSync(resolve(dir, 'opinions/devils-advocate.md'), '# Devil\'s Advocate\n\nPrefer PARK unless the team can show existing tools fail in repeated real workflows. Promotion is acceptable only because it preserves build blocking and forces G1 discovery.\n', 'utf8');
  writeFileSync(resolve(dir, 'internal-synthesis.md'), '# Internal synthesis\n\n## Agreements\n\nThere is enough structured uncertainty to justify deeper discovery.\n\n## Disagreements\n\nThe strongest disagreement is whether existing tools already solve the problem sufficiently.\n\n## Hidden assumptions\n\nTeams will maintain the workflow.\n\n## Missing evidence\n\nObserved switching behavior.\n\n## Reversibility analysis\n\nPROMOTE is reversible because it starts at DISCOVERY with build and release blocked.\n\n## Preliminary recommendation\n\nPROMOTE.\n\n## Strongest counterargument\n\nExisting tools may be enough.\n\n## Confidence\n\n0.70 decision-support score.\n', 'utf8');
  writeFileSync(resolve(dir, 'verification.md'), '# Verifier review\n\n## Evidence fidelity\n\nPASS. Synthetic evidence is labeled as synthetic and is not elevated to fact.\n\n## Opinion fidelity\n\nPASS. The dissenting view remains visible.\n\n## Unresolved contradictions\n\nAdoption and switching remain open.\n\n## Governance check\n\nPASS. Human approval is still required.\n\n## Verdict\n\nPASS for a PROMOTE recommendation only.\n', 'utf8');
  writeFileSync(resolve(dir, 'final-recommendation.md'), '# Final recommendation\n\n## Recommendation\n\nPROMOTE.\n\n## Evidence\n\nStructured problem and alternatives exist; verifier reports no blocking promotion gap.\n\n## Open assumptions\n\nAdoption and switching behavior.\n\n## Strongest counterargument\n\nExisting tools may be enough.\n\n## Confidence\n\n0.74 decision-support score.\n\n## Human approval\n\nRequired before promotion.\n', 'utf8');
}

test('Phase 10 full lifecycle: idea -> council -> Codex -> human decision -> promotion -> G1', () => {
  const temp = mkdtempSync(join(tmpdir(), 'product-os-phase10-'));
  const os = resolve(temp, 'product-os');
  const product = resolve(temp, 'scenario-product');
  try {
    cpSync(SOURCE_ROOT, os, {
      recursive: true,
      filter: (source) => !source.includes(`${join('node_modules')}`) && !source.includes(`${join('.git')}`),
    });
    const env = createFakeCodex(temp);

    const created = run(os, ['idea:new', '--title', SCENARIO.title, '--user', SCENARIO.target_user, '--problem', SCENARIO.problem, '--solution', SCENARIO.solution_hypothesis], env);
    const ideaId = created.match(/(IDEA-[0-9]{4,}) created/)?.[1];
    assert.ok(ideaId, created);
    populateIdea(os, ideaId);

    const councilCreated = run(os, [
      'council:create',
      '--title', 'Incubator promotion decision',
      '--question', SCENARIO.decision.question,
      '--type', 'product',
      '--impact', 'HIGH',
      '--reversibility', 'MEDIUM',
      '--evidence-quality', 'MEDIUM',
      '--option', 'PROMOTE',
      '--option', 'PARK',
      '--human-approval',
      '--approval-action', 'PROMOTE',
      '--confidence', '0.62',
    ], env);
    const councilId = councilCreated.match(/(DEC-[0-9]{4,}) created/)?.[1];
    assert.ok(councilId, councilCreated);
    populateCouncil(os, councilId);

    run(os, ['council:update', councilId, '--status', 'SYNTHESIZED', '--evidence-quality', 'MEDIUM', '--confidence', '0.70'], env);
    const codex = run(os, ['codex:consult', councilId], env);
    assert.match(codex, /Codex external review SUCCESS/);
    const advisory = JSON.parse(readFileSync(resolve(os, `.product/advisory/codex/${councilId}/response.json`), 'utf8'));
    assert.equal(advisory.recommended_option, 'PROMOTE');

    run(os, ['council:update', councilId, '--status', 'VERIFIED', '--confidence', '0.73'], env);
    run(os, ['council:update', councilId, '--status', 'RECOMMENDED', '--confidence', '0.74'], env);
    const recorded = run(os, ['council:record', councilId, '--decision', 'PROMOTE', '--human-approved', '--approved-by', 'phase10-human', '--confidence', '0.74'], env);
    assert.match(recorded, /Human approval recorded: phase10-human/);

    const ideaPath = resolve(os, `incubator/ideas/${ideaId}/idea.yaml`);
    const idea = YAML.parse(readFileSync(ideaPath, 'utf8'));
    idea.decision.latest = councilId;
    writeYaml(ideaPath, idea);

    const check = run(os, ['promote:check', ideaId, '--destination', product], env);
    assert.match(check, /READY FOR HUMAN-GATED PROMOTION/);
    const promoted = run(os, ['promote', ideaId, '--destination', product, '--name', SCENARIO.title, '--human-approved', '--approved-by', 'phase10-human', '--decision-id', councilId, '--skip-git-init'], env);
    assert.match(promoted, /PROMOTED/);

    const state = YAML.parse(readFileSync(resolve(product, '.product/state.yaml'), 'utf8'));
    assert.equal(state.product.stage, SCENARIO.expected_product_state.stage);
    assert.equal(state.current_gate, SCENARIO.expected_product_state.current_gate);
    assert.equal(state.build.allowed, SCENARIO.expected_product_state.build_allowed);
    assert.equal(state.release.allowed, SCENARIO.expected_product_state.release_allowed);
    assert.equal(state.decisions.latest, null, 'Incubator promotion decision must not become the Product Repo active decision');
    assert.equal(state.assumptions.critical.length, 2);

    const origin = YAML.parse(readFileSync(resolve(product, '.product/origin.yaml'), 'utf8'));
    assert.equal(origin.promotion.decision_id, councilId);
    assert.equal(origin.decision_artifact.id, councilId);
    assert.match(origin.decision_artifact.sha256, /^[a-f0-9]{64}$/);
    assert.equal(existsSync(resolve(product, origin.decision_artifact.path)), true);
    assert.equal(existsSync(resolve(product, 'product/00-origin/incubator/idea.yaml')), true);
    assert.equal(existsSync(resolve(product, 'incubator')), false, 'A promoted Product Repository must not become another Incubator');

    const promotedDecisionName = basename(origin.decision_artifact.path);
    assert.match(promotedDecisionName, new RegExp(`^${councilId}-`));
    const agentFiles = readdirSync(resolve(product, '.cursor/agents')).filter((name) => name.endsWith('.md') && name !== 'README.md');
    const skillDirs = readdirSync(resolve(product, '.cursor/skills')).filter((name) => existsSync(resolve(product, '.cursor/skills', name, 'SKILL.md')));
    assert.equal(agentFiles.length, 9);
    assert.equal(skillDirs.length, 10);

    const productStatus = run(product, ['status'], env);
    assert.match(productStatus, /Stage:\s+DISCOVERY/);
    assert.match(productStatus, /Build:\s+BLOCKED/);
    assert.match(productStatus, /Release:\s+BLOCKED/);

    const impossibleRePromote = spawnSync(process.execPath, [CLI, 'idea:new', '--title', 'Should fail'], { cwd: product, env, encoding: 'utf8' });
    assert.notEqual(impossibleRePromote.status, 0);
    assert.match(`${impossibleRePromote.stdout}\n${impossibleRePromote.stderr}`, /does not contain an Incubator template/);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});

test('Phase 10 Codex branch remains fail-open when Codex is unavailable', () => {
  const temp = mkdtempSync(join(tmpdir(), 'product-os-phase10-no-codex-'));
  const os = resolve(temp, 'product-os');
  try {
    cpSync(SOURCE_ROOT, os, { recursive: true, filter: (source) => !source.includes(`${join('node_modules')}`) && !source.includes(`${join('.git')}`) });
    const created = run(os, ['council:create', '--title', 'Fallback decision', '--question', 'Can the internal council continue without Codex?', '--type', 'other', '--impact', 'MEDIUM', '--reversibility', 'HIGH', '--option', 'CONTINUE', '--option', 'STOP']);
    const councilId = created.match(/(DEC-[0-9]{4,}) created/)?.[1];
    assert.ok(councilId, created);
    populateCouncil(os, councilId);
    run(os, ['council:update', councilId, '--status', 'SYNTHESIZED', '--evidence-quality', 'MEDIUM', '--confidence', '0.70']);
    const env = createUnavailableCodex(temp);
    const result = spawnSync(process.execPath, [CLI, 'codex:consult', councilId], { cwd: os, env, encoding: 'utf8' });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.match(`${result.stdout}\n${result.stderr}`, /Codex unavailable; continuing with internal council/);
    const council = YAML.parse(readFileSync(resolve(os, `.product/council/${councilId}/council.yaml`), 'utf8'));
    assert.equal(council.external_advisor.status, 'UNAVAILABLE');
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});
