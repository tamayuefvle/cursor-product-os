import { emit, loadStatus, readHookInput } from './hook-utils.mjs';

await readHookInput();
const status = loadStatus();
const failures = Object.entries(status.checks || {})
  .filter(([, check]) => check.level === 'error')
  .map(([key, check]) => ({ key, ...check }));

if (!failures.length) {
  emit({});
  process.exit(0);
}

const lines = failures.slice(0, 8).map((failure) => {
  const detail = (failure.messages || []).join('; ');
  return `- ${failure.file || failure.key}: ${detail}`;
});

emit({
  followup_message: `Product OS guardrails found unresolved validation errors. Repair these before concluding the task, without weakening or bypassing the guards:\n${lines.join('\n')}\nAfter the fixes, re-run the relevant validation or edit the artifact so the hook status is refreshed.`,
});
