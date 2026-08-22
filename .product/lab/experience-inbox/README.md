# experience-inbox

Local-only inbox for **pattern-redacted** experience. This directory is gitignored except this README.

Admission after `po experience:scan` / `po experience:sanitize` / `po experience:ingest`:

```yaml
status: LOCAL_SANITIZED
classification: PATTERN_REDACTED
publication_allowed: false
```

New files use an opaque `source_id` and filename `EXP-LOCAL-<32-hex>.md`. They must not store the RAW basename. Local RAW filename mapping, if needed, stays only under gitignored `experience-raw/`.

Legacy `status: REPOSITORY_SAFE` and `EXP-SAFE-<32-hex>.md` remain readable locally. New output must not use those names. `experience:ingest` accepts them read-only and must not rewrite, rename, or copy them.

`LOCAL_SANITIZED` means pattern redaction passed. It does **not** mean the artifact may be committed to Public Product OS. Semantic private context can survive pattern scan. Public durable artifacts are generalized observations and findings only.

`po experience:ingest` is a boundary gate, not a learning engine. It does not create Findings or change Core behavior.

Use:

```bash
npm run po -- experience:scan <raw-file>
npm run po -- experience:sanitize <raw-file>
npm run po -- experience:ingest <safe-or-raw-file>
```
