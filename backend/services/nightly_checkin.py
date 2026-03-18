from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel
from db.database import SessionLocal
from db.models import NightlyCheckin, KnowledgeEntity, KnowledgeRelationship
from sqlalchemy import desc
from datetime import datetime, timedelta

llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.3)

# ── Pydantic schema ───────────────────────────────────────
class CheckinAnalysis(BaseModel):
    emotional_pattern: str   # what today reveals
    trigger_entity:    str   # main trigger detected — empty if none
    trigger_relation:  str   # how it connects — empty if none
    weekly_insight:    str   # pattern across 7 days — empty if less than 3
    nudge:             str   # one gentle suggestion

structured_llm = llm.with_structured_output(CheckinAnalysis)

CHECKIN_QUESTIONS = [
    {
        "id":   "best_moment",
        "text": "What was the best moment of today?",
        "type": "positive"
    },
    {
        "id":   "reaction_moment",
        "text": "Was there a moment today where you reacted instead of responded?",
        "type": "reflection"
    },
    {
        "id":   "patience_test",
        "text": "What or who tested your patience today?",
        "type": "trigger"
    },
    {
        "id":   "blame_target",
        "text": "Did you catch yourself blaming someone — or yourself?",
        "type": "accountability"
    },
    {
        "id":   "tomorrow_intention",
        "text": "One thing you want to do differently tomorrow?",
        "type": "intention"
    }
]

# ── helpers ───────────────────────────────────────────────
def _upsert_entity(db, user_id: int, name: str):
    name = name.lower().strip()
    if not name:
        return
    existing = db.query(KnowledgeEntity).filter(
        KnowledgeEntity.user_id == user_id,
        KnowledgeEntity.name    == name
    ).first()
    if existing:
        existing.frequency += 1
    else:
        db.add(KnowledgeEntity(
            user_id   = user_id,
            name      = name,
            frequency = 1
        ))

def _upsert_relationship(db, user_id: int, entity_from: str, relation: str, entity_to: str):
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
        existing.frequency += 1
    else:
        db.add(KnowledgeRelationship(
            user_id     = user_id,
            entity_from = entity_from,
            relation    = relation,
            entity_to   = entity_to,
            frequency   = 1
        ))

# ── get questions ─────────────────────────────────────────
def get_checkin_questions() -> list:
    return CHECKIN_QUESTIONS

# ── check if already done today ───────────────────────────
def already_checked_in_today(user_id: int) -> bool:
    db = SessionLocal()
    try:
        today = datetime.now().date()
        existing = db.query(NightlyCheckin).filter(
            NightlyCheckin.user_id    == user_id,
            NightlyCheckin.created_at >= today
        ).first()
        return existing is not None
    finally:
        db.close()

