from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel
from db.database import SessionLocal
from db.models import (OnboardingAnswer, OnboardingComplete,KnowledgeEntity, KnowledgeRelationship)
from datetime import datetime

llm = ChatGoogleGenerativeAI(model="gemini-3.1-flash-lite-preview", temperature=0.2)

# ── Pydantic schemas ──────────────────────────────────────
class Relationship(BaseModel):
    entity_from: str
    relation:    str   # causes|triggers|improves|worsens|leads_to|supports
    entity_to:   str

class OnboardingExtract(BaseModel):
    entities:      list[str]
    relationships: list[Relationship]
    emotional_tone: str   # positive | negative | neutral | mixed

structured_llm = llm.with_structured_output(OnboardingExtract)

ONBOARDING_QUESTIONS = [
    "What is one thing that has been consistently on your mind lately?",
    "What is one goal you keep coming back to but haven't achieved yet?",
    "Who in your life affects your mood the most — positively or negatively?",
    "What drains your energy the most in a typical week?",
    "What does a good day look like for you versus a bad day?"
]

# ── helpers ───────────────────────────────────────────────
def upsert_entity(db, user_id: int, name: str, boost: int = 3):
    name = name.lower().strip()
    if not name:
        return
    existing = db.query(KnowledgeEntity).filter(
        KnowledgeEntity.user_id == user_id,
        KnowledgeEntity.name    == name
    ).first()
    if existing:
        existing.frequency += boost
    else:
        db.add(KnowledgeEntity(
            user_id   = user_id,
            name      = name,
            frequency = boost   # start higher than 1
        ))                      # because user explicitly stated this

def upsert_relationship(db, user_id, entity_from, relation, entity_to, boost=3):
    entity_from = entity_from.lower().strip()
    entity_to   = entity_to.lower().strip()
    if not entity_from or not entity_to:
        return
    existing = db.query(KnowledgeRelationship).filter(
        KnowledgeRelationship.user_id     == user_id,
        KnowledgeRelationship.entity_from == entity_from,
        KnowledgeRelationship.relation    == relation,
        KnowledgeRelationship.entity_to   == entity_to
    ).first()
    if existing:
        existing.frequency += boost
    else:
        db.add(KnowledgeRelationship(
            user_id     = user_id,
            entity_from = entity_from,
            relation    = relation,
            entity_to   = entity_to,
            frequency   = boost
        ))

# ── check if onboarding is done ───────────────────────────
def is_onboarding_complete(user_id: int) -> bool:
    db = SessionLocal()
    try:
        result = db.query(OnboardingComplete).filter(
            OnboardingComplete.user_id == user_id
        ).first()
        return result is not None
    finally:
        db.close()

# ── get next question ─────────────────────────────────────
def get_next_question(user_id: int) -> dict:
    db = SessionLocal()
    try:
        answered_count = db.query(OnboardingAnswer).filter(
            OnboardingAnswer.user_id == user_id
        ).count()

        if answered_count >= len(ONBOARDING_QUESTIONS):
            return {
                "done":     True,
                "answered": answered_count,
                "total":    len(ONBOARDING_QUESTIONS)
            }

        return {
            "done":       False,
            "question":   ONBOARDING_QUESTIONS[answered_count],
            "step":       answered_count + 1,
            "total":      len(ONBOARDING_QUESTIONS),
            "progress":   int((answered_count / len(ONBOARDING_QUESTIONS)) * 100)
        }
    finally:
        db.close()

