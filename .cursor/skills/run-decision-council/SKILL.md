---
name: run-decision-council
description: Run a structured, auditable multi-agent review for difficult, high-impact, low-reversibility, disputed, or human-gated product decisions. Use when confidence is low, evidence conflicts, specialists disagree, or the human requests independent opinions.
---
# Run Decision Council

Create independent views first, then synthesize. Never decide by simple majority vote.

## 1. Create the council workspace

Create one decision workspace before delegation:

```bash
npm run po -- council:create \
  --title "<short title>" \
  --question "<one precise decision question>" \
  --type <product|strategy|ux|architecture|security|release|other> \
  --impact <LOW|MEDIUM|HIGH> \
  --reversibility <LOW|MEDIUM|HIGH> \
  --option "<option A>" \
  --option "<option B>"
```

Add `--approval-action PROMOTE|KILL|PIVOT|READY_FOR_BUILD|RELEASE` when the decision controls a human-gated transition. The CLI then marks human approval as required.

The command creates `.product/council/DEC-####/` with a common context packet, independent opinion slots, synthesis, verification, and recommendation files.

## 2. Populate the factual packet

Write only established context to `context.md`:

- decision scope;
- FACTS / EVIDENCE with source paths or external sources;
- ASSUMPTIONS / INFERENCES separately;
- constraints;
- known unknowns.

Do not put council conclusions in the packet before independent reviews.

## 3. Delegate independent reviews

Select the smallest relevant set from:

- `problem-analyst`
- `market-researcher`
- `competitor-analyst`
- `business-analyst`
- `product-manager`
- `ux-strategist`
- `tech-lead`

Always include `devils-advocate` for high-impact or human-gated decisions. Run members independently and in parallel where possible. Give each the same context packet and options. Save each returned view to `.product/council/DEC-####/opinions/<agent>.md`.

Each opinion must include recommendation, evidence used, assumptions, strongest counterargument, risk, and confidence score.

## 4. Internal synthesis

Write `internal-synthesis.md` with:

- areas of agreement;
- material disagreements;
- hidden assumptions;
- missing evidence;
- reversibility analysis;
- preliminary recommendation;
- strongest counterargument;
- decision-support confidence.

Update the workspace only after independent opinions exist:

```bash
npm run po -- council:update DEC-#### --status SYNTHESIZED --evidence-quality <LOW|MEDIUM|HIGH> --confidence <0-1>
```

## 5. Optional Codex external review

When policy warrants independent external review, run:

```bash
npm run po -- codex:consult DEC-####
```

The command is fail-open. Missing CLI, auth failure, timeout, malformed output, sensitive-data detection, or any other Codex failure must not stop the council. A structured record is written under `.product/advisory/codex/DEC-####/`.

Use the Codex response as another opinion, never as authority.

## 6. Verify

Delegate the complete synthesis plus all opinions and any Codex response to `verifier`. Save the result to `verification.md`. The verifier checks evidence fidelity, opinion fidelity, unresolved contradictions, and governance boundaries. Then mark the verified state:

```bash
npm run po -- council:update DEC-#### --status VERIFIED
```

## 7. Recommend and, when allowed, record

Write `final-recommendation.md`, then mark the council `RECOMMENDED`:

```bash
npm run po -- council:update DEC-#### --status RECOMMENDED --confidence <0-1>
```

If human approval is required, stop at recommendation until explicit approval is received.

After an allowed decision is final, record it with:

```bash
npm run po -- council:record DEC-#### --decision "<chosen option>"
```

For a human-gated decision, use `--human-approved --approved-by human` only after explicit human approval has actually occurred.

The command writes the durable decision under `product/09-decisions/` and updates only `state.decisions.latest`; it does **not** change stage, build permission, or release permission.
