# Repo Intel Agent Integration

هذا الدليل يشرح كيف تستهلك طبقة `repo-intel` داخل **دواير** من أي Agent مثل `Goose` أو `OpenClaw` قبل كتابة أي patch.

## الهدف

نقل الوكيل من:

`prompt -> patch`

إلى:

`prompt -> repo graph lookup -> impact analysis -> patch -> verification`

## الموجود بالفعل

- مولد الجراف: [`scripts/repo-intel.mjs`](/c:/Users/ty/Downloads/Dawayir-main/Dawayir-main/scripts/repo-intel.mjs)
- Adapter للوكيل: [`scripts/repo-intel-agent.mjs`](/c:/Users/ty/Downloads/Dawayir-main/Dawayir-main/scripts/repo-intel-agent.mjs)
- MCP server محلي: [`scripts/repo-intel-mcp.mjs`](/c:/Users/ty/Downloads/Dawayir-main/Dawayir-main/scripts/repo-intel-mcp.mjs)
- API graph: [`app/api/repo-graph/route.ts`](/c:/Users/ty/Downloads/Dawayir-main/Dawayir-main/app/api/repo-graph/route.ts)
- API query: [`app/api/repo-graph/query/route.ts`](/c:/Users/ty/Downloads/Dawayir-main/Dawayir-main/app/api/repo-graph/query/route.ts)

## الترتيب الصحيح

1. شغّل الجراف أولًا:

```bash
npm run repo:graph
```

2. قبل أي تعديل، اطلب preflight:

```bash
npm run repo:agent -- preflight --intent "change runtime env" --path src/config/runtimeEnv.ts
```

3. اقرأ:
- الملفات المتأثرة
- المستهلكين
- التعارضات الموجودة
- verification checklist

4. بعدها فقط يبدأ الوكيل التعديل.

## استخدام CLI Adapter

أمثلة مباشرة:

```bash
npm run repo:agent -- impact --path src/config/runtimeEnv.ts
npm run repo:agent -- route --route /api/chat/agent
npm run repo:agent -- function --function handleSend
npm run repo:agent -- service --service telegram
```

أفضل استخدام فعلي للوكيل:

```bash
npm run repo:agent -- preflight --intent "edit facilitator chat" --path src/components/Chat/FacilitatorChat.tsx --route /api/chat/agent --function handleSend
```

## استخدام MCP مع Goose أو OpenClaw

شغّل الخادم المحلي:

```bash
npm run repo:mcp
```

الأدوات المتاحة للوكيل:

- `get_file_impact`
- `get_route_consumers`
- `find_function`
- `get_service_consumers`
- `list_conflicts`
- `agent_preflight`

أمثلة منطقية لما يجب أن يفعله الوكيل:

1. استدعاء `agent_preflight` قبل أي patch.
2. إذا كان التعديل على route، يستدعي `get_route_consumers`.
3. إذا كان التعديل على function اسمها شائع، يستدعي `find_function`.
4. إذا ظهرت conflicts، يعاملها كإشارة خطر قبل المتابعة.

## استخدام HTTP Adapter

أمثلة:

```bash
http://localhost:3000/api/repo-graph/query?action=impact&path=src/config/runtimeEnv.ts
http://localhost:3000/api/repo-graph/query?action=route&route=/api/chat/agent
http://localhost:3000/api/repo-graph/query?action=function&name=handleSend
http://localhost:3000/api/repo-graph/query?action=service&name=telegram
http://localhost:3000/api/repo-graph/query?action=conflicts
```

هذا مناسب إذا كان `Goose/OpenClaw` أسهل لهما استهلاك HTTP بدل MCP.

## سياسة التشغيل المقترحة

أي Agent يشتغل على **دواير** يجب أن يلتزم بـ:

1. ممنوع تعديل ملف دون `impact check`.
2. ممنوع تعديل route دون فحص المستهلكين.
3. ممنوع تعديل env/runtime دون فحص `Vite` و`Next`.
4. بعد أي تعديل بنيوي: أعد تشغيل `npm run repo:graph`.
5. بعد أي patch: شغّل `npm run typecheck`.

## مثال تشغيل كامل

```bash
npm run repo:graph
npm run repo:agent -- preflight --intent "change runtime env" --path src/config/runtimeEnv.ts
npm run typecheck
```

## ملاحظة مهمة

هذه الطبقة لا تمنع الأخطاء وحدها، لكنها تمنع الشغل الأعمى. القيمة هنا أن الوكيل يفهم أثر التعديل قبل أن يلمس الكود.
