# <Feature Name> Logic Flow

## Goal
الهدف من الفيتشر في سطرين واضحين.

## Mental Model
- المستخدم داخل إيه؟
- النظام عايز يوصله لإيه؟
- ليه التدفق ده هو الأنسب؟

## Inputs / Outputs
- Inputs:
- Outputs:

## States
- `idle`
- `loading`
- `success`
- `error`

## Transitions
1. `idle -> loading` عند ...
2. `loading -> success` عند ...
3. `loading -> error` عند ...
4. `error -> loading` (retry) عند ...

## Edge Cases
- حالة 1:
- حالة 2:

## Failure & Fallback
- لو API فشل:
- لو data ناقصة:
- لو feature flag مقفول:

## Performance Constraints
- Target complexity:
- Max latency:
- Memory constraints:

## Security Constraints
- Validation rules:
- Authorization boundary:
- Sensitive data handling:

## Acceptance Criteria
1. ...
2. ...
3. ...

