---
name: research-problem
description: Validate and falsify an incubator or product problem hypothesis. Use before G1 PROBLEM, when user pain is weakly evidenced, or when a solution appears to be driving the problem definition.
---
# Research Problem

Build the minimum evidence package needed to judge whether the stated problem deserves further investment.

## Workflow

1. Read the current idea/product state and existing `problem.md`, `evidence.md`, and assumptions.
2. Invoke `/problem-analyst` with the exact known context and evidence.
3. When public facts or behavior can be researched, gather external evidence and record source + date.
4. Look specifically for disconfirming evidence and acceptable workarounds.
5. Update `problem.md` and `evidence.md` only with claims supported by the returned analysis or cited research.
6. Keep unsupported statements explicitly labeled `ASSUMPTION`.
7. Invoke `/verifier` before recommending G1 readiness.

## G1 recommendation criteria

Recommend G1 only when there is enough evidence to articulate:

- who has the problem;
- in what context;
- what they do today;
- why the current state is meaningfully costly/painful/risky;
- what remains uncertain.

Artifact existence alone is not sufficient.
