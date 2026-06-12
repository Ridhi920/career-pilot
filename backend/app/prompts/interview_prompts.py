INTERVIEW_QUESTIONS_PROMPT = """You are an expert technical interviewer and hiring manager.

Generate targeted interview questions for the following role based on the job description.

JOB ROLE: {job_role}
JOB DESCRIPTION: {job_description}
CANDIDATE BACKGROUND: {candidate_context}
QUESTIONS PER CATEGORY: {num_questions}

Return a JSON object with EXACTLY this structure:
{{
  "technical": [
    "<technical question 1>",
    "<technical question 2>",
    ...
  ],
  "behavioral": [
    "<behavioral question using STAR format prompt>",
    ...
  ],
  "scenario": [
    "<scenario/situational question>",
    ...
  ],
  "company_style": [
    "<culture fit or company-specific question>",
    ...
  ],
  "job_role": "{job_role}"
}}

Make questions specific to the role and technologies mentioned. Return ONLY valid JSON."""


EVALUATE_ANSWER_PROMPT = """You are a senior interviewer and career coach evaluating a candidate's interview answer.

QUESTION: {question}
QUESTION TYPE: {question_type}
JOB ROLE: {job_role}

CANDIDATE'S ANSWER:
{answer}

Evaluate the answer on multiple dimensions and provide actionable feedback.

Return a JSON object with EXACTLY this structure:
{{
  "score": <number 0-10>,
  "clarity_score": <number 0-10>,
  "technical_accuracy_score": <number 0-10>,
  "communication_score": <number 0-10>,
  "star_format_used": <true or false>,
  "strengths": [
    "<strength 1>",
    "<strength 2>"
  ],
  "weaknesses": [
    "<weakness 1>",
    "<weakness 2>"
  ],
  "improved_answer": "<rewritten version of the answer that would score higher>",
  "tip": "<one specific, actionable tip to improve this type of answer>"
}}

Be constructive and specific. Return ONLY valid JSON."""
