# QA Gate Checks

## The 7 Mandatory Quality Checks

1. **Code review** — patterns, readability, maintainability.
   - *Requirement:* Must use Absolute Imports (`@/`). Relative paths (`../`) should be rejected.
2. **Unit tests** — adequate coverage, all passing.
3. **Acceptance criteria** — all met per story AC.
4. **No regressions** — existing functionality preserved.
5. **Performance** — within acceptable limits.
6. **Security** — OWASP basics verified.
7. **Documentation** — updated if necessary.

## Gate Severity Levels

| Severity | Behavior                     | Target                        |
| -------- | ---------------------------- | ----------------------------- |
| BLOCK    | Prevents execution/push      | NON-NEGOTIABLE, MUST critical |
| WARN     | Allows to continue w/ alert  | MUST non-critical             |
| INFO     | Only reports                 | SHOULD (e.g., imports)        |

## Expected Verdicts

1. **PASS:** All checks OK. Action: Approve, proceed to @devops push.
2. **CONCERNS:** Minor issues. Action: Approve with observations documented.
3. **FAIL:** HIGH/CRITICAL issues. Action: Return to @dev with feedback.
4. **WAIVED:** Issues accepted. Action: Approve with waiver documented (rare).
