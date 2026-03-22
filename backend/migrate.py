from db.database import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        # get existing columns
        result = conn.execute(text("PRAGMA table_info(journal_entries)"))
        existing_columns = [row[1] for row in result.fetchall()]
        print("Existing columns:", existing_columns)

        # add missing columns only if they don't exist
        columns_to_add = {
            "mood":             "VARCHAR",
            "primary_emotion":  "VARCHAR",
            "goals_mentioned":  "TEXT",
            "people_mentioned": "TEXT",
            "valence":          "FLOAT",
            "energy_score":     "FLOAT",
            "word_count":       "INTEGER",
            "hour_of_day":      "INTEGER",
            "day_of_week":      "INTEGER",
            "xp":               "INTEGER DEFAULT 0",
            "level":            "INTEGER DEFAULT 1",
        }

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS xp_logs (
                id INTEGER PRIMARY KEY,
                user_id INTEGER,
                action VARCHAR,
                xp_earned INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """))

        for column_name, column_type in columns_to_add.items():
            if column_name not in existing_columns:
                conn.execute(text(
                    f"ALTER TABLE journal_entries ADD COLUMN {column_name} {column_type}"
                ))
                print(f"✅ Added column: {column_name}")
            else:
                print(f"⏭️  Already exists: {column_name}")

        conn.commit()
        print("\n✅ Migration complete")

if __name__ == "__main__":
    migrate()