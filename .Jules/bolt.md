# Bolt Journal

## 2026-02-27 - Archive Toast Hot Path
**Learning:** في `MapCanvas` مسار إشعار الأرشفة كان يستخدم `filter + sort` على `allNodes` كل تحديث، وهو نمط مكلف O(n log n) في مسار تفاعلي يتكرر كثيراً.
**Action:** في أي مسار يعتمد على تغيرات العقد بشكل مستمر، نجمع العدادات و"latest item" في مسح واحد O(n) بدل سلاسل transform متعددة.
