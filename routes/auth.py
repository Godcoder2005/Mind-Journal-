from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
from db.database import get_db
from db.models import User
from pydantic import BaseModel
import os

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"])
SECRET_KEY = os.getenv("SECRET_KEY")

class SignupRequest(BaseModel):
    email: str
    username: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

def create_token(user_id: int):
    payload = {
        "sub": str(user_id),
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

@router.post("/signup")
def signup(req: SignupRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=req.email,
        username=req.username,
        password=pwd_context.hash(req.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"token": create_token(user.id), "username": user.username}

@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not pwd_context.verify(req.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"token": create_token(user.id), "username": user.username}

from services.onboarding import (
    is_onboarding_complete,
    get_next_question,
    process_answer
)
from pydantic import BaseModel

class OnboardingAnswerInput(BaseModel):
    question: str
    answer:   str

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
    input: OnboardingAnswerInput,
    current_user: User = Depends(get_current_user)
):
    return process_answer(
        user_id  = current_user.id,
        question = input.question,
        answer   = input.answer
    )