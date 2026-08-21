# Cursor Product OS — vNext Lab Architecture

Status: PROPOSED
Target: Experimental architecture derived from Cursor Product OS v1.0.0
Baseline: v1.0.0 remains immutable Stable Kernel
Primary objective: Learn from real Product Engineering work without allowing uncontrolled self-modification

---

## 1. Executive Decision

vNext Lab is not v1.1 Stable and is not a replacement for v1.0.0.

It is an experimental overlay around the v1.0.0 Stable Kernel that makes all planned v1.1–v2 capability hypotheses testable in one environment while preserving the v1 governance invariants.

The architectural goal is:

> Execute product-engineering work → observe outcomes → detect recurring friction → create evidence-backed improvement hypotheses → evaluate changes in isolation → require human approval for core evolution → distribute accepted improvements safely.

vNext Lab improves repository artifacts, orchestration, skills, rules, evaluations, adapters, and runtime behavior. It does not self-train or modify model weights.

---

## 2. Baseline that MUST NOT regress

vNext Lab inherits the v1.0.0 kernel unchanged unless a separate human-approved core migration is accepted.

The following remain constitutional invariants:

1. Repository Artifact is the durable Source of Truth.
2. Fact / Evidence / Assumption / Inference / Decision remain distinct.
3. AI cannot finalize PROMOTE / KILL / PIVOT / READY_FOR_BUILD / RELEASE.
4. PROMOTE requires recommendation + Verifier PASS + required evidence + human approval.
5. A promoted Product Repository starts at DISCOVERY / G1_PROBLEM with build=false and release=false.
6. One Product = one independent Repository.
7. Codex and other external advisors remain optional and fail-open.
8. Secrets and sensitive packets must be blocked before external transmission.
9. Protected governance state cannot be casually rewritten by Agent tools.
10. Catastrophic operations deny; destructive/high-impact operations require human approval.
11. Product OS Core remains framework-agnostic.
12. AI may propose weakening governance, but may never approve or apply that weakening itself.

These invariants are called the **Product OS Constitution** in vNext Lab.

---

## 3. Problem statement

Dogfooding of v1.0.0 produced the first meaningful product-level observation:

- v1.0 performs deep investigation well;
- its orchestration tends to converge around the initially framed problem;
- broader opportunity reframing, adjacent users, adjacent JTBD, alternative solution classes, non-product options, and contrarian directions are not surfaced strongly enough.

A second architectural problem exists: v1.0 contains a small bounded repair loop, but there is no durable system for learning across tasks, converting recurring friction into evals, comparing candidate improvements, and safely promoting improvements back into the OS.

A third problem is roadmap fragmentation: Research Intelligence, MCP, Cloud Agents, automation, and Product Intelligence UI were planned as sequential feature releases, even though their highest value may come from their interaction inside a learning system.

---

## 4. Goals

vNext Lab MUST:

- preserve all v1 invariants;
- add deliberate Diverge → Converge reasoning;
- adapt breadth and depth to the task;
- capture failures, friction, human corrections, missed perspectives, retries, and outcomes;
- distinguish repair from improvement from evolution;
- convert recurring observations into explicit findings and evaluation cases;
- support isolated capability experiments and rollback;
- learn across multiple Product Engineering task classes without leaking product-specific knowledge across repositories;
- make Research Intelligence, MCP, Cloud Agents, automation, and UI independently enableable;
- provide a safe upgrade path from accepted Lab capabilities into Product Repositories;
- expose why the OS changed and what evidence justified the change.

---

## 5. Non-goals

vNext Lab MUST NOT:

- autonomously rewrite the Product OS Constitution;
- self-approve a governance change;
- directly modify model weights;
- become a generic agent OS for arbitrary unrelated life/work tasks;
- treat every observation as a global lesson;
- automatically ship every improvement candidate;
- make MCP, Cloud Agents, Codex, or external SaaS a hard dependency;
- require a Product Intelligence UI for operation;
- optimize a single opaque "growth score";
- trade evidence integrity or safety for task completion rate.

