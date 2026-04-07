# Dynamic Context Router Logic Flow

## Context
This flow describes the routing logic for semantic and awareness shifts in the `DynamicContextRouter`.

## Logic
1. Action -> Data -> Instant Feedback
2. Ingests semantic shifts and updates BI integrity.
3. Retrieves client trajectory and current vector.
4. If active mission, verifies BI and updates DDA.
5. If cold start, calculates initial DDA.
6. Constructs Mission Prompt and returns.

## Changes
- Removed stray debug log output (`console.log("PROMPT GENERATED FOR LLM:", prompt);`) to prevent potential sensitive data leaks.
