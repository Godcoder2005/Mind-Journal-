from datetime import datetime
from db.models import JournalEntry
from utils.state import MindJournal

def Memory_save(state: MindJournal, db) -> MindJournal:

    sentiment = state["sentiment_result"]
    pattern   = state["pattern_result"]

    entry = JournalEntry(
        user_id = state["user_id"],

        content = state["query"],

        # sentiment
        energy_score = sentiment.get("energy_score"),
        valence = sentiment.get("sentiment_score"),
        primary_emotion = sentiment.get("primary_emotion"),

        # patterns
        themes = ",".join(pattern.get("recurring_themes", [])),
        goals_mentioned = ",".join(pattern.get("goals_mentioned", [])),
        people_mentioned = ",".join(pattern.get("people_mentioned", [])),

        # metadata
        word_count = len(state["query"].split()),
        hour_of_day = datetime.now().hour,
        day_of_week = datetime.now().weekday()
    )

    db.add(entry)
    db.commit()
    db.refresh(entry)
    return state