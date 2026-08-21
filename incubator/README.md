# Incubator

The Incubator holds multiple early ideas before they deserve an independent product repository.

Lifecycle:

`INBOX → FRAMING → RESEARCHING → EVALUATING → PROMOTE | PARK | KILL`

`PROMOTE` and `KILL` require explicit human approval.

## Create an idea

```bash
npm run po -- idea:new \
  --title "Idea title" \
  --user "Target user hypothesis" \
  --problem "Problem hypothesis"
```

Each idea receives structured discovery artifacts plus `promotion-readiness.yaml`.

## Promotion readiness

`promotion-readiness.yaml` deliberately separates:

- Agent recommendation;
- Verifier result and blocking gaps;
- Human approval;
- Resulting promoted product identity.

A recommendation or confidence score never substitutes for human approval.

```bash
npm run po -- promote:check IDEA-0001 --destination ../my-product
```

After explicit approval:

```bash
npm run po -- promote IDEA-0001 \
  --destination ../my-product \
  --name "My Product" \
  --human-approved \
  --approved-by human
```

Promotion refuses existing destinations and destinations inside this Product OS repository.
