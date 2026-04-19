import base64
from django.conf import settings
from cryptography.fernet import Fernet
import hashlib

def get_sovereign_key():
    """
    توليد مفتاح تشفير ثابت يعتمد على SECRET_KEY الخاص بـ Django.
    يضمن سيادة البيانات حتى لو تم تسريب قاعدة البيانات.
    """
    h = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
    return base64.urlsafe_b64encode(h)

def encrypt_value(value: str) -> str:
    if not value:
        return ""
    f = Fernet(get_sovereign_key())
    return f.encrypt(value.encode()).decode()

def decrypt_value(token: str) -> str:
    if not token:
        return ""
    try:
        f = Fernet(get_sovereign_key())
        return f.decrypt(token.encode()).decode()
    except Exception:
        return "[Error: Decryption Failed]"
