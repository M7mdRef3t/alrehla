#!/bin/bash
# سكربت تشغيل منصة دواير على الماك
cd "$(dirname "$0")"

# تحميل nvm إن وُجد (شائع على الماك)
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  export NVM_DIR="$HOME/.nvm"
  . "$NVM_DIR/nvm.sh"
fi

# تشغيل المنصة وفتح المتصفح
echo "جاري تشغيل المنصة..."
npm start

# إبقاء النافذة مفتوحة عند الخطأ
if [ $? -ne 0 ]; then
  echo ""
  echo "حدث خطأ. تأكد من تثبيت Node.js ثم جرّب: npm start"
  read -p "اضغط Enter للإغلاق..."
fi
