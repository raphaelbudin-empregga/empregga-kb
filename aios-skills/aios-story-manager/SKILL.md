---
name: aios-story-manager
description: Manage Synkra AIOS stories, including creation, status transitions (Draft, Ready, InProgress, InReview, Done), updating file lists, and ensuring Story-Driven Development compliance. Use when creating or updating a `.story.md` file.
---

# AIOS Story Manager

This skill enforces Principle III (Story-Driven Development) of the Synkra AIOS Constitution and the strict Story Lifecycle rules.

## Core Mandates
1. **No Code Without a Story:** Every code change must trace back to a story.
2. **Acceptance Criteria Required:** Development cannot start without clear acceptance criteria.
3. **Role-Based Editing:** Only specific agents can edit certain sections of a story.

## Usage Guide

### Creating a New Story (Agent: @sm)
When requested to create a new story, use the official template in [template.md](assets/template.md).
- Ensure the status starts as `Draft`.
- Fill in the Epic context and placeholders.

### Validating a Story (Agent: @po)
When requested to validate a draft story:
- Review the story against the 10-Point Validation Checklist in [lifecycle.md](references/lifecycle.md).
- If GO (≥7/10), you **MUST** update the status from `Draft` to `Ready`.
- You are the ONLY agent authorized to edit Title, Description, AC, and Scope.

### Developing a Story (Agent: @dev)
When requested to implement a story:
- Verify the status is `Ready` before starting.
- Update the status to `InProgress`.
- **Update the File List:** As you modify or create files, keep the File List section of the story strictly up-to-date.
- **Track Progress:** Check off AC checkboxes as you complete them.
- You may only edit the File List, Dev Notes, and checkboxes.

### QA Review (Agent: @qa)
When validating an implemented story:
- Review against the 7 Quality Checks in [lifecycle.md](references/lifecycle.md).
- Update the status to `InReview`.
- You are the ONLY agent authorized to edit the QA Results section.
- If PASS, proceed to @devops for push.

### Completing a Story (Agent: @devops)
When a story passes QA:
- Push changes and update the status to `Done`.

## Advanced Reference
For detailed phase information, status progression triggers, and QA loop rules, refer to [lifecycle.md](references/lifecycle.md).
