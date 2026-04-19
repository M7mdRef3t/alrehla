import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from nexus.models import UserInsight
from django.db import connection

def test_sovereign_logic():
    print("Testing Sovereign Logic...")
    
    # 1. Create a mock user if not exists
    user, _ = User.objects.get_or_create(username="test_supabase_user")
    
    # 2. Create an insight
    content_text = "هذه بصيرة سرية جدا لمسافر الرحلة."
    insight = UserInsight.objects.create(
        user=user,
        content=content_text,
        category="self-discovery",
        energy_level=8,
        exercise_code="EXE-001"
    )
    print(f"PASS: Insight created with ID: {insight.id}")
    
    # 3. Verify decryption on read
    fetched = UserInsight.objects.get(id=insight.id)
    print(f"Read content: {fetched.content}")
    assert fetched.content == content_text
    print("PASS: Decryption works correctly.")
    
    # 4. Verify encryption in DB (Raw Query)
    with connection.cursor() as cursor:
        cursor.execute("SELECT content FROM nexus_userinsight WHERE id = %s", [insight.id])
        raw_content = cursor.fetchone()[0]
        print(f"Raw content in DB (first 50 chars): {raw_content[:50]}...")
        assert content_text not in raw_content
        print("PASS: Encryption at rest verified.")

if __name__ == "__main__":
    test_sovereign_logic()
