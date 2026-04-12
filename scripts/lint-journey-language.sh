#!/usr/bin/env bash
# ═══════════════════════════════════════════════════
# Journey Language Lint — فحص لغة الرحلة
# ═══════════════════════════════════════════════════
# يفحص الملفات اللي بتواجه المسافر ويطلع warning
# لأي كلمة ممنوعة حسب GLOSSARY.md
#
# Usage:
#   bash scripts/lint-journey-language.sh
#   npm run lint:journey  (بعد إضافة script في package.json)
# ═══════════════════════════════════════════════════

set -euo pipefail

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo -e "${CYAN}🧭 Journey Language Lint — فحص لغة الرحلة${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Directories containing user-facing copy
SCAN_DIRS=(
  "src/copy"
  "src/modules"
  "src/services/smartReminders.ts"
  "src/services/nudgeEngine.ts"
  "src/data"
  "src/lib/marketing"
  "src/templates"
  "app/not-found.tsx"
  "app/error.tsx"
  "app/onboarding"
  "public/manifest.json"
)

# Excluded paths (admin/owner, code comments, etc.)
EXCLUDE_PATTERNS=(
  "--glob=!**/admin/**"
  "--glob=!**/dashboard/**"
  "--glob=!**/*.test.*"
  "--glob=!**/*.spec.*"
  "--glob=!**/node_modules/**"
  "--glob=!**/.next/**"
)

# Forbidden terms (in user-facing Arabic copy)
# Format: "term|replacement suggestion"
FORBIDDEN=(
  'افتح التطبيق|ارجع لرحلتك'
  'استخدم المنصة|ابدأ رحلتك'
  'ابدأ التطبيق|ابدأ رحلتك'
  'فريق عمل المنصة|رفاق الطريق'
  'مستخدمي المنصة|مسافري الرحلة'
  'أداتنا|بوصلتنا'
  'خدماتنا|محطاتنا'
  'منتجنا|رحلتنا'
)

TOTAL_VIOLATIONS=0

for entry in "${FORBIDDEN[@]}"; do
  IFS='|' read -r term suggestion <<< "$entry"
  
  RESULTS=""
  for dir in "${SCAN_DIRS[@]}"; do
    if [ -e "$dir" ]; then
      FOUND=$(rg --no-heading -n "$term" "$dir" "${EXCLUDE_PATTERNS[@]}" 2>/dev/null || true)
      if [ -n "$FOUND" ]; then
        RESULTS+="$FOUND"$'\n'
      fi
    fi
  done
  
  if [ -n "$RESULTS" ]; then
    echo -e "${RED}⚠ ممنوع:${NC} \"$term\" → ${GREEN}استخدم: \"$suggestion\"${NC}"
    echo "$RESULTS" | head -10
    COUNT=$(echo "$RESULTS" | grep -c . || true)
    TOTAL_VIOLATIONS=$((TOTAL_VIOLATIONS + COUNT))
    echo ""
  fi
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$TOTAL_VIOLATIONS" -eq 0 ]; then
  echo -e "${GREEN}✅ لا يوجد انتهاكات لغوية — الرحلة نظيفة!${NC}"
else
  echo -e "${YELLOW}⚠ إجمالي الانتهاكات: $TOTAL_VIOLATIONS${NC}"
  echo -e "${YELLOW}  راجع GLOSSARY.md للبدائل الصحيحة${NC}"
fi
echo ""
