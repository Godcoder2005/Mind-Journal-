from db.database import SessionLocal
from db.models import JournalEntry

def get_user_stage(user_id) -> str:
    if user_id is None:
        return "anonymous"

    db = SessionLocal()
    try:
        count = db.query(JournalEntry).filter(
            JournalEntry.user_id == user_id
        ).count()

        if count == 0:   return "first_entry"
        if count < 5:    return "early_user"
        return "mature_user"

    finally:
        db.close()