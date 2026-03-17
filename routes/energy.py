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
from db.models import User

router = APIRouter()

# all 5 features in one call — use this for the dashboard
@router.get("/full")
def full_tracker(current_user: User = Depends(get_current_user)):
    return get_full_energy_tracker(current_user.id)

# individual endpoints — use these for lazy loading
@router.get("/dna")
def energy_dna(current_user: User = Depends(get_current_user)):
    return generate_energy_dna(current_user.id)

@router.get("/forecast")
def energy_forecast(current_user: User = Depends(get_current_user)):
    return generate_energy_forecast(current_user.id)

@router.get("/villain")
def energy_villain(current_user: User = Depends(get_current_user)):
    return generate_energy_villain(current_user.id)

@router.get("/golden-hours")
def golden_hours(current_user: User = Depends(get_current_user)):
    return generate_golden_hours(current_user.id)

@router.get("/streak")
def energy_streak(current_user: User = Depends(get_current_user)):
    return generate_energy_streak(current_user.id)