---

## 6. Scope of learning

The supported learning domain is **Product Engineering**.

Task classes:

- IDEA_DISCOVERY
- PROBLEM_RESEARCH
- MARKET_RESEARCH
- COMPETITOR_ANALYSIS
- PRODUCT_STRATEGY
- PRODUCT_DEFINITION
- UX_DESIGN
- ARCHITECTURE
- IMPLEMENTATION
- CODE_REVIEW
- QA_TESTING
- DEBUGGING
- SECURITY_REVIEW
- RELEASE
- OPERATIONS
- DOCUMENTATION
- INCIDENT_ANALYSIS
- PROCESS_IMPROVEMENT

A lesson learned in one task class is not automatically generalized to another.

---

## 7. Architecture overview

```text
                         ┌──────────────────────────────┐
                         │      Human Control Plane     │
                         │ approval / override / review │
                         └──────────────┬───────────────┘
                                        │
              ┌─────────────────────────▼────────────────────────┐
              │            Product OS Constitution                │
              │ v1 invariants / protected governance / trust      │
              └─────────────────────────┬────────────────────────┘
                                        │
                     ┌──────────────────▼──────────────────┐
                     │       v1.0 Stable Kernel            │
                     │ State / Gates / Council / Promotion │
                     │ 9 Specialists / 10 Core Skills      │
                     │ Hooks / Schemas / CLI               │
                     └──────────────────┬──────────────────┘
                                        │
              ┌─────────────────────────▼────────────────────────┐
              │              vNext Capability Runtime             │
              │ feature flags / isolation / adapters / versions   │
              └───┬───────────┬───────────┬──────────┬───────────┘
                  │           │           │          │
        ┌─────────▼───┐ ┌────▼──────┐ ┌──▼──────┐ ┌▼──────────┐
        │ Reasoning   │ │ Research  │ │Connected│ │ Execution │
        │ Intelligence│ │Intelligence│ │Intel/MCP │ │ Cloud     │
        └─────────┬───┘ └────┬──────┘ └──┬──────┘ └┬──────────┘
                  └───────────┴───────────┴──────────┘
                                      │
                         ┌────────────▼─────────────┐
                         │   Experience Telemetry   │
                         │ traces / friction / eval │
                         └────────────┬─────────────┘
                                      │
                         ┌────────────▼─────────────┐
                         │ Learning & Eval Engine   │
                         │ OBS → FIND → EVAL → IMP │
                         └────────────┬─────────────┘
                                      │
                         ┌────────────▼─────────────┐
                         │ Improvement Sandbox      │
                         │ branch/worktree/cloud VM │
                         └────────────┬─────────────┘
                                      │
                         ┌────────────▼─────────────┐
                         │ Verification & Council   │
                         │ regression / DA / human  │
                         └────────────┬─────────────┘
                                      │
                       ACCEPT ────────┼──────── REJECT
                                      │
                         ┌────────────▼─────────────┐
                         │ Capability Registry      │
                         │ candidate→accepted→stable│
                         └──────────────────────────┘
```

---

## 8. Architectural layers

### 8.1 Constitution Layer

Highest-trust, human-controlled invariants.

Protected from automatic evolution.

Includes:

- human approval boundaries;
- evidence integrity rules;
- secret handling;
- protected-file policy;
- external advisor isolation;
- product repository boundary;
- decision provenance requirements;
- self-approval prohibition.

Any proposed Constitution change has lifecycle:

`PROPOSED → REVIEWED → HUMAN_APPROVED → MIGRATION_TESTED → APPLIED`

There is no autonomous APPLY path.

### 8.2 Stable Kernel

The v1.0 runtime remains the executable fallback.

Contains:

- Product Orchestrator;
- current 9 read-only specialists;
- current 10 core skills;
- State/Gate/Decision schemas;
- Decision Council;
- Incubator/Promotion;
- Hooks and shell guard;
- optional Codex adapter;
- baseline CLI.

