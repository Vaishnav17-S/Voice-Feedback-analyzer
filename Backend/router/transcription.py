from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form
from sqlalchemy.orm import Session
import openai
import os
import uuid
import shutil
from pathlib import Path
from database import get_db, FeedbackResponse, FeedbackSession, init_db
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

init_db()

openai.api_key = os.getenv("OPENAI_API_KEY")


class SessionCreate(BaseModel):
    respondent_name: Optional[str] = None


@router.post("/start-session")
async def start_session(data: SessionCreate, db: Session = Depends(get_db)):
    """Create a new feedback session for a respondent."""
    session_id = str(uuid.uuid4())
    session = FeedbackSession(
        session_id=session_id,
        respondent_name=data.respondent_name
    )
    db.add(session)
    db.commit()
    return {"session_id": session_id, "message": "Session started"}


@router.post("/upload-audio")
async def upload_audio(
    session_id: str = Form(...),
    question_id: int = Form(...),
    question_text: str = Form(...),
    audio: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload audio recording for a specific question.
    Transcribes using OpenAI Whisper and stores in DB.
    """
    if not openai.api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")

    # Save audio file
    file_ext = audio.filename.split(".")[-1] if "." in audio.filename else "webm"
    file_name = f"{session_id}_{question_id}.{file_ext}"
    file_path = UPLOAD_DIR / file_name

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(audio.file, buffer)

    # Transcribe with Whisper
    try:
        with open(file_path, "rb") as audio_file:
            transcript_response = openai.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                language="en"
            )
        transcript_text = transcript_response.text
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

    # Quick sentiment analysis using Claude
    try:
        sentiment_response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a sentiment analyzer. Respond with JSON only: {\"score\": <float -1 to 1>, \"label\": \"positive|neutral|negative\"}"},
                {"role": "user", "content": f"Analyze sentiment: {transcript_text}"}
            ],
            response_format={"type": "json_object"}
        )
        import json
        sentiment_data = json.loads(sentiment_response.choices[0].message.content)
        sentiment_score = sentiment_data.get("score", 0)
        sentiment_label = sentiment_data.get("label", "neutral")
    except Exception:
        sentiment_score = 0.0
        sentiment_label = "neutral"

    # Store in DB
    response = FeedbackResponse(
        session_id=session_id,
        question_id=question_id,
        question_text=question_text,
        audio_path=str(file_path),
        transcript=transcript_text,
        sentiment_score=sentiment_score,
        sentiment_label=sentiment_label
    )
    db.add(response)
    db.commit()

    return {
        "success": True,
        "transcript": transcript_text,
        "sentiment": {"score": sentiment_score, "label": sentiment_label}
    }


@router.post("/submit-text")
async def submit_text_response(
    session_id: str = Form(...),
    question_id: int = Form(...),
    question_text: str = Form(...),
    text_response: str = Form(...),
    db: Session = Depends(get_db)
):
    """Fallback: submit a typed text response instead of audio."""
    try:
        sentiment_response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a sentiment analyzer. Respond with JSON only: {\"score\": <float -1 to 1>, \"label\": \"positive|neutral|negative\"}"},
                {"role": "user", "content": f"Analyze sentiment: {text_response}"}
            ],
            response_format={"type": "json_object"}
        )
        import json
        sentiment_data = json.loads(sentiment_response.choices[0].message.content)
        sentiment_score = sentiment_data.get("score", 0)
        sentiment_label = sentiment_data.get("label", "neutral")
    except Exception:
        sentiment_score = 0.0
        sentiment_label = "neutral"

    response = FeedbackResponse(
        session_id=session_id,
        question_id=question_id,
        question_text=question_text,
        transcript=text_response,
        sentiment_score=sentiment_score,
        sentiment_label=sentiment_label
    )
    db.add(response)
    db.commit()

    return {
        "success": True,
        "transcript": text_response,
        "sentiment": {"score": sentiment_score, "label": sentiment_label}
    }


@router.get("/session/{session_id}")
async def get_session_responses(session_id: str, db: Session = Depends(get_db)):
    """Get all responses for a session."""
    responses = db.query(FeedbackResponse).filter(
        FeedbackResponse.session_id == session_id
    ).all()
    return [
        {
            "question_id": r.question_id,
            "question_text": r.question_text,
            "transcript": r.transcript,
            "sentiment": {"score": r.sentiment_score, "label": r.sentiment_label}
        }
        for r in responses
    ]
