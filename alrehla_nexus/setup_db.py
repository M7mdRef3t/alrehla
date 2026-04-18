import psycopg2
import os

# Database URL from .env.local (manual copy for now or parsed)
DB_URL = "postgresql://postgres:mm2JMw1iyQiP1l0O@db.acvcnktpsbayowhurcmn.supabase.co:5432/postgres"

def setup_schema():
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()
        print("Checking/Creating 'sovereign' schema...")
        cur.execute("CREATE SCHEMA IF NOT EXISTS sovereign;")
        conn.commit()
        print("✅ Schema 'sovereign' is ready.")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"❌ Error setting up schema: {e}")

if __name__ == "__main__":
    setup_schema()
