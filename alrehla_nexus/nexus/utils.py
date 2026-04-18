from cryptography.fernet import Fernet
from django.conf import settings
import base64

def get_fernet():
    """
    Initialize Fernet with the Django SECRET_KEY (properly padded/hashed for Fernet)
    """
    # Fernet requires a 32-bit URL-safe base64-encoded key.
    # We'll use the first 32 chars of SECRET_KEY and encode it.
    key = settings.SECRET_KEY[:32].encode()
    return Fernet(base64.urlsafe_b64encode(key))

def encrypt_value(value: str) -> str:
    if not value:
        return value
    f = get_fernet()
    return f.encrypt(value.encode()).decode()

def decrypt_value(value: str) -> str:
    if not value:
        return value
    try:
        f = get_fernet()
        return f.decrypt(value.encode()).decode()
    except Exception:
        return "[Decryption Error]"
