from langchain_google_genai import ChatGoogleGenerativeAI
from utils.state import MindJournal
from pydantic import BaseModel
from db.database import SessionLocal
from db.models import JournalEntry, Insight
from services.rag import hybrid_fetch
from sqlalchemy import desc
from datetime import datetime

class InsightStructure(BaseModel):
    reflection:     str
    nudge:          str
    pattern_notice: str
    affirmation:    str

llm            = ChatGoogleGenerativeAI(model="gemini-3.1-flash-lite-preview", temperature=0.4)
structured_llm = llm.with_structured_output(InsightStructure)

def Insight_generation(state: MindJournal) -> MindJournal:
    query             = state['query']
    user_id           = state['user_id']
    stage             = state.get('stage', 'mature_user')
    context           = state['orchestration']['context_for_tools']
    emotional_summary = state['orchestration']['emotional_summary']
    urgency           = state['orchestration']['urgency']
    sentiment         = state['sentiment_result']
    patterns          = state['pattern_result']

    # ── stage gate — decide fetch strategy ───────────────
    if stage in ('anonymous', 'first_entry'):
        is_first_time = True
        past_entries  = ""
    else:
        past_entries, is_first_time = hybrid_fetch(user_id, query)

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
- Never use "you often", "you usually", "you tend to" — no history exists yet
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
- Goal drift detected: {patterns['goal_drift']}
- People mentioned: {patterns['people_mentioned']}

RELEVANT PAST ENTRIES (retrieved via hybrid RAG):
{past_entries}

Write a deeply personal response using BOTH today's entry AND past history.
The past entries above were retrieved semantically — they are the most relevant
to what this person is feeling right now, not just the most recent.
If you see a pattern across entries, call it out gently.
If they have improved since a similar past entry, acknowledge it specifically.

Rules:
- reflection: 2-3 warm sentences showing you understood today AND their journey
- nudge: one small kind actionable suggestion — not preachy
- pattern_notice: one honest observation using today + past entries
- affirmation: one specific affirmation based on what they wrote today

STRICT RULES:
- Never be generic — reference specifics from their entries
- Speak like a wise caring friend not a therapist
- If urgency is high — lead with warmth and safety first
"""

    response = structured_llm.invoke(prompt)

    # ── save to DB only for logged in users ──────────────
    if user_id is not None:
        db = SessionLocal()
        try:
            insight = Insight(
                user_id    = user_id,
                content    = response.reflection,
                type       = "daily",
                created_at = datetime.now()
            )
            db.add(insight)
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"Insight save failed: {e}")
        finally:
            db.close()

    return {
        **state,
        "insight_result": response.model_dump()
    }