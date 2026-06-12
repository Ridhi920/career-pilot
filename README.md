# Career Pilot — AI Career Copilot

Full-stack AI Career Copilot — optimize resumes, prepare for interviews, track applications, and close skill gaps. Runs locally with no Docker — AI is powered by the **Groq API** (free tier, one API key).

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS, TanStack Query |
| Backend | FastAPI, Python 3.12, SQLAlchemy 2.0, Alembic |
| Database | PostgreSQL (local) |
| AI | Groq API — Llama 3.3 70B / Llama 3.1 8B / Mixtral |
| File parsing | PyMuPDF, python-docx |

## Requirements

- PostgreSQL 16+ (e.g. `brew install postgresql@16`)
- A free [Groq API key](https://console.groq.com/keys)
- Python 3.12+
- Node.js 20+

## Setup (one time)

```bash
# 1. Database
createdb careerpilot

# 2. Backend
cd backend
python3 -m venv venv && source venv/bin/activate
make install            # pip install -r requirements.txt
cp .env.example .env    # then set GROQ_API_KEY=gsk_... and DATABASE_URL
make migrate            # apply DB migrations

# 3. Frontend
cd ../frontend
npm install
```

## Run

```bash
# Terminal 1 — backend
cd backend && make start      # uvicorn on :8000 with hot reload

# Terminal 2 — frontend
cd frontend && npm run dev    # Next.js on :3000
```

| Service | URL |
|---|---|
| App | http://localhost:3000 |
| API docs | http://localhost:8000/docs |

## Deploy (manual, no Docker)

### Backend — any Linux VPS / your own server

```bash
# on the server
git clone <repo> && cd career-pilot/backend
python3 -m venv venv && source venv/bin/activate
make install
cp .env.example .env        # set GROQ_API_KEY, DATABASE_URL, CORS_ORIGINS
make migrate
make start-prod             # uvicorn, no reload, 2 workers (PORT=... WORKERS=... to override)
```

Set `CORS_ORIGINS` in `backend/.env` to include your deployed frontend URL, e.g.:

```env
CORS_ORIGINS=["https://your-frontend.vercel.app"]
```

To keep it running after logout, run it under your process manager of choice
(`systemd`, `pm2`, `supervisor`, or even `nohup make start-prod &`), and put
nginx/Caddy in front for HTTPS.

### Frontend

**Option A — Vercel (simplest):** import the repo, set the root directory to
`frontend/`, and add one environment variable:

```
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
```

**Option B — same server as backend:**

```bash
cd frontend
echo "NEXT_PUBLIC_API_URL=https://your-backend-domain.com" > .env.local
npm install
npm run build
npm start                   # serves on :3000
```

> `NEXT_PUBLIC_API_URL` is baked in at build time — rebuild the frontend after changing it.

### Database

Any PostgreSQL 16+ works (managed Postgres on Neon/Supabase/RDS, or local on the
VPS). Point `DATABASE_URL` in `backend/.env` at it and run `make migrate` once.

## Switch AI model any time

Edit `GROQ_MODEL` in `backend/.env` — no code changes needed.

## Features

| Feature | Description |
|---|---|
| Resume Upload | PDF or DOCX → text extraction → AI parsing → instant ATS score |
| ATS Analyzer | Score resume against any job description |
| Skill Gap Analysis | Critical / medium / optional missing skills with roadmap |
| AI Resume Generator | AI rewrite optimized for a target job description |
| Interview Coach | Generate role-specific questions, evaluate your answers with scoring |
| Application Tracker | Pipeline with Saved → Applied → Interview → Rejected → Offer |
| Learning Pathways | AI learning plans with free resources for any skill |

## Pipeline

```
Resume upload
  → extract text (PyMuPDF / python-docx)
  → AI parsing + general ATS score (Groq, JSON mode)
  → validate with Pydantic → store in PostgreSQL

Resume generation
  → resume + job description into Groq prompt (JSON mode)
  → validate with Pydantic → store version in PostgreSQL
```

## Configuration

All config lives in `backend/.env` (created automatically from `.env.example` during setup):

```env
GROQ_API_KEY=gsk_...                  # get one free at console.groq.com/keys
GROQ_MODEL=llama-3.3-70b-versatile    # change this to switch models
GROQ_TIMEOUT=300

DATABASE_URL=postgresql://localhost/careerpilot
```

## Project structure

```
career-pilot/
├── backend/
│   ├── app/
│   │   ├── api/routes/   FastAPI routes
│   │   ├── services/     business logic (llm_service → Groq)
│   │   ├── repositories/ data access
│   │   └── prompts/      LLM prompt templates
│   └── alembic/          DB migrations
└── frontend/
    └── src/
        ├── app/          Next.js pages
        ├── components/   UI components
        └── lib/          API client, utilities
```

## Model comparison

| Model | Speed | Best for |
|---|---|---|
| `llama-3.3-70b-versatile` | Fast | Default, best quality |
| `llama-3.1-8b-instant` | Fastest | Lighter tasks, highest rate limits |
| `mixtral-8x7b-32768` | Fast | Long context (32k tokens) |
| `gemma2-9b-it` | Fast | Lightweight alternative |

## Troubleshooting

**PostgreSQL won't start**
```bash
brew services restart postgresql@16
# or check: brew services list
```

**AI requests failing**
- Check `GROQ_API_KEY` is set in `backend/.env` (get one free at https://console.groq.com/keys)
- Check Groq status: https://groqstatus.com

**Rate limited (429 errors)** — the free tier has per-minute limits. Switch to a smaller model with higher limits by setting `GROQ_MODEL=llama-3.1-8b-instant` in `backend/.env`.
