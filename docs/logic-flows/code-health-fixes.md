# Code Health and Type Fixes Logic Flow

## Goal
Resolve CI validation errors, mojibake encoding issues, and TypeScript type mismatch errors across multiple components.

## Mental Model
- CI pipeline was failing due to missing types and corrupted Arabic encoding.
- The system needs to have standard English strings for admin panels to prevent mojibake, and accurate TypeScript definitions to pass `typecheck`.
- This ensures a stable and maintainable codebase.

## Inputs / Outputs
- Inputs: Modified source code files with updated types and fixed strings.
- Outputs: Passing CI pipelines (`check:arabic-encoding`, `typecheck`, `test`).

## States
- `idle`: Code contains type errors and mojibake.
- `success`: Code compiles without errors, no encoding issues found.

## Transitions
1. `idle -> success` upon applying the code fixes.

## Edge Cases
- If Arabic encoding is strictly required in the future, we must ensure UTF-8 without BOM is strictly enforced by the editor, but for now English is safe.

## Failure & Fallback
- If `typecheck` fails, we fallback to finding the missing types.
- If `check:arabic-encoding` fails, we fallback to stripping out `SUSPICIOUS` characters.

## Performance Constraints
- Target complexity: O(1) impact on runtime logic.

## Security Constraints
- Validation rules: N/A
- Authorization boundary: N/A

## Acceptance Criteria
1. `npm run typecheck` passes without emitting errors for the changed components.
2. `npm run check:arabic-encoding` passes without detecting mojibake.
3. Tests continue to pass.
