SCORE_JOB_PROMPT = """You are an expert ATS analyzer and recruiter.

Score how well this resume matches the job posting.

RESUME:
{resume_text}

JOB TITLE: {job_title}
COMPANY: {job_company}
JOB DESCRIPTION:
{job_description}

Return a JSON object with EXACTLY this structure:
{{
  "score": <number 0-100>,
  "matching_skills": ["<skill>", ...],
  "missing_skills": ["<skill>", ...],
  "recommendation": "<apply|maybe|skip>",
  "reason": "<one sentence explaining the score>"
}}

Scoring guide:
- 80-100: Strong match, definitely apply
- 60-79: Decent match, worth trying
- 40-59: Partial match, skill gaps exist
- Below 40: Poor match, skip

Return ONLY valid JSON."""


COVER_LETTER_PROMPT = """You are an expert career coach and professional writer.

Write a tailored, concise cover letter for this job application.

CANDIDATE RESUME:
{resume_text}

JOB TITLE: {job_title}
COMPANY: {job_company}
JOB DESCRIPTION:
{job_description}

Instructions:
- 3 paragraphs max
- Opening: express genuine interest and strongest qualification
- Middle: 2-3 specific achievements relevant to this role
- Closing: call to action
- Professional but personable tone
- Do NOT use clichés like "I am writing to apply..."

Return a JSON object:
{{
  "cover_letter": "<full cover letter text, use \\n for line breaks>"
}}

Return ONLY valid JSON."""

