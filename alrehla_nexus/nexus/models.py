from django.db import models
from django.contrib.auth.models import User
from .utils import encrypt_value, decrypt_value

class SovereignEncryptedField(models.TextField):
    """
    A field that encrypts data on 'save' and decrypts in 'read'.
    """
    def from_db_value(self, value, expression, connection):
        return decrypt_value(value)

    def to_python(self, value):
        return decrypt_value(value)

    def get_prep_value(self, value):
        return encrypt_value(value)

class UserInsight(models.Model):
    """
    Sovereign User Insight model.
    Stores user's personal reflections and AI-generated insights securely.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='insights')
    
    # Encrypted content at rest using custom SovereignEncryptedField
    content = SovereignEncryptedField(verbose_name="البصيرة المشفرة")
    
    # Metadata
    category = models.CharField(max_length=100, default='general', verbose_name="التصنيف")
    energy_level = models.IntegerField(default=5, verbose_name="مستوى الطاقة")
    exercise_code = models.CharField(max_length=100, blank=True, null=True, verbose_name="كود التمرين")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "بصيرة المستخدم"
        verbose_name_plural = "بصائر المستخدمين"
        ordering = ['-created_at']

    def __str__(self):
        return f"Insight {self.id} for {self.user.username} ({self.category})"
