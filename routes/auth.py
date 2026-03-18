from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
from db.database import get_db
from db.models import User
from pydantic import BaseModel
from services.onboarding import (
    is_onboarding_complete,
    get_next_question,
    process_answer
)
import os

# ── setup ─────────────────────────────────────────────────
router        = APIRouter()
pwd_context   = CryptContext(schemes=["bcrypt"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
SECRET_KEY    = os.getenv("SECRET_KEY", "fallback_secret")

# ── pydantic schemas ──────────────────────────────────────
class SignupRequest(BaseModel):
    email:    str
    username: str
    password: str

class LoginRequest(BaseModel):
    email:    str
    password: str

class OnboardingAnswerInput(BaseModel):
    question: str
    answer:   str

# ── helpers ───────────────────────────────────────────────
def create_token(user_id: int) -> str:
    payload = {
        "sub": str(user_id),
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

# ── get_current_user must be defined BEFORE any route uses it
def get_current_user(
    token: str     = Depends(oauth2_scheme),
    db:    Session = Depends(get_db)
) -> User:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = int(payload["sub"])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# ── auth routes ───────────────────────────────────────────
@router.post("/signup")
def signup(req: SignupRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email    = req.email,
        username = req.username,
        password = pwd_context.hash(req.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {
        "token":    create_token(user.id),
        "username": user.username,
        "user_id":  user.id
    }

@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not pwd_context.verify(req.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {
        "token":    create_token(user.id),
        "username": user.username,
        "user_id":  user.id
    }

# ── onboarding routes ─────────────────────────────────────
@router.get("/onboarding/status")
def onboarding_status(current_user: User = Depends(get_current_user)):
    complete = is_onboarding_complete(current_user.id)
    if complete:
        return {"complete": True}
    return {
        "complete": False,
        **get_next_question(current_user.id)
    }

@router.post("/onboarding/answer")
def submit_answer(
    input:        OnboardingAnswerInput,
    current_user: User = Depends(get_current_user)
):
    return process_answer(
        user_id  = current_user.id,
        question = input.question,
        answer   = input.answer
    )