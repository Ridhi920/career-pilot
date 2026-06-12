ATS_ANALYSIS_PROMPT = """You are an expert ATS (Applicant Tracking System) analyzer and career coach.

Analyze the following resume against the job description and return a detailed ATS analysis.

RESUME:
{resume_text}

JOB DESCRIPTION:
{job_description}

Return a JSON object with EXACTLY this structure:
{{
  "score": <number 0-100>,
  "keyword_coverage": <number 0-100>,
  "experience_match": "<brief description of experience alignment>",
  "matching_skills": ["<skill1>", "<skill2>", ...],
  "missing_skills": ["<skill1>", "<skill2>", ...],
  "strengths": ["<strength1>", "<strength2>", ...],
  "recommendations": ["<rec1>", "<rec2>", "<rec3>", ...],
  "summary": "<2-3 sentence overall assessment>"
}}

Scoring criteria:
- 90-100: Excellent match, likely to pass ATS
- 70-89: Good match with minor gaps
- 50-69: Moderate match, significant improvements needed
- Below 50: Poor match, major gaps exist

Be specific and actionable in recommendations. Return ONLY valid JSON, no markdown or extra text."""


ATS_SCORE_PROMPT = """You are an expert ATS (Applicant Tracking System) auditor and professional resume reviewer.

Evaluate the following resume on its own merits (no target job description) for ATS-readiness and overall quality.

RESUME:
{resume_text}

Return a JSON object with EXACTLY this structure:
{{
  "score": <overall ATS readiness score 0-100>,
  "rating": "<one of: excellent | good | fair | poor>",
  "summary": "<2-3 sentence overall assessment>",
  "breakdown": [
    {{"category": "Formatting & Structure", "score": <0-100>, "feedback": "<1 sentence>"}},
    {{"category": "Keywords & Skills", "score": <0-100>, "feedback": "<1 sentence>"}},
    {{"category": "Impact & Quantification", "score": <0-100>, "feedback": "<1 sentence>"}},
    {{"category": "Clarity & Readability", "score": <0-100>, "feedback": "<1 sentence>"}},
    {{"category": "Completeness", "score": <0-100>, "feedback": "<1 sentence>"}}
  ],
  "strengths": ["<strength1>", "<strength2>", ...],
  "issues": ["<specific problem 1>", "<specific problem 2>", ...],
  "improvements": [
    {{"priority": "<high | medium | low>", "section": "<resume section>", "suggestion": "<specific actionable change>"}},
    ...
  ],
  "keyword_suggestions": ["<keyword or skill the candidate could truthfully add>", ...]
}}

Scoring criteria:
- 90-100: Excellent — clean structure, strong keywords, quantified impact
- 70-89: Good — minor formatting or content gaps
- 50-69: Fair — significant improvements needed to pass ATS reliably
- Below 50: Poor — major structural or content problems

Give 3-6 improvements ordered by priority. Be specific and actionable (reference actual content from the resume). Return ONLY valid JSON, no markdown or extra text."""


SKILL_GAP_PROMPT = """You are a senior technical recruiter and career development expert.

Analyze the skill gaps between this candidate's resume and the target job description.

RESUME:
{resume_text}

JOB DESCRIPTION:
{job_description}

Return a JSON object with EXACTLY this structure:
{{
  "critical_missing": [
    {{
      "skill": "<skill name>",
      "priority": "critical",
      "reason": "<why this skill is critical for this role>",
      "learning_time": "<estimated time to learn>"
    }}
  ],
  "medium_priority": [
    {{
      "skill": "<skill name>",
      "priority": "medium",
      "reason": "<why this skill matters>",
      "learning_time": "<estimated time to learn>"
    }}
  ],
  "optional": [
    {{
      "skill": "<skill name>",
      "priority": "optional",
      "reason": "<why this could be a bonus>",
      "learning_time": "<estimated time to learn>"
    }}
  ],
  "learning_roadmap": [
    "<Step 1: ...>",
    "<Step 2: ...>",
    ...
  ],
  "estimated_preparation_time": "<total estimated time to be job-ready>"
}}

Be realistic and specific. Return ONLY valid JSON."""


RESUME_PARSE_PROMPT = """You are an expert resume parser. Extract structured information from this resume.

RESUME TEXT:
{resume_text}

Return a JSON object with EXACTLY this structure:
{{
  "name": "<full name or null>",
  "email": "<email or null>",
  "phone": "<phone or null>",
  "location": "<city, state/country or null>",
  "summary": "<professional summary or null>",
  "skills": ["<skill1>", "<skill2>", ...],
  "experience": [
    {{
      "company": "<company name>",
      "title": "<job title>",
      "duration": "<start - end>",
      "description": "<key responsibilities and achievements>",
      "technologies": ["<tech1>", "<tech2>"]
    }}
  ],
  "education": [
    {{
      "institution": "<school name>",
      "degree": "<degree type>",
      "field": "<field of study>",
      "graduation": "<year or date range>"
    }}
  ],
  "projects": [
    {{
      "name": "<project name>",
      "description": "<what it does and your role>",
      "technologies": ["<tech1>", "<tech2>"],
      "link": "<url or null>"
    }}
  ],
  "certifications": ["<cert1>", "<cert2>", ...]
}}

Return ONLY valid JSON, no markdown."""


RESUME_GENERATE_PROMPT = """You are an expert ATS resume optimizer and professional resume writer.

Your task is to rewrite the candidate's resume to maximize ATS compatibility for the target job description.

ORIGINAL RESUME:
{resume_text}

TARGET JOB DESCRIPTION:
{job_description}

ORIGINAL ATS SCORE: {original_score}/100

Instructions:
1. Rewrite bullet points with strong action verbs (Led, Built, Architected, Reduced, Increased, Implemented)
2. Naturally incorporate keywords from the job description
3. Add quantifiable metrics where the experience suggests them (e.g., "improved performance by ~X%")
4. Maintain 100% factual accuracy — never fabricate achievements
5. Optimize section ordering for this specific role
6. Use ATS-friendly formatting (no tables, no graphics references)
7. Keep content concise and impactful

Return a JSON object with EXACTLY this structure:
{{
  "optimized_resume": "<full optimized resume text>",
  "ats_score_after": <number 0-100>,
  "changes_made": [
    "<change description 1>",
    "<change description 2>",
    ...
  ]
}}

The optimized_resume should be the complete resume as plain text with clear section headers.
Return ONLY valid JSON."""
