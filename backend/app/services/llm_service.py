import json
import re
from fastapi import HTTPException
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from groq import (
    Groq,
    APIConnectionError,
    APIStatusError,
    AuthenticationError,
    InternalServerError,
    RateLimitError,
)
from app.core.config import settings
from loguru import logger


def _get_client() -> Groq:
    return Groq(api_key=settings.GROQ_API_KEY, timeout=settings.GROQ_TIMEOUT)


def _extract_json(text: str) -> dict:
    """Parse JSON from model response, stripping any markdown fences."""
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            return json.loads(match.group())
        raise ValueError(f"Could not parse JSON from model response: {text[:300]}")


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    # Only transient failures are worth retrying; 429 (daily quota) and 401 are not.
    retry=retry_if_exception_type((APIConnectionError, InternalServerError)),
    reraise=True,
)
def _chat(model: str, prompt: str, max_tokens: int = 8192) -> str:
    client = _get_client()
    logger.debug(f"Calling Groq ({model}), prompt length: {len(prompt)}")
    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},  # Groq JSON mode — forces valid JSON output
        temperature=0.2,
        max_tokens=max_tokens,
    )
    return response.choices[0].message.content


def call_llm(prompt: str) -> dict:
    """Call the Groq API and return a parsed JSON dict.

    Groq rate limits are per-model, so when the primary model is rate-limited
    we retry once on GROQ_FALLBACK_MODEL. Unrecoverable API errors are mapped
    to HTTPExceptions so routes return a meaningful status instead of a 500.
    """
    fallback = settings.GROQ_FALLBACK_MODEL
    try:
        try:
            raw_text = _chat(settings.GROQ_MODEL, prompt)
        except RateLimitError:
            if not fallback or fallback == settings.GROQ_MODEL:
                raise
            logger.warning(f"{settings.GROQ_MODEL} rate-limited; falling back to {fallback}")
            # The fallback model has a tight per-minute token budget (6k TPM on the
            # free tier) that prompt + max_tokens must fit inside.
            raw_text = _chat(fallback, prompt, max_tokens=3000)
    except RateLimitError as e:
        provider_msg = ""
        if isinstance(e.body, dict):
            provider_msg = e.body.get("error", {}).get("message", "")
        logger.error(f"Groq rate limit exhausted: {provider_msg or e}")
        raise HTTPException(
            status_code=429,
            detail=f"AI provider rate limit reached. {provider_msg}".strip(),
        )
    except AuthenticationError:
        logger.error("Groq authentication failed — check GROQ_API_KEY in backend/.env")
        raise HTTPException(status_code=503, detail="AI service misconfigured: invalid GROQ_API_KEY.")
    except APIConnectionError:
        logger.error("Could not reach Groq API after retries")
        raise HTTPException(status_code=503, detail="Could not reach the AI provider. Try again shortly.")
    except APIStatusError as e:
        provider_msg = ""
        if isinstance(e.body, dict):
            provider_msg = e.body.get("error", {}).get("message", "")
        logger.error(f"Groq API error {e.status_code}: {provider_msg or e}")
        raise HTTPException(status_code=502, detail=f"AI provider error: {provider_msg or e.status_code}")

    logger.debug(f"Groq response length: {len(raw_text)}")
    return _extract_json(raw_text)
