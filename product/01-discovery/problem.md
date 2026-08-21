# Problem

## Target user

The primary v1 user is a developer or small product owner using Cursor to turn an early web-product idea into a product that can be investigated, defined, implemented, and validated without losing the reasoning that led to each decision. The initial dogfood user is the maintainer of Cursor Product OS itself.

## Problem statement

AI coding tools are strong at producing code, but an idea can move from chat to implementation before its problem, evidence, alternatives, risks, or irreversible decisions are recorded. Long-running work then becomes vulnerable to context loss: decisions live in chat history, different agents optimize for different goals, and implementation momentum can outrun product validation.

Cursor Product OS addresses the orchestration problem rather than the coding problem: keep product state, evidence, gates, decisions, and implementation context in a repository so an AI-assisted workflow remains reviewable and resumable.

## Current alternatives and workarounds

Teams can combine chat history, Markdown notes, issue trackers, Notion, spreadsheets, ADRs, PRDs, and manual review. These are valid alternatives and may be sufficient for disciplined teams. The v1 hypothesis is not that those tools are inadequate individually; it is that a repository-native workflow integrated with Cursor can reduce the coordination overhead of keeping them consistent during AI-assisted development.

## Assumptions and open questions

- Repository-first artifacts will reduce context loss compared with chat-only state.
- A staged workflow will improve decision quality without making small ideas too bureaucratic.
- Optional specialist agents and Codex review will add useful disagreement rather than noise.
- Human gates will remain understandable enough that users do not bypass them.
- The product must prove value through dogfooding before broader automation or UI work is justified.
