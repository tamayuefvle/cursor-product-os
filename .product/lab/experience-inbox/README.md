# experience-inbox

Git-tracked Lab inbox for **repository-safe** experience only.

Admission rule: `status: REPOSITORY_SAFE` after scan and redaction/generalization. RAW files, secrets, PII, and client data are rejected.

Use:

```bash
npm run po -- experience:scan <raw-file>
npm run po -- experience:sanitize <raw-file>
npm run po -- experience:ingest <safe-or-raw-file>
```

`experience:ingest` is a boundary gate, not a learning engine. It does not create Findings or change Core behavior.
