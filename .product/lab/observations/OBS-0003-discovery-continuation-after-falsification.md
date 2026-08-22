---
id: OBS-0003
timestamp: "2026-08-22T12:20:00Z"
runtime_version: 1.0.0
task_class: IDEA_DISCOVERY
source_scope: LOCAL
type: PROCESS_GAP
impact: MEDIUM
capability_context:
  - STABLE_KERNEL
human_feedback: true
evidence_refs:
  - USER-DOGFOOD-REVIEW-2026-08-22
  - .cursor/skills/research-problem/SKILL.md
---

# OBS-0003 — Discovery continuation after falsification

## Observation

During Phase 11 dogfooding of idea-stage Discovery, orchestration continued asking follow-up questions on adjacent channels after a stated falsifier had already closed the original channel. The `research-problem` skill states when G1 may be recommended. It does not state when questioning must stop after G1 is not recommended.

## Supported interpretation

v1 Discovery is stronger at deepening the current frame than at halting after falsification. Breadth (OBS-0001) and stop-after-falsification are related but not the same gap. This observation records the stop-condition gap only.

## Improvement hypothesis

Add an explicit Discovery stop rule: after a channel is falsified or the next question is none, do not reopen that channel and do not automatically migrate questioning into an adjacent channel. Compare any later skill change against the v1.0 Stable Kernel.

This hypothesis is recorded. Phase 11.2 does not implement a Discovery stop-rule.

## First eval question

Does an explicit stop-after-falsification rule reduce continued probing without blocking legitimate new evidence that arrives unsolicited?

## Deferred

Not implemented in Phase 11.2: Discovery stop-rule text, Adaptive Reasoning (Phase 12), or CAP-001 enablement.
