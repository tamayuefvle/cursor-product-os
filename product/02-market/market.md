# Market context

## Market

Cursor Product OS sits at the intersection of AI-assisted software development, lightweight product discovery, agent orchestration, and repository-native engineering governance. v1 is intentionally not positioned as a generic project-management suite or as a replacement for established product-management platforms. It is a workflow layer for developers and small product teams already working inside an AI coding environment.

The immediate opportunity is narrow: users who can build quickly with AI but need a repeatable way to preserve product reasoning, independent critique, human approval boundaries, and implementation provenance in the same repository as the product.

## Signals and evidence

- Modern AI coding workflows can generate implementation faster than a human can manually preserve every product decision; the v1 architecture was created specifically to manage that imbalance.
- Cursor provides repository rules, custom agents, skills, hooks, browser/agent workflows, and local/cloud execution surfaces that make a repository-native Product OS technically feasible.
- The v1 baseline audit exposed the cost of weak provenance inside the Product OS itself, strengthening the dogfooding case for deterministic product artifacts and release checks.
- The Product OS is framework-agnostic, allowing the product workflow to remain stable while each promoted product chooses its own implementation stack.

## Sources

Primary v1 sources are the current Cursor Product OS repository, its acceptance tests, and the Cursor/OpenAI product documentation consulted while designing the runtime. Numerical TAM/SAM/SOM estimates are intentionally omitted because v1 has not performed a defensible market-sizing study.

## Risks and uncertainties

- Product teams may prefer existing documentation/issue systems and see repository-native product governance as duplicated ceremony.
- Cursor platform capabilities can evolve, requiring migration of Rules, Skills, Hooks, or agent definitions.
- Solo developers may value speed over formal gates.
- Larger organizations may require permissions, compliance, analytics, integrations, and audit capabilities beyond v1.
- The product may remain best as an open repository template rather than becoming a hosted commercial platform.
