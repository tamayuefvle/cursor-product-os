import { emit, readHookInput } from './hook-utils.mjs';

const input = await readHookInput();
const command = String(input.command || '').trim();

const denyRules = [
  ['catastrophic recursive deletion', /(?:^|[;&|]\s*)rm\s+[^\n]*-[^\n]*r[^\n]*f[^\n]*\s+(?:\/\s*$|~(?:\/|\s|$)|\.\.(?:\/|\s|$))/i],
  ['filesystem formatting', /\bmkfs(?:\.[a-z0-9]+)?\b/i],
  ['raw device overwrite', /\bdd\b[^\n]*\bof=\/dev\//i],
  ['fork bomb', /:\s*\(\s*\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;\s*:/],
  ['system power command', /(?:^|[;&|]\s*)(?:shutdown|poweroff|reboot)\b/i],
  ['public repository visibility change', /(?:\bgh\b|\borigin\b)[^\n]*(?:--public\b|--visibility\s+public\b|\bvisibility\s+public\b)/i],
  ['GitHub repository create without explicit private', /\bgh\s+repo\s+create\b(?![^\n]*--(?:private|internal))/i],
];

const askRules = [
  ['human-gated Product OS promotion', /(?:npm\s+run\s+po\b[^\n]*\bpromote\b|npm\s+run\s+product:promote\b|node\s+scripts\/product-os\.mjs\s+promote\b)/i],
  ['human-gated Product OS public visibility', /(?:npm\s+run\s+po\b[^\n]*\bvisibility:set-public\b|node\s+scripts\/product-os\.mjs\s+visibility:set-public\b)/i],
  ['GitHub/Origin repository create or visibility change', /\b(?:gh\s+repo\s+(?:create|edit|visibility)|origin\s+repo(?:s)?\s+create)\b/i],
  ['recursive deletion', /(?:^|[;&|]\s*)rm\s+[^\n]*-[^\n]*r/i],
  ['discard Git working tree', /\bgit\s+(?:reset\s+--hard|clean\s+-[^\s]*f|checkout\s+--\s+\.|restore\s+(?:--worktree\s+)?\.)\b/i],
  ['force Git push', /\bgit\s+push\b[^\n]*(?:--force(?:-with-lease)?|\s-f(?:\s|$))/i],
  ['delete Git branch', /\bgit\s+branch\s+-D\b/],
  ['destructive SQL', /\b(?:DROP\s+(?:DATABASE|SCHEMA|TABLE)|TRUNCATE\s+(?:TABLE\s+)?)\b/i],
  ['infrastructure destroy', /\b(?:terraform\s+destroy|pulumi\s+destroy)\b/i],
  ['destructive Kubernetes operation', /\bkubectl\s+delete\s+(?:namespace|ns|all)\b/i],
  ['Docker prune', /\bdocker\s+(?:system|volume)\s+prune\b/i],
  ['production deploy or publish', /\b(?:vercel\b[^\n]*--prod|netlify\s+deploy\b[^\n]*--prod|firebase\s+deploy\b|npm\s+publish\b|pnpm\s+publish\b|yarn\s+npm\s+publish\b|gh\s+release\s+create\b|terraform\s+apply\b|kubectl\s+apply\b)/i],
];

const protectedMutation = /(?:\.product\/(?:state\.yaml|gates\.yaml|council-policy\.yaml|artifact-policy\.json|constitution\.yaml|visibility\.yaml)|\.cursor\/hooks\.json)/i;
const shellWrite = /(?:>>?|\btee\b|\bsed\s+-i\b|\bperl\s+-pi\b|\brm\b|\bmv\b|\bcp\b)/i;
if (protectedMutation.test(command) && shellWrite.test(command) && !/scripts\/product-os\.mjs|npm\s+run\s+po\b/.test(command)) {
  emit({
    permission: 'deny',
    user_message: 'Direct shell mutation of Product OS governance files is blocked.',
    agent_message: 'Use the Product OS CLI or an approved governance workflow instead of shell redirection/mutation for protected Product OS files.',
  });
  process.exit(0);
}

for (const [label, regex] of denyRules) {
  if (regex.test(command)) {
    emit({
      permission: 'deny',
      user_message: `Blocked by Product OS shell guard: ${label}.`,
      agent_message: `This command matches a hard-deny safety rule (${label}). Choose a non-destructive alternative or ask the human to perform the operation outside the agent workflow.`,
    });
    process.exit(0);
  }
}

for (const [label, regex] of askRules) {
  if (regex.test(command)) {
    emit({
      permission: 'ask',
      user_message: `Product OS requires explicit approval before: ${label}.`,
      agent_message: `This command is potentially destructive or externally consequential (${label}). Explain why it is needed and wait for explicit human approval.`,
    });
    process.exit(0);
  }
}

emit({ permission: 'allow' });
