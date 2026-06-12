"""
Tech Pulse: live trending technologies and AI models.

Pulls three public sources (no API keys needed) and asks the LLM to turn
them into learnable insights:
  - GitHub trending repos (weekly)     — what developers are building with
  - Hugging Face trending models       — which AI models are hot right now
  - Hacker News front page             — what the industry is talking about
"""
import asyncio
import re
import time

import httpx
from bs4 import BeautifulSoup
from loguru import logger

from app.services.llm_service import call_llm
from app.prompts.learning_prompts import TECH_PULSE_PROMPT

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    )
}

CACHE_TTL_SECONDS = 6 * 3600
_cache: dict = {"data": None, "at": 0.0}


async def _github_trending(client: httpx.AsyncClient) -> list[str]:
    try:
        resp = await client.get("https://github.com/trending?since=weekly")
        soup = BeautifulSoup(resp.text, "html.parser")
        rows = []
        for row in soup.select("article.Box-row")[:20]:
            name = re.sub(r"\s+", "", row.select_one("h2 a").get_text(strip=True)) if row.select_one("h2 a") else None
            if not name:
                continue
            desc_el = row.select_one("p")
            desc = desc_el.get_text(strip=True)[:140] if desc_el else ""
            lang_el = row.select_one("[itemprop='programmingLanguage']")
            lang = lang_el.get_text(strip=True) if lang_el else ""
            rows.append(f"{name} ({lang}): {desc}")
        return rows
    except Exception as e:
        logger.warning(f"GitHub trending fetch failed: {e}")
        return []


async def _hf_trending_models(client: httpx.AsyncClient) -> list[str]:
    try:
        resp = await client.get(
            "https://huggingface.co/api/models",
            params={"sort": "trendingScore", "direction": -1, "limit": 15},
        )
        models = resp.json()
        return [
            f"{m.get('id')} [{m.get('pipeline_tag') or 'model'}] "
            f"(downloads: {m.get('downloads', 0)}, likes: {m.get('likes', 0)})"
            for m in models
        ]
    except Exception as e:
        logger.warning(f"HuggingFace trending fetch failed: {e}")
        return []


async def _hn_front_page(client: httpx.AsyncClient) -> list[str]:
    try:
        resp = await client.get(
            "https://hn.algolia.com/api/v1/search",
            params={"tags": "front_page", "hitsPerPage": 25},
        )
        hits = resp.json().get("hits", [])
        return [f"{h.get('title')} ({h.get('points', 0)} points)" for h in hits if h.get("title")]
    except Exception as e:
        logger.warning(f"Hacker News fetch failed: {e}")
        return []


async def fetch_tech_pulse(force_refresh: bool = False) -> dict:
    if not force_refresh and _cache["data"] and time.time() - _cache["at"] < CACHE_TTL_SECONDS:
        return _cache["data"]

    async with httpx.AsyncClient(headers=_HEADERS, follow_redirects=True, timeout=20) as client:
        github, hf, hn = await asyncio.gather(
            _github_trending(client),
            _hf_trending_models(client),
            _hn_front_page(client),
        )

    if not (github or hf or hn):
        raise RuntimeError("All trend sources are unreachable right now — try again later.")

    digest = (
        "GITHUB TRENDING THIS WEEK:\n" + "\n".join(f"- {r}" for r in github)
        + "\n\nHUGGING FACE TRENDING MODELS:\n" + "\n".join(f"- {m}" for m in hf)
        + "\n\nHACKER NEWS FRONT PAGE:\n" + "\n".join(f"- {t}" for t in hn)
    )

    raw = call_llm(TECH_PULSE_PROMPT.format(digest=digest[:9000]))
    raw["sources"] = {"github": len(github), "huggingface": len(hf), "hackernews": len(hn)}

    _cache["data"] = raw
    _cache["at"] = time.time()
    return raw
