from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"
    id         = Column(Integer, primary_key=True, index=True)
    email      = Column(String, unique=True, index=True, nullable=False)
    username   = Column(String, unique=True, nullable=False)
    password   = Column(String, nullable=False)   # hashed password
    created_at = Column(DateTime, server_default=func.now())

class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id           = Column(Integer, primary_key=True, index=True)
    user_id      = Column(Integer, ForeignKey("users.id"), nullable=False)

    # journal content
    content      = Column(Text, nullable=False)

    # sentiment analysis
    energy_score = Column(Float, nullable=True)
    valence      = Column(Float, nullable=True)
    primary_emotion = Column(String, nullable=True)

    # pattern analysis
    themes       = Column(Text, nullable=True)
    goals_mentioned = Column(Text, nullable=True)
    people_mentioned = Column(Text, nullable=True)

    # metadata
    word_count   = Column(Integer, nullable=True)
    hour_of_day  = Column(Integer, nullable=True)
    day_of_week  = Column(Integer, nullable=True)

    created_at   = Column(DateTime, server_default=func.now())

class Insight(Base):
    __tablename__ = "insights"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)

    content    = Column(Text, nullable=False)

    type       = Column(String, nullable=False)
    # examples:
    # weekly_summary
    # energy_pattern
    # future_self_letter
    # behavioral_pattern
    created_at = Column(DateTime, server_default=func.now())


class KnowledgeEntity(Base):
    __tablename__ = "knowledge_entities"

    id        = Column(Integer, primary_key=True, index=True)
    user_id   = Column(Integer, ForeignKey("users.id"))
    name      = Column(String)       # e.g. "manager", "gym", "rahul"
    frequency = Column(Integer, default=1)  # how many times mentioned
    created_at = Column(DateTime, server_default=func.now())

class EnergyForecast(Base):
    __tablename__ = "energy_forecasts"

    id               = Column(Integer, primary_key=True)
    user_id          = Column(Integer, ForeignKey("users.id"))
    forecast_day     = Column(String)
    predicted_energy = Column(Float)
    confidence       = Column(String)
    advice           = Column(Text)
    reasoning        = Column(Text)
    created_at       = Column(DateTime, server_default=func.now())


class KnowledgeRelationship(Base):
    __tablename__ = "knowledge_relationships"

    id          = Column(Integer, primary_key=True)
    user_id     = Column(Integer, ForeignKey("users.id"))
    entity_from = Column(String)   # e.g. "manager"
    relation    = Column(String)   # e.g. "causes"
    entity_to   = Column(String)   # e.g. "work stress"
    frequency   = Column(Integer, default=1)
    created_at  = Column(DateTime, server_default=func.now())

class AlterEgoSession(Base):
    __tablename__ = "alter_ego_sessions"

    id         = Column(Integer, primary_key=True)
    user_id    = Column(Integer, ForeignKey("users.id"))
    role       = Column(String)   # "user" | "assistant"
    content    = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

class FutureLetter(Base):
    __tablename__ = "future_letters"

    id           = Column(Integer, primary_key=True)
    user_id      = Column(Integer, ForeignKey("users.id"))
    month        = Column(String)    # e.g. "March 2026"
    letter       = Column(Text)      # full letter text
    mood_summary = Column(String)    # overall mood this month
    avg_energy   = Column(Float)     # avg energy this month
    created_at   = Column(DateTime, server_default=func.now())