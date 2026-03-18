from db.database import SessionLocal, engine
from db.models import Base, User, JournalEntry

# Step 1 — check tables exist
print("Checking tables...")
Base.metadata.create_all(bind=engine)
print("✅ Tables created successfully")

# Step 2 — check connection
db = SessionLocal()
try:
    # try a simple query
    user_count = db.query(User).count()
    entry_count = db.query(JournalEntry).count()
    print(f"✅ Database connected successfully")
    print(f"✅ Users in DB: {user_count}")
    print(f"✅ Journal entries in DB: {entry_count}")
except Exception as e:
    print(f"❌ Database connection failed: {e}")
finally:
    db.close()

# Step 3 — show all tables
from sqlalchemy import inspect
inspector = inspect(engine)
tables = inspector.get_table_names()
print(f"\n✅ Tables found in database:")
for table in tables:
    print(f"   - {table}")