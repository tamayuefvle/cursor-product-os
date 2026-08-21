# Agent Skills — Phase 5

These skills encode repeatable Product OS workflows. Skills are procedures; Subagents are independent specialist workers.

| Skill | Purpose | Automatic? |
|---|---|---|
| `intake-idea` | Capture a raw idea into the incubator | Yes |
| `research-problem` | Validate/falsify the problem hypothesis | Yes |
| `analyze-market` | Market + alternatives research | Yes |
| `evaluate-idea` | Recommend PROMOTE/PARK/KILL/RESEARCH-MORE | Yes |
| `run-decision-council` | Multi-agent difficult-decision review | Yes |
| `consult-codex` | Optional Codex CLI second opinion | Yes when warranted/available |
| `promote-product` | Bootstrap a human-approved one-product repo | **Explicit `/promote-product` only** |
| `create-prd` | Evidence-traceable PRD | Yes |
| `define-mvp` | Minimum learning-oriented MVP | Yes |
| `review-build-readiness` | G4 readiness review | Yes |

Each skill has a focused `SKILL.md` plus on-demand material under `references/` to keep the default context smaller.
