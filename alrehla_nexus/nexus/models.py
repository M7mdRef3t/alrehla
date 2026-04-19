from django.db import models
from django.conf import settings
from .utils import encrypt_value, decrypt_value

class SovereignEncryptedField(models.TextField):
    """
    حقل سيادي يقوم بتشفير البيانات آلياً قبل الحفظ في Postgres 
    ويفك التشفير آلياً عند القراءة.
    """
    description = "Field that encrypts data at rest"

    def from_db_value(self, value, expression, connection):
        if value is None:
            return value
        return decrypt_value(value)

    def to_python(self, value):
        if value is None or not isinstance(value, str):
            return value
        # نعتبره مشفراً لو مش راجع من الـ DB مباشرة في الغالب
        # بس Django بينادي ده كتير، فإحنا هنعتمد على to_db_value أكتر
        return value

    def get_prep_value(self, value):
        if value is None:
            return value
        return encrypt_value(str(value))

class UserInsight(models.Model):
    """
    الخزنة السيادية للبصائر.
    المحتوى النصي مشفر بالكامل.
    """
    user_id = models.UUIDField(db_index=True) # UUID اللي جاي من Supabase
    content = SovereignEncryptedField()
    category = models.CharField(max_length=100, default="general")
    energy_level = models.IntegerField(default=5)
    exercise_code = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Insight for {self.user_id} - {self.category}"
