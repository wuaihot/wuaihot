# Continuous Development Governance

**Status:** Active  
**Scope:** sustained human/AI product development, implementation, verification and handoff.

This document makes the repository's continuous-development workflow durable. Live task state still belongs in GitHub Issues / Project; this file defines the stable rules that every development agent must follow.

## Source of truth

1. **GitHub Issue body** — canonical long-lived requirements, acceptance checklist and durable status.
2. **GitHub Project** — cross-Issue priority, workflow state, roadmap and blocked view.
3. **Issue comments** — stage plans, temporary TODOs, execution notes, evidence and user follow-up.
4. **Pull requests** — one reviewable implementation unit that links back to the canonical Issue.
5. **Chat** — interaction and execution entry point, never the only persistent project state.

Repository documentation may explain stable architecture or governance, but it must not replace live Issue / Project status.

## Intake and automatic bookkeeping

When a user introduces a concrete requirement, bug or optimization during a conversation:

- Keep it in the current Issue's stage plan when it can be completed and accepted inside the current task.
- Promote it to an independent Issue when it crosses stages, has independent acceptance, or will survive the current task boundary.
- Promote it into the canonical Issue body when it changes the long-lived product requirement or master checklist.
- Do not require the user to repeat “record this in the Issue”.
- Rewrite raw feedback into professional background, goal, acceptance criteria and blockers where useful; do not mechanically paste chat text as low-quality TODOs.

## Resume and handoff

Before continuing an existing task, read in this order:

1. current canonical Issue body;
2. latest active stage-plan / user-feedback comments;
3. recent relevant PRs and their merge / deployment evidence;
4. repository state and current branch;
5. old chat history only as supporting context.

If chat memory and canonical GitHub state differ, reconcile explicitly instead of silently trusting chat memory.

## Comment-to-canonical promotion

Issue comments are intentionally temporary. They must not become an unbounded second backlog.

- Completed temporary TODOs must be reflected in canonical status/evidence.
- A confirmed unresolved TODO that survives a conversation boundary must move to the Issue body or an independent Issue.
- Superseded or duplicate items should be marked as such rather than remaining ambiguous.
- Do not close an Issue merely because the implementation PR merged when user/product acceptance remains outstanding.

## Pull request contract

Every implementation PR should:

- link the canonical Issue;
- explain which acceptance criteria it changes;
- include exact build/audit/visual/production evidence appropriate to the change;
- state blockers and remaining work;
- avoid hiding new requirements only in PR prose.

After merge, finish the repository's Return-to-Trunk procedure before opening the next product branch.

## Verification and closeout

Before claiming a task complete:

- run the relevant repository audits and build;
- verify merged `main` / production when the task affects deployment;
- update the canonical Issue checkbox/evidence;
- synchronize Project state where applicable;
- keep subjective visual/product acceptance open when the user has not approved it;
- clean temporary branches/worktrees according to the Git/worktree governance document.

## Harness

`npm run audit:development-governance` verifies that the durable governance contract remains wired into:

- `AGENTS.md`;
- this document;
- the pull-request template;
- `package.json` / `prebuild`.

The harness is deliberately offline: it protects the repository contract without requiring GitHub credentials during ordinary builds. Live Issue / Project state is still maintained through the connected GitHub workflow.
