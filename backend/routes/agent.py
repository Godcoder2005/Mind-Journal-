from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from services.agent_graph import workflow
from services.alter_ego import chat_with_alter_ego
from routes.auth import get_current_user
from db.models import User
import traceback

router = APIRouter()

# ── schemas ───────────────────────────────────────────────
class JournalInput(BaseModel):
    query: str

class AlterEgoInput(BaseModel):
    message: str

# ── routes ────────────────────────────────────────────────
@router.post("/chat")
def chat_with_agent(
    input:        JournalInput,
    current_user: User = Depends(get_current_user)
):
    try:
        result = workflow.invoke({
            "query":             input.query,
            "user_id":           current_user.id,
            "orchestration":     None,
            "sentiment_result":  None,
            "pattern_result":    None,
            "insight_result":    None,
            "knowledge_updated": None,
            "memory_saved":      None
        })
        return {
            "insight":      result['insight_result'],
            "memory_saved": result['memory_saved']
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/alter-ego")
def alter_ego_chat(
    input:        AlterEgoInput,
    current_user: User = Depends(get_current_user)
):
    try:
        result = chat_with_alter_ego(
            user_id = current_user.id,
            message = input.message
        )
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))