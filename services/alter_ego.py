from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from db.database import SessionLocal
from db.models import (
    JournalEntry, KnowledgeEntity,
    KnowledgeRelationship, AlterEgoSession
)
from sqlalchemy import desc
from datetime import datetime

llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.7)

# ─────────────────────────────────────────────
# Step 1 — Build the persona from all stored data
# ─────────────────────────────────────────────
def build_persona(user_id: int) -> str:
    db = SessionLocal()
    try:
        # top 15 entities by frequency
        entities = (
            db.query(KnowledgeEntity)
            .filter(KnowledgeEntity.user_id == user_id)
            .order_by(KnowledgeEntity.frequency.desc())
            .limit(15)
            .all()
        )

        # top 20 strongest relationships
        relationships = (
            db.query(KnowledgeRelationship)
            .filter(KnowledgeRelationship.user_id == user_id)
            .order_by(KnowledgeRelationship.frequency.desc())
            .limit(20)
            .all()
        )

        # last 15 journal entries
        entries = (
            db.query(JournalEntry)
            .filter(JournalEntry.user_id == user_id)
            .order_by(desc(JournalEntry.created_at))
            .limit(15)
            .all()
        )

        if len(entries) < 5:
            return None

        # format entities
        entity_text = "\n".join([
            f"- {e.name} (mentioned {e.frequency} times)"
            for e in entities
        ])

        # format relationships as readable sentences
        rel_text = "\n".join([
            f"- {r.entity_from} {r.relation.replace('_', ' ')} "
            f"{r.entity_to} (confirmed {r.frequency} times)"
            for r in relationships
        ])

        # format recent entries
        entry_text = "\n".join([
            f"[{e.created_at.strftime('%d %b')}] "
            f"Energy {e.energy_score}/10 | "
            f"Mood: {e.mood} | "
            f"{e.content[:150]}..."
            for e in entries
        ])

        # calculate stats
        scores     = [e.energy_score for e in entries if e.energy_score]
        avg_energy = round(sum(scores) / len(scores), 1) if scores else 5.0
        low_days   = len([s for s in scores if s <= 4])
        high_days  = len([s for s in scores if s >= 7])

        # build the persona — this is the system prompt
        persona = f"""
You are this person's Alter Ego — the most honest,
self-aware version of them that exists.

You were built entirely from their private journal entries.
You know them better than anyone because you ARE them —
their inner voice given words.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHAT MATTERS MOST TO THIS PERSON:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{entity_text}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOW THINGS CONNECT IN THEIR LIFE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{rel_text}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RECENT JOURNAL ENTRIES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{entry_text}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ENERGY PATTERNS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Average energy: {avg_energy}/10
- High energy days: {high_days} out of last {len(scores)}
- Low energy days: {low_days} out of last {len(scores)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOW TO SPEAK AS THIS PERSON:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Always speak in first person — use "I", "me", "my"
- Reason from the patterns, relationships and entries above
- Be honest even when uncomfortable — you are their inner
  voice not a yes-man
- Reference specific things from their data when relevant
- If you see a pattern they are avoiding, gently name it
- If asked something you don't have enough data for, 
  say "I'm not sure — I haven't written about this enough"
- Never give generic advice — always ground in their data
- You are NOT an AI assistant — you are their most 
  self-aware inner voice

IMPORTANT: If the relationship data shows a chain 
e.g. manager → causes → stress → leads_to → gym_skipped
reason through that full chain in your answer.
"""
        return persona

    finally:
        db.close()


# ─────────────────────────────────────────────
# Step 2 — Load conversation history from DB
# ─────────────────────────────────────────────
def load_history(user_id: int, limit: int = 10) -> list:
    db = SessionLocal()
    try:
        sessions = (
            db.query(AlterEgoSession)
            .filter(AlterEgoSession.user_id == user_id)
            .order_by(AlterEgoSession.created_at.desc())
            .limit(limit)
            .all()
        )
        # reverse to get chronological order
        return list(reversed(sessions))
    finally:
        db.close()


# ─────────────────────────────────────────────
# Step 3 — Save message to DB
# ─────────────────────────────────────────────
def save_message(user_id: int, role: str, content: str):
    db = SessionLocal()
    try:
        msg = AlterEgoSession(
            user_id    = user_id,
            role       = role,
            content    = content,
            created_at = datetime.now()
        )
        db.add(msg)
        db.commit()
    finally:
        db.close()


# ─────────────────────────────────────────────
# Step 4 — Main chat function
# ─────────────────────────────────────────────
def chat_with_alter_ego(user_id: int, message: str) -> dict:

    # check if enough data exists
    persona = build_persona(user_id)
    if not persona:
        return {
            "ready":   False,
            "message": "Write at least 5 journal entries to unlock your Alter Ego"
        }

    # load past conversation history from DB
    history = load_history(user_id)

    # build message list for LLM
    messages = [SystemMessage(content=persona)]

    # add conversation history
    for h in history:
        if h.role == "user":
            messages.append(HumanMessage(content=h.content))
        else:
            messages.append(AIMessage(content=h.content))

    # add current message
    messages.append(HumanMessage(content=message))

    # get response
    response = llm.invoke(messages)

    # save both messages to DB for next session
    save_message(user_id, "user",      message)
    save_message(user_id, "assistant", response.content)

    return {
        "ready":    True,
        "response": response.content
    }


# ─────────────────────────────────────────────
# Step 5 — Clear conversation history
# ─────────────────────────────────────────────
def clear_alter_ego_history(user_id: int):
    db = SessionLocal()
    try:
        db.query(AlterEgoSession).filter(
            AlterEgoSession.user_id == user_id
        ).delete()
        db.commit()
        return {"message": "Conversation cleared"}
    finally:
        db.close()