from fastapi import APIRouter
from pydantic import BaseModel
from services.agent_graph import workflow

router = APIRouter()

class JournalInput(BaseModel):
    query: str

@router.post("/chat")
def chat_with_agent(input: JournalInput):
    try:
        result = workflow.invoke({
            "query":            input.query,
            "orchestration":    None,
            "sentiment_result": None,
            "pattern_result":   None,
            "insight_result":   None,
            "memory_saved":     None,
            "graph_updated":    None
        })
        return {
            "status":       "success",
            "orchestration": result["orchestration"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/chat")
def chat_with_agent(input: JournalInput, current_user: User = Depends(get_current_user)):
    result = workflow.invoke({
        "query":            input.query,
        "user_id":          current_user.id,    # ← pass user id
        "orchestration":    None,
        "sentiment_result": None,
        "pattern_result":   None,
        "insight_result":   None,
        "memory_saved":     None
    })
    return {"insight": result["insight_result"]}

from services.alter_ego import chat_with_alter_ego
from pydantic import BaseModel

class AlterEgoInput(BaseModel):
    message: str
    history: list   # [{"role": "user", "content": "..."}, ...]

@router.post("/alter-ego")
def alter_ego_chat(
    input: AlterEgoInput,
    current_user: User = Depends(get_current_user)
):
    result = chat_with_alter_ego(
        user_id = current_user.id,
        message = input.message,
        history = input.history
    )
    return result