# Validation Hypotheses

## Hypothesis 1 — Continuity

If product state, evidence, and decisions remain repository-native, a user can resume a long-running Cursor product effort without reconstructing the product rationale from prior chat history.

### Test / experiment
Dogfood v1 on at least one real product idea and attempt to resume work from repository artifacts only after a meaningful gap.

### Decision
If key rationale cannot be reconstructed, identify the missing artifact class and change the smallest part of the workflow that fixes it.

## Hypothesis 2 — Guardrails

Human gates and runtime hooks prevent accidental irreversible actions without causing routine bypass behavior.

### Test / experiment
Track blocked/asked commands and human-gated decisions during dogfooding. Record whether users circumvent the workflow because it is too cumbersome.

### Decision
Reduce ceremony or improve CLI ergonomics before adding more controls if bypass behavior becomes common.

## Hypothesis 3 — Independent review

Devil's Advocate, Verifier, and optional Codex review surface materially different assumptions on difficult decisions.

### Test / experiment
For high-impact decisions, record whether independent review changes the final option, reveals missing evidence, or only restates existing arguments.

### Decision
Keep or simplify review layers based on observed decision value.
