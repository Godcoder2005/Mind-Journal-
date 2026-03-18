from db.database import SessionLocal
from db.models import JournalEntry
from utils.state import MindJournal
from datetime import datetime

def Memory_save(state: MindJournal) -> MindJournal:  # ← only state, no db
    db = SessionLocal() 
    try:
        query     = state['query']
        user_id   = state['user_id']
        sentiment = state['sentiment_result']
        patterns  = state['pattern_result']
        now       = datetime.now()

        entry = JournalEntry(
            user_id         = user_id,
            content         = query,
            energy_score    = sentiment['energy_score'],
            valence         = sentiment['sentiment_score'],
            mood            = sentiment['mood'],
            primary_emotion = sentiment['primary_emotion'],
            themes          = ", ".join(patterns['recurring_themes']),
            goals_mentioned = ", ".join(patterns['goals_mentioned']),
            people_mentioned = ", ".join(patterns['people_mentioned']),
            word_count      = len(query.split()),
            hour_of_day     = now.hour,
            day_of_week     = now.weekday(),
            created_at      = now
        )

        db.add(entry)
        db.commit()

        return {
            **state,
            "memory_saved": True
        }

    except Exception as e:
        db.rollback()
        print(f"Memory_save failed: {e}")
        return {
            **state,
            "memory_saved": False
        }
    finally:
        db.close()

def NodeName(state: MindJournal) -> MindJournal:
    db = SessionLocal()