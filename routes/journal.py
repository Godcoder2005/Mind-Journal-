from fastapi import APIRouter

router = APIRouter()

@router.get("/journal")
def journal_home():
    return {"message": "journal route working"}