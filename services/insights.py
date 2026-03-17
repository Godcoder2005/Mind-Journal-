from langchain_google_genai import ChatGoogleGenerativeAI
from utils.state import MindJournal
from pydantic import BaseModel
from db.database import SessionLocal
from db.models import JournalEntry, Insight
from sqlalchemy import desc

# pydantic class for structured output
class InsightStructure(BaseModel):
    reflection:     str
    nudge:          str
    pattern_notice: str
    affirmation:    str

# llm model
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.4)
structured_llm = llm.with_structured_output(InsightStructure)

# function to fetch past entries
def fetch_past_entries(user_id: int, limit: int = 5):
    db = SessionLocal()
    try:
        entries = (
            db.query(JournalEntry)
            .filter(JournalEntry.user_id == user_id)
            .order_by(desc(JournalEntry.created_at))
            .limit(limit)
            .all()
        )

        if not entries:
            return "", True 

        past = []
        for e in entries:
            themes = e.themes if e.themes else "none"
            past.append(
                f"- [{e.created_at.strftime('%d %b')}] "
                f"Mood: {e.primary_emotion} | Energy: {e.energy_score}/10 | "
                f"Themes: {themes} | Entry: {e.content[:100]}..."
            )
        return "\n".join(past), False   # ← returning tuple here too

    finally:
        db.close()

def Insight_generation(state: MindJournal) -> MindJournal:
    query             = state['query']
    user_id           = state['user_id']
    context           = state['orchestration']['context_for_tools']
    emotional_summary = state['orchestration']['emotional_summary']
    urgency           = state['orchestration']['urgency']
    sentiment         = state['sentiment_result']
    patterns          = state['pattern_result']

    past_entries, is_first_time = fetch_past_entries(user_id)

    if is_first_time:
        prompt = f"""
You are Mind Mirror — a warm, emotionally intelligent journaling companion.
This is the FIRST TIME this person has ever used the app.
They just wrote their very first journal entry.

FIRST ENTRY:
\"\"\"{query}\"\"\"

WHAT YOU KNOW:
- Emotional summary: {emotional_summary}
- Energy: {sentiment['energy_score']}/10
- Mood: {sentiment['mood']}
- Primary emotion: {sentiment['primary_emotion']}
- Themes: {patterns['recurring_themes']}

This is a sacred moment — they chose to start journaling today.
Be welcoming, warm, and encouraging. Make them feel safe and seen.

Rules:
- reflection: acknowledge their courage in starting + reflect what they shared today
- nudge: one gentle suggestion to come back tomorrow — make it feel easy not a task
- pattern_notice: something interesting you noticed from this first entry alone
- affirmation: make them feel genuinely welcomed and understood

STRICT RULES:
- Never mention this is their first entry in a clinical way
- Do NOT say "Welcome to Mind Mirror" — too robotic
- Speak like a wise friend who is genuinely happy they opened up
"""
    else:
        prompt = f"""
You are Mind Mirror — a deeply empathetic journaling companion with 10+ years 
of experience in cognitive behavioral therapy and emotional coaching.

CURRENT JOURNAL ENTRY:
\"\"\"{query}\"\"\"

WHAT YOU KNOW FROM ANALYSIS:
- Emotional summary: {emotional_summary}
- Urgency: {urgency}
- Energy: {sentiment['energy_score']}/10
- Mood: {sentiment['mood']}
- Primary emotion: {sentiment['primary_emotion']}
- Cognitive distortions: {sentiment['cognitive_distortions']}
- Recurring themes: {patterns['recurring_themes']}
- Goals mentioned: {patterns['goals_mentioned']}
- Goal drift: {patterns['goal_drift']}
- People mentioned: {patterns['people_mentioned']}

THIS PERSON'S RECENT JOURNAL HISTORY:
{past_entries}

Write a deeply personal response using BOTH today's entry AND their history.

Rules:
- reflection: 2-3 warm sentences showing you understood today AND their journey
- nudge: one small kind actionable suggestion — not preachy
- pattern_notice: one honest observation across current + past entries
- affirmation: one specific affirmation based on what they wrote today

STRICT RULES:
- Never be generic — reference specifics from their entries
- Speak like a wise caring friend not a therapist
- If urgency is high — lead with warmth and safety first
"""

    response = structured_llm.invoke(prompt)

    # save to DB BEFORE returning
    db = SessionLocal()
    try:
        insight = Insight(
            user_id = user_id,
            content = response.reflection,
            type    = "reflection"
        )
        db.add(insight)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Insight save failed: {e}")
    finally:
        db.close()

    # return AFTER saving

    return {
        **state,
        "insight_result": response.model_dump()
    }