The Stable Kernel can run when every Lab capability is disabled.

### 8.3 Capability Runtime

Optional behavior is packaged as independently versioned Capability Packs.

Required lifecycle:

`EXPERIMENTAL → CANDIDATE → ACCEPTED → STABLE → DEPRECATED`

Each capability declares:

- id;
- version;
- dependencies;
- supported task classes;
- required connectors;
- risk class;
- default state;
- metrics;
- eval suite;
- rollback behavior;
- migration behavior.

### 8.4 Experience Plane

Captures structured experience from Product Engineering work.

It records evidence of behavior, not hidden chain-of-thought.

Allowed telemetry:

- task metadata;
- input artifact references;
- selected workflow/capabilities;
- decisions and outcomes;
- verifier findings;
- retries;
- hook failures;
- human corrections;
- tool/connector failures;
- latency/cost where available;
- evaluation results;
- explicit user feedback.

Raw secrets and unrestricted conversation dumps are prohibited.

### 8.5 Learning & Evaluation Plane

Transforms experience into improvement evidence.

Pipeline:

`OBSERVATION → FINDING → IMPROVEMENT HYPOTHESIS → EVAL → EXPERIMENT → RESULT → DECISION`

No improvement is accepted because it "sounds better".

### 8.6 Execution Plane

Provides local and optional cloud execution.

Supported execution targets:

- LOCAL_CURSOR
- CURSOR_CLOUD
- LOCAL_CODEX_ADVISOR
- CI

Local Cursor remains sufficient for core operation.

### 8.7 Integration Plane

Adapters for MCP/external systems.

Examples:

- GitHub;
- Linear;
- Notion;
- Analytics;
- databases;
- AWS/cloud services.

Adapters are capability dependencies, never Stable Kernel dependencies.

### 8.8 Automation Plane

Optional scheduled/event-driven execution.

Valid examples:

- PR/CI follow-up;
- recurring evidence freshness checks;
- competitor change checks;
- experiment metric review;
- stale assumption review.

Automation can wake an agent but cannot bypass a human gate.

### 8.9 Product Intelligence Control Plane

UI is an observability and control surface, not the Source of Truth.

Repository artifacts remain authoritative.

Initial UI should be read-mostly and show:

- current products/ideas;
- decisions;
- evidence freshness;
- observations;
- recurring findings;
- capability experiments;
- accepted/rejected improvements;
- runtime versions;
- known weaknesses;
- open human approvals.

---

## 9. Capability packs

### CAP-001 Adaptive Reasoning

Purpose: correct premature convergence.

Adds:

- Diverge → Converge → Verify workflow;
- problem reframing;
- adjacent users;
- adjacent JTBD;
- adjacent market/category exploration;
- alternative solution classes;
- non-product option;
- contrarian option;
- adaptive breadth/depth.

Reasoning modes:

```text
Breadth: LIGHT | STANDARD | WIDE
Depth:   LIGHT | STANDARD | DEEP
```

Default heuristic:

- early discovery: WIDE / LIGHT;
- validated problem research: STANDARD / DEEP;
- high-impact architecture: STANDARD / DEEP;
- low-risk reversible change: LIGHT / LIGHT.

The existing 9 specialists remain. vNext first changes orchestration, not headcount.

### CAP-002 Experience & Learning

Purpose: make OS learning durable.

Adds OBS/FIND/IMP/EVAL/EXP artifacts and cross-task pattern detection.

### CAP-003 Bounded Self-Repair

Purpose: automatically repair known deterministic failures.

Safe repair classes include:

- generated artifact drift;
- schema-validatable formatting errors;
- manifest mismatch;
- deterministic validation failure where target state is known.

Repair limits:

- finite attempts;
- explicit test after repair;
- no governance weakening;
- escalation after limit.

### CAP-004 Research Intelligence

Adds:

