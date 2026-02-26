# Synkra AIOS Agent Delegation Matrix

## @devops (Gage) — EXCLUSIVE Authority
- `git push` / `git push --force`
- `gh pr create` / `gh pr merge`
- MCP add/remove/configure
- CI/CD pipeline management
- Release management

## @pm (Morgan) — Epic Orchestration
- `*execute-epic`, `*create-epic`
- Epic execution YAML management
- Requirements gathering & Spec writing

## @po (Pax) — Story Validation
- `*validate-story-draft` (10-point checklist)
- Story context tracking in epics
- Backlog prioritization

## @sm (River) — Story Creation
- `*draft` / `*create-story` (From epic/PRD)
- Story template selection

## @dev (Dex) — Implementation
- **Allowed:** `git add`, `git commit`, `git status`, `git branch`, `git checkout`, `git merge` (local), `git stash`, `git diff`, `git log`. Story file updates (File List, checkboxes).
- **Blocked:** `git push`, PR management, MCP management, Story edits (AC, scope, title).

## @architect (Aria) — Design Authority
- System architecture decisions, Technology selection, Integration patterns.
- Delegates to @data-engineer for detailed DDL and query optimization.

## @data-engineer (Dara) — Database
- Schema design (detailed DDL), Query optimization, RLS policies, Index strategy, Migration planning & execution.
- Does NOT own System architecture, Application code, Git operations, Frontend/UI.

## @aios-master — Framework Governance
- Can execute ANY task directly.
- Framework governance and Constitutional enforcement.
- Can override agent boundaries when necessary for framework health.

## Cross-Agent Delegation Patterns
- **Git Push Flow:** ANY agent → `@devops`
- **Schema Design Flow:** `@architect` (decides technology) → `@data-engineer` (implements DDL)
- **Story Flow:** `@sm` (draft) → `@po` (validate) → `@dev` (develop) → `@qa` (qa-gate) → `@devops` (push)
- **Epic Flow:** `@pm` (create/execute) → `@sm` (draft per story)
