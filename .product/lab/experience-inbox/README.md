# experience-inbox

Git-tracked Lab inbox for **repository-safe** experience only.

Admission rule: `status: REPOSITORY_SAFE` after scan and redaction/generalization. RAW files, secrets, PII, client data, and RAW filenames are rejected.

Tracked artifacts use an opaque `source_id` and filename `EXP-SAFE-<32-hex>.md`. They must not store the RAW basename. Local RAW filename mapping, if needed, stays only under gitignored `experience-raw/`.

Use:

```bash
npm run po -- experience:scan <raw-file>
npm run po -- experience:sanitize <raw-file>
npm run po -- experience:ingest <safe-or-raw-file>
```

`experience:ingest` is a boundary gate, not a learning engine. It does not create Findings or change Core behavior.
