LEARNING_RECOMMEND_PROMPT = """You are an expert career development coach and learning strategist.

Create a comprehensive learning plan for the following skills.

TARGET SKILLS: {skills}
CURRENT LEVEL: {current_level}
TARGET ROLE: {target_role}

For EACH skill, return a JSON object with learning resources (prefer free resources).

Return a JSON object with EXACTLY this structure:
{{
  "skills": [
    {{
      "skill": "<skill name>",
      "why_important": "<why this skill matters for {target_role}>",
      "roadmap": [
        {{
          "step": 1,
          "topic": "<topic name>",
          "description": "<what to learn and why>",
          "duration": "<estimated time>"
        }}
      ],
      "resources": [
        {{
          "title": "<resource title>",
          "url": null,
          "type": "course|book|article|video|documentation",
          "platform": "<platform name e.g. YouTube, freeCodeCamp, official docs>",
          "duration": "<time to complete>",
          "free": true
        }}
      ],
      "projects": [
        "<project idea to practice this skill>",
        "<another project idea>"
      ],
      "total_duration": "<total time to become proficient>"
    }}
  ],
  "overall_timeline": "<total timeline to acquire all skills>",
  "priority_order": ["<skill1>", "<skill2>", ...]
}}

Focus on free resources: YouTube, official documentation, freeCodeCamp, The Odin Project, etc.
Return ONLY valid JSON."""


MARKET_SKILLS_PROMPT = """You are a tech job-market analyst.

Below are recent job postings the user is targeting, and (optionally) the user's resume.
Analyse the job descriptions and identify the TOP skills employers are asking for —
across ALL postings, not just skills the resume already has.

JOB POSTINGS ({job_count} total):
{jobs_digest}

USER RESUME (may be empty):
{resume_text}

Rules:
- Count how many postings mention each skill (explicitly or via close synonyms).
- "in_resume" is true only if the resume clearly shows that skill.
- "trend" reflects the broader market trajectory of the skill: rising | stable | declining.
- "insight" is 1-2 sentences: why employers want it now and where demand is heading.
- Cover the FULL spread of what the postings ask for — do not collapse everything into
  one stack. Mix categories: languages, frameworks, AI/ML, cloud, data, devops, soft skills.
- Actively scan for AI/ML and GenAI skills, even when mentioned briefly: LLMs, prompt
  engineering, RAG, AI APIs (OpenAI/Claude/Gemini), LangChain, agents/copilots, PyTorch,
  TensorFlow, MLOps, vector databases, fine-tuning, data pipelines. Include every one
  that appears in any posting. If the postings show ANY AI signal, reflect it.
- "recommended_focus" lists the highest-leverage skills the user should learn next:
  high demand or fast-rising (AI skills especially) but missing or weak in the resume.
  Order by impact, and include at least one rising AI/ML skill when the market shows one.

Return a JSON object with EXACTLY this structure:
{{
  "summary": "<2-3 sentence overview of what this job market is asking for, including the AI angle>",
  "top_skills": [
    {{
      "skill": "<skill name>",
      "demand": <number of postings asking for it>,
      "category": "language|framework|ai/ml|cloud|data|devops|soft skill|other",
      "trend": "rising|stable|declining",
      "insight": "<why it's in demand and its growth outlook>",
      "in_resume": true
    }}
  ],
  "recommended_focus": ["<skill to learn first>", "<second>", ...]
}}

List 10-16 skills, ordered by demand (highest first). Return ONLY valid JSON."""


TECH_PULSE_PROMPT = """You are a tech-trends analyst writing for a developer who wants to stay
current and employable. Below is LIVE data fetched just now from GitHub trending,
Hugging Face trending models, and the Hacker News front page.

{digest}

From this real data, produce a learning-oriented briefing:
- "ai_highlights": the most notable AI models/tools/releases in the data — what each one
  is and why a developer should care. Use the actual names from the data.
- "trending_tech": the technologies gaining momentum across the sources (not only AI).
  "momentum" reflects how strongly it shows up: exploding | hot | steady.
- "learn_next": 4-6 concrete skills/technologies from this data worth learning right now
  to stay competitive, most impactful first. Use short learnable names (e.g. "RAG",
  "Rust", "LangGraph") — these get fed into a learning-plan generator.
- "summary": 2-3 sentences on what this snapshot says the industry is moving toward.

Return a JSON object with EXACTLY this structure:
{{
  "summary": "<2-3 sentence industry snapshot>",
  "ai_highlights": [
    {{
      "name": "<model/tool name from the data>",
      "type": "model|tool|framework|release",
      "source": "github|huggingface|hackernews",
      "what_it_is": "<one sentence>",
      "why_it_matters": "<one sentence for a developer's career>"
    }}
  ],
  "trending_tech": [
    {{
      "name": "<technology>",
      "category": "ai/ml|language|framework|devops|data|other",
      "momentum": "exploding|hot|steady",
      "summary": "<what's happening with it, grounded in the data>"
    }}
  ],
  "learn_next": ["<skill>", ...]
}}

List 4-6 ai_highlights and 5-8 trending_tech. Ground EVERYTHING in the provided data —
do not invent items that aren't there. Return ONLY valid JSON."""
