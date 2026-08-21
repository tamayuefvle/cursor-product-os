# v1.0.0 Baseline Normalization Result

The original release package was audited after being moved into a persistent ChatGPT project. The audit found that the release ZIP omitted six Phase documents, the root Product OS had product state without corresponding product artifacts, `state.decisions.latest` pointed to a missing `DEC-0001`, and foundation/test coverage contained defects.

The normalized baseline restores the Phase documents, adds root Product OS artifacts through the release-validation surface, reconstructs decision provenance without inventing historical Council workspaces, hardens promotion rollback behavior, expands security/human-gate tests, regenerates acceptance evidence, and repackages the release from the normalized repository.

This incident is treated as dogfood evidence: release prose and chat history are insufficient substitutes for repository Source of Truth and executable acceptance.
