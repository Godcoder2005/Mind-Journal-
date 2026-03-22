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
import requests

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

class GoogleAuthRequest(BaseModel):
    access_token: str

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

@router.post("/google")
def google_auth(req: GoogleAuthRequest, db: Session = Depends(get_db)):
    try:
        google_res = requests.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {req.access_token}"}
        )
        if google_res.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid Google token")
        
        user_info = google_res.json()
        email = user_info.get("email")
        name = user_info.get("given_name") or user_info.get("name") or email.split('@')[0]

        if not email:
            raise HTTPException(status_code=400, detail="Google account has no email")
            
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            # ensure username uniqueness
            base_name = name
            counter = 1
            while db.query(User).filter(User.username == name).first():
                name = f"{base_name}{counter}"
                counter += 1

            user = User(
                email=email,
                username=name,
                password=pwd_context.hash(os.urandom(16).hex())
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        return {
            "token":    create_token(user.id),
            "username": user.username,
            "user_id":  user.id
        }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Google auth error: {str(e)}")

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