- evidence ledger;
- citation metadata;
- source retrieval date;
- freshness policy;
- contradiction tracking;
- evidence quality;
- competitor/source re-check requests.

Research Intelligence must distinguish externally verified evidence from synthetic fixtures and AI hypotheses.

### CAP-005 Connected Intelligence

MCP/external connector adapter system.

Trust classes:

- READ_ONLY
- WRITE_REVERSIBLE
- WRITE_DESTRUCTIVE

Capabilities must declare required class. WRITE_DESTRUCTIVE always requires an explicit approval policy.

### CAP-006 Parallel Agent Runtime

Uses isolated subagents/cloud VMs when available.

Primary uses:

- independent research;
- independent adversarial review;
- regression testing;
- parallel implementation candidates;
- fresh-context verification.

Parallelism is optional. Deterministic synthesis and conflict handling remain in the Orchestrator.

### CAP-007 Continuous Operation

Uses event/schedule-based wakeups when available.

Every automation declares:

- trigger;
- scope;
- max run budget;
- allowed actions;
- stop condition;
- escalation condition;
- human-gated boundaries.

### CAP-008 Product Intelligence UI

Read-mostly dashboard/control plane built only after the underlying repository contracts are stable.

The UI never becomes required for CLI/agent workflows.

### CAP-009 Runtime Upgrade & Migration

Provides explicit runtime versioning and conflict-safe upgrades for promoted Product Repositories.

Rules:

- product artifacts are never overwritten;
- unmodified managed runtime files may upgrade automatically;
- locally modified managed runtime files become conflicts;
- migrations are idempotent;
- downgrade/rollback metadata is recorded.

---

## 10. Cross-repository learning

A Product Repository MUST NOT directly modify Product OS Core.

Learning crosses repository boundaries through a bounded Experience Bundle.

```text
Product Repo
   ↓
experience:export
   ↓
Sanitize + Validate + Hash
   ↓
Experience Bundle
   ↓
Product OS vNext Lab inbox
   ↓
Generalization Review
   ↓
OBS / FIND / EVAL candidate
```

An Experience Bundle contains references and summaries, not unrestricted repository contents.

A product-specific observation remains LOCAL by default.

Generalization states:

- LOCAL
- REPEATABLE
- CROSS_TASK
- CORE_CANDIDATE

A lesson may become CORE_CANDIDATE only when:

- it recurs across independent tasks/products; or
- it is a single high-severity safety/governance incident; and
- evidence is sufficient for reproduction/evaluation.

This prevents one Product's local preference from silently changing global OS behavior.

---

## 11. Learning artifacts

Proposed core types:

### Observation — OBS

What happened.

Required fields:

- id;
- timestamp;
- runtime_version;
- task_class;
- source_scope;
- type;
- description;
- evidence_refs;
- impact;
- capability_context;
- human_feedback when applicable.

Observation types include:

- DEFECT
- FRICTION
- CONTEXT_LOSS
- MISSED_PERSPECTIVE
- REDUNDANCY
- GATE_BYPASS_ATTEMPT
- LOW_REVIEW_YIELD
- HUMAN_CORRECTION
- CONNECTOR_FAILURE
- RESEARCH_STALENESS
- COST_REGRESSION
- LATENCY_REGRESSION

### Finding — FIND

A repeated or high-impact pattern derived from observations.

Must list source OBS ids and alternative explanations.

### Improvement Proposal — IMP

A concrete candidate change.

Must include:

- target capability/runtime artifact;
- expected benefit;
- strongest counterargument;
- affected invariants;
- rollback plan;
- required evals;
- risk classification.

### Evaluation Case — EVAL

A reproducible test of desired behavior.

Evaluation types:

- deterministic;
- rubric-based;
- comparative;
- regression;
- security/governance.

### Experiment — EXP

Runs a capability/config change against defined evals.

### Result — RES

Stores before/after outcomes and side effects.

---

## 12. Self-improvement loops

