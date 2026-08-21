# GitHub Operations — Cursor Product OS

## Purpose

GitHub is the durable version, review, release, and provenance layer for Cursor Product OS. Repository Artifacts remain the Source of Truth; GitHub issues and pull requests are collaboration and review surfaces, not replacements for governed repository artifacts.

## Stable baseline

The normalized v1.0.0 source tree is preserved by the annotated Git tag `v1.0.0`.

The original normalized ZIP should be attached to the corresponding GitHub Release as the distribution artifact.

`MANIFEST.txt` describes the v1.0.0 release package. GitHub-only repository files added after the `v1.0.0` tag are not expected to appear in that historical release manifest.

## Branch policy

- `main`: stable line. Protect from direct pushes once the remote repository is created.
- `lab/vnext`: long-running experimental Product OS line.
- `experiment/*`: isolated improvement experiments.
- `hotfix/*`: narrowly scoped corrections to the stable line.

Avoid a permanent `develop` branch until team size or release flow provides evidence that it is useful.

## Change flow

Experimental OS changes should normally flow:

`experiment/* -> lab/vnext -> stable-graduation review -> main`

Stable Kernel changes require regression validation. High-impact or governance-affecting changes require the existing Human Approval policy and an authoritative Decision artifact.

## Required CI

The v1.0.0 acceptance contract remains authoritative:

```bash
npm install
npm run po -- validate
npm test
```

A lockfile / `npm ci` migration is intentionally deferred to Lab evaluation rather than retroactively changing the v1.0.0 tag.

## Release policy

For stable releases:

1. pass required validation and tests;
2. resolve the authoritative release Decision;
3. obtain required Human Approval;
4. merge to `main`;
5. create the version tag;
6. publish the matching GitHub Release and distribution artifact.

## Runtime roles

- Cursor: primary Product OS runtime and Product Orchestrator.
- GitHub: durable Source of Truth history, CI, PR review, tags, releases.
- ChatGPT Project: architecture / strategy review and artifact preparation.
- Codex: optional independent advisor / evaluation path, never the decision authority.
