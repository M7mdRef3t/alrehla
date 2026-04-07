---
trigger: always_on
---

# Dawayir Core Operating Rule

Always analyze before editing.

For any non-trivial task in this workspace:
1. First identify the affected area of the repo
2. Mention relevant routes, services, state, analytics, auth, database, and deployment impact if applicable
3. Use available skills before making risky edits:
   - repo-cartographer
   - nextjs-app-router-guardian
   - supabase-rls-auditor
   - analytics-pixel-debugger
   - pr-reviewer-paranoid
4. Do not make broad code changes before summarizing risks
5. Prefer minimal safe changes over wide refactors
6. When reviewing changes, explicitly call out:
   - hidden risks
   - regression risks
   - tracking risks
   - auth / data exposure risks
7. For route-related work, check App Router structure first
8. For database-related work, check RLS and ownership boundaries first
9. For analytics-related work, audit event flow before editing tracking code
10. If the task is complex, propose a short plan before implementation