import psycopg2
import os

# Database URL from environment
DB_URL = os.getenv("SOVEREIGN_DB_URL")

def setup_schema():
    if not DB_URL:
        print("❌ Error: SOVEREIGN_DB_URL environment variable is not set.")
        return
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
