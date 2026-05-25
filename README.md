#  AI Voice Feedback Analyzer

A full-stack AI system for collecting voice feedback and generating intelligent NLP insights — built with **FastAPI**, **React**, **OpenAI Whisper**, and **GPT-4**.

---

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     USER FLOW                               │
│                                                             │
│  User visits /feedback                                      │
│       ↓                                                     │
│  Records voice answers to 5 questions                       │
│       ↓                                                     │
│  Audio → OpenAI Whisper → Transcript                        │
│       ↓                                                     │
│  GPT-4o-mini → Sentiment per response                       │
│       ↓                                                     │
│  Stored in SQLite DB                                        │
│                                                             │
│  Admin clicks "Run AI Analysis"                             │
│       ↓                                                     │
│  GPT-4o → Full NLP report:                                  │
│    • Common complaints                                      │
│    • Positive feedback                                      │
│    • Improvement suggestions + action items                 │
│    • Sentiment timeline                                     │
│    • NPS estimate                                           │
│    • Executive summary                                      │
│       ↓                                                     │
│  Dashboard visualizes everything with Recharts              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Project Structure

```
voice-feedback-analyzer/
├── backend/
│   ├── main.py                  # FastAPI app + CORS
│   ├── database.py              # SQLAlchemy models (SQLite)
│   ├── requirements.txt
│   ├── .env.example
│   └── routers/
│       ├── transcription.py     # /api/transcription/*
│       │     start-session       → creates DB session
│       │     upload-audio        → Whisper STT + sentiment
│       │     submit-text         → fallback text input
│       ├── analysis.py          # /api/analysis/*
│       │     run                 → GPT-4 full NLP analysis
│       │     report/{id}         → retrieve report
│       │     all-reports         → list all reports
│       └── dashboard.py         # /api/dashboard/*
│             stats               → KPI aggregations
│             sentiment-timeline  → chart data
│
└── frontend/
    ├── index.html
    ├── vite.config.js           # proxies /api → :8000
    ├── tailwind.config.js
    └── src/
        ├── App.jsx              # Router
        ├── index.css            # Design system (CSS vars)
        ├── pages/
        │   ├── Landing.jsx      # Home page with features
        │   ├── FeedbackForm.jsx # Voice survey (5 questions)
        │   └── Dashboard.jsx    # Analytics dashboard
        ├── components/
        │   └── VoiceRecorder.jsx # MediaRecorder + waveform
        └── hooks/
            └── useAudioRecorder.js # Recording logic
```

---

## ⚡ Quick Start

### 1. Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Python | 3.10+ | python.org |
| Node.js | 18+ | nodejs.org |
| npm | 9+ | included with Node |
| OpenAI API Key | — | platform.openai.com |

> **Cost estimate**: Whisper ~$0.006/min of audio. GPT-4o analysis ~$0.02–0.10 per analysis run.

---

### 2. One-command setup

```bash
cd voice-feedback-analyzer
bash start.sh
```

The script will:
1. Ask for your OpenAI API key
2. Install Python deps in a venv
3. Install npm packages
4. Initialize the SQLite database
5. Start backend on :8000 and frontend on :3000

---

### 3. Manual setup (if you prefer)

**Backend:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env and set OPENAI_API_KEY=sk-...

python -c "from database import init_db; init_db()"
uvicorn main:app --reload --port 8000
```

**Frontend (new terminal):**
```bash
cd frontend
npm install
npm run dev
```

---

## 🌐 URLs

| URL | Description |
|-----|-------------|
| http://localhost:3000 | Landing page |
| http://localhost:3000/feedback | Voice feedback survey |
| http://localhost:3000/dashboard | Admin analytics dashboard |
| http://localhost:8000/docs | Interactive API docs (Swagger) |
| http://localhost:8000/redoc | ReDoc API documentation |

---

## 🎯 Features

### Voice Collection
- 5 pre-configured questions (fully customizable in `FeedbackForm.jsx`)
- Browser MediaRecorder API — no plugins needed
- Animated waveform visualizer during recording
- Playback before submitting
- Text fallback if microphone unavailable

### AI Pipeline
- **OpenAI Whisper** for speech-to-text
- **GPT-4o-mini** for per-response sentiment (fast + cheap)
- **GPT-4o** for full batch NLP analysis including:
  - Common complaints with frequency + impact
  - Positive feedback with example quotes
  - Prioritized improvement suggestions
  - Action items with owners + timelines
  - NPS estimate
  - Executive summary

### Dashboard
- Real-time KPI cards (sessions, responses, sentiment score)
- Sentiment pie chart + bar chart
- Sentiment timeline (Recharts LineChart)
- 5 tabs: Overview / Complaints / Positives / Suggestions / Report
- Recent responses feed

---

## 🔧 Configuration

### Customize questions

Edit `QUESTIONS` in `frontend/src/pages/FeedbackForm.jsx`:
```js
const QUESTIONS = [
  { id: 1, text: 'Your custom question here?', category: 'Category' },
  // ...
]
```

### Use PostgreSQL instead of SQLite

```bash
# In backend/.env
DATABASE_URL=postgresql://user:password@localhost:5432/feedback_db
```

Install driver: `pip install psycopg2-binary`

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | required | Your OpenAI API key |
| `DATABASE_URL` | `sqlite:///./feedback.db` | DB connection string |

---

## 🚀 Deployment

### Backend (Railway / Render / Fly.io)
```bash
# Add env vars: OPENAI_API_KEY, DATABASE_URL (PostgreSQL)
# Start command:
uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Frontend (Vercel / Netlify)
```bash
cd frontend && npm run build
# Deploy the dist/ folder
# Set VITE_API_URL env var to your backend URL
```

Update `vite.config.js` proxy to point to your deployed backend:
```js
proxy: { '/api': { target: 'https://your-backend.railway.app' } }
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| API | FastAPI (Python) |
| Database | SQLAlchemy + SQLite/PostgreSQL |
| STT | OpenAI Whisper API |
| NLP | OpenAI GPT-4o |
| Frontend | React 18 + Vite |
| Routing | React Router v6 |
| Charts | Recharts |
| Styling | Tailwind CSS |
| Audio | Web MediaRecorder API |

---

## 📊 API Reference

### POST `/api/transcription/start-session`
```json
{ "respondent_name": "Alice" }
→ { "session_id": "uuid-...", "message": "Session started" }
```

### POST `/api/transcription/upload-audio`
```
FormData: session_id, question_id, question_text, audio (file)
→ { "transcript": "...", "sentiment": { "score": 0.7, "label": "positive" } }
```

### POST `/api/analysis/run`
```json
{ "session_ids": null }   // null = analyze ALL responses
→ { "report_id": "uuid", "analysis": { ... full NLP report ... } }
```

### GET `/api/dashboard/stats`
```json
→ { "total_sessions": 12, "total_responses": 60, "sentiment_breakdown": {...}, ... }
```
