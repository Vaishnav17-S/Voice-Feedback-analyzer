import os
from urllib.parse import quote
import requests

SANITY_PROJECT_ID = os.getenv("SANITY_PROJECT_ID")
SANITY_DATASET = os.getenv("SANITY_DATASET", "production")
SANITY_API_TOKEN = os.getenv("SANITY_API_TOKEN")

def _base_url():
    if not SANITY_PROJECT_ID:
        raise ValueError("SANITY_PROJECT_ID not configured")
    return f"https://{SANITY_PROJECT_ID}.api.sanity.io/v1/data/query/{SANITY_DATASET}"

def run_groq(query, params=None, timeout=10):
    """Run a GROQ query and return the parsed JSON response."""
    if not SANITY_API_TOKEN:
        raise ValueError("SANITY_API_TOKEN not configured")
    url = _base_url()
    q = quote(query, safe='')
    headers = {"Authorization": f"Bearer {SANITY_API_TOKEN}"}
    resp = requests.get(f"{url}?query={q}", headers=headers, params=params or {}, timeout=timeout)
    resp.raise_for_status()
    return resp.json()

def get_total_responses():
    try:
        data = run_groq('count(*[_type == "feedbackResponse"])')
        return int(data.get("result", 0))
    except Exception:
        # Fallback to counting all documents if specific type missing
        data = run_groq('count(*[])')
        return int(data.get("result", 0))

def get_recent_feedback(limit=5):
    # Try to fetch typed feedbackResponse documents first
    query = f'*[_type == "feedbackResponse"] | order(_createdAt desc)[0...{limit}]{{_id, sessionId, questionText, transcript, sentimentScore, sentimentLabel, _createdAt}}'
    try:
        data = run_groq(query)
        return data.get("result", [])
    except Exception:
        # Generic fallback: return latest documents
        query = f'* | order(_createdAt desc)[0...{limit}]{{_id, _type, _createdAt}}'
        data = run_groq(query)
        return data.get("result", [])
