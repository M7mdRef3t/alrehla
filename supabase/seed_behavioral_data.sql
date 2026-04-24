-- Seeding script for Behavioral Pattern Analysis
-- Run this in the Supabase SQL Editor to test the module with real data.

-- Get a valid user_id (replace with your actual user id if needed, or it will use the first user found)
DO $$
DECLARE
    target_user_id uuid;
BEGIN
    SELECT id INTO target_user_id FROM auth.users LIMIT 1;

    IF target_user_id IS NOT NULL THEN
        -- 1. Seed Patterns
        INSERT INTO public.behavioral_patterns (user_id, title, description, sentiment, icon, frequency, linked_quiz, is_sensitive, resource_tab)
        VALUES 
        (target_user_id, 'التجنب العاطفي النشط', 'ميل واضح للابتعاد عن المحادثات العميقة عند الشعور بالضغط النفسي.', 'negative', '🛡️', 12, 'attachment', true, 'exit-scripts'),
        (target_user_id, 'التزامن المسائي', 'ارتفاع ملحوظ في جودة التواصل العاطفي بعد الساعة 9 مساءً.', 'positive', '✨', 8, 'emotional', false, 'articles'),
        (target_user_id, 'نمط التفكير الزائد', 'تكرار تحليل الرسائل والمواقف البسيطة مما يؤدي لإجهاد ذهني.', 'recurring', '🧠', 15, null, false, 'exercises')
        ON CONFLICT DO NOTHING;

        -- 2. Seed Metrics (Weekly)
        INSERT INTO public.behavioral_metrics (user_id, day, connection, withdrawal, stability, period, metric_type)
        VALUES 
        (target_user_id, 'الأحد', 65, 25, 70, 'morning', 'week'),
        (target_user_id, 'الاثنين', 45, 50, 55, 'evening', 'week'),
        (target_user_id, 'الثلاثاء', 50, 45, 60, 'morning', 'week'),
        (target_user_id, 'الأربعاء', 75, 20, 80, 'evening', 'week'),
        (target_user_id, 'الخميس', 60, 35, 75, 'morning', 'week'),
        (target_user_id, 'الجمعة', 85, 10, 90, 'evening', 'week'),
        (target_user_id, 'السبت', 70, 20, 85, 'morning', 'week')
        ON CONFLICT DO NOTHING;

        -- 3. Seed Alerts
        INSERT INTO public.behavioral_alerts (user_id, message, resource_tab, resource_key)
        VALUES 
        (target_user_id, 'لاحظنا نمط تجنب بعد ساعات العمل المكثفة — جرب تمرين التنفس السريع.', 'exercises', 'breathing'),
        (target_user_id, 'هذا هو الوقت المثالي لمحادثة عميقة؛ مؤشرات التزامن المسائي في ذروتها.', 'articles', 'deep-talk')
        ON CONFLICT DO NOTHING;

        RAISE NOTICE 'Seeding completed for user %', target_user_id;
    ELSE
        RAISE NOTICE 'No users found to seed data for.';
    END IF;
END $$;
