from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from db.database import SessionLocal
from db.models import JournalEntry
from sqlalchemy import desc
import os

# ── Setup ─────────────────────────────────────────────────
embeddings = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")
# ── Add entry to FAISS after saving ──────────────────────
def add_entry_to_faiss(user_id: int, entry_id: int, content: str):
    try:
        doc = Document(
            page_content = content,
            metadata     = {
                "user_id":  user_id,
                "entry_id": entry_id
            }
        )

        path = f"{FAISS_BASE}_{user_id}"

        if os.path.exists(path):
            index = FAISS.load_local(
                path,
                embeddings,
                allow_dangerous_deserialization=True
            )
            index.add_documents([doc])
        else:
            index = FAISS.from_documents([doc], embeddings)

        index.save_local(path)
        print(f"✅ Entry added to FAISS for user {user_id}")

    except Exception as e:
        print(f"FAISS add failed: {e}")

# ── Semantic search ───────────────────────────────────────
def retrieve_similar_entries(user_id: int, query: str, k: int = 3) -> str:
    try:
        path = f"{FAISS_BASE}_{user_id}"

        if not os.path.exists(path):
            return ""

        index = FAISS.load_local(
            path,
            embeddings,
            allow_dangerous_deserialization=True
        )

        docs = index.similarity_search(query, k=k)

        if not docs:
            return ""

        return "\n\n".join([
            f"[Similar past entry]: {doc.page_content[:300]}"
            for doc in docs
        ])

    except Exception as e:
        print(f"FAISS search failed: {e}")
        return ""

# ── SQL recent fetch ──────────────────────────────────────
def fetch_recent_sql(user_id: int, limit: int = 2) -> str:
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
            return ""

        return "\n".join([
            f"[{e.created_at.strftime('%d %b')} - recent] "
            f"Energy {e.energy_score}/10 | "
            f"Mood: {e.mood} | "
            f"{e.content[:150]}..."
            for e in entries
        ])
    finally:
        db.close()

# ── Hybrid retrieval — main function ─────────────────────
def hybrid_fetch(user_id: int, query: str) -> tuple:
    db = SessionLocal()
    try:
        count = db.query(JournalEntry).filter(
            JournalEntry.user_id == user_id
        ).count()
    finally:
        db.close()

    # first time user
    if count == 0:
        return "", True

    # not enough entries for FAISS — SQL only
    if count < 10:
        recent = fetch_recent_sql(user_id, limit=5)
        context = f"RECENT ENTRIES:\n{recent}" if recent else ""
        return context, False

    # hybrid — RAG + SQL
    rag_results  = retrieve_similar_entries(user_id, query, k=3)
    sql_results  = fetch_recent_sql(user_id, limit=2)

    context = ""
    if rag_results:
        context += f"SEMANTICALLY SIMILAR PAST ENTRIES:\n{rag_results}\n\n"
    if sql_results:
        context += f"MOST RECENT ENTRIES:\n{sql_results}"

    return context, False