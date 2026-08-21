# G4 build-readiness checklist

Check against the repository's authoritative `.product/gates.yaml`; this checklist is a human-readable supplement.

At minimum verify:

- Product problem and target user are explicit and traceable to evidence.
- PRD defines outcomes, required capabilities, constraints, risks, and non-goals.
- MVP scope tests a specific risky assumption and has clear IN/OUT boundaries.
- Critical user journey is coherent enough to implement/test.
- Architecture is proportional to MVP and identifies meaningful security/privacy/operational risks.
- Required technical spikes are complete or explicitly accepted as risk.
- Success/failure measurement is defined.
- No unresolved decision silently blocks implementation.
- Devil's Advocate objections have responses or are consciously accepted.
- Verifier found no blocking artifact/evidence gaps.
- Human approval is still required for `READY_FOR_BUILD`.
