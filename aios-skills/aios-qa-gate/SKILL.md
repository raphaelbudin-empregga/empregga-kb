---
name: aios-qa-gate
description: Execute QA gate checks, enforcing Principle V (Quality First) of the Synkra AIOS Constitution. Use when validating code changes before pushing, reviewing a PR, or validating story acceptance criteria (AC) as the @qa agent.
---

# AIOS Quality Gatekeeper

This skill enforces Principle I (CLI First), Principle IV (No Invention), Principle V (Quality First), and Principle VI (Absolute Imports) of the Synkra AIOS Constitution. Every code change must pass these checks before it can be merged or pushed.

## Core Mandates
1. **Quality First:** Quality is non-negotiable. All automatic checks (`npm run lint`, `npm run typecheck`, `npm test`, `npm run build`) MUST pass.
2. **CLI First:** All new functionality MUST work 100% via CLI before any UI is built. UI is never a requirement for system operation.
3. **No Invention:** Implementations MUST strictly map to requirements, non-functional requirements (NFRs), constraints, or verified research. No undocumented features or technologies are allowed.
4. **Absolute Imports:** All local modules SHOULD use absolute imports with the `@/` alias. Relative imports (e.g., `../../`) are heavily discouraged.

## Quality Checks & Execution

When acting as `@qa` or reviewing changes:

1. **Verify Code Standards:** Ensure all imports use the absolute `@/` path.
2. **Execute Checks:**
   - Run `npm run lint`
   - Run `npm run typecheck`
   - Run `npm test`
   - Run `npm run build`
3. **Review Against Story:** Verify all acceptance criteria (AC) defined in the story file are met.
4. **No UI First:** Reject any UI changes introduced before the core functionality works via CLI.
5. **Report Verdict:** Document any findings as PASS, CONCERNS, FAIL, or WAIVED according to the defined gate file structure. Only `@qa` may edit the QA Results section in the story file.

For detailed checklist rules, review [quality-checks.md](references/quality-checks.md).
