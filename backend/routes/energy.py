from fastapi import APIRouter, Depends
from routes.auth import get_current_user
from services.energy_tracker import (
    generate_energy_dna,
    generate_energy_forecast,
    generate_energy_villain,
    generate_golden_hours,
    generate_energy_streak,
    get_full_energy_tracker
)
from utils.user_stage import get_user_stage    # ← add this import only
from db.models import User

router = APIRouter()

@router.get("/full")
def full_tracker(current_user: User = Depends(get_current_user)):
    stage = get_user_stage(current_user.id)    # ← add this line
    return get_full_energy_tracker(current_user.id, stage)    # ← pass stage

@router.get("/dna")
def energy_dna(current_user: User = Depends(get_current_user)):
    stage = get_user_stage(current_user.id)    # ← add this line
    return generate_energy_dna(current_user.id, stage)    # ← pass stage

@router.get("/forecast")
def energy_forecast(current_user: User = Depends(get_current_user)):
    stage = get_user_stage(current_user.id)    # ← add this line
    return generate_energy_forecast(current_user.id, stage)    # ← pass stage

@router.get("/villain")
def energy_villain(current_user: User = Depends(get_current_user)):
    stage = get_user_stage(current_user.id)    # ← add this line
    return generate_energy_villain(current_user.id, stage)    # ← pass stage

@router.get("/golden-hours")
def golden_hours(current_user: User = Depends(get_current_user)):
    stage = get_user_stage(current_user.id)    # ← add this line
    return generate_golden_hours(current_user.id, stage)    # ← pass stage

@router.get("/streak")
def energy_streak(current_user: User = Depends(get_current_user)):
    stage = get_user_stage(current_user.id)    # ← add this line
    return generate_energy_streak(current_user.id, stage)    # ← pass stage