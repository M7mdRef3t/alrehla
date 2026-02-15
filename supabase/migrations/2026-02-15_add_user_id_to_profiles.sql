-- إضافة عمود user_id لربط الجلسة بالمستخدم المسجّل (Session → User Stitching)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_id text;
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON profiles (user_id);
