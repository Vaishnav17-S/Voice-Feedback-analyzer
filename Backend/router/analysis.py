from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
import openai
import os
import uuid
import json
from database import get_db, FeedbackResponse, AnalysisReport
from pydantic import BaseModel
from typing import Optional

router = APIRouter()
openai.api_key = os.getenv("OPENAI_API_KEY")


class AnalyzeRequest(BaseModel):
    session_ids: Optional[list[str]] = None  # None = analyze ALL responses


@router.post("/run")
async def run_analysis(request: AnalyzeRequest, db: Session = Depends(get_db)):
    """
    Run full NLP analysis across all (or selected) feedback responses.
    Returns: complaints, positives, suggestions, sentiment, themes, summary.
    """
    if not openai.api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")

    # Fetch responses
    query = db.query(FeedbackResponse)
    if request.session_ids:
        query = query.filter(FeedbackResponse.session_id.in_(request.session_ids))
    
    responses = query.all()
    if not responses:
        raise HTTPException(status_code=404, detail="No feedback responses found")

    # Prepare transcript data
    transcripts = []
    for r in responses:
        if r.transcript:
            transcripts.append({
                "question": r.question_text,
                "response": r.transcript,
                "sentiment_score": r.sentiment_score,
                "sentiment_label": r.sentiment_label
            })

    if not transcripts:
        raise HTTPException(status_code=404, detail="No transcripts available for analysis")

    # Build prompt for deep NLP analysis
    transcript_text = "\n\n".join([
        f"Q: {t['question']}\nA: {t['response']}\nSentiment: {t['sentiment_label']} ({t['sentiment_score']:.2f})"
        for t in transcripts
    ])

    analysis_prompt = f"""You are an expert NLP analyst specializing in feedback analysis for businesses. 
Analyze the following {len(transcripts)} feedback responses and provide a comprehensive structured analysis.

FEEDBACK RESPONSES:
{transcript_text}

Provide analysis in this EXACT JSON format:
{{
  "common_complaints": [
    {{"issue": "string", "frequency": "high/medium/low", "example_quote": "short quote", "impact": "string"}}
  ],
  "positive_feedback": [
    {{"aspect": "string", "frequency": "high/medium/low", "example_quote": "short quote", "strength": "string"}}
  ],
  "improvement_suggestions": [
    {{"suggestion": "string", "priority": "critical/high/medium/low", "rationale": "string", "expected_impact": "string"}}
  ],
  "sentiment_breakdown": {{
    "positive_percentage": number,
    "neutral_percentage": number,
    "negative_percentage": number,
    "overall_mood": "string",
    "trend": "string"
  }},
  "key_themes": [
    {{"theme": "string", "occurrences": number, "sentiment": "positive/neutral/negative"}}
  ],
  "executive_summary": "2-3 paragraph executive summary of all feedback",
  "action_items": [
    {{"action": "string", "owner": "string", "timeline": "string", "priority": "string"}}
  ],
  "nps_estimate": number,
  "overall_score": number
}}

Be specific, data-driven, and actionable. Extract real insights from the actual feedback."""

    try:
        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are an expert business analyst. Always respond with valid JSON only, no markdown."},
                {"role": "user", "content": analysis_prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.3
        )
        
        analysis = json.loads(response.choices[0].message.content)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse AI response: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

    # Calculate average sentiment
    sentiment_scores = [r.sentiment_score for r in responses if r.sentiment_score is not None]
    avg_sentiment = sum(sentiment_scores) / len(sentiment_scores) if sentiment_scores else 0

    # Store report
    report_id = str(uuid.uuid4())
    report = AnalysisReport(
        report_id=report_id,
        total_responses=len(responses),
        avg_sentiment=avg_sentiment,
        common_complaints=analysis.get("common_complaints", []),
        positive_feedback=analysis.get("positive_feedback", []),
        improvement_suggestions=analysis.get("improvement_suggestions", []),
        summary=analysis.get("executive_summary", ""),
        themes=analysis.get("key_themes", [])
    )
    db.add(report)
    db.commit()

    return {
        "report_id": report_id,
        "total_responses": len(responses),
        "avg_sentiment": avg_sentiment,
        "analysis": analysis
    }


@router.get("/report/{report_id}")
async def get_report(report_id: str, db: Session = Depends(get_db)):
    """Retrieve a previously generated analysis report."""
    report = db.query(AnalysisReport).filter(AnalysisReport.report_id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return {
        "report_id": report.report_id,
        "total_responses": report.total_responses,
        "avg_sentiment": report.avg_sentiment,
        "common_complaints": report.common_complaints,
        "positive_feedback": report.positive_feedback,
        "improvement_suggestions": report.improvement_suggestions,
        "themes": report.themes,
        "summary": report.summary,
        "created_at": report.created_at.isoformat()
    }


@router.get("/all-reports")
async def list_reports(db: Session = Depends(get_db)):
    """List all analysis reports."""
    reports = db.query(AnalysisReport).order_by(AnalysisReport.created_at.desc()).all()
    return [
        {
            "report_id": r.report_id,
            "total_responses": r.total_responses,
            "avg_sentiment": r.avg_sentiment,
            "created_at": r.created_at.isoformat()
        }
        for r in reports
    ]
