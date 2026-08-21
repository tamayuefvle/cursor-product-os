# Custom Subagents — Phase 4

The main Cursor Agent is the **Product Orchestrator**. These nine specialist subagents provide independent, context-isolated analysis and return recommendations to the Orchestrator.

All v1 Product OS specialists are `readonly: true`: durable repository writes, state changes, and gate transitions remain centralized in the Orchestrator.

| Subagent | Primary responsibility |
|---|---|
| `problem-analyst` | Problem framing and falsification |
| `market-researcher` | Market evidence and external context |
| `competitor-analyst` | Full alternative landscape |
| `business-analyst` | Product economics and business-model assumptions |
| `product-manager` | Product strategy/requirements synthesis |
| `ux-strategist` | JTBD, IA, flows, friction and accessibility |
| `tech-lead` | Feasibility and proportional architecture |
| `devils-advocate` | Adversarial review and anti-confirmation-bias |
| `verifier` | Independent completeness/gate verification |

Cursor may delegate automatically based on descriptions, or the Orchestrator can explicitly invoke a specialist by name.
