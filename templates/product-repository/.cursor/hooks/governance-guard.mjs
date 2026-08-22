import { collectLikelyPaths, emit, normalizedRelativeCandidate, readHookInput } from './hook-utils.mjs';

const PROTECTED = new Set([
  '.product/state.yaml',
  '.product/gates.yaml',
  '.product/council-policy.yaml',
  '.product/artifact-policy.json',
  '.product/constitution.yaml',
  '.product/visibility.yaml',
  '.cursor/hooks.json',
]);

const input = await readHookInput();
const tool = String(input.tool_name || '');
if (!['Write', 'Delete'].includes(tool)) {
  emit({ permission: 'allow' });
  process.exit(0);
}

const candidates = collectLikelyPaths(input.tool_input || {}).map(normalizedRelativeCandidate);
const hit = candidates.find((candidate) => PROTECTED.has(candidate));
if (!hit) {
  emit({ permission: 'allow' });
  process.exit(0);
}

emit({
  permission: 'deny',
  user_message: `Product OS governance file is protected from direct Agent ${tool}: ${hit}`,
  agent_message: `Do not directly ${tool.toLowerCase()} ${hit}. Use the Product OS CLI / approved governance workflow so validation and human-gate rules remain auditable.`,
});
