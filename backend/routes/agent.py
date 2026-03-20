from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer        # ← add
from sqlalchemy.orm import Session                       # ← add
from pydantic import BaseModel
from typing import Optional                              # ← add
from jose import jwt, JWTError                          # ← add
from services.agent_graph import workflow
from services.alter_ego import chat_with_alter_ego
from utils.user_stage import get_user_stage             # ← add
from routes.auth import get_current_user
from db.database import get_db                          # ← add
from db.models import User
import traceback, os

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(                   # ← add
    tokenUrl="/auth/login",
    auto_error=False
)

# ── schemas ───────────────────────────────────────────────
class JournalInput(BaseModel):
    query:   str
    user_id: Optional[int] = None                       # ← add

class AlterEgoInput(BaseModel):
    message: str

# ── optional auth — returns None if no token ─────────────
def get_optional_user(                                  # ← add entire function
    token: str     = Depends(oauth2_scheme),
    db:    Session = Depends(get_db)
) -> Optional[User]:
    if not token:
        return None
    try:
        payload = jwt.decode(
            token,
            os.getenv("SECRET_KEY", "fallback_secret"),
            algorithms=["HS256"]
        )
        user_id = int(payload["sub"])
        return db.query(User).filter(User.id == user_id).first()
    except JWTError:
        return None

# ── routes ────────────────────────────────────────────────
@router.post("/chat")
def chat_with_agent(
    input:        JournalInput,
    current_user: Optional[User] = Depends(get_optional_user)  # ← change
):
    try:
        uid   = current_user.id if current_user else None       # ← add
        stage = get_user_stage(uid)                             # ← add

        result = workflow.invoke({
            "query":             input.query,
            "user_id":           uid,                           # ← change
            "stage":             stage,                         # ← add
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
    current_user: User = Depends(get_current_user)   # unchanged
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