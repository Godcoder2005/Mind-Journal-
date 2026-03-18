from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db.database import engine,SessionLocal
from db import models
from typing import Annotated
from sqlalchemy.orm import Session
from routes import auth, journal, agent, insights, energy

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Mind Journal API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(energy.router, prefix="/energy", tags=["energy"])
app.include_router(auth.router,     prefix="/auth",     tags=["auth"])
app.include_router(journal.router,  prefix="/journal",  tags=["journal"])
app.include_router(agent.router,    prefix="/agent",    tags=["agent"])
app.include_router(insights.router, prefix="/insights", tags=["insights"])

@app.get("/")
def root():
    return {"status": "Mind Mirror API is running"}