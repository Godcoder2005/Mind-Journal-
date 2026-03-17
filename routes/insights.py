from fastapi import APIRouter

router = APIRouter()

@router.get("/insights")
def journal_home():
    return {"message": "insights route working"}