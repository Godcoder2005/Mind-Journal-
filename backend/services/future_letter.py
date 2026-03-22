from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel
from db.database import SessionLocal
from db.models import (
    JournalEntry, KnowledgeEntity,
    KnowledgeRelationship, FutureLetter
)
from sqlalchemy import desc
from datetime import datetime, timedelta

llm = ChatGoogleGenerativeAI(model="gemini-3.1-flash-lite-preview", temperature=0.8)

class LetterOutput(BaseModel):
    subject:     str   # letter subject line e.g. "I remember this month"
    letter:      str   # full letter text
    mood_of_month: str # one word capturing this month's theme

structured_llm = llm.with_structured_output(LetterOutput)

# ─────────────────────────────────────────────
# Fetch everything needed for the letter
# ─────────────────────────────────────────────
def fetch_letter_data(user_id: int) -> dict:
    db = SessionLocal()
    try:
        cutoff = datetime.now() - timedelta(days=30)

        # last 30 days entries
        entries = (
            db.query(JournalEntry)
            .filter(
                JournalEntry.user_id   == user_id,
                JournalEntry.created_at >= cutoff
            )
            .order_by(JournalEntry.created_at.asc())
            .all()
        )

        # top entities
        entities = (
            db.query(KnowledgeEntity)
            .filter(KnowledgeEntity.user_id == user_id)
            .order_by(KnowledgeEntity.frequency.desc())
            .limit(12)
            .all()
        )

        # strongest relationships
        relationships = (
            db.query(KnowledgeRelationship)
            .filter(KnowledgeRelationship.user_id == user_id)
            .order_by(KnowledgeRelationship.frequency.desc())
            .limit(15)
            .all()
        )

        if not entries:
            return None

        # compute stats
        scores     = [e.energy_score for e in entries if e.energy_score]
        avg_energy = round(sum(scores) / len(scores), 1) if scores else 5.0

        moods = [e.mood for e in entries if e.mood]
        dominant_mood = max(set(moods), key=moods.count) if moods else "neutral"

        # format entries as a timeline
        entry_lines = "\n".join([
            f"[{e.created_at.strftime('%d %b')}] "
            f"Energy {e.energy_score}/10 | "
            f"Mood: {e.mood} | "
            f"{e.content[:200]}..."
            for e in entries
        ])

        # format knowledge
        entity_lines = "\n".join([
            f"- {e.name} ({e.frequency} times)"
            for e in entities
        ])

        rel_lines = "\n".join([
            f"- {r.entity_from} {r.relation.replace('_',' ')} "
            f"{r.entity_to} ({r.frequency} times)"
            for r in relationships
        ])

        return {
            "entries":       entry_lines,
            "entities":      entity_lines,
            "relationships": rel_lines,
            "avg_energy":    avg_energy,
            "dominant_mood": dominant_mood,
            "entry_count":   len(entries),
            "month":         datetime.now().strftime("%B %Y")
        }

    finally:
        db.close()

# ─────────────────────────────────────────────
# Check if letter already exists this month
# ─────────────────────────────────────────────
def letter_exists_this_month(user_id: int) -> bool:
    db = SessionLocal()
    try:
        current_month = datetime.now().strftime("%B %Y")
        existing = db.query(FutureLetter).filter(
            FutureLetter.user_id == user_id,
            FutureLetter.month   == current_month
        ).first()
        return existing is not None
    finally:
        db.close()