# ── process one answer ────────────────────────────────────
def process_answer(user_id: int, question: str, answer: str) -> dict:
    db = SessionLocal()
    try:
        # save raw answer
        db.add(OnboardingAnswer(
            user_id  = user_id,
            question = question,
            answer   = answer
        ))
        db.flush()

        # extract entities + relationships from answer
        prompt = f"""
You are a knowledge graph builder doing user onboarding.
The user was asked: "{question}"
They answered: "{answer}"

Extract everything psychologically relevant from this answer.

Use ONLY these relationship types:
causes | triggers | improves | worsens | leads_to | supports | conflicts_with

Examples:
- "My boss stresses me out" → boss causes stress
- "I want to get fit but keep procrastinating" → fitness leads_to procrastination
- "My friend Sara makes me happy" → sara improves mood

STRICT RULES:
- Keep entity names short and lowercase
- Only extract what is clearly stated
- Maximum 5 relationships per answer
- Boost important entities — user explicitly chose to mention these
"""
        response = structured_llm.invoke(prompt)

        # save entities with boost=3 because user explicitly stated these
        for entity in response.entities:
            upsert_entity(db, user_id, entity, boost=3)

        # save relationships with boost=3
        for rel in response.relationships:
            upsert_relationship(
                db, user_id,
                rel.entity_from,
                rel.relation,
                rel.entity_to,
                boost=3
            )

        # check if all questions answered
        answered_count = db.query(OnboardingAnswer).filter(
            OnboardingAnswer.user_id == user_id
        ).count()

        is_done = answered_count >= len(ONBOARDING_QUESTIONS)

        # mark onboarding complete
        if is_done:
            db.add(OnboardingComplete(
                user_id      = user_id,
                completed_at = datetime.now()
            ))

        db.commit()

        # get next question
        next_q = None
        if not is_done:
            next_q = ONBOARDING_QUESTIONS[answered_count]

        return {
            "saved":         True,
            "is_done":       is_done,
            "next_question": next_q,
            "step":          answered_count + 1,
            "total":         len(ONBOARDING_QUESTIONS)
        }

    except Exception as e:
        db.rollback()
        print(f"Onboarding failed: {e}")
        return {"saved": False, "error": str(e)}
    finally:
        db.close()
        \
# ── Day 1 Profile from onboarding answers ─────────────────
class Day1Profile(BaseModel):
    baseline_energy:  float   # 1-10 predicted energy from Q4+Q5
    energy_drainer:   str     # main thing draining energy (Q4)
    key_person:       str     # person affecting mood most (Q3)
    primary_goal:     str     # goal they keep coming back to (Q2)
    top_of_mind:      str     # what's consistently on mind (Q1)
    good_day_looks_like: str  # from Q5
    bad_day_looks_like:  str  # from Q5
    emotional_tone:   str     # positive | negative | neutral | mixed
    one_line_summary: str     # one sentence about this person

profile_llm = llm.with_structured_output(Day1Profile)

def analyze_onboarding_answers(user_id: int) -> dict:
    db = SessionLocal()
    try:
        answers = (
            db.query(OnboardingAnswer)
            .filter(OnboardingAnswer.user_id == user_id)
            .order_by(OnboardingAnswer.id.asc())
            .all()
        )

        if not answers:
            return {"ready": False, "message": "No onboarding answers found"}

        qa_text = "\n".join([
            f"Q: {a.question}\nA: {a.answer}"
            for a in answers
        ])

        prompt = f"""
You are analyzing a person's onboarding answers for a journaling app.
Extract a Day 1 psychological profile from these answers.

{qa_text}

For baseline_energy: estimate their typical daily energy on a 1-10 scale.
- If they describe draining days, overwhelming stress → 3-5
- If they describe manageable stress, some good days → 5-7
- If they describe mostly good days, clear goals → 7-9

Be specific and personal — use their exact words where possible.
one_line_summary should feel like you truly understand them.
"""
        profile = profile_llm.invoke(prompt)

        return {
            "ready":              True,
            "baseline_energy":    profile.baseline_energy,
            "energy_drainer":     profile.energy_drainer,
            "key_person":         profile.key_person,
            "primary_goal":       profile.primary_goal,
            "top_of_mind":        profile.top_of_mind,
            "good_day_looks_like": profile.good_day_looks_like,
            "bad_day_looks_like":  profile.bad_day_looks_like,
            "emotional_tone":     profile.emotional_tone,
            "one_line_summary":   profile.one_line_summary
        }

    except Exception as e:
        print(f"Day1Profile failed: {e}")
        return {"ready": False, "message": str(e)}
    finally:
        db.close()