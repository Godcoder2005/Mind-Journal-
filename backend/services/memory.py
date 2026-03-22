from db.database import SessionLocal
from db.models import JournalEntry
from utils.state import MindJournal
from services.rag import add_entry_to_faiss
from datetime import datetime
from services.gamification import award_xp

def Memory_save(state: MindJournal) -> MindJournal:
    # ── skip DB insert for anonymous users ────────────────
    if state.get('stage') == 'anonymous':
        return state
    # ── existing logic unchanged below ───────────────────
    db = SessionLocal()
    try:
        query     = state['query']
        user_id   = state['user_id']
        sentiment = state['sentiment_result']
        patterns  = state['pattern_result']
        now       = datetime.now()

        entry = JournalEntry(
            user_id          = user_id,
            content          = query,
            energy_score     = sentiment['energy_score'],
            valence          = sentiment['sentiment_score'],
            mood             = sentiment['mood'],
            primary_emotion  = sentiment['primary_emotion'],
            themes           = ", ".join(patterns['recurring_themes']),
            goals_mentioned  = ", ".join(patterns['goals_mentioned']),
            people_mentioned = ", ".join(patterns['people_mentioned']),
            word_count       = len(query.split()),
            hour_of_day      = now.hour,
            day_of_week      = now.weekday(),
            created_at       = now
        )

        db.add(entry)
        db.commit()
        db.refresh(entry)
        award_xp(user_id, "journal_entry")

        # add to FAISS vector store after saving to SQL
        add_entry_to_faiss(
            user_id  = user_id,
            entry_id = entry.id,
            content  = query
        )

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