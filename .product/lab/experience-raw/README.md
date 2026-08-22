# experience-raw

RAW experience lives here only. This directory is gitignored except this README.

Do not commit:

- secrets, tokens, keys, `.env` contents;
- names, emails, phone numbers, or other PII;
- client identifiers, customer records, or private repository dumps.

Pipeline: RAW → `po experience:scan` → `po experience:sanitize` → repository-safe inbox. Unsanitized files must never be copied into `.product/lab/experience-inbox/` or a public Product OS path.

Optional local mapping (RAW basename ↔ opaque `source_id`) may live under `.local-map/` here. That mapping is gitignored and must not be copied into Product OS inbox paths.
