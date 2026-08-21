# Codex independent review contract

The executable adapter assembles this contract automatically from a Decision Council workspace.

Codex receives only the prepared packet, not an instruction to inspect the repository. The response must conform to `schemas/codex-advisor-response.schema.json` with these fields:

- `recommended_option`
- `supporting_argument`
- `opposing_argument`
- `hidden_assumptions[]`
- `missing_evidence[]`
- `overlooked_risks[]`
- `confidence` (0-100 decision-support score)
- `change_evidence[]`

The Orchestrator must compare this response against repository evidence. Codex is advisory only.
