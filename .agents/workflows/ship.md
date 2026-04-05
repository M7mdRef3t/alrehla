---
description: 
---

# Ship Workflow

For any implementation task in this workspace, execute safely and keep changes minimal, testable, and reviewable.

## Steps
1. Restate the task in one clear sentence
2. Confirm the smallest safe implementation scope
3. Identify the exact files to change before editing
4. Use the most relevant available skills before risky implementation
5. Make the smallest safe code changes needed to complete the task
6. Avoid broad refactors unless explicitly required
7. After implementation, review the changes for:
   - regressions
   - architecture drift
   - analytics issues
   - auth or data exposure risks
   - deployment risks
8. Run the most relevant checks if applicable
9. Summarize:
   - what was changed
   - what was intentionally not changed
   - remaining risks
   - next recommended step

## Output format
- Task
- Scope
- Files changed
- Skills used
- Changes made
- Checks run
- Risks
- Remaining work
- Next step