# Career Pilot — AI Career Copilot

Full-stack AI Career Copilot — optimize resumes, prepare for interviews, track applications, and close skill gaps. Runs **100% locally**, no cloud services, no Docker, no API keys.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS, TanStack Query |
| Backend | FastAPI, Python 3.12, SQLAlchemy 2.0, Alembic |
| Database | PostgreSQL (local) |
| AI (local) | Ollama — Llama 3.2 / Mistral / Qwen2.5 |
| Vector DB | Qdrant (local binary, no Docker) |
| Embeddings | BAAI/bge-small-en-v1.5 (runs locally via sentence-transformers) |
| File parsing | PyMuPDF, python-docx |

## Requirements

- macOS (scripts use Homebrew)
- [Homebrew](https://brew.sh)
- [Ollama](https://ollama.com/download) — install the app, it runs in the menu bar
- Python 3.12+
- Node.js 20+

## Setup (one time)

```bash
# 1. Pull an AI model (pick one)
ollama pull llama3.2        # 2 GB — fast, recommended default
ollama pull llama3.1:8b     # 5 GB — better quality
ollama pull mistral         # 4 GB — great at instructions
ollama pull qwen2.5:7b      # 5 GB — best JSON accuracy

# 2. Run the setup script — installs PostgreSQL, downloads Qdrant binary,
#    creates the database, sets up Python venv, runs migrations, installs npm deps
chmod +x scripts/setup.sh && ./scripts/setup.sh
```

That's it. Setup takes 2–5 minutes (mostly pip install + model download if you haven't done it yet).

## Run

```bash
./scripts/start.sh   # starts everything
./scripts/stop.sh    # stops everything
```

| Service | URL |
|---|---|
| App | http://localhost:3000 |
| API docs | http://localhost:8000/docs |
| Qdrant dashboard | http://localhost:6333/dashboard |

## Switch AI model any time

```bash
./scripts/change_model.sh
```

Picks a model from a menu, pulls it with Ollama, and updates `.env` — no code changes needed.

## Features

| Feature | Description |
|---|---|
| Resume Upload | PDF or DOCX → text extraction → AI parsing |
| ATS Analyzer | Score resume against any job description |
| Skill Gap Analysis | Critical / medium / optional missing skills with roadmap |
| AI Resume Generator | RAG-powered rewrite — retrieves relevant experience from Qdrant |
| Interview Coach | Generate role-specific questions, evaluate your answers with scoring |
| Application Tracker | Pipeline with Saved → Applied → Interview → Rejected → Offer |
| Learning Pathways | AI learning plans with free resources for any skill |

## RAG Pipeline

```
Resume upload
  → extract text (PyMuPDF / python-docx)
  → chunk (512 chars, 64 char overlap)
  → embed (BAAI/bge-small-en-v1.5, local)
  → store in Qdrant with section metadata

Resume generation
  → embed job description
  → similarity search → top-6 chunks from Qdrant
  → inject context into Ollama prompt (JSON mode)
  → validate with Pydantic → store version in PostgreSQL
```

## Configuration

All config lives in `backend/.env` (created automatically from `.env.example` during setup):

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2          # change this to switch models
OLLAMA_TIMEOUT=300

DATABASE_URL=postgresql://localhost/careerpilot
QDRANT_HOST=localhost
QDRANT_PORT=6333
```

## Project structure

```
career-pilot/
├── scripts/
│   ├── setup.sh          one-time setup
│   ├── start.sh          start all services
│   ├── stop.sh           stop all services
│   └── change_model.sh   switch Ollama model
├── bin/                  Qdrant binary (downloaded by setup.sh)
├── logs/                 runtime logs
├── backend/
│   ├── app/
│   │   ├── api/routes/   FastAPI routes
│   │   ├── services/     business logic (llm_service → Ollama)
│   │   ├── repositories/ data access
│   │   ├── vector_store/ Qdrant + embeddings
│   │   └── prompts/      LLM prompt templates
│   └── alembic/          DB migrations
└── frontend/
    └── src/
        ├── app/          Next.js pages
        ├── components/   UI components
        └── lib/          API client, utilities
```

## Model comparison

| Model | Size | Speed | Best for |
|---|---|---|---|
| `llama3.2` | ~2 GB | Fast | Default, good all-round |
| `llama3.1:8b` | ~5 GB | Medium | Better reasoning |
| `mistral` | ~4 GB | Fast | Instruction following |
| `qwen2.5:7b` | ~5 GB | Medium | Best structured JSON output |
| `phi3.5` | ~2 GB | Fast | Lightweight alternative |

## Troubleshooting

**PostgreSQL won't start**
```bash
brew services restart postgresql@16
# or check: brew services list
```

**Qdrant won't start** — the binary wasn't downloaded:
```bash
./scripts/setup.sh   # re-run setup, it's idempotent
```

**Ollama not responding**
```bash
ollama serve         # start manually if the desktop app isn't open
ollama list          # check which models are pulled
```

**Slow AI responses** — normal for large models on CPU. Switch to a smaller model:
```bash
./scripts/change_model.sh
# pick llama3.2 or phi3.5 for speed
```