### Loop A — Task Loop

```text
Understand State
→ Select task class
→ Select capabilities
→ Execute
→ Verify
→ Persist product artifacts
→ Emit experience
```

### Loop B — Repair Loop

```text
Failure
→ classify
→ deterministic target state exists?
   YES → bounded repair → test → success/escallate
   NO  → create Observation
```

Repair does not change policy.

### Loop C — Improvement Loop

```text
Observations
→ pattern detection
→ Finding
→ Improvement Proposal
→ create/update Eval
→ sandbox experiment
→ regression suite
→ Verifier + Devil's Advocate
→ recommendation
```

### Loop D — Evolution Loop

```text
Accepted Improvement recommendation
→ impact/reversibility classification
→ Decision Council when required
→ Human Approval for protected/core change
→ merge/apply
→ runtime version update
→ post-change dogfood
→ watch regression
→ KEEP or ROLLBACK
```

No loop is unbounded.

---

## 13. Improvement authority model

### L0 Observe

May record telemetry/observations.

### L1 Repair

May automatically restore known valid states inside a bounded scope.

### L2 Improve

May generate patches, branches/worktrees, evals, experiments, and recommendations.

Cannot merge protected core changes without policy authorization.

### L3 Evolve

Changes Agents, Skills, Rules, Hooks, Gates, schemas, CLI, capability contracts, or upgrade semantics.

Requires human approval when risk or policy indicates.

### L4 Constitution

Human-only apply.

AI may analyze and propose but never approve/apply autonomously.

---

## 14. Evaluation and fitness model

There is no single Growth Score.

Required dimensions:

### Quality

- decision usefulness;
- verifier pass rate;
- defect escape rate;
- human correction rate;
- rework rate.

### Reasoning

- perspective coverage;
- evidence/assumption separation;
- falsification quality;
- alternative coverage;
- decision clarity.

### Execution

- task completion;
- repair success;
- retry count;
- regression rate;
- latency/cost budget.

### Research

- citation completeness;
- freshness;
- source quality;
- contradiction resolution;
- unsupported-claim rate.

### Governance — hard constraints

- human gate bypass = 0;
- secret exfiltration = 0;
- protected-state unauthorized mutation = 0;
- product-boundary violation = 0.

An experiment cannot be accepted if a hard constraint regresses, regardless of gains elsewhere.

---

## 15. Capability experiment model

All Lab capabilities support configuration isolation.

Example:

```yaml
lab:
  enabled: true
  profile: dogfood

capabilities:
  adaptive_reasoning:
    enabled: true
    version: 0.1.0
    breadth: WIDE
    depth: STANDARD

  learning:
    enabled: true
    version: 0.1.0

  research_intelligence:
    enabled: true
    version: 0.1.0

  connected_intelligence:
    enabled: false

  cloud_runtime:
    enabled: false

  continuous_operation:
    enabled: false

  intelligence_ui:
    enabled: false
```

Evaluation supports A/B-style profile comparison when tasks can be replayed safely:

- BASELINE: all Lab features off;
- REASONING_ONLY;
- LEARNING_ONLY;
- RESEARCH_ONLY;
- FULL_LAB.

---

## 16. Agent model

v1's 9 read-only specialist Subagents remain Core and preserve the v1 invariant.

vNext Lab SHOULD NOT initially add permanent specialist roles.

Instead:

- Capability Packs alter orchestration instructions;
- ephemeral experiment reviewers may be created as isolated task roles;
- cloud subagents are execution instances, not new organizational roles;
- a permanent new specialist requires evidence that existing roles cannot cover the recurring need.

This avoids "agent count growth" being mistaken for capability growth.

---

## 17. Skill model

The v1 10 Skills remain Core Skills.

Lab capabilities introduce **Lab Skills** in a separate namespace and are excluded from the v1 10-skill invariant.

Initial Lab Skills:

