# Synkra AIOS Story Lifecycle

## Status Progression

`Draft` → `Ready` → `InProgress` → `InReview` → `Done`

| Status     | Trigger                 | Agent   | Action                             |
| ---------- | ----------------------- | ------- | ---------------------------------- |
| Draft      | @sm creates story       | @sm     | Story file created                 |
| Ready      | @po validates (GO)      | @po     | Update status field Draft → Ready  |
| InProgress | @dev starts             | @dev    | Update status field                |
| InReview   | @dev completes, @qa rev | @qa     | Update status field                |
| Done       | @qa PASS, @devops push  | @devops | Update status field                |

**CRITICAL:** The `Draft → Ready` transition is the responsibility of @po. When verdict is GO, @po MUST update the story's Status field to `Ready` and log the transition in the Change Log.

## Phase 2: Validate (@po)

### 10-Point Validation Checklist

1. Clear and objective title
2. Complete description (problem/need explained)
3. Testable acceptance criteria (Given/When/Then preferred)
4. Well-defined scope (IN and OUT clearly listed)
5. Dependencies mapped (prerequisite stories/resources)
6. Complexity estimate (points or T-shirt sizing)
7. Business value (benefit to user/business clear)
8. Risks documented (potential problems identified)
9. Criteria of Done (clear definition of complete)
10. Alignment with PRD/Epic (consistency with source docs)

**Decision:** GO (≥7/10) or NO-GO (<7/10 with required fixes)

## Phase 4: QA Gate (@qa)

### 7 Quality Checks

1. **Code review** — patterns, readability, maintainability
2. **Unit tests** — adequate coverage, all passing
3. **Acceptance criteria** — all met per story AC
4. **No regressions** — existing functionality preserved
5. **Performance** — within acceptable limits
6. **Security** — OWASP basics verified
7. **Documentation** — updated if necessary

### Gate Decisions

| Decision | Score                | Action                               |
| -------- | -------------------- | ------------------------------------ |
| PASS     | All checks OK        | Approve, proceed to @devops push     |
| CONCERNS | Minor issues         | Approve with observations documented |
| FAIL     | HIGH/CRITICAL issues | Return to @dev with feedback         |
| WAIVED   | Issues accepted      | Approve with waiver documented (rare)|