# ─────────────────────────────────────────────
# Generate the letter
# ─────────────────────────────────────────────
def generate_future_letter(user_id: int, force: bool = False) -> dict:

    # don't regenerate if already exists this month
    if not force and letter_exists_this_month(user_id):
        return get_latest_letter(user_id)

    data = fetch_letter_data(user_id)

    if not data:
        return {
            "ready":   False,
            "message": "Write at least one journal entry to receive your first letter"
        }

    if data["entry_count"] < 5:
        return {
            "ready":   False,
            "message": f"Write {5 - data['entry_count']} more entries "
                       f"this month to unlock your Future Self Letter"
        }

    prompt = f"""
You are writing a letter from someone's future self — 
exactly 1 year from now — back to their present self.

You have full access to what their {data['month']} looked like:

THEIR JOURNAL ENTRIES THIS MONTH:
{data['entries']}

WHAT MATTERED MOST TO THEM:
{data['entities']}

HOW THINGS CONNECTED IN THEIR LIFE:
{data['relationships']}

THIS MONTH'S STATS:
- Average energy: {data['avg_energy']}/10
- Dominant mood: {data['dominant_mood']}
- Number of entries: {data['entry_count']}

Write a deeply personal letter FROM their future self 
TO their present self about this specific month.

The future self has:
- Lived through everything this person is currently facing
- Come out the other side
- Gained perspective on what actually mattered
- Grown through the struggles mentioned in the entries

Rules for the letter:
- Start with "Dear [month] me," e.g. "Dear March me,"
- Reference SPECIFIC things from their entries — 
  never be generic
- The future self speaks with warmth, honesty, 
  and hard-won perspective
- Acknowledge the real struggles without minimizing them
- Reveal what actually mattered vs what felt urgent
- End with one specific piece of advice only 
  the future self could give
- Tone: like a letter from an older sibling who 
  loves you and has been through it

subject: a short poetic subject line for the letter
letter: the full letter — 3 to 4 paragraphs
mood_of_month: one word capturing the essence of 
               this month e.g. "turbulent", "searching", 
               "rebuilding", "awakening"

STRICT RULES:
- Never use generic phrases like "believe in yourself"
- Every sentence must be grounded in their actual data
- The future self references specific struggles by name
- Maximum 400 words for the letter
- Make them cry a little — in a good way
"""

    response = structured_llm.invoke(prompt)

    # save to DB
    db = SessionLocal()
    try:
        letter = FutureLetter(
            user_id      = user_id,
            month        = data['month'],
            letter       = response.letter,
            mood_summary = response.mood_of_month,
            avg_energy   = data['avg_energy'],
            created_at   = datetime.now()
        )
        db.add(letter)
        db.commit()
        db.refresh(letter)

        return {
            "ready":         True,
            "month":         data['month'],
            "subject":       response.subject,
            "letter":        response.letter,
            "mood_of_month": response.mood_of_month,
            "avg_energy":    data['avg_energy'],
            "created_at":    letter.created_at.strftime("%d %B %Y")
        }

    except Exception as e:
        db.rollback()
        print(f"Future letter save failed: {e}")
        return {"ready": False, "error": str(e)}
    finally:
        db.close()

# ─────────────────────────────────────────────
# Get latest letter
# ─────────────────────────────────────────────
def get_latest_letter(user_id: int) -> dict:
    db = SessionLocal()
    try:
        letter = (
            db.query(FutureLetter)
            .filter(FutureLetter.user_id == user_id)
            .order_by(desc(FutureLetter.created_at))
            .first()
        )
        if not letter:
            return {
                "ready":   False,
                "message": "No letters yet — your first letter arrives at the end of the month"
            }
        return {
            "ready":         True,
            "month":         letter.month,
            "letter":        letter.letter,
            "mood_of_month": letter.mood_summary,
            "avg_energy":    letter.avg_energy,
            "created_at":    letter.created_at.strftime("%d %B %Y")
        }
    finally:
        db.close()

# ─────────────────────────────────────────────
# Get all past letters — letter archive
# ─────────────────────────────────────────────
def get_all_letters(user_id: int) -> list:
    db = SessionLocal()
    try:
        letters = (
            db.query(FutureLetter)
            .filter(FutureLetter.user_id == user_id)
            .order_by(desc(FutureLetter.created_at))
            .all()
        )
        return [
            {
                "month":         l.month,
                "subject":       l.letter[:60] + "...",
                "mood_of_month": l.mood_summary,
                "avg_energy":    l.avg_energy,
                "created_at":    l.created_at.strftime("%d %B %Y")
            }
            for l in letters
        ]
    finally:
        db.close()