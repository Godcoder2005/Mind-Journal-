from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel
from db.database import SessionLocal
from db.models import KnowledgeEntity, KnowledgeRelationship
from utils.state import MindJournal

llm = ChatGoogleGenerativeAI(model="gemini-3.1-flash-lite-preview", temperature=0.2)

# ── Pydantic schemas ──────────────────────────────────────
class Relationship(BaseModel):
    entity_from: str   # e.g. "manager"
    relation:    str   # causes | triggers | improves | worsens | leads_to | supports
    entity_to:   str   # e.g. "stress"

class GraphOutput(BaseModel):
    entities:      list[str]
    relationships: list[Relationship]

structured_llm = llm.with_structured_output(GraphOutput)

# ── helpers ───────────────────────────────────────────────
def upsert_entity(db, user_id: int, name: str):
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

def upsert_relationship(db, user_id: int, entity_from: str, relation: str, entity_to: str):
    entity_from = entity_from.lower().strip()
    entity_to   = entity_to.lower().strip()
    if not entity_from or not entity_to:
        return
    existing = db.query(KnowledgeRelationship).filter(
        KnowledgeRelationship.user_id      == user_id,
        KnowledgeRelationship.entity_from  == entity_from,
        KnowledgeRelationship.relation     == relation,
        KnowledgeRelationship.entity_to    == entity_to
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

# ── main node ─────────────────────────────────────────────
def personal_knowledge_grain(state: MindJournal) -> MindJournal:
    query    = state['query']
    user_id  = state['user_id']
    patterns = state['pattern_result']
    db       = SessionLocal()

    try:
        # Step 1 — save entities from pattern tool (same as before)
        all_entities = (
            patterns['recurring_themes'] +
            patterns['people_mentioned'] +
            patterns['goals_mentioned']  +
            patterns['knowledge_entities']
        )
        for entity_name in all_entities:
            upsert_entity(db, user_id, entity_name)

        # Step 2 — use LLM to extract relationships from entry
        prompt = f"""
You are a knowledge graph builder.
Extract entities and their relationships from this journal entry.

JOURNAL ENTRY:
\"\"\"{query}\"\"\"

KNOWN ENTITIES FROM THIS ENTRY: {all_entities}

Extract:
- entities: all important nouns — people, habits, emotions, goals, situations
- relationships: how entities connect to each other

Use ONLY these relationship types:
causes | triggers | improves | worsens | leads_to | supports | conflicts_with

Examples:
- "My manager stressed me out"       → manager causes stress
- "Skipped gym because of meetings"  → meetings leads_to gym_skipped
- "Felt better after journaling"     → journaling improves mood
- "Rahul and I argued again"         → rahul conflicts_with peace

STRICT RULES:
- Only extract what is clearly in the entry — never invent
- Keep entity names short and lowercase
- Maximum 8 relationships per entry
"""
        response = structured_llm.invoke(prompt)

        # Step 3 — save LLM extracted entities
        for entity_name in response.entities:
            upsert_entity(db, user_id, entity_name)

        # Step 4 — save relationships
        for rel in response.relationships:
            upsert_relationship(
                db, user_id,
                rel.entity_from,
                rel.relation,
                rel.entity_to
            )

        db.commit()

        return {
            **state,
            "knowledge_updated": True
        }

    except Exception as e:
        db.rollback()
        print(f"Knowledge graph failed: {e}")
        return {
            **state,
            "knowledge_updated": False
        }
    finally:
        db.close()