- expand-perspective
- capture-observation
- analyze-learning-pattern
- design-eval
- run-improvement-experiment
- review-improvement
- export-experience
- ingest-experience
- review-evidence-freshness
- plan-runtime-upgrade

A Lab Skill graduates into Core only via an accepted migration decision.

---

## 18. Proposed repository structure

```text
.
├── AGENTS.md                         # v1 Stable Orchestrator entry
├── .cursor/
│   ├── rules/                        # Core rules
│   ├── agents/                       # 9 Core specialists
│   ├── skills/                       # 10 Core skills
│   ├── lab-skills/                   # experimental skills
│   ├── hooks/
│   └── hooks.json
│
├── .product/
│   ├── state.yaml
│   ├── gates.yaml
│   ├── council-policy.yaml
│   ├── artifact-policy.json
│   ├── constitution.yaml             # protected v1 invariants
│   ├── runtime-version.yaml
│   ├── capabilities.yaml
│   ├── council/
│   ├── advisory/
│   └── lab/
│       ├── observations/
│       ├── findings/
│       ├── improvements/
│       ├── evals/
│       ├── experiments/
│       ├── results/
│       ├── experience-inbox/
│       └── runtime/                  # transient, gitignored where appropriate
│
├── capabilities/
│   ├── adaptive-reasoning/
│   ├── learning/
│   ├── self-repair/
│   ├── research-intelligence/
│   ├── connected-intelligence/
│   ├── parallel-runtime/
│   ├── continuous-operation/
│   ├── product-intelligence-ui/
│   └── runtime-upgrade/
│
├── evals/
│   ├── baseline/
│   ├── reasoning/
│   ├── research/
│   ├── execution/
│   ├── governance/
│   └── regression/
│
├── incubator/
├── product/
├── schemas/
├── scripts/
├── tests/
├── templates/product-repository/
└── docs/
    └── vnext/
```

---

## 19. CLI design

Core commands remain compatible.

Lab adds:

```text
po lab:status
po lab:doctor
po capability:list
po capability:status <id>
po capability:enable <id>
po capability:disable <id>

po observe:new
po observe:list
po finding:analyze
po improvement:create
po improvement:status <id>

po eval:list
po eval:run [suite|id]
po experiment:create
po experiment:run <id>
po experiment:compare <id>

po experience:export
po experience:ingest <bundle>

po resume
po transition:check <action>
po transition <action>

po upgrade:check
po upgrade
po upgrade:rollback
```

High-risk CLI actions reuse human approval metadata and protected mutation paths.

---

## 20. Hooks and telemetry design

Existing v1 Phase 8 hooks remain.

vNext adds observation hooks only where supported and useful.

Potential events:

- postToolUseFailure → connector/tool failure observation;
- subagentStart/subagentStop → parallel execution metadata;
- afterAgentResponse → task completion telemetry;
- preCompact → persistence reminder for long sessions;
- stop → bounded quality/repair logic.

Hooks record explicit events and results, never private hidden reasoning.

Cloud portability requires repository-level command hooks only for mandatory behavior.

---

## 21. Research Intelligence contract

Each significant external evidence item SHOULD contain:

```yaml
evidence_id: EV-0001
claim: "..."
source:
  url: "..."
  title: "..."
  publisher: "..."
retrieved_at: "..."
published_at: "..."
source_type: PRIMARY | SECONDARY | COMMUNITY
freshness_class: VOLATILE | MODERATE | STABLE
supports:
  - HYP-0001
contradicts: []
confidence: HIGH | MEDIUM | LOW
```

Freshness checks create observations; they do not silently rewrite decisions.

---

## 22. MCP / Connector trust model

Connector manifest:

```yaml
id: github
mode: READ_ONLY
required: false
allowed_operations:
  - search
  - read
blocked_operations:
  - destructive_write
fallback: LOCAL_ONLY
```

The Orchestrator selects connectors based on declared task need, not because a connector exists.

External connectors cannot directly mutate protected Product OS governance.

---

