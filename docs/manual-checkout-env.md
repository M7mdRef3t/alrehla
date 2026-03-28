# Manual Checkout Env Guide

الملف ده هو المرجع السريع لأي إعدادات تخص صفحة التفعيل اليدوي الحالية في [app/checkout/page.tsx](/C:/Users/ty/Downloads/Dawayir-main/Dawayir-main/app/checkout/page.tsx).

## المتغيرات المطلوبة

`NEXT_PUBLIC_PUBLIC_PAYMENTS_ENABLED`
- يفتح أو يقفل صفحة الـ checkout اليدوي للجمهور.

`NEXT_PUBLIC_WHATSAPP_CONTACT_NUMBER`
- رقم واتساب اللي بيتبعت له المستخدم في أزرار الدعم والتأكيد.
- الصيغة المفضلة: دولية بدون `+`، مثال: `201023050092`

## متغيرات الأسعار المعروضة

`NEXT_PUBLIC_FOUNDING_COHORT_PRICE_LABEL`
- السعر الرئيسي الظاهر في الهيدر.

`NEXT_PUBLIC_LOCAL_PREMIUM_PRICE_LABEL`
- السعر المحلي الظاهر في كارت مصر وفي placeholder المبلغ المحلي.

`NEXT_PUBLIC_GLOBAL_PREMIUM_PRICE_LABEL`
- السعر الدولي الظاهر في كارت الدفع الدولي وفي placeholder المبلغ الدولي.

## وسائل الدفع المحلية

`NEXT_PUBLIC_PAYMENT_INSTAPAY_ALIAS`
- alias إنستا باي لو متاح.

`NEXT_PUBLIC_PAYMENT_INSTAPAY_NUMBER`
- رقم إنستا باي البديل أو رقم الهاتف.

`NEXT_PUBLIC_PAYMENT_VODAFONE_CASH_NUMBER`
- رقم فودافون كاش.

`NEXT_PUBLIC_PAYMENT_ETISALAT_CASH_NUMBER`
- رقم اتصالات كاش.

## التحويل البنكي

`NEXT_PUBLIC_PAYMENT_BANK_NAME`
- اسم البنك.

`NEXT_PUBLIC_PAYMENT_BANK_BENEFICIARY`
- اسم المستفيد.

`NEXT_PUBLIC_PAYMENT_BANK_ACCOUNT_NUMBER`
- رقم الحساب.

`NEXT_PUBLIC_PAYMENT_BANK_IBAN`
- رقم الـ IBAN.

`NEXT_PUBLIC_PAYMENT_BANK_SWIFT`
- كود SWIFT لو التحويل يحتاجه.

## الدفع الدولي

`NEXT_PUBLIC_PAYMENT_PAYPAL_URL`
- رابط PayPal المباشر لو متاح.

`NEXT_PUBLIC_PAYMENT_PAYPAL_EMAIL`
- الإيميل البديل المعروض لو مفيش رابط مباشر.

## ملاحظات تشغيل

- صفحة الـ checkout الحالية لا تعتمد على Stripe نهائيًا.
- رفع إثبات الدفع يتم عبر [app/api/checkout/manual-proof/route.ts](/C:/Users/ty/Downloads/Dawayir-main/Dawayir-main/app/api/checkout/manual-proof/route.ts).
- أي مسار قديم متعلق بـ Stripe مقفول حاليًا برسالة `410`.
- لو وسيلة دفع ناقصة بياناتها، الصفحة بتسمح للمستخدم يروح واتساب ويطلب التفاصيل يدويًا بدل ما تتكسر الرحلة.
