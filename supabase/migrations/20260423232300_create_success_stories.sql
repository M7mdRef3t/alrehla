-- Create success_stories table
CREATE TABLE IF NOT EXISTS public.success_stories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    city TEXT NOT NULL,
    category TEXT NOT NULL,
    quote TEXT NOT NULL,
    outcome TEXT NOT NULL,
    stars INTEGER DEFAULT 5,
    avatar TEXT NOT NULL,
    color TEXT NOT NULL,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access for published stories" 
ON public.success_stories 
FOR SELECT 
USING (is_published = true);

-- Insert hardcoded stories
INSERT INTO public.success_stories (name, age, city, category, quote, outcome, stars, avatar, color, is_published)
VALUES
('سارة المنصوري', 29, 'الرياض', 'العلاقات', 'كنت عاجزة عن فهم نفسي في العلاقات. الرحلة ساعدتني أشوف الأنماط اللي كنت مكررّها بلا وعي.', 'بعد ٤ أشهر، قدرت أبدأ علاقة صحية وأحدد حدودي بوضوح.', 5, 'س', 'from-teal-500 to-emerald-600', true),
('خالد الزهراني', 34, 'جدة', 'الإنتاجية', 'كنت أعرف إن في مشكلة بالتسويف لكن ما كنت أعرف السبب الحقيقي. الخريطة كشّفت لي إن الخوف من الفشل هو الجذر.', 'أنهيت مشروعي الجانبي اللي كان موقوف ٣ سنوات.', 5, 'خ', 'from-violet-500 to-purple-600', true),
('نورة العتيبي', 26, 'أبوظبي', 'الثقة بالنفس', 'ما كنت أقدر أتخذ قرارات بدون موافقة الناس. الرحلة علمّتني أثق برؤيتي الداخلية.', 'تركت وظيفتي وأسست مشروعي الخاص — وهذا أكبر قرار في حياتي.', 5, 'ن', 'from-rose-500 to-pink-600', true),
('محمد الشمري', 41, 'الكويت', 'القلق والتوتر', 'كنت أظن القلق جزء من شخصيتي. اكتشفت إنه رد فعل على مواقف محددة — وهذا غيّر كل شيء.', 'نمط النوم تحسّن وتوقفت عن العلاج التقليدي بإشراف طبيب.', 5, 'م', 'from-blue-500 to-cyan-600', true),
('ريم الغامدي', 31, 'الدوحة', 'الهوية الشخصية', 'كنت أعيش الحياة اللي يتوقعها أهلي مني. بدأت أسأل: أنا مين فعلاً؟', 'قدرت أخبر أهلي باختياراتي الحقيقية وأحافظ على علاقتهم في نفس الوقت.', 5, 'ر', 'from-amber-500 to-orange-600', true),
('يوسف القحطاني', 38, 'مسقط', 'العمل والمهنة', 'كنت ناجح من الخارج لكن فاضي من الداخل. الرحلة ساعدتني أعيد تعريف النجاح بطريقتي.', 'انتقلت لمجال يتوافق مع قيمي وأنا أسعد بكتير.', 5, 'ي', 'from-green-500 to-teal-600', true);
