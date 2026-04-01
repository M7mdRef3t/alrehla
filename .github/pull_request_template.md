## Summary

- What changed?
- Why does it help the user or owner experience?

## Logic Flow First Checklist (Mandatory)

- [ ] تم إنشاء/تحديث Logic Flow قبل الكود داخل `docs/logic-flows/*.md`
- [ ] تم توضيح الـ Mental Model (الهدف، الحالات، الانتقالات، الفشل/البدائل)
- [ ] التغييرات البرمجية متسقة مع الـ Logic Flow المرفق

### Logic Flow File

`docs/logic-flows/<feature-name>.md`

## Checks

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run test:run`
- [ ] `npm run build`

## Risk Review

- [ ] User mode impact checked
- [ ] Dev-only changes are intentional
- [ ] No duplicate component or flow introduced
- [ ] Fallback exists if AI path fails

## Notes

- Screenshots, rollout notes, or known follow-ups
- أي PR فيه Feature code بدون Logic Flow محدث سيتم رفضه تلقائياً عبر CI.
