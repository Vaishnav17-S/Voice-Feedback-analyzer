from sqlalchemy import create_engine, Column, Integer, String, Text, Float, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./feedback.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class FeedbackSession(Base):
    __tablename__ = "feedback_sessions"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, unique=True, index=True)
    respondent_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class FeedbackResponse(Base):
    __tablename__ = "feedback_responses"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True)
    question_id = Column(Integer)
    question_text = Column(Text)
    audio_path = Column(String, nullable=True)
    transcript = Column(Text, nullable=True)
    sentiment_score = Column(Float, nullable=True)
    sentiment_label = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class AnalysisReport(Base):
    __tablename__ = "analysis_reports"
    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(String, unique=True, index=True)
    total_responses = Column(Integer)
    avg_sentiment = Column(Float)
    common_complaints = Column(JSON)
    positive_feedback = Column(JSON)
    improvement_suggestions = Column(JSON)
    summary = Column(Text)
    themes = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
