---
name: aios-agent-manager
description: Enforce and manage Synkra AIOS agent authorities, ensuring agents do not overstep their boundaries (e.g., only @devops can git push or manage MCP). Use when delegating tasks, creating agents, or verifying if an action is permitted by the current agent.
---

# AIOS Agent Manager

This skill enforces Principle II (Agent Authority) of the Synkra AIOS Constitution and the strict Delegation Matrix. Each agent has exclusive authorities that cannot be violated or assumed by another agent.

## Core Mandates
1. **Strict Exclusivity:** Agents MUST delegate tasks that fall outside their scope to the appropriate agent.
2. **Git & Deployments:** Only `@devops` can push code, manage PRs, or handle releases.
3. **Framework Governance:** `@aios-master` is the only entity that can override boundaries for framework health.

## Delegation and Authority Guidelines

### Checking Permissions
Before executing an action, especially involving external systems (Git, PRs) or architecture changes, verify your authority in [authority.md](references/authority.md).
- If you lack authority, you must stop and instruct the user to delegate the task to the correct agent (e.g., "I cannot git push. Please ask @devops to execute this step.").

### Creating or Updating Agents
When creating or updating agent definitions in `.codex/agents`, `.gemini/commands`, or `.claude/rules`:
- Ensure the agent adheres strictly to the defined capabilities in the delegation matrix.
- Ensure the schema `.aios-core/schemas/agent-v3-schema.json` is respected.

### Key Exclusivities
- **@devops:** `git push`, PR creation/merge, releases, CI/CD, MCP management.
- **@pm:** Epic orchestration, requirements gathering, spec writing.
- **@po:** Story validation (Draft -> Ready), backlog prioritization.
- **@sm:** Story creation (Drafting from Epic/PRD).
- **@architect:** System architecture, technology selection.
- **@qa:** Quality verdicts, gate decisions.
- **@data-engineer:** Database schema (DDL), query optimization.

For detailed cross-agent patterns and the complete Delegation Matrix, see [authority.md](references/authority.md).
