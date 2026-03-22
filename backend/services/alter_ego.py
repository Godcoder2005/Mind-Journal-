from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from db.database import SessionLocal
from db.models import JournalEntry, KnowledgeEntity, KnowledgeRelationship, AlterEgoSession
from services.rag import retrieve_similar_entries
from sqlalchemy import desc
from datetime import datetime
from services.gamification import award_xp

llm = ChatGoogleGenerativeAI(model="gemini-3.1-flash-lite-preview", temperature=0.7)

# ── Build persona from knowledge graph + RAG ──────────────
def build_persona(user_id: int, question: str = "") -> str:
    db = SessionLocal()
    try:
        # top 15 knowledge entities
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

        # entry count check
        count = db.query(JournalEntry).filter(
            JournalEntry.user_id == user_id
        ).count()

        if count < 5:
            return None

        # RAG — retrieve entries most relevant to this question
        if question:
            relevant_entries = retrieve_similar_entries(
                user_id, question, k=6
            )
        else:
            # fallback — recent entries
            recent = (
                db.query(JournalEntry)
                .filter(JournalEntry.user_id == user_id)
                .order_by(desc(JournalEntry.created_at))
                .limit(10)
                .all()
            )
            relevant_entries = "\n".join([
                f"[{e.created_at.strftime('%d %b')}] "
                f"Energy {e.energy_score}/10 | {e.content[:150]}..."
                for e in recent
            ])

        # format entities
        entity_text = "\n".join([
            f"- {e.name} (mentioned {e.frequency} times)"
            for e in entities
        ])

        # format relationships
        rel_text = "\n".join([
            f"- {r.entity_from} {r.relation.replace('_', ' ')} "
            f"{r.entity_to} (confirmed {r.frequency} times)"
            for r in relationships
        ])

        # compute energy stats
        entries_all = (
            db.query(JournalEntry)
            .filter(JournalEntry.user_id == user_id)
            .order_by(desc(JournalEntry.created_at))
            .limit(20)
            .all()
        )
        scores     = [e.energy_score for e in entries_all if e.energy_score]
        avg_energy = round(sum(scores) / len(scores), 1) if scores else 5.0
        low_days   = len([s for s in scores if s <= 4])
        high_days  = len([s for s in scores if s >= 7])

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
MOST RELEVANT PAST ENTRIES (retrieved via RAG):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{relevant_entries}

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

# ── Load conversation history ─────────────────────────────
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
        return list(reversed(sessions))
    finally:
        db.close()

# ── Save message ──────────────────────────────────────────
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

# ── Main chat function ────────────────────────────────────
def chat_with_alter_ego(user_id: int, message: str) -> dict:
    db = SessionLocal()
    try:
        entry_count = db.query(JournalEntry).filter(
            JournalEntry.user_id == user_id
        ).count()
    finally:
        db.close()

    # scenario 1 — brand new user
    if entry_count == 0:
        return {
            "ready":    False,
            "scenario": "new_user",
            "message":  "Your Alter Ego hasn't been born yet. "
                        "Write your first journal entry and "
                        "I'll start learning who you are.",
            "progress": 0,
            "required": 5
        }

    # scenario 2 — not enough entries
    if entry_count < 5:
        return {
            "ready":    False,
            "scenario": "building",
            "message":  f"Your Alter Ego is still forming. "
                        f"I've read {entry_count} of your entries. "
                        f"Write {5 - entry_count} more and I'll have "
                        f"enough to truly speak as you.",
            "progress": entry_count,
            "required": 5
        }

    # scenario 3 — build persona using RAG with current question
    persona = build_persona(user_id, question=message)
    if not persona:
        return {
            "ready":   False,
            "message": "Not enough data yet. Keep journaling."
        }

    history  = load_history(user_id)
    messages = [SystemMessage(content=persona)]

    for h in history:
        if h.role == "user":
            messages.append(HumanMessage(content=h.content))
        else:
            messages.append(AIMessage(content=h.content))

    messages.append(HumanMessage(content=message))

    response = llm.invoke(messages)

    if isinstance(response.content, list):
        response_text = "".join(
            block["text"] if isinstance(block, dict) else block.text
            for block in response.content
            if (isinstance(block, dict) and block.get("type") == "text")
            or (hasattr(block, "type") and block.type == "text")
        )
    else:
        response_text = response.content
    
    save_message(user_id, "user",      message)
    save_message(user_id, "assistant", response.content)
    award_xp(user_id, "alter_ego_chat")

    return {
        "ready":       True,
        "scenario":    "active",
        "response":    response.content,
        "entry_count": entry_count
    }

# ── Clear history ─────────────────────────────────────────
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