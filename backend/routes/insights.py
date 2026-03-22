from fastapi import APIRouter, Depends, HTTPException
from routes.auth import get_current_user
from services.nightly_checkin import (
    get_checkin_questions,
    save_checkin,
    get_weekly_report,
    get_checkin_history,
    already_checked_in_today
)
from pydantic import BaseModel
from db.models import User
from services.gamification import get_user_stats
from services.onboarding import analyze_onboarding_answers
from db.database import get_db

router = APIRouter()

class CheckinInput(BaseModel):
    best_moment:        str
    reaction_moment:    str = ""
    patience_test:      str = ""
    blame_target:       str = ""
    tomorrow_intention: str = ""

@router.get("/checkin/questions")
def checkin_questions():
    return get_checkin_questions()

@router.get("/checkin/status")
def checkin_status(current_user: User = Depends(get_current_user)):
    done = already_checked_in_today(current_user.id)
    return {"checked_in_today": done}

@router.post("/checkin/submit")
def submit_checkin(
    input:        CheckinInput,
    current_user: User = Depends(get_current_user)
):
    return save_checkin(
        user_id = current_user.id,
        answers = {
            "best_moment":        input.best_moment,
            "reaction_moment":    input.reaction_moment,
            "patience_test":      input.patience_test,
            "blame_target":       input.blame_target,
            "tomorrow_intention": input.tomorrow_intention
        }
    )

@router.get("/checkin/weekly-report")
def weekly_report(current_user: User = Depends(get_current_user)):
    return get_weekly_report(current_user.id)

@router.get("/checkin/history")
def checkin_history(current_user: User = Depends(get_current_user)):
    return get_checkin_history(current_user.id)

@router.get("/stats")
def user_stats(current_user: User = Depends(get_current_user)):
    return get_user_stats(current_user.id)

@router.get("/onboarding-profile")
def onboarding_profile(current_user: User = Depends(get_current_user)):
    return analyze_onboarding_answers(current_user.id)