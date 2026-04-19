from cryptography.fernet import Fernet
from django.conf import settings
import base64

def get_fernet():
    """
    Initialize Fernet with an environment secret or fallback to Django SECRET_KEY
    """
    # Prefer a dedicated environment key for the Sovereign Engine
    env_key = os.getenv("SOVEREIGN_ENGINE_SECRET")
    if env_key:
        # If it's already a valid Fernet key (32 bytes base64), use it directly
        try:
            return Fernet(env_key.encode())
        except Exception:
            # Fallback to derivation if it's just a raw secret string
            key = env_key[:32].ljust(32, '0').encode()
    else:
        # Fallback to Django SECRET_KEY (properly padded/hashed for Fernet)
        key = settings.SECRET_KEY[:32].ljust(32, '0').encode()
    
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
