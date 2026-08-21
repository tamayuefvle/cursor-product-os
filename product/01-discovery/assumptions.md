# Assumptions

## Critical assumptions

### ASM-001 — Repository-first continuity
Repository artifacts will make long-running AI-assisted product work more coherent and recoverable than relying on chat history as the primary source of truth.

Status: OPEN. The baseline packaging defect provides supporting evidence, but sustained dogfooding is still required.

### ASM-002 — Optional external review
Codex CLI can improve difficult decisions as an independent external advisor without becoming a mandatory runtime dependency.

Status: OPEN. The adapter and fail-open behavior are implemented; decision-quality benefit still needs measurement.

### ASM-003 — Gates remain lightweight enough
Explicit product gates and human approvals will prevent premature irreversible actions without creating enough friction that users routinely bypass the system.

Status: OPEN.

### ASM-004 — Repository template portability
A promoted product can remain independently useful after it leaves the Product OS incubator because Rules, Agents, Skills, Hooks, Schemas, CLI, and provenance travel with the repository.

Status: PARTIALLY VALIDATED by template parity and promotion tests; real product dogfooding remains required.

## Review rule

Assumptions must be changed to VALIDATED or INVALIDATED only when the repository contains the supporting evidence or decision record. Confidence values are decision-support scores, not probabilities.
