const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/admin/AIDecisionLog.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Add tooltip param to StatCardProps
content = content.replace(
  '  onClick: () => void;\r\n}',
  '  onClick: () => void;\r\n  tooltip?: string;\r\n}'
);
content = content.replace(
  '  onClick: () => void;\n}',
  '  onClick: () => void;\n  tooltip?: string;\n}'
);

content = content.replace(
  'const StatCard: FC<StatCardProps> = ({ label, count, icon, color, active, onClick }) => {',
  'const StatCard: FC<StatCardProps> = ({ label, count, icon, color, active, onClick, tooltip }) => {'
);

// Inject AdminTooltip component inside StatCard below label
content = content.replace(
  /      <p className="text-xs" style={{ color: "rgba\(148,163,184,0\.7\)" }}>\s*{\s*label\s*}\s*<\/p>\s*<\/motion\.button>/,
  `      <div className="flex items-center justify-between mt-1">
        <p className="text-xs" style={{ color: "rgba(148,163,184,0.7)" }}>
          {label}
        </p>
        {tooltip && <AdminTooltip content={tooltip} position="bottom" />}
      </div>
    </motion.button>`
);

// Add tooltips to the StatCards in the grid
content = content.replace(
  `onClick={() => setFilter(filter === "executed" ? "all" : "executed")}\r\n        />`,
  `onClick={() => setFilter(filter === "executed" ? "all" : "executed")}\r\n          tooltip="القرارات اللي السيستم أخدها ونفذها بشكل آلي بناءً على المعايير بدون تدخل بشري."\r\n        />`
);
content = content.replace(
  `onClick={() => setFilter(filter === "executed" ? "all" : "executed")}\n        />`,
  `onClick={() => setFilter(filter === "executed" ? "all" : "executed")}\n          tooltip="القرارات اللي السيستم أخدها ونفذها بشكل آلي بناءً على المعايير بدون تدخل بشري."\n        />`
);

content = content.replace(
  `onClick={() => setFilter(filter === "pending" ? "all" : "pending")}\r\n        />`,
  `onClick={() => setFilter(filter === "pending" ? "all" : "pending")}\r\n          tooltip="قرارات حساسة تتطلب موافقة المالك (Owner) قبل التنفيذ النهائي (مثل تغيير تسعير جذري)."\r\n        />`
);
content = content.replace(
  `onClick={() => setFilter(filter === "pending" ? "all" : "pending")}\n        />`,
  `onClick={() => setFilter(filter === "pending" ? "all" : "pending")}\n          tooltip="قرارات حساسة تتطلب موافقة المالك (Owner) قبل التنفيذ النهائي (مثل تغيير تسعير جذري)."\n        />`
);

content = content.replace(
  `onClick={() => setFilter(filter === "rejected" ? "all" : "rejected")}\r\n        />`,
  `onClick={() => setFilter(filter === "rejected" ? "all" : "rejected")}\r\n          tooltip="قرارات تم رفضها يدوياً من المالك وتم إلغاء تنفيذها."\r\n        />`
);
content = content.replace(
  `onClick={() => setFilter(filter === "rejected" ? "all" : "rejected")}\n        />`,
  `onClick={() => setFilter(filter === "rejected" ? "all" : "rejected")}\n          tooltip="قرارات تم رفضها يدوياً من المالك وتم إلغاء تنفيذها."\n        />`
);

content = content.replace(
  `onClick={() => setFilter("all")}\r\n        />`,
  `onClick={() => setFilter("all")}\r\n          tooltip="قرارات حاول الذكاء الاصطناعي اتخاذها ولكنها محظورة وفقاً لقواعد الحماية الأساسية للمنصة."\r\n        />`
);
content = content.replace(
  `onClick={() => setFilter("all")}\n        />`,
  `onClick={() => setFilter("all")}\n          tooltip="قرارات حاول الذكاء الاصطناعي اتخاذها ولكنها محظورة وفقاً لقواعد الحماية الأساسية للمنصة."\n        />`
);

// Header Add
content = content.replace(
  `سجل قرارات الـ AI\r\n          </h2>\r\n          <span`,
  `سجل قرارات الـ AI\r\n          </h2>\r\n          <AdminTooltip content="مراقبة حية لكل القرارات التي يتخذها الذكاء الاصطناعي في المنصة (مثل تعديل تسعير، فلترة مجتمع، أو اقتراحات)." position="bottom" />\r\n          <span`
);
content = content.replace(
  `سجل قرارات الـ AI\n          </h2>\n          <span`,
  `سجل قرارات الـ AI\n          </h2>\n          <AdminTooltip content="مراقبة حية لكل القرارات التي يتخذها الذكاء الاصطناعي في المنصة (مثل تعديل تسعير، فلترة مجتمع، أو اقتراحات)." position="bottom" />\n          <span`
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Done!');