## 23. Cloud Agent model

Cloud execution is an accelerator, not a dependency.

Use cases:

- parallel independent reviews;
- long-running research;
- isolated regression tests;
- PR/CI follow-up;
- candidate implementation comparison.

Required behavior:

- fresh isolated context;
- bounded task packet;
- repository/branch isolation;
- results returned as structured artifacts;
- parent Orchestrator performs synthesis;
- cloud unavailable → local workflow continues.

---

## 24. Continuous operation model

Recurring agents are allowed only for explicit bounded responsibilities.

Example subscription:

```yaml
id: AUTO-001
purpose: competitor freshness check
trigger:
  type: SCHEDULE
  cadence: WEEKLY
scope:
  product: PRODUCT-001
allowed_actions:
  - READ_WEB
  - WRITE_OBSERVATION
  - PROPOSE_UPDATE
forbidden_actions:
  - CHANGE_GATE
  - RELEASE
  - PROMOTE
stop_condition:
  - capability disabled
escalation:
  - material contradiction found
```

---

## 25. Product Intelligence UI contract

The UI reads normalized repository contracts.

Initial pages:

1. Overview
2. Products / Ideas
3. Evidence & Freshness
4. Decisions
5. Learning
6. Experiments
7. Capabilities
8. Runtime / Upgrade
9. Pending Human Approvals

The UI MAY invoke CLI-backed commands later, but direct file mutation is prohibited.

---

## 26. Runtime upgrade model

Each managed Product Repository records:

```yaml
product_os:
  kernel_version: 1.0.0
  capability_profile: stable
  capability_versions: {}
  last_upgrade: null
```

Lab Product Repositories can additionally pin capability versions.

Upgrade algorithm:

1. validate current repository;
2. compare managed-file hashes;
3. calculate migration plan;
4. stop on local conflicts;
5. apply into staging/worktree;
6. run baseline + migration regression tests;
7. human review when required;
8. atomic apply;
9. record migration Decision/Result;
10. retain rollback metadata.

---

## 27. Security model

Threats specific to self-improvement:

- governance bypass framed as optimization;
- reward/eval gaming;
- poisoned external evidence;
- malicious MCP content/prompt injection;
- secret leakage in experience bundles;
- self-modification loops;
- one-product overfitting;
- capability dependency escalation;
- destructive automation.

Mandatory controls:

- Constitution hard boundary;
- multi-dimensional fitness, not single reward;
- independent Verifier/Devil's Advocate review;
- external-source trust metadata;
- secret scanning before export/advisory;
- bounded repair/automation loops;
- capability least privilege;
- regression suites;
- human approval for high-impact low-reversibility changes.

---

## 28. vNext Lab development phases

### Phase 11 — Lab Foundation

- freeze/tag v1.0.0 baseline;
- Constitution artifact/schema;
- runtime version;
- Capability registry/config;
- Lab namespace;
- baseline regression suite.

### Phase 12 — Adaptive Reasoning

- Perspective Expansion;
- Diverge/Converge orchestration;
- breadth/depth heuristic;
- missed-perspective eval suite.

### Phase 13 — Experience & Learning

- OBS/FIND/IMP/EVAL/EXP/RES schemas;
- experience capture;
- pattern analysis;
- cross-repo Experience Bundles.

### Phase 14 — Self-Repair & Improvement Sandbox

- repair taxonomy;
- bounded automatic repair;
- worktree/branch experiments;
- before/after comparison;
- rollback.

### Phase 15 — Research Intelligence

- Evidence Ledger;
- citation/freshness contracts;
- contradiction tracking;
- research evals.

### Phase 16 — Connected & Parallel Runtime

- MCP adapter contracts;
- connector trust classes;
- optional Cloud Agents;
- isolated parallel review.

### Phase 17 — Continuous Operation

- event/scheduled automation contracts;
- budgets/stop conditions;
- stale evidence / CI / experiment review scenarios.