# ── save checkin + analyze ────────────────────────────────
def save_checkin(user_id: int, answers: dict) -> dict:

    # don't allow duplicate checkin same day
    if already_checked_in_today(user_id):
        return {
            "saved":   False,
            "message": "You have already checked in today. Come back tomorrow."
        }

    db = SessionLocal()
    try:
        # save raw answers
        checkin = NightlyCheckin(
            user_id            = user_id,
            best_moment        = answers.get("best_moment"),
            reaction_moment    = answers.get("reaction_moment"),
            patience_test      = answers.get("patience_test"),
            blame_target       = answers.get("blame_target"),
            tomorrow_intention = answers.get("tomorrow_intention"),
            day_of_week        = datetime.now().weekday(),
            created_at         = datetime.now()
        )
        db.add(checkin)
        db.flush()

        # get last 7 checkins for context
        past = (
            db.query(NightlyCheckin)
            .filter(NightlyCheckin.user_id == user_id)
            .order_by(desc(NightlyCheckin.created_at))
            .limit(7)
            .all()
        )

        past_text = "\n".join([
            f"[{c.created_at.strftime('%a')}] "
            f"Best: {c.best_moment or 'none'} | "
            f"Reaction: {c.reaction_moment or 'none'} | "
            f"Patience tested by: {c.patience_test or 'none'} | "
            f"Blame: {c.blame_target or 'none'}"
            for c in past
        ]) if past else "No past checkins yet"

        # count patterns for weekly insight
        reaction_days = len([c for c in past if c.reaction_moment])
        patience_days = len([c for c in past if c.patience_test])
        blame_days    = len([c for c in past if c.blame_target])

        prompt = f"""
You are analyzing someone's nightly reflection checkin.

TODAY'S CHECKIN:
- Best moment: {answers.get('best_moment', 'not answered')}
- Reaction moment: {answers.get('reaction_moment', 'not answered')}
- Patience tested by: {answers.get('patience_test', 'not answered')}
- Blame: {answers.get('blame_target', 'not answered')}
- Tomorrow's intention: {answers.get('tomorrow_intention', 'not answered')}

LAST 7 DAYS PATTERN:
{past_text}

WEEKLY COUNTS (out of {len(past)} checkins):
- Reaction days: {reaction_days}
- Patience tested days: {patience_days}
- Blame days: {blame_days}

Rules:
- emotional_pattern: what today's checkin reveals — 1-2 warm sentences
- trigger_entity: main person or situation that triggered them today
  empty string if nothing clear
- trigger_relation: how it connects e.g. "causes stress" | "triggers reaction"
  empty string if no trigger found
- weekly_insight: if 3+ checkins exist and a pattern is visible name it clearly
  e.g. "You've lost patience 4 out of 6 days — always work related"
  empty string if less than 3 checkins
- nudge: one warm specific actionable suggestion for tomorrow

STRICT RULES:
- Be warm not clinical
- Reference specific things they wrote
- Never be preachy
- weekly_insight must reference actual numbers if available
"""
        response = structured_llm.invoke(prompt)

        # save trigger to knowledge graph
        if response.trigger_entity and response.trigger_relation:
            _upsert_entity(db, user_id, response.trigger_entity)
            _upsert_relationship(
                db, user_id,
                response.trigger_entity,
                response.trigger_relation,
                "user_state"
            )

        db.commit()

        return {
            "saved":            True,
            "emotional_pattern": response.emotional_pattern,
            "weekly_insight":   response.weekly_insight,
            "nudge":            response.nudge,
            "streak":           len(past) + 1
        }

    except Exception as e:
        db.rollback()
        print(f"Checkin save failed: {e}")
        return {"saved": False, "error": str(e)}
    finally:
        db.close()

# ── get weekly report ─────────────────────────────────────
def get_weekly_report(user_id: int) -> dict:
    db = SessionLocal()
    try:
        cutoff   = datetime.now() - timedelta(days=7)
        checkins = (
            db.query(NightlyCheckin)
            .filter(
                NightlyCheckin.user_id    == user_id,
                NightlyCheckin.created_at >= cutoff
            )
            .order_by(NightlyCheckin.created_at.asc())
            .all()
        )

        if len(checkins) < 3:
            return {
                "ready":   False,
                "message": f"Complete {3 - len(checkins)} more checkins to see your weekly report",
                "current": len(checkins),
                "needed":  3
            }

        reaction_days = len([c for c in checkins if c.reaction_moment])
        patience_days = len([c for c in checkins if c.patience_test])
        blame_days    = len([c for c in checkins if c.blame_target])

        # collect all triggers
        triggers = [
            c.patience_test for c in checkins
            if c.patience_test
        ]

        # best moments
        best_moments = [
            c.best_moment for c in checkins
            if c.best_moment
        ]

        return {
            "ready":           True,
            "total_checkins":  len(checkins),
            "reaction_days":   reaction_days,
            "patience_days":   patience_days,
            "blame_days":      blame_days,
            "triggers":        triggers,
            "best_moments":    best_moments,
            "completion_rate": f"{len(checkins)}/7 days",
            "summary": (
                f"You checked in {len(checkins)} out of 7 days. "
                f"Patience was tested {patience_days} times. "
                f"You caught yourself reacting {reaction_days} times. "
                f"That self-awareness is the whole point."
            )
        }

    finally:
        db.close()

# ── get checkin history ───────────────────────────────────
def get_checkin_history(user_id: int, limit: int = 30) -> list:
    db = SessionLocal()
    try:
        checkins = (
            db.query(NightlyCheckin)
            .filter(NightlyCheckin.user_id == user_id)
            .order_by(desc(NightlyCheckin.created_at))
            .limit(limit)
            .all()
        )
        return [
            {
                "date":             c.created_at.strftime("%d %B %Y"),
                "day":              ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][c.day_of_week],
                "best_moment":      c.best_moment,
                "reaction_moment":  c.reaction_moment,
                "patience_test":    c.patience_test,
                "blame_target":     c.blame_target,
                "tomorrow_intention": c.tomorrow_intention
            }
            for c in checkins
        ]
    finally:
        db.close()