### Phase 18 — Intelligence UI & Graduation

- read-mostly UI;
- capability experiment history;
- v1.1 graduation council;
- upgrade/migration hardening;
- vNext acceptance suite.

---

## 29. vNext acceptance criteria

### Baseline compatibility

- all v1.0 acceptance invariants remain PASS;
- Stable Kernel runs with Lab disabled;
- existing Product Repositories are not forced to upgrade.

### Reasoning

- early-stage tasks can produce materially distinct reframes before convergence;
- alternatives are labeled hypothesis/inference, never fabricated fact;
- breadth does not eliminate depth after direction selection.

### Learning

- observations require evidence references;
- findings trace to observations;
- improvements trace to findings/evals;
- accepted changes have before/after results.

### Repair

- repair loops are bounded;
- failed repair escalates;
- repair cannot modify Constitution/protected policy.

### Evolution

- AI cannot self-approve protected/core changes;
- Constitution changes require explicit human apply;
- every accepted improvement is reversible or has explicit irreversible-risk approval.

### Cross-repo safety

- experience export is sanitized and schema-validated;
- Product Repo cannot directly mutate Core;
- product-specific findings do not automatically become global.

### Research

- important claims can carry source/freshness metadata;
- stale/contradictory evidence is surfaced rather than silently overwritten.

### Connectors/cloud

- unavailable optional integrations fail open;
- connector permissions are explicit;
- remote agents cannot bypass kernel gates.

### Automation

- every automation has scope, budget, stop, escalation, and forbidden actions;
- automation cannot finalize human-gated transitions.

### Upgrade

- migration is idempotent;
- product artifacts are preserved;
- local managed-file conflicts stop safely;
- rollback is tested.

---

## 30. Dogfooding program

Do not judge vNext only on synthetic acceptance tests.

Recommended initial program: 12–20 real tasks across at least 6 task classes.

Suggested mix:

- 3 Idea/Discovery tasks;
- 2 external Research tasks;
- 2 Product Definition/PRD tasks;
- 2 Architecture decisions;
- 3 Implementation/Debugging tasks;
- 2 QA/Regression tasks;
- 1 Security/Release task;
- 1 Process/OS-improvement task.

For replayable tasks, compare Stable Kernel against one capability at a time before FULL_LAB.

Primary first experiment:

> Does Adaptive Reasoning increase materially useful opportunity breadth without increasing unsupported claims, decision paralysis, or research cost beyond an acceptable level?

---

## 31. Graduation policy: vNext Lab → v1.1 Stable

v1.1 is not defined by implementation completeness.

A capability graduates only when:

1. a real problem/observation exists;
2. a reproducible eval exists;
3. the change improves target dimensions;
4. governance/security hard constraints do not regress;
5. strongest counterargument has been reviewed;
6. migration/rollback is viable;
7. Verifier passes;
8. Decision Council is used when impact/reversibility requires it;
9. human approves Stable graduation.

Possible outcomes:

- GRADUATE_TO_V1_1
- KEEP_EXPERIMENTAL
- REVISE
- PARK
- REJECT

---

## 32. First formal decisions to record

Recommended Decision records:

### DEC-0004 — Establish vNext Lab Architecture

Decision: keep v1.0.0 as Stable Kernel and create vNext Lab as a capability-based experimental overlay.

### DEC-0005 — Product OS Constitution Boundary

Decision: self-improvement may propose changes to any layer, but protected constitutional changes cannot be self-approved/applied.

### DEC-0006 — Evidence-Based Graduation

Decision: v1.1 scope is determined by validated Lab capabilities, not by the old sequential feature roadmap.

---

## 33. Final architecture principle

v1.0 established:

> Think before Build.

vNext Lab adds:

> Explore broadly → Think deeply → Act safely → Observe outcomes → Learn from evidence → Improve experimentally → Evolve with approval.

The OS should become more capable because it accumulates tested product-engineering experience, not because it accumulates more prompts, agents